const mongoose = require('mongoose');
const Message = require('../models/messages');
const catchError = require('../utils/catchError');

const getUserMessages = catchError(async (req, res) => {
  const currentUser = req.user.id;
  const otherUser = req.params.userId;

  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [
              { fromUser: mongoose.Types.ObjectId(currentUser) },
              { toUser: mongoose.Types.ObjectId(otherUser) },
            ],
          },
          {
            $and: [
              { fromUser: mongoose.Types.ObjectId(otherUser) },
              { toUser: mongoose.Types.ObjectId(currentUser) },
            ],
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        content: 1,
        createdAt: 1,
        fromMyself: {
          $cond: {
            if: { $eq: [mongoose.Types.ObjectId(currentUser), '$fromUser'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: { createdAt: 1 },
    },
  ]).exec();

  res.status(200).send(messages);
});

const markAllMessagesAsRead = catchError(async (req, res) => {
  const fromUser = req.params.userId;
  await Message.updateMany({ fromUser, read: false }, { read: true });
  res.status(200).send();
});

module.exports = {
  getUserMessages,
  markAllMessagesAsRead,
};
