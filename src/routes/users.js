const checkValidity = require("../middlewares/checkValidity");
const psql = require("../../database/connect/postgre");
const {
  UnauthorizedError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} = require("../model/customError");
const checkDuplicatedId = require("../middlewares/checkDuplicatedId");
const checkAuth = require("../middlewares/checkAuth");
const makeToken = require("../modules/makeToken");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 *
 * @param {import("express").RequestHandler} requestHandler
 * @returns {import("express").RequestHandler}
 */
const endRequestHandler = (requestHandler) => {
  return async (req, res, next) => {
    try {
      await requestHandler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

router.post("/login", checkValidity, async (req, res, next) => {
  const { id, pw } = req.body;
  try {
    const selectLoginQueryResult = await psql.query(
      `SELECT CU.idx, CU.role  
      FROM calenduck.login CL 
      JOIN calenduck.user CU 
      ON CL.idx = CU.login_idx 
      WHERE CL.id = $1 AND CL.pw = $2`,
      [id, pw]
    );

    const loginUser = selectLoginQueryResult.rows[0];

    const accessToken = makeToken(
      {
        idx: loginUser.idx,
        rank: loginUser.role,
      },
      "login"
    );

    res.cookie("access_token", accessToken);

    return res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

router.get(
  "/check-id",
  checkValidity,
  checkDuplicatedId,
  async (req, res, next) => {
    return res.sendStatus(201);
  }
);

router.post(
  "/",
  checkValidity,
  checkDuplicatedId,
  endRequestHandler(async (req, res, next) => {
    const { id, pw, name, email } = req.body;

    const isEmail = (
      await psql.query(`SELECT email FROM calenduck.user WHERE email = $1`, [
        email,
      ])
    ).rows[0].email;

    if (isEmail) {
      throw new ConflictError("이메일 중복");
    }

    const psqlClient = await psql.connect();

    try {
      await psqlClient.query("BEGIN");
      const insertLoginQueryResult = await psqlClient.query(
        `INSERT INTO calenduck.login(id, pw) VALUES($1, $2) RETURNING idx`,
        [id, pw]
      );
      const loginIdx = insertLoginQueryResult.rows[0].idx;

      await psqlClient.query(
        `INSERT INTO calenduck.user(login_idx, name, email) VALUES($1, $2, $3)`,
        [loginIdx, name, email]
      );

      await psqlClient.query("COMMIT");

      return res.sendStatus(201);
    } catch (err) {
      await psqlClient.query("ROLLBACK");
      throw err;
    } finally {
      psqlClient.release();
    }
  })
);

router.delete("/", checkAuth, async (req, res, next) => {
  const loginUser = req.decoded;

  try {
    await psql.query(
      `DELETE FROM calenduck.login CL 
      USING calenduck.user CU 
      WHERE CL.idx = CU.login_idx AND CU.idx=$1`,
      [loginUser.idx]
    );

    return res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

router.get("/interests", checkAuth, async (req, res, next) => {
  const loginUser = req.decoded;

  try {
    const interestList = (
      await psql.query(
        `SELECT I.interest, I.idx FROM calenduck.user_interest UI 
      JOIN calenduck.interest I 
      ON UI.interest_idx = I.idx 
      WHERE UI.user_idx = $1`,
        [loginUser.idx]
      )
    ).rows;

    if (!interestList) {
      return res.sendStatus(204);
    }

    return res.status(200).send({
      list: interestList,
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/interests/:idx", checkAuth, async (req, res, next) => {
  const { idx: interestIdx = null } = req.params;
  const loginUser = req.decoded;

  try {
    if (!interestIdx || isNAN(interestIdx)) {
      throw new BadRequestError("잘못된 요청 양식");
    }

    const isInterest = (
      await psql.query(`SELECT idx FROM calenduck.interest WHERE idx=$1`, [
        interestIdx,
      ])
    ).rows[0];

    if (!isInterest) {
      throw new NotFoundError("관심사 없음");
    }

    const isUserInterest = (
      await psql.query(
        `SELECT idx FROM calenduck.user_interest WHERE user_idx =$1 AND interest_idx=$2`,
        [loginUser.idx, interestIdx]
      )
    ).rows[0];

    if (isUserInterest) {
      throw new ConflictError("데이터 중복");
    }

    await psql.query(
      `INSERT INTO calenduck.user_interest(user_idx, interest_idx) VALUES($1, $2)`,
      [loginUser.idx, interestIdx]
    );

    res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

router.delete("/interests/:idx", checkAuth, async (req, res, next) => {
  const { idx: interestIdx = null } = req.params;
  const loginUser = req.decoded;

  try {
    if (!interestIdx || isNAN(interestIdx)) {
      throw new BadRequestError("잘못된 요청 양식");
    }

    const isInterest = (
      await psql.query(`SELECT idx FROM calenduck.interest WHERE idx=$1`, [
        interestIdx,
      ])
    ).rows[0];

    if (!isInterest) {
      throw new NotFoundError("관심사 없음");
    }

    await psql.query(
      `DELETE FROM calenduck.user_interest WHERE user_idx =$1 AND interest_idx=$2`,
      [loginUser.idx, interestIdx]
    );

    res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
