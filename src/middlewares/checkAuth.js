const jwt = require("jsonwebtoken");

const {
    ForbiddenException,
    UnauthorizedException
} = require("../model/customException");

/**
 * @param {"signup" | "findId" | "findPw" | "login" | "master" | "manager"} type
 */

const checkAuth = (type = null) => {
    return (req, res, next) => {
        const token = req.cookies.access_token;

        try {
            const jwtData = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
            req.decoded = jwtData;

            const validTypes = ["signup", "findId", "findPw", "login"];

            if (validTypes.includes(type) && jwtData.type !== type) {
                return next(new UnauthorizedException());
            }
            if (type === "master" && jwtData.rank !== "master") {
                return next(new ForbiddenException());
            }
            if (type === "manager" && jwtData.rank !== "manager") {
                return next(new ForbiddenException());
            }
            return next();
        } catch (err) {
            return next(new UnauthorizedException());
        }
    }
}

module.exports = checkAuth