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
        console.log("Authorization Header:", authHeader);

        const token = authHeader && authHeader.split(' ')[1]; // "Bearer <토큰>"에서 "<토큰>" 부분만 추출
        console.log("Extracted Token:", token);

        try {
            const jwtData = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
            console.log("Decoded JWT Data:", jwtData);
            req.decoded = jwtData;

            const validTypes = [SIGNUP, FIND_ID, FIND_PW, LOGIN];

            if (validTypes.includes(type) && jwtData.type !== type) {
                console.log("Invalid type in JWT:", jwtData.type);
                return next(new UnauthorizedException());
            }
            if (type === MASTER && jwtData.rank !== MASTER) {
                console.log("Forbidden: User is not a MASTER");
                return next(new ForbiddenException());
            }
            if (type === MANAGER && jwtData.rank !== MANAGER) {
                console.log("Forbidden: User is not a MANAGER");
                return next(new ForbiddenException());
            }
            console.log("Authorization successful");
            return next();
        } catch (err) {
            console.log("JWT verification failed:", err.message);
            return next(new UnauthorizedException());
        }
    }
}

module.exports = checkAuth