const loggingSchema = require("../../database/mongooseSchema/loggingSchema");

const logging = (req, res, next) => {
  res.on("finish", async () => {
    const log = new loggingSchema({
        user_idx: req.decoded?.idx || null, // req.decoded가 없으면 null 사용
        api: `${req.method} ${req.originalUrl}`,
        request: {
            headers: req.headers,
            body: req.body,
            query: req.query
        },
        response: res.statusCode,
    });

    try {
      await log.save();
      console.log("Log saved:", log);
    } catch (err) {
      console.error("Error saving log:", err);
    }
  });

  return next();
};

module.exports = logging;
