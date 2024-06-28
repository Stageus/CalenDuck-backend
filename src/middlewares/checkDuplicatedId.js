// 아이디 중복 확인 middleware
const { BadRequestError, ConflictError, InternalServerError } = require("../model/customError");
const psql = require("../../database/connect/postgre");

const checkDuplicatedId = async (req, res, next) => {
    const { id } = req.body;
    try {
        const selectLoginQueryResult = await psql.query('SELECT 1 FROM calenduck.login WHERE id = $1', [id]);

        if (selectLoginQueryResult.rowCount > 0) {
            return next(new ConflictError("사용 불가능한 아이디입니다. 다른 아이디를 입력해주세요."));
        }

        next();
    } catch (err) {
        return next(new InternalServerError("서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 개발팀(support@calenduck.com)으로 문의해 주세요."));
    }
};

module.exports = checkDuplicatedId;
