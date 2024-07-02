const { NotFoundException } = require("../model/customException");

const notFoundApi = (req, res, next) => {
  throw new NotFoundException();
};

module.exports = notFoundApi;
