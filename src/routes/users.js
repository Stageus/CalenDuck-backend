const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const checkValidity = require("../middlewares/checkValidity");
const checkDuplicatedId = require("../middlewares/checkDuplicatedId");
const checkAuth = require("../middlewares/checkAuth");

const endRequestHandler = require("../modules/endRequestHandler");
const makeToken = require("../modules/makeToken");
const { getOneResult } = require("../modules/sqlHandler");

const {
  UnauthorizedException,
} = require("../model/customException");

//로그인
router.post("/login", checkValidity({"authField": ["id", "pw"]}), endRequestHandler(async (req, res, next) => {
    const { id, pw } = req.body;

    const loginUser = await getOneResult(`
      SELECT CU.idx, CU.role
      FROM calenduck.login CL
      JOIN calenduck.user CU
      ON CL.idx = CU.login_idx
      WHERE CL.id = $1 AND CL.pw = $2
    `, [id, pw]);

    if (!loginUser) return next(new UnauthorizedException());

    const accessToken = makeToken({
      type: "login",
      idx: loginUser.idx,
      rank: loginUser.role,
    });

    res.cookie("access_token", accessToken);

    return res.sendStatus(201);
  })
);

//아이디 찾기
router.post("/id/find", checkAuth("findId"), endRequestHandler(async (req, res, next) => {
    const email = req.decoded.email;

    const user = await getOneResult(`
      SELECT CL.id  
      FROM calenduck.login CL 
      JOIN calenduck.user CU 
      ON CU.login_idx = CL.idx 
      WHERE CU.email = $1
    `, [email]);

    if (!user) return next(new UnauthorizedException());

    return res.status(200).send({
      id: user.id,
    });
  })
);

//비밀번호 찾기
router.post("/pw/find", checkAuth("findPw"), endRequestHandler(async (req, res, next) => {
    const { email, id } = req.decoded;

    const user = await getOneResult(`
        SELECT CU.email
        FROM calenduck.login CL 
        JOIN calenduck.user CU 
        ON CU.login_idx = CL.idx 
        WHERE CU.email = $1 AND CL.id = $2
    `, [email, id]);

    if (!user) return next(new UnauthorizedException());

    return res.sendStatus(201);
  })
);

//비밀번호 재설정
router.put("/pw", checkAuth("findPw"), checkValidity({"authField": ["pw"]}), endRequestHandler(async (req, res, next) => {
    const { pw } = req.body;
    const { email } = req.decoded;

    await psql.query(`
      UPDATE calenduck.login CL SET pw = $1 
      FROM calenduck.user CU 
      WHERE CL.idx = CU.login_idx AND CU.email = $2
    `, [pw, email]);

    return res.sendStatus(201);
  })
);

//아이디 중복 체크
router.get("/check-id", checkValidity({"authField": ["id"]}), checkDuplicatedId,
  async (req, res, next) => {
    return res.sendStatus(201);
  }
);

//회원가입
router.post("/", checkAuth("signup"), checkValidity({"authField": ["id", "pw", "nickname"]}), checkDuplicatedId, endRequestHandler(async (req, res, next) => {
    const { id, pw, nickname } = req.body;
    const email = req.decoded.email;

    const psqlClient = await psql.connect();

    try {
      await psqlClient.query("BEGIN");

      const insertLoginQueryResult = await psqlClient.query(`
        INSERT INTO calenduck.login(id, pw) 
        VALUES($1, $2) RETURNING idx
      `, [id, pw]);
      const loginIdx = insertLoginQueryResult.rows[0].idx;

      await psqlClient.query(`
        INSERT INTO calenduck.user(login_idx, nickname, email) 
        VALUES($1, $2, $3)
      `, [loginIdx, nickname, email]);

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

//회원 탈퇴
router.delete("/", checkAuth("login"), endRequestHandler(async (req, res, next) => {
    const loginUser = req.decoded;

    const user = await getOneResult(`
      SELECT login_idx, kakao_idx
      FROM calenduck.user
      WHERE idx = $1 
    `, [loginUser.idx]);

    const loginIdx = user?.login_idx || null;
    const kakaoIdx = user?.kakao_idx || null;

    if (loginIdx) {
      await psql.query(`
        DELETE FROM calenduck.login
        WHERE idx = $1
      `, [loginIdx]);
    }

    if (kakaoIdx) {
      await psql.query(`
        DELETE FROM calenduck.kakao 
        WHERE idx = $1
      `,[kakaoIdx]);
    }

    return res.sendStatus(201);
  })
);

module.exports = router;
