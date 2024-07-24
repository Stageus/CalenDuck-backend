const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loggingSchema = new mongoose.Schema({
  user_idx: {
    type: String,
    required: true,
  },
  api: {
    type: String,
    required: true,
  },
  request: {
    type: Schema.Types.Mixed,
    required: true,
  },
  response: {
    type: Number,
    required: true,
  },
});
loggingSchema.set("timestamps", {
  createdAt: "time",
  updatedAt: false,
});

module.exports = mongoose.model("logging", loggingSchema);
