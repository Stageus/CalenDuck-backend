const nodemailer = require("nodemailer");
const router = require("express").Router();
const crypto = require("crypto");

const checkValidity = require("../middlewares/checkValidity");

const { 
    ConflictException,
    UnauthorizedException 
} = require("../model/customException");

const endRequestHandler = require("../modules/endRequestHandler");
const { getOneResult } = require("../modules/sqlHandler");


router.post("/email", checkValidity, endRequestHandler(async (req, res, next) => {
    const { email } = req.body;
    const min = 100000;
    const max = 999999;
    const range = max - min + 1;

    const user = await getOneResult(`
      SELECT email FROM calenduck.user 
      WHERE email=$1
    `, [email] );

    if (user) {
      return next(new ConflictException());
    }

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

router.post("/check-code", endRequestHandler(async (req, res, next) => {
  const { code = null, pageType } = req.body;

  const redis = require("redis").createClient();
  await redis.connect();
  
  try{
    const verifiCode = await redis.get(email);

    if (!verifiCode || verifiCode !== code) {
      return next(new UnauthorizedException());
    }

    const emailToken = makeToken(
      {
        email: user.email,
        type: pageType 
      } 
    );

    res.cookie("access_token", emailToken);
    res.sendStatus(201);
  }catch(err){
    return next(err);
  }
}))

module.exports = router;
