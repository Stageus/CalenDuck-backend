const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  user_idx: {
    type: Number,
    required: true,
  },
  is_read: {
    type: Boolean,
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  }
});

notificationSchema.set("timestamps", {
  createdAt: "created_at",
  updatedAt: false,
});

module.exports = mongoose.model("notifications", notificationSchema);
