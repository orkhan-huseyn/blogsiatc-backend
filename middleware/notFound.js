const notFound = (_, res) => {
  res.status(404).send({
    message: 'Requested URL not found.',
  });
};

module.exports = notFound;
