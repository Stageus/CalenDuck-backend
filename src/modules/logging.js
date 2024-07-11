const loggingSchema = require("../../database/mongooseSchema/loggingSchema");

const logging = async (receiverIdx, api, request, response) => {
  let loggingData = {
    user_idx: receiverIdx,
    api: `${req.method} ${req.originalUrl}`,
    request: {
      headers: req.headers,
      body: req.body,
      query: req.query
    },
    response: res.statusCode,
  }
  await loggingSchema.create(loggingData);
}

module.exports = logging;
