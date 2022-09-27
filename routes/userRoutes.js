const express = require('express');
const upload = require('../middleware/fileUpload');
const userController = require('../controllers/user');
const passport = require('passport');

const userRouter = express.Router();
const imageUpload = upload.single('image');

userRouter.post('/register', imageUpload, userController.registerUser);

userRouter.post('/login', userController.loginUser);

userRouter.patch('/password', userController.resetPassword);

userRouter.post('/password/reset-request', userController.requestPasswordReset);

userRouter.get(
  '/users',
  passport.authenticate('jwt', { session: false }),
  userController.getUsers
);

userRouter.get(
  '/me',
  passport.authenticate('jwt', { session: false }),
  userController.getUserInfo
);

userRouter.post(
  '/logout',
  passport.authenticate('jwt', { session: false }),
  userController.logout
);

userRouter.get(
  '/login/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

userRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.CLIENT_URL + '/auth/login',
    session: false,
  }),
  (req, res) => {
    const accessToken = req.user.generateJWT();
    res.cookie('app-access-token', accessToken, {
      maxAge: 60 * 60 * 12 * 1000,
      httpOnly: true,
    });
    res.redirect(process.env.CLIENT_URL + '/dashboard');
  }
);

module.exports = userRouter;
