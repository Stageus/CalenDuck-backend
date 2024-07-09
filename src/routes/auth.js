const nodemailer = require("nodemailer");
const router = require("express").Router();
const crypto = require("crypto");

const checkValidity = require("../middlewares/checkValidity");

const { idRegex } = require("../model/constants")  
const { range } = require("../model/constants");

const { 
    ConflictException,
    UnauthorizedException, 
    BadRequestException
} = require("../model/customException");

const endRequestHandler = require("../modules/endRequestHandler");
const { getOneResult } = require("../modules/sqlHandler");
const makeToken = require("../modules/makeToken");


router.post("/email", checkValidity({"authField": ["email"]}), endRequestHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await getOneResult(`
      SELECT email FROM calenduck.user 
      WHERE email=$1
    `, [email]);

    if (user) return next(new ConflictException());

    const redis = require("redis").createClient();
    await redis.connect();

    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.USER,
          pass: process.env.PASSWORD,
        },
      });

      const array = new Uint32Array(1);
      crypto.getRandomValues(array);

      const code = (array[0] % range) + min;

      redis.set(email, code);
      redis.expire(email, 3 * 60);

      await transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: "Calenduck 이메일 인증번호",
        text: `이메일 인증 번호는 ${code}입니다.`,
      });

      return res.sendStatus(201);
    } catch (err) {
      return next(err);
    } finally {
      await redis.disconnect();
    }
  })
);

router.post("/check-code", checkValidity({"authField": ["email"], "codeField": ["code"]}), endRequestHandler(async (req, res, next) => {
  const { email, code, pageType, id } = req.body;

  const validTypes = ["signup", "findId", "findPw"];

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

    if (pageType === "findPw") {
      if (!idRegex.test(id)) {
        return next(new BadRequestException());
      }
      tokenPayload.id = id;
    }
      
    
    const emailToken = makeToken(tokenPayload);

    res.cookie("access_token", emailToken);
    res.sendStatus(201);
  }catch(err){
    return next(err);
  }
}))

module.exports = router;
