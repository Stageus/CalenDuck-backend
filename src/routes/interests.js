const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const checkAuth = require("../middlewares/checkAuth");
const checkValidity = require("../middlewares/checkValidity");

const {
  NotFoundException,
  UnprocessableEntityException
} = require("../model/customException");

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
  const loginUser = req.decoded;

  const interestList = await getManyResults(`
    SELECT idx AS "interestIdx", interest AS "interestName"
    FROM calenduck.interest
    WHERE is_assigned=true
    OR expiration_date IS NOT NULL
    ORDER BY interest ASC
  `)

  const userInterestList = await getManyResults(`
    SELECT interest_idx 
    FROM calenduck.user_interest
    WHERE user_idx = $1 
  `, [loginUser.idx]);
  const userInterestData = userInterestList.map(row => row.interest_idx);

  const filteredData = interestList.filter(item => !userInterestData.includes(item.interestIdx));

  return res.status(200).send({
    list: filteredData
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

  return res.status(200).send({
    list: interestList,
  });
})
);

//관심사 추가
router.post("/:idx", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
  const { idx: interestIdx } = req.params;
  const loginUser = req.decoded;

  const interest = await getOneResult(`
    SELECT idx
    FROM calenduck.interest
    WHERE idx = $1  
  `, [interestIdx]);

  if (!interest) return next(new NotFoundException("idx does not exist"));

  const user = await getOneResult(`
    SELECT interest_count
    FROM calenduck.user
    WHERE idx = $1
  `, [loginUser.idx]);

  if (user.interest_count >= 5) return next(new UnprocessableEntityException("cannot add more interests"));

  await psql.query(`
    UPDATE calenduck.user
    SET interest_count = interest_count + 1
    WHERE idx = $1;
  `, [loginUser.idx]);

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

  if (!userInterest) return next(new NotFoundException("idx does not exist"));

  await psql.query(`
    UPDATE calenduck.user
    SET interest_count = interest_count - 1
    WHERE idx = $1;
  `, [loginUser.idx]);

  return res.sendStatus(201);
})
);

module.exports = router;