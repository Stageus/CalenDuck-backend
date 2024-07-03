// const checkValidity = require("../middlewares/checkValidity");
const nodemailer = require("nodemailer");
const router = require("express").Router();
const crypto = require("crypto");
const endRequestHandler = require("../modules/endRequestHandler");

router.post(
  "/email",
  endRequestHandler(async (req, res, next) => {
    const { email } = req.body;
    const min = 100000;
    const max = 999999;
    const range = max - min + 1;

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

      const vericicationCode = (array[0] % range) + min;

      redis.set(email, vericicationCode);
      redis.expire(email, 3 * 60);

      await transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: "Calenduck 이메일 인증번호",
        text: `이메일 인증 번호는 ${vericicationCode}입니다.`,
      });

      return res.sendStatus(201);
    } catch (err) {
      return next(err);
    } finally {
      await redis.disconnect();
    }
  })
);

module.exports = router;
