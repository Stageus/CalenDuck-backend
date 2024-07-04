const router = require("express").Router();

const notificationSchema = require("../../database/mongooseSchema/notificationSchema");

const checkAuth = require("../middlewares/checkAuth");

router.get("/", checkAuth, async (req, res, next) => {
  const loginUser = req.decoded;
  const { page } = req.body;
  const pageSize = 20;
  const skipAmount = (page - 1) * pageSize;

  try {
    const notificationList = await notificationSchema
      .find(
        {
          user_idx: loginUser.idx,
        },
        { is_read: 0 }
      )
      .sort({ created_at: "desc" })
      .skip(skipAmount)
      .limit(pageSize);

    if (!notificationList) {
      return res.sendStatus(204);
    }

    await notificationSchema.updateMany(
      { user_idx: loginUser.idx, is_read: false },
      { is_read: true }
    );

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
    const count =
      await notificationSchema.countDocuments({
        user_idx: loginUser.idx,
        is_read: false,
      });

    return res.status(200).send({
      notif_count: count,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
