const router = require("express").Router();
const notificationSchema = require("../../database/mongooseSchema/notificationSchema");
const checkAuth = require("../middlewares/checkAuth");

router.get("/", checkAuth, async (req, res, next) => {
  const loginUser = req.decoded;
  const page = req.body.page;
  const pageSize = 20;
  const skipAmount = (page - 1) * pageSize;

  try {
    const findNotificationQueryResult = await notificationSchema
      .find(
        {
          user_idx: loginUser.idx,
        },
        { is_read: 0 }
      )
      .sort({ created_at: "desc" })
      .skip(skipAmount)
      .limit(pageSize);

    const notificationList = findNotificationQueryResult;

    await notificationSchema.updateMany(
      { user_idx: loginUser.idx, is_read: false },
      { is_read: true }
    );

    if (notificationList.length === 0) {
      return res.status(204).end();
    }

    return res.status(200).send({
      list: notificationList,
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/counts", checkAuth, async (req, res, next) => {
  const loginUser = req.decoded;

  try {
    const countNotiricationQueryResult = notificationSchema.countDocuments({
      user_idx: loginUser.idx,
      is_read: false,
    });
    const count = countNotiricationQueryResult;

    res.status(200).send({
      notif_count: count,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
