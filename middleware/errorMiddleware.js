const errorMiddleware = (err, req, res, next) => {
  let message = err.message || 'Ooops! Something went wrong.';

  if (process.env.NODE_ENV === 'production') {
    message = 'Ooops! Something went wrong.';
  }

  res.status(500).send({
    message,
  });
};

module.exports = errorMiddleware;
