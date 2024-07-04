// 아이디 중복 확인 middleware
const psql = require("../../database/connect/postgre");

const { 
    ConflictException 
} = require("../model/customException");

const { 
    getOneResult 
} = require("../modules/sqlHandler");

const checkDuplicatedId = async (req, res, next) => {
    const { id } = req.body;

    try {
        const login = await getOneResult(`
            SELECT id
            FROM calenduck.login
            WHERE id = $1
        `, [id]);

        if (login) {
            return next(new ConflictException());
        }

        return next();
    } catch (err) {
        return next(err);
    }
};

module.exports = checkDuplicatedId;
