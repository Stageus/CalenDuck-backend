const { CustomError } = require("../model/customError");

const errorHandler = async (err, req, res, next) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({
      message: err.message,
    });
  } else {
    console.log(`에러 발생 : ${err}`);

    return res.status(500).send({
      message: "서버 에러 발생",
    });
  }
};

module.exports = errorHandler;
