const loggingSchema = require("../../database/mongooseSchema/loggingSchema");

const logging = async (receiverIdx, api, request, response) => {
  let loggingData = {
    user_idx: receiverIdx,
    api: api,
    request: request,
    response: response,
  }

  await loggingSchema.create(loggingData);
}

module.exports = logging;
