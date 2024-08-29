const jwt = require("jsonwebtoken");

const {
    ForbiddenException,
    UnauthorizedException
} = require("../model/customException");

const {
    SIGNUP,
    FIND_ID,
    FIND_PW,
    LOGIN,
    MASTER,
    MANAGER
} = require("../constants");

/**
 * @param {"signup" | "findId" | "findPw" | "login" | "master" | "manager"} type
 */

const checkAuth = (type = null) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // "Bearer <토큰>"에서 "<토큰>" 부분만 추출

        try {
            const jwtData = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
            req.decoded = jwtData;

            const validTypes = [SIGNUP, FIND_ID, FIND_PW, LOGIN];

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