const { NotFoundError } = require("../model/customError");

const notFoundApi = (req, res, next) => {
  throw new NotFoundError("Api가 없습니다");
};

module.exports = notFoundApi;
