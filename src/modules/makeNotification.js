const notificationSchema = require("../../database/mongooseSchema/notificationSchema");

/**
 *
 * @param {number} receiverIdx
 * @param {"import" | "manager" | "reply"} type
 * @param {*} data
 */

const makeNotification = async (receiverIdx, type, data) => {
  if (type === "import") {
    await notificationSchema.create({
      type: type,
      user_idx: receiverIdx,
      interest: data.interest,
      contents: data.contents,
      is_read: false,
    });
  } else if (type === "manager") {
    await notificationSchema.create({
      type: type,
      user_idx: receiverIdx,
      interest: data.interest,
      is_read: false,
    });
  } else if (type === "reply") {
    await notificationSchema.create({
      type: type,
      user_idx: receiverIdx,
      title: data.title,
      reply: data.reply,
      is_read: false,
    });
  }
};

module.exports = makeNotification;
