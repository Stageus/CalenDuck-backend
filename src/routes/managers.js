// 관심사 계정 관련 API
const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const checkAuth = require("../middlewares/checkAuth");
const checkValidity = require("../middlewares/checkValidity");

const { 
    NotFoundException 
} = require("../model/customException");

const { 
    getOneResult 
} = require("../modules/sqlHandler");
const endRequestHandler = require("../modules/endRequestHandler");

const { DATE_TIME_REGEX,
        MAX_LENGTH_100_REGEX,
        PARAM_REGEX,
        MANAGER } = require("../constants");

// 관심사 스케줄 생성
router.post("/schedules/interests", checkAuth(MANAGER), checkValidity({ [DATE_TIME_REGEX]: ["fullDate"], [MAX_LENGTH_100_REGEX]: ["interestContents"] }), endRequestHandler(async (req, res, next) => {
    const { fullDate, interestContents } = req.body
    const loginUser = req.decoded;
    
    await psql.query(`
        INSERT INTO calenduck.interest_schedule (interest_idx, time, contents)
        SELECT CM.interest_idx, $1, $2
        FROM calenduck.manager CM
        WHERE CM.user_idx = $3
    `, [fullDate, interestContents, loginUser.idx]);
    
    return res.sendStatus(201);
}))

// 관심사 스케줄 수정
router.put("/schedules/interests/:idx", checkAuth(MANAGER), checkValidity({ [DATE_TIME_REGEX]: ["fullDate"], [MAX_LENGTH_100_REGEX]: ["interestContents"], [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { fullDate, interestContents } = req.body;
    const { idx } = req.params;
    const loginUser = req.decoded;

    // 스케줄 존재 여부 확인
    const interestSchedule = await getOneResult(`
        SELECT 1
        FROM calenduck.interest_schedule
        WHERE idx = $1
    `, [idx]);

    if (!interestSchedule) return next(new NotFoundException());

    // 스케줄 수정
    await psql.query(`
        UPDATE calenduck.interest_schedule CIS
        SET time = $1, contents = $2, interest_idx = CM.interest_idx
        FROM calenduck.manager CM
        WHERE CIS.idx = $3 AND CM.user_idx = $4
    `, [fullDate, interestContents, idx, loginUser.idx]);

    return res.sendStatus(201);
}))

// 관심사 스케줄 삭제
router.delete("/schedules/interests/:idx", checkAuth(MANAGER), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { idx } = req.params;
    const loginUser = req.decoded;

    // 스케줄 존재 여부 확인
    const interestSchedule = await getOneResult(`
        SELECT 1
        FROM calenduck.interest_schedule
        WHERE idx = $1
    `, [idx]);

    if (!interestSchedule) return next(new NotFoundException());

    // 스케줄 삭제
    await psql.query(`
        DELETE FROM calenduck.interest_schedule CIS
        USING calenduck.manager CM
        WHERE CIS.idx = $1 AND CM.user_idx = $2;
    `, [idx, loginUser.idx]);

    return res.sendStatus(201);
}))

module.exports = router;