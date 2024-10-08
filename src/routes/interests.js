const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const checkAuth = require("../middlewares/checkAuth");
const checkValidity = require("../middlewares/checkValidity");

const { NotFoundException } = require("../model/customException");

const {
  getManyResults,
  getOneResult
} = require("../modules/sqlHandler");
const endRequestHandler = require("../modules/endRequestHandler");

const {
  PARAM_REGEX,
  LOGIN
} = require("../constants");

// 관리자 할당된 관심사 목록 불러오기
router.get("/all", checkAuth(LOGIN), endRequestHandler(async (req, res, next) => {
  const interestList = await getManyResults(`
    SELECT idx AS "interestIdx", interest AS "interestName"
    FROM calenduck.interest
    WHERE is_assigned=true
    OR expiration_date IS NOT NULL
    ORDER BY interest ASC
  `)

  if (interestList.length === 0) return res.sendStatus(204);

  return res.status(200).send({
    list: interestList
  });
}))

//내 관심사 불러오기
router.get("/", checkAuth(LOGIN), endRequestHandler(async (req, res, next) => {
  const loginUser = req.decoded;

  const interestList = await getManyResults(`
    SELECT CI.idx AS "interestIdx", CI.interest AS "interestName" FROM calenduck.user_interest CUI
    JOIN calenduck.interest CI
    ON CUI.interest_idx = CI.idx
    WHERE CUI.user_idx = $1
    ORDER BY interest ASC
  `, [loginUser.idx]);

  if (!interestList || interestList.length === 0) return res.sendStatus(204);

  return res.status(200).send({
    list: interestList,
  });
})
);

//관심사 추가
router.post("/:idx", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
  const { idx: interestIdx } = req.params;
  const loginUser = req.decoded;

  await psql.query(`
    INSERT INTO calenduck.user_interest(user_idx, interest_idx) 
    VALUES($1, $2)
  `, [loginUser.idx, interestIdx]);

  return res.sendStatus(201);
})
);

//내 관심사 삭제
router.delete("/:idx", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
  const { idx: interestIdx } = req.params;
  const loginUser = req.decoded;

  const userInterest = await getOneResult(`
    DELETE FROM calenduck.user_interest 
    WHERE user_idx = $1 AND interest_idx = $2
    RETURNING interest_idx
  `, [loginUser.idx, interestIdx]);

  if (!userInterest) return next(new NotFoundException());

  return res.sendStatus(201);
})
);

module.exports = router;