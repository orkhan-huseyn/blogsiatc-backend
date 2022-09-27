require('dotenv').config();
const path = require('path');
const helmet = require('helmet');
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const blogRoutes = require('./routes/blogRoutes');
const messageRoutes = require('./routes/messageRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const notFound = require('./middleware/notFound');

mongoose.connect(process.env.DB_CONNECTION_STRING);

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(mongoSanitize());
app.use(passport.initialize());
require('./utils/passport');
app.use('/public', express.static(path.resolve('public')));
app.use(limiter);
app.use('/api/v1', userRoutes);
app.use('/api/v1', blogRoutes);
app.use('/api/v1', messageRoutes);
app.all('*', notFound);
app.use(errorMiddleware);

module.exports = app;
