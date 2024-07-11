const jwt = require("jsonwebtoken");
const { EXPIRESIN } = require("../constants")

const makeToken = (Object) => {
  const token = process.env.TOKEN_SECRET_KEY;

  const accessToken = jwt.sign(Object, token, {
    issuer: "stageus",
    expiresIn: EXPIRESIN,
  });

  return accessToken;
};

module.exports = makeToken;
