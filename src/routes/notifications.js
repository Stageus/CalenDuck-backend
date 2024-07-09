const router = require("express").Router();

const notificationSchema = require("../../database/mongooseSchema/notificationSchema");

const checkAuth = require("../middlewares/checkAuth");
const checkValidity = require("../middlewares/checkValidity");

const { pageSize } = require("../model/constants");

const endRequestHandler = require("../modules/endRequestHandler");

router.get("/", checkAuth("login"), checkValidity({"numberField": ["page"]}), endRequestHandler(async (req, res, next) => {
    const loginUser = req.decoded;
    const { page } = req.body;
    const skipAmount = (page - 1) * pageSize;

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
  })
);

router.get("/counts", checkAuth("login"), endRequestHandler(async (req, res, next) => {
    const loginUser = req.decoded;

    const count = await notificationSchema.countDocuments({
      user_idx: loginUser.idx,
      is_read: false,
    });

    return res.status(200).send({
      notif_count: count,
    });
  })
);

module.exports = router;
