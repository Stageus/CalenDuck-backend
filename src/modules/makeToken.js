const jwt = require("jsonwebtoken");

/**
 *
 * @param {*} Object
 * @param {"login" | "email"} type
 * @returns
 */

const makeToken = (Object, type) => {
  let token = null;

  if (type === "email") token = process.env.EMAIL_TOKEN_SECRET_KEY;
  if (type === "login") token = process.env.TOKEN_SECRET_KEY;

  const accessToken = jwt.sign(Object, token, {
    issuer: "stageus",
    expiresIn: "1h",
  });
  return accessToken;
};

module.exports = makeToken;
