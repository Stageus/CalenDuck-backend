// 아이디 중복 확인 middleware
const { ConflictException } = require("../model/customException");

const psql = require("../../database/connect/postgre");

const checkDuplicatedId = async (req, res, next) => {
    const { id } = req.body;
    try {
        const selectLoginQueryResult = await psql.query('SELECT 1 FROM calenduck.login WHERE id = $1', [id]);

        if (selectLoginQueryResult.rowCount > 0) {
            return next(new ConflictException());
        }

        next();
    } catch (err) {
        console.log(err)
    }
};

module.exports = checkDuplicatedId;
