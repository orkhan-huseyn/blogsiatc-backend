const mongoose = require('mongoose');

const MessagesSchema = new mongoose.Schema(
  {
    fromUser: {
      type: 'ObjectId',
      ref: 'users',
    },
    toUser: {
      type: 'ObjectId',
      ref: 'users',
    },
    content: String,
    read: {
      type: Boolean,
      default: () => false,
    },
  },
  {
    timestamps: true,
  }
);

const MessagesModel = mongoose.model('messages', MessagesSchema);

module.exports = MessagesModel;
