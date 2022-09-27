const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SALT = process.env.PASSWORD_SALT;
const JWT_SECRET = process.env.JWT_SECRET_KEY;

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,
    image: String,
    oAuthProvider: String,
    oAuthId: String,
    online: {
      type: Boolean,
      default: () => false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.toJSON = function () {
  return {
    id: this._id,
    fullName: `${this.firstName} ${this.lastName}`,
    image: this.image,
    email: this.email,
    oAuthProvider: this.oAuthProvider,
    oAuthId: this.oAuthId,
    online: this.online,
  };
};

UserSchema.methods.generateJWT = function () {
  const user = this.toJSON();
  const accessToken = jwt.sign(user, JWT_SECRET, {
    expiresIn: '12h',
  });
  return accessToken;
};

UserSchema.pre('save', function (next) {
  if (this.oAuthId) {
    return next();
  }
  this.password = crypto
    .pbkdf2Sync(this.password, SALT, 100000, 64, 'sha512')
    .toString('hex');
  next();
});

const UserModel = mongoose.model('users', UserSchema);

module.exports = UserModel;
