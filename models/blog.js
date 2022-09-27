const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
  {
    title: String,
    body: String,
    comments: [{ type: 'ObjectId', ref: 'comments' }],
    likes: [{ type: 'ObjectId', ref: 'users' }],
    author: {
      type: 'ObjectId',
      ref: 'users',
    },
    tags: {
      type: [String],
      default: () => [],
    },
  },
  {
    timestamps: true,
  }
);

const BlogModel = mongoose.model('blogs', BlogSchema);

module.exports = BlogModel;
