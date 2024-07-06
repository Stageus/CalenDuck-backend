const router = require("express").Router();
const jwt = require("jsonwebtoken");

const psql = require("../../database/connect/postgre");

const checkValidity = require("../middlewares/checkValidity");
const checkDuplicatedId = require("../middlewares/checkDuplicatedId");
const checkAuth = require("../middlewares/checkAuth");

const makeToken = require("../modules/makeToken");
const { getOneResult, getManyResults } = require("../modules/sqlHandler");

const {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} = require("../model/customException");

//로그인
router.post("/login", checkValidity, async (req, res, next) => {
  const { id, pw } = req.body;
  
  try {
    const loginUser = await getOneResult(`
      SELECT CU.idx, CU.role
      FROM calenduck.login CL
      JOIN calenduck.user CU
      ON CL.idx = CU.login_idx
      WHERE CL.id = $1 AND CL.pw = $2
    `, [id, pw]);

    if(!loginUser) return next(new UnauthorizedException());

    const accessToken = makeToken(
      {
        type: "login",
        idx: loginUser.idx,
        rank: loginUser.role,
      }
    );

    res.cookie("access_token", accessToken);

    return res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});


//아이디 찾기
router.post("/id/find", checkAuth("findId"), async (req, res, next) => {
    const email = req.decoded.email;

    try {
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
    } catch (err) {
      return next(err)
    } 
  }
);

//비밀번호 찾기
router.post("/pw/find", checkValidity, checkAuth("findPw"), async (req, res, next) => {
    const { email, id } = req.decoded;

    try {
      const user = await getOneResult(`
        SELECT CU.email
        FROM calenduck.login CL 
        JOIN calenduck.user CU 
        ON CU.login_idx = CL.idx 
        WHERE CU.name = $1 AND CU.email = $2 AND CL.id = $3
      `, [email, id])

      if (!user) return next(new UnauthorizedException());

      return res.sendStatus(201);
    } catch (err) {
      return next(err);
    }
  }
);

//비밀번호 재설정
router.put("/pw", checkValidity, checkAuth("findPw"), async (req, res, next) => {
  const { pw } = req.body;
  const { email } = req.decoded;

  try {
    await psql.query(`
      UPDATE calenduck.login CL SET pw = $1 
      FROM calenduck.user CU 
      WHERE CL.idx = CU.login_idx AND CU.email = $2
    `, [pw, email]);

    return res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

//아이디 중복 체크
router.get("/check-id", checkValidity, checkDuplicatedId, async (req, res, next) => {
    return res.sendStatus(201);
  }
);

//회원가입
router.post("/", checkAuth("signUp"), checkValidity, checkDuplicatedId, async (req, res, next) => {
    const { id, pw, name } = req.body;
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
        INSERT INTO calenduck.user(login_idx, name, email) 
        VALUES($1, $2, $3)
      `, [loginIdx, name, email]);

      await psqlClient.query("COMMIT");

      return res.sendStatus(201);
    } catch (err) {
      await psqlClient.query("ROLLBACK");
      return next(err);
    } finally {
      psqlClient.release();
    }
  }
);

//회원 탈퇴
router.delete("/", checkAuth(), async (req, res, next) => {
  const loginUser = req.decoded;

  try {

    const user = await getOneResult(`
      SELECT login_idx, kakao_idx
      FROM calenduck.user
      WHERE idx = $1 
      `, [loginUser.idx]);

    const loginIdx = user?.login_idx || null;
    const kakaoIdx = user?.kakao_idx || null;

    if(loginIdx){
      await psql.query(`
        DELETE FROM calenduck.login
        WHERE idx = $1
      `, [loginIdx]);
    }

    if(kakaoIdx){
      await psql.query(`
        DELETE FROM calenduck.kakao 
        WHERE idx = $1
        `, [kakaoIdx]);
    }

    return res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

//내 관심사 불러오기
router.get("/interests", checkAuth(), async (req, res, next) => {
  const loginUser = req.decoded;

  try {
    const interestList = await getManyResults(`
      SELECT CI.interest, CI.idx FROM calenduck.user_interest UI
      JOIN calenduck.interest CI
      ON UI.interest_idx = CI.idx
      WHERE UI.user_idx = $1
    `, [loginUser.idx]);

    if (!interestList || interestList.length === 0) return res.sendStatus(204);

    return res.status(200).send({
      list: interestList,
    });
  } catch (err) {
    return next(err);
  }
});


//관심사 추가
router.post("/interests/:idx", checkAuth(), async (req, res, next) => {
  const { idx: interestIdx = null } = req.params;
  const loginUser = req.decoded;

  try {
    if (!interestIdx || isNAN(interestIdx)) return next(new BadRequestException());
    

    await psql.query(`
      INSERT INTO calenduck.user_interest(user_idx, interest_idx) 
      VALUES($1, $2)
    `, [loginUser.idx, interestIdx]);

    return res.sendStatus(201);
  } catch (err) {
    if(err.constraint === "user_interest_pkey") return next(new NotFoundException());
    if(err.constraint === "fk_interest_to_user_interest" || err.constraint === "fk_user_to_user_interest") return next(new NotFoundException());
    return next(err);
  }
});

//내 관심사 삭제
router.delete("/interests/:idx", checkAuth(), async (req, res, next) => {
  const { idx: interestIdx = null } = req.params;
  const loginUser = req.decoded;

  try {
    if (!interestIdx || isNAN(interestIdx)) return next(new BadRequestException());

    await psql.query(`
      DELETE FROM calenduck.user_interest 
      WHERE user_idx = $1 AND interest_idx= $2
    `, [loginUser.idx, interestIdx]);

    return res.sendStatus(201);
  } catch (err) {
    if(err.constraint === "fk_interest_to_user_interest" || err.constraint === "fk_user_to_user_interest") return next(new NotFoundException());
    return next(err);
  }
});

module.exports = router;
