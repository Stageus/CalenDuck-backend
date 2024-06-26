const { rateLimiter } = require("express-rate-limit");
const { TooManyRequestsError } = require("../model/customError");
require("dotenv").config();

const limiter = rateLimiter({
  windowMs: process.env.RATE_LIMIT_INTERVAL,
  limit: process.env.MAX_REQUESTS,
  handler(req, res, next) {
    return next(new TooManyRequestsError("Api 그만 호출"));
  },
});

module.exports = limiter;
