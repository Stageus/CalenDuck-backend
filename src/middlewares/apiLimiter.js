const { rateLimiter } = require("express-rate-limit");
require("dotenv").config();

const limiter = rateLimiter({
  windowMs: process.env.RATE_LIMIT_INTERVAL,
  limit: process.env.MAX_REQUESTS,
  handler(req, res, next) {
    return next(new TooManyRequest("Api 그만 호출"));
  },
});

module.exports = limiter;
