const jwt = require("jsonwebtoken");
const {
    ForbiddenError,
    UnauthorizedError
} = require("../model/customError")

const checkAuth = (type = null) => {
    return (req, res, next) => {
        const { token } = req.cookies.access_token;

        try {
            const jwtData = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
            req.decoded = jwtData;

            if (type === "admin" && jwtData.admin !== true) {
                return next(new ForbiddenError("관리자만이 접근할 수 있습니다."));
            }
            return next();
        } catch (err) {
            return next(new UnauthorizedError("인증되지 않은 접근입니다."));
        }
    }
}

module.exports = checkAuth