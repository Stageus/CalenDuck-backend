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
        INSERT INTO calenduck.interest_schedule (user_idx, interest_idx, time, contents)
        SELECT CM.user_idx, CM.interest_idx, $1, $2
        FROM calenduck.manager CM
        WHERE CM.user_idx = $3
    `, [fullDate, interestContents, loginUser.idx]);
    
    return res.sendStatus(201);
}))

// 관심사 스케줄 수정
router.put("/schedules/interests/:idx", checkAuth(MANAGER), checkValidity({ "dateField": ["fullDate"], "stringField": ["interestContents"], "numberField": ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { fullDate, interestContents } = req.body;
    const { idx } = req.params;

    // 스케줄 존재 여부 확인
    const interestSchedule = await getOneResult(`
        SELECT 1
        FROM calenduck.interest_schedule
        WHERE idx = $1
    `, [idx]);

    if (!interestSchedule) return next(new NotFoundException());

    // 스케줄 수정
    await psql.query(`
        UPDATE calenduck.interest_schedule
        SET time = $1, contents = $2
        WHERE idx = $3
    `, [fullDate, interestContents, idx]);

    return res.sendStatus(201);
}))

// 관심사 스케줄 삭제
router.put("/schedules/interests/:idx", checkAuth(MANAGER), checkValidity({ "numberField": ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { idx } = req.params;

    // 스케줄 존재 여부 확인
    const interestSchedule = await getOneResult(`
        SELECT 1
        FROM calenduck.interest_schedule
        WHERE idx = $1
    `, [idx]);

    if (!interestSchedule) return next(new NotFoundException());

    // 스케줄 삭제
    await psql.query(`
        DELETE FROM calenduck.interest_schedule
        WHERE idx = $1
    `, [idx]);

    return res.sendStatus(201);
}))

module.exports = router;