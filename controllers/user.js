const crypto = require('crypto');
const passport = require('passport');
const mongoose = require('mongoose');
const User = require('../models/user');
const PasswordReset = require('../models/passwordReset');
const catchError = require('../utils/catchError');
const transporter = require('../utils/emailSender');

const SALT = process.env.PASSWORD_SALT;

const getUsers = catchError(async (req, res) => {
  const currentUserId = req.user.id;

  const users = await User.aggregate([
    { $match: { _id: { $ne: mongoose.Types.ObjectId(currentUserId) } } },
    {
      $lookup: {
        from: 'messages',
        localField: '_id',
        foreignField: 'fromUser',
        as: 'unreadMessages',
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        fullName: {
          $concat: ['$firstName', ' ', '$lastName'],
        },
        image: 1,
        online: 1,
        oAuthProvider: 1,
        unreadMessages: {
          $filter: {
            input: '$unreadMessages',
            as: 'message',
            cond: {
              $and: [
                { $eq: ['$$message.read', false] },
                {
                  $eq: [
                    '$$message.toUser',
                    mongoose.Types.ObjectId(currentUserId),
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        id: 1,
        fullName: 1,
        image: 1,
        online: 1,
        oAuthProvider: 1,
        unreadMessages: {
          $size: '$unreadMessages',
        },
      },
    },
  ]).exec();

  const total = await User.count({ _id: { $ne: currentUserId } });
  res.send({
    users,
    total,
  });
});

const registerUser = catchError(async (req, res) => {
  const { path } = req.file;
  const { firstName, lastName, password, email } = req.body;

  const user = new User({
    firstName,
    lastName,
    password,
    email,
    image: path,
  });

  await user.save();

  res.status(201).send();
});

const getUserInfo = (req, res) => {
  res.status(200).send(req.user);
};

const logout = (req, res) => {
  res.clearCookie('app-access-token', { path: '/' });
  res.status(200).send();
};

const loginUser = catchError(async (req, res) => {
  passport.authenticate('local', { session: false }, (error, user) => {
    if (error) {
      return res.status(400).json({ error });
    }
    req.login(user, { session: false }, (error) => {
      if (error) {
        return res.status(500).send({ message: error.message });
      }

      const accessToken = user.generateJWT();
      res.cookie('app-access-token', accessToken, {
        maxAge: 60 * 60 * 12 * 1000,
        httpOnly: true,
      });
      res.status(200).send();
    });
  })(req, res);
});

const requestPasswordReset = catchError(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400).send({
      message: 'No user found with this email.',
    });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('base64url');
  const passwordReset = new PasswordReset({
    user: user._id,
    resetToken,
  });

  await passwordReset.save();

  const linkToPasswordResetPage =
    process.env.CLIENT_URL + '/auth/reset-password/' + resetToken;

  await transporter.sendMail({
    from: 'Blogs API <noreply@blogs.info>',
    to: email,
    subject: 'Password Reset',
    text: `
      Oi, pal! Looks like you have lost your shit!
      To get your shit together please click the link below and follow the instructions:
      ${linkToPasswordResetPage}
    `,
    html: `
      <h1>Password reset</h1>
      <p>
        Oi, pal! Looks like you have lost your shit!
        To get your shit together please click the link below and follow the instructions:
        <a href=${linkToPasswordResetPage} target="_blank">Reset password</a>
      </p>
    `,
  });

  res.send({
    message: 'Email has been sent to you to reset your password!',
  });
});

const resetPassword = catchError(async (req, res) => {
  const { newPassword, resetToken } = req.body;

  const hashedPassoword = crypto
    .pbkdf2Sync(newPassword, SALT, 100000, 64, 'sha512')
    .toString('hex');

  const passwordReset = await PasswordReset.findOne({
    resetToken,
    expired: false,
  });

  if (passwordReset) {
    const userId = passwordReset.user;
    await User.findByIdAndUpdate(userId, { password: hashedPassoword });
    await PasswordReset.findByIdAndUpdate(passwordReset._id, { expired: true });
    res.send({
      message: 'Your password has been reset.',
    });
  } else {
    res.status(400).send({
      message: 'This password reset request does not exist or expired.',
    });
  }
});

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getUserInfo,
  logout,
  getUsers,
};
