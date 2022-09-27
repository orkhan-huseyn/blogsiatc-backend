const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: 'ObjectId',
      ref: 'users',
    },
    body: String,
  },
  {
    timestamps: true,
  }
);

CommentSchema.pre(/find.*/, function () {
  this.populate('author', '-password');
});

const CommentModel = mongoose.model('comments', CommentSchema);

module.exports = CommentModel;
