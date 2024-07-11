const jwt = require("jsonwebtoken");

const {
    ForbiddenException,
    UnauthorizedException
} = require("../model/customException");

const {
    SIGNUP,
    FINDID,
    FINDPW,
    LOGIN,
    MASTER,
    MANAGER
} = require("../constants");

/**
 * @param {"signup" | "findId" | "findPw" | "login" | "master" | "manager"} type
 */

const checkAuth = (type = null) => {
    return (req, res, next) => {
        const token = req.cookies.access_token;

        try {
            const jwtData = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
            req.decoded = jwtData;

            const validTypes = [SIGNUP, FINDID, FINDPW, LOGIN];

            if (validTypes.includes(type) && jwtData.type !== type) {
                return next(new UnauthorizedException());
            }
            if (type === MASTER && jwtData.rank !== MASTER) {
                return next(new ForbiddenException());
            }
            if (type === MANAGER && jwtData.rank !== MANAGER) {
                return next(new ForbiddenException());
            }
            return next();
        } catch (err) {
            return next(new UnauthorizedException());
        }
    }
}

module.exports = checkAuth