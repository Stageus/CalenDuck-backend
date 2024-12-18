const router = require("express").Router();

const notificationSchema = require("../../database/mongooseSchema/notificationSchema");

const checkAuth = require("../middlewares/checkAuth");
const checkValidity = require("../middlewares/checkValidity");

const endRequestHandler = require("../modules/endRequestHandler");

const { LOGIN, PARAM_REGEX } = require("../constants");

//알림 목록 불러오기
router.get("/", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["page"] }), endRequestHandler(async (req, res, next) => {
  const loginUser = req.decoded;
  const page = req.query.page;
  const pageSize = 20;
  const skipAmount = (page - 1) * pageSize;

  const notificationList = await notificationSchema
    .aggregate([
      { $match: { user_idx: loginUser.idx } },
      {
        $project: {
          _id: 0,
          idx: "$_id",
          type: "$type",
          date: "$created_at",
          content: "$data.contents",
          interestName: "$data.interest",
          title: "$data.title",
          reply: "$data.reply",
          is_read: "$is_read",
        }
      }
    ]).sort({ date: "desc" })
    .skip(skipAmount)
    .limit(pageSize);

  if (!notificationList || notificationList.length === 0) {
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

//신규 알림 개수 불러오기
router.get("/counts", checkAuth(LOGIN), endRequestHandler(async (req, res, next) => {
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
