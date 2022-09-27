const express = require('express');
const passport = require('passport');
const messagesController = require('../controllers/messages');

const messagesRouter = express.Router();

messagesRouter.use(passport.authenticate('jwt', { session: false }));
messagesRouter.get('/messages/:userId', messagesController.getUserMessages);
messagesRouter.put(
  '/messages/:userId/read/all',
  messagesController.markAllMessagesAsRead
);

module.exports = messagesRouter;
