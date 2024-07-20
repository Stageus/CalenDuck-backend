const notificationSchema = require("../../database/mongooseSchema/notificationSchema");

const { IMPORT_NOTI, MANAGER_NOTI, REPLY_NOTI } = require("../constants");

/**
 *
 * @param {number} receiverIdx
 * @param { 'IMPORT_NOTI' | 'MANAGER_NOTI' | 'REPLY_NOTI' } type
 * @param {*} data
 */

const makeNotification = async (receiverIdx, type, inputData) => {
  let notificationData = {
    type: type,
    user_idx: receiverIdx,
    is_read: false,
    data: {},
  };

  if (type === IMPORT_NOTI) {
    notificationData.data.contents = inputData.contents;
    if (inputData.interest) {
      notificationData.data.interest = inputData.interest;
    }
  } else if (type === MANAGER_NOTI) {
    notificationData.data.interest = inputData.interest;
  } else if (type === REPLY_NOTI) {
    notificationData.data.title = inputData.title;
    notificationData.data.reply = inputData.reply;
  }

  await notificationSchema.create(notificationData);
};

module.exports = makeNotification;
