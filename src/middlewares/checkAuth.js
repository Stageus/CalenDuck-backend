const jwt = require("jsonwebtoken");
const { ForbiddenError } = require("../model/customError")

const checkAuth = (type = null) => {
    return (req, res, next) => {
        const { token } = req.headers;
        const result = {
            message: "",
        }

        try {
            const jwtData = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
            req.decoded = jwtData;

            if (type === "admin" && jwtData.admin !== true) {
                throw new ForbiddenError("관리자만이 접근할 수 있습니다.");
            }
            return next();
        } catch (err) {
            if (err.message === "jwt must be provided") {
                result.message = "로그인이 필요합니다.";
            } else if (err.message === "jwt expired") {
                result.message = "세션이 만료되었습니다. 다시 로그인해주세요.";
            } else if (err.message === "invalid token") {
                result.message = "정상적이지 않은 접근입니다.";
            } else {
                result.message = err.message;
            }
            res.status(401).send(result);
        }
    }
}

module.exports = checkAuth