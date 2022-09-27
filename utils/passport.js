const passport = require('passport');
const crypto = require('crypto');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

const SALT = process.env.PASSWORD_SALT;
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const hashedPassword = crypto
          .pbkdf2Sync(password, SALT, 100000, 64, 'sha512')
          .toString('hex');

        const user = await User.findOne({
          email,
          password: hashedPassword,
        });

        if (user) {
          return done(null, user);
        }

        return done('Username or password is incorrect!', false);
      } catch (error) {
        return done(error.message);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: (req) => req.cookies['app-access-token'],
      secretOrKey: JWT_SECRET,
    },
    (jwtPayload, done) => {
      if (Date.now() > jwtPayload.exp * 1000) {
        return done('jwt expired');
      }
      return done(null, jwtPayload);
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.SELF_URL + '/api/v1/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      const firstName = profile.name.givenName;
      const lastName = profile.name.familyName;
      const oAuthId = profile.id;
      const email = profile.emails[0].value;
      const image = profile.photos[0].value;

      try {
        const user = await User.findOneAndUpdate(
          { email },
          {
            firstName,
            lastName,
            oAuthId,
            oAuthProvider: 'google',
            email,
            image,
          },
          { upsert: true }
        );
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);
