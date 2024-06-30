const checkValidity = require("../middlewares/checkValidity");
const psql = require("../../database/connect/postgre");
const {
  UnauthorizedError,
  ConflictError,
  ForbiddenError,
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

module.exports = router;
