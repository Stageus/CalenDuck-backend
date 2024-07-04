const jwt = require("jsonwebtoken");

const makeToken = (Object) => {
  const token = process.env.TOKEN_SECRET_KEY;

  const accessToken = jwt.sign(Object, token, {
    issuer: "stageus",
    expiresIn: "1h",
  });

  return accessToken;
};

module.exports = makeToken;
