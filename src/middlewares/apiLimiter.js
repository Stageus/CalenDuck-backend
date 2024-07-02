const { rateLimit } = require("express-rate-limit");
const { TooManyRequestsException } = require("../model/customException");

require("dotenv").config();

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_INTERVAL,
  limit: process.env.MAX_REQUESTS,
  handler(req, res, next) {
    return next(new TooManyRequestsException());
  },
});

module.exports = limiter;
