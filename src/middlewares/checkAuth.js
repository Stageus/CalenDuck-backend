const jwt = require("jsonwebtoken");

const {
    ForbiddenException,
    UnauthorizedException
} = require("../model/customException");

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
            if (type === "admin" && jwtData.rank !== "admin") {
                return next(new ForbiddenException());
            }
            return next();
        } catch (err) {
            return next(new UnauthorizedException());
        }
    }
}

module.exports = checkAuth