const express = require('express');
const passport = require('passport');
const blogController = require('../controllers/blog');

const blogRouter = express.Router();

blogRouter.use(passport.authenticate('jwt', { session: false }));
blogRouter.get('/blogs', blogController.getBlogList);
blogRouter.get('/blogs/my', blogController.getMyBlogs);
blogRouter.get('/blogs/:id', blogController.getSingleBlog);
blogRouter.put('/blogs/:id/like', blogController.likeBlog);
blogRouter.post('/blogs/:id/comments', blogController.addComment);
blogRouter.post('/blogs', blogController.insertBlog);
blogRouter.put('/blogs/:id', blogController.updateBlog);
blogRouter.delete('/blogs/:id', blogController.deleteBlog);

module.exports = blogRouter;
