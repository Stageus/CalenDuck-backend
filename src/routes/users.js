const checkValidity = require("../middlewares/checkValidity");
const psql = require("../../database/connect/postgre");

const checkDuplicatedId = require("../middlewares/checkDuplicatedId");
const checkAuth = require("../middlewares/checkAuth");
const makeToken = require("../modules/makeToken");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const {
  BadRequestException,
  UnauthorizedException,
} = require("../model/customException");
const endRequestHandler = require("../modules/endRequestHandler");
const { getOneResult, getManyResults } = require("../modules/sqlHandler");

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
      `, [id, pw] 
    );

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


//아이디 찾기
router.post(
  "/id/find", checkValidity,
  endRequestHandler(async (req, res, next) => {
    const { name, email, verification_code: verificationCode } = req.body;
    const redis = require("redis").createClient();
    await redis.connect();

    try {
      let verifiCode = await redis.get(email);

      if (
        !verifiCode ||
        verifiCode !== verificationCode
      ) {
        return next(new UnauthorizedException());
      }

      const user = await getOneResult(`
        SELECT CL.id AS "id" 
        FROM calenduck.login CL 
        JOIN calenduck.user CU 
        ON CU.login_idx = CL.idx 
        WHERE CU.name =$1 AND CU.email=$2
        `, [name, email]
      );

      if (!user) return next(new UnauthorizedException());

      return res.status(200).send({
        id: user.id,
      });
    } catch (err) {
      throw err;
    } finally {
      await redis.disconnect();
    }
  })
);

//비밀번호 찾기
router.post(
  "/pw/find", checkValidity,
  endRequestHandler(async (req, res, next) => {
    const { name, id, email, verification_code: verificationCode } = req.body;

    const redis = require("redis").createClient();
    await redis.connect();

    try {
      let verifiCode = await redis.get(email);

      if (
        !verifiCode ||
        verifiCode !== verificationCode
      ) {
        return next(new UnauthorizedException());
      }


      const user = await getOneResult(`
        SELECT CU.email
        FROM calenduck.login CL 
        JOIN calenduck.user CU 
        ON CU.login_idx = CL.idx 
        WHERE CU.name =$1 AND CU.email=$2 AND CL.id = $3
        `, [name, email, id])

      if (!user) return next(new UnauthorizedException());

      const emailToken = makeToken(
        {
          email: user.email,
        },
        "email"
      );

      res.cookie("access_token", emailToken);

      return res.sendStatus(201);
    } catch (err) {
      throw err;
    } finally {
      await redis.disconnect();
    }
  })
);

//비밀번호 재설정
router.put("/pw", checkValidity, async (req, res, next) => {
  const { pw } = req.body;
  const token = req.cookies.email_token || null;
  
  if(!token){
    return next(new UnauthorizedException());
  }

  try {
    const user = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET_KEY);
    
    await psql.query(`
      UPDATE calenduck.login CL SET pw=$1 
      FROM calenduck.user CU 
      WHERE CL.idx = CU.login_idx AND CU.email =$2
      `, [pw, user.email]
    );

    return res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

//아이디 중복 체크
router.get(
  "/check-id",
  checkValidity,
  checkDuplicatedId,
  async (req, res, next) => {
    return res.sendStatus(201);
  }
);

//회원가입
router.post(
  "/",  checkValidity, checkDuplicatedId,
  endRequestHandler(async (req, res, next) => {
    const { id, pw, name, email } = req.body;

    const psqlClient = await psql.connect();

    try {
      await psqlClient.query("BEGIN");
      const insertLoginQueryResult = await psqlClient.query(`
        INSERT INTO calenduck.login(id, pw) 
        VALUES($1, $2) RETURNING idx
        `, [id, pw]
      );
      const loginIdx = insertLoginQueryResult.rows[0].idx;

      await psqlClient.query(`
        INSERT INTO calenduck.user(login_idx, name, email) 
        VALUES($1, $2, $3)
        `, [loginIdx, name, email]
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

//회원 탈퇴
router.delete("/", checkAuth(), async (req, res, next) => {
  const loginUser = req.decoded;

  try {
    await psql.query(`
      DELETE FROM calenduck.login CL
      USING calenduck.user CU
      WHERE CL.idx = CU.login_idx AND CU.idx=$1`,
      [loginUser.idx]
    );

    return res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

//내 관심사 불러오기
router.get("/interests", checkAuth, async (req, res, next) => {
  const loginUser = req.decoded;

  try {
    const interestList = await getManyResults(`
      SELECT I.interest, I.idx FROM calenduck.user_interest UI
      JOIN calenduck.interest I
      ON UI.interest_idx = I.idx
      WHERE UI.user_idx = $1
      `, [loginUser.idx]
    )

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


//관심사 추가
router.post("/interests/:idx", checkAuth, async (req, res, next) => {
  const { idx: interestIdx = null } = req.params;
  const loginUser = req.decoded;

  try {
    if (!interestIdx || isNAN(interestIdx)) {
      throw new BadRequestException();
    }

    await psql.query(`
      INSERT INTO calenduck.user_interest(user_idx, interest_idx) 
      VALUES($1, $2)
      `, [loginUser.idx, interestIdx]
    );

    res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

//내 관심사 삭제
router.delete("/interests/:idx", checkAuth, async (req, res, next) => {
  const { idx: interestIdx = null } = req.params;
  const loginUser = req.decoded;

  try {
    if (!interestIdx || isNAN(interestIdx)) {
      throw new BadRequestException();
    }

    await psql.query(`
      DELETE FROM calenduck.user_interest 
      WHERE user_idx =$1 AND interest_idx=$2
      `, [loginUser.idx, interestIdx]
    );

    res.sendStatus(201);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
