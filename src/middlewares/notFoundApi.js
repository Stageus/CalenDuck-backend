const { NotFoundException } = require("../model/customException");

const notFoundApi = (req, res, next) => {
  return next(new NotFoundException());
};

module.exports = notFoundApi;
