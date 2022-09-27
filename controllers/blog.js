const mongoose = require('mongoose');
const Blog = require('../models/blog');
const Comment = require('../models/comment');
const catchError = require('../utils/catchError');

const blogAggregations = (offset, limit, userId) => {
  return [
    {
      $project: {
        _id: 0,
        id: '$_id',
        title: 1,
        body: 1,
        author: 1,
        tags: 1,
        liked: {
          $in: [mongoose.Types.ObjectId(userId), '$likes'],
        },
        likes: { $size: '$likes' },
        comments: { $size: '$comments' },
        createdAt: 1,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
      },
    },
    { $unwind: '$author' },
    {
      $project: {
        id: 1,
        title: 1,
        body: 1,
        tags: 1,
        likes: 1,
        comments: 1,
        liked: 1,
        createdAt: 1,
        'author.fullName': {
          $concat: ['$author.firstName', ' ', '$author.lastName'],
        },
        'author.image': 1,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: offset },
    { $limit: limit },
  ];
};

const getMyBlogs = catchError(async (req, res) => {
  const userId = req.user.id;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const q = req.query.q || '';
  const offset = (page - 1) * limit;

  const titleFilter = { $regex: '.*' + q + '.*', $options: 'i' };
  const blogs = await Blog.aggregate([
    {
      $match: {
        $and: [
          { title: titleFilter },
          { author: mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    ...blogAggregations(offset, limit, userId),
  ]).exec();

  const total = await Blog.find({
    title: titleFilter,
  })
    .where('author')
    .equals(userId)
    .count();

  res.status(200).send({
    blogs,
    total,
  });
});

const getBlogList = catchError(async (req, res) => {
  const userId = req.user.id;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const q = req.query.q || '';
  const offset = (page - 1) * limit;

  const titleFilter = { $regex: '.*' + q + '.*', $options: 'i' };
  const blogs = await Blog.aggregate([
    { $match: { title: titleFilter } },
    ...blogAggregations(offset, limit, userId),
  ]).exec();

  const total = await Blog.find({
    title: titleFilter,
  }).count();

  res.status(200).send({
    blogs,
    total,
  });
});

const getSingleBlog = catchError(async (req, res) => {
  const blog = await Blog.findById(req.params.id)
    .populate('author', '-password')
    .populate('comments')
    .exec();
  res.status(200).send(blog);
});

const insertBlog = catchError(async (req, res) => {
  const blog = new Blog({
    ...req.body,
    author: req.user._id,
  });
  await blog.save();
  res.status(201).send();
});

const updateBlog = catchError(async (req, res) => {
  await Blog.findByIdAndUpdate(req.params.id, req.body);
  res.status(200).send();
});

const likeBlog = catchError(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (blog.likes.includes(req.user._id)) {
    blog.likes.pull(req.user._id);
  } else {
    blog.likes.push(req.user._id);
  }
  await blog.save();
  res.status(200).send();
});

const deleteBlog = catchError(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (blog.author !== req.user._id) {
    res.status(403).send({
      message: "You cannot delete other people's posts!",
    });
    return;
  }

  await Blog.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

const addComment = catchError(async (req, res) => {
  const comment = new Comment({
    author: req.user._id,
    body: req.body.content,
  });
  await comment.save();

  const blog = await Blog.findById(req.params.id);
  blog.comments.push(comment);
  await blog.save();

  const result = await Comment.findById(comment._id);
  res.status(201).send(result);
});

module.exports = {
  getBlogList,
  getSingleBlog,
  insertBlog,
  likeBlog,
  updateBlog,
  deleteBlog,
  addComment,
  getMyBlogs,
};
