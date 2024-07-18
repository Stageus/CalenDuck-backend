const notificationSchema = require("../../database/mongooseSchema/notificationSchema");

const { IMPORT, REPLY, MANAGER } = require("../constants");

/**
 *
 * @param {number} receiverIdx
 * @param {"import" | "manager" | "reply"} type
 * @param {*} data
 */

const makeNotification = async (receiverIdx, type, inputData) => {
  let notificationData = {
    type: type,
    user_idx: receiverIdx,
    is_read: false,
    data: {},
  };

  if (type === IMPORT) {
    notificationData.data.contents = inputData.contents;
    if (inputData.interest) {
      notificationData.data.interest = inputData.interest;
    }
  } else if (type === MANAGER) {
    notificationData.data.interest = inputData.interest;
  } else if (type === REPLY) {
    notificationData.data.title = inputData.title;
    notificationData.data.reply = inputData.reply;
  }

  await notificationSchema.create(notificationData);
};

module.exports = makeNotification;
