const nodemailer = require("nodemailer");
const router = require("express").Router();
const crypto = require("crypto");

const checkValidity = require("../middlewares/checkValidity");

const { ID_REGEX, RANGE, MIN, SIGNUP, FIND_ID, FIND_PW } = require("../constants");

const { 
    ConflictException,
    UnauthorizedException, 
    BadRequestException
} = require("../model/customException");

const endRequestHandler = require("../modules/endRequestHandler");
const { getOneResult } = require("../modules/sqlHandler");
const makeToken = require("../modules/makeToken");

//이메일 인증 번호 발송
router.post("/email", checkValidity({"authField": ["email"]}), endRequestHandler(async (req, res, next) => {
    const { email, checkDuplicated } = req.body;
    
    if(typeof checkDuplicated !== "boolean") return next(new BadRequestException());

    if (checkDuplicated) {
      const user = await getOneResult(`
        SELECT 1 FROM calenduck.user 
        WHERE email=$1
      `, [email]);
  
      if (user) return next(new ConflictException());
    }

    const redis = require("redis").createClient();
    await redis.connect();

    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        host: process.env.EMAIL_HOST,
        auth: {
          user: process.env.EMAIL_ID,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const array = new Uint32Array(1);
      crypto.getRandomValues(array);

      const code = (array[0] % RANGE) + MIN;

      redis.set(email, code);
      redis.expire(email, 3 * 60);

      await transporter.sendMail({
        from: process.env.EMAIL_ID,
        to: email,
        subject: "Calenduck 이메일 인증번호",
        text: `이메일 인증 번호는 ${code}입니다.`,
      });

      return res.sendStatus(201);
    } catch (err) {
      throw err;
    } finally {
      await redis.disconnect();
    }
  })
);

//이메일 인증 번호 확인
router.post("/check-code", checkValidity({"authField": ["email"], "codeField": ["code"]}), endRequestHandler(async (req, res, next) => {
  const { email, code, pageType, id } = req.body;

  const validTypes = [SIGNUP, FIND_ID, FIND_PW];

  if(!validTypes.includes(pageType)) return next(new BadRequestException());

  const redis = require("redis").createClient();
  await redis.connect();
  
  try{
    const verifiCode = await redis.get(email);

    if (!verifiCode || verifiCode !== code) {
      return next(new UnauthorizedException());
    }

    const tokenPayload = 
      {
        email: email,
        type: pageType 
      } 

    if (pageType === FIND_PW) {
      if (!ID_REGEX.test(id)) {
        return next(new BadRequestException());
      }
      tokenPayload.id = id;
    }
      
    const emailToken = makeToken(tokenPayload);

    res.cookie("access_token", emailToken);
    res.sendStatus(201);
  }catch(err){
    throw err;
  }finally {
    await redis.disconnect();
  }
}))

module.exports = router;
