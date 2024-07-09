// 스케줄 관련 API
const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const checkValidity = require("../middlewares/checkValidity");
const checkAuth = require("../middlewares/checkAuth")

const { 
    getOneResult,
    getManyResults
} = require("../modules/sqlHandler");

// 특정 년월 스케줄 전체 불러오기
router.get("/", checkAuth(), async (req, res, next) => {
    const { date } = req.query;

    try{
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);

        // 날짜별로 빈 리스트 초기화(31개)
        let scheduleList = Array.from({ length: 31 }, () => []);

        // 개인 스케줄 가져오기
        const personalSchedule = await getManyResults(`
            SELECT COUNT(*) AS count, EXTRACT(DAY FROM time) as day
            FROM calenduck.personal_schedule
            WHERE EXTRACT(YEAR FROM time) = $1 AND EXTRACT(MONTH FROM time) = $2
            GROUP BY EXTRACT(DAY FROM time)
        `, [year, month]);

        // 관심사 스케줄 가져오기
        const interestSchedule = await getManyResults(`
            SELECT COUNT(*) AS count, EXTRACT(DAY FROM time) as day, contents as name
            FROM calenduck.interest_schedule
            WHERE EXTRACT(YEAR FROM time) = $1 AND EXTRACT(MONTH FROM time) = $2
            GROUP BY EXTRACT(DAY FROM time), contents
        `, [year, month]);

        // 결과 반환
        if ( personalSchedule.length === 0 && !interestSchedule.length === 0 ) {
            return res.sendStatus(204); 
        }

        // 개인 스케줄을 날짜별로 리스트에 추가
        personalSchedule.forEach(schedule => {
        const day = schedule.day - 1; // index값이 day 값은 같게 하기 위해서 1을 뺌
        scheduleList[day].push({
            type: 'personal',
            name: null,
            count: schedule.count
        });
        });

        // 관심사 스케줄을 날짜별로 리스트에 추가
        interestSchedule.forEach(schedule => {
            const day = schedule.day - 1; // index값이 day 값은 같게 하기 위해서 1을 뺌
            scheduleList[day].push({
                type: 'interest',
                name: schedule.name,
                count: schedule.count
        });
        });

        return res.status(200).json({
            list: scheduleList
        });
    }catch(err){
        return next(err);
    }
})

// 특정 년월 특정 관심사 불러오기
router.get("/interest", checkAuth(), async (req, res, next) => {
    const { date, interestIdx } = req.query;

    try{
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);

        // 날짜별로 빈 리스트 초기화(31개)
        let scheduleList = Array.from({ length: 31 }, () => []);

        // 관심사 스케줄 가져오기
        const interestSchedule = await getManyResults(`
            SELECT COUNT(*) AS count, EXTRACT(DAY FROM time) as day, contents as interestName
            FROM calenduck.interest_schedule
            WHERE EXTRACT(YEAR FROM time) = $1 AND EXTRACT(MONTH FROM time) = $2 AND interest_idx = $3
            GROUP BY EXTRACT(DAY FROM time), contents
        `, [year, month, interestIdx]);

        if ( interestSchedule === 0 ) {
            return res.sendStatus(204); 
        }
    
        // 관심사 스케줄을 날짜별로 리스트에 추가
        interestSchedule.forEach(schedule => {
            const day = schedule.day - 1; // index값이 day 값은 같게 하기 위해서 1을 뺌
            scheduleList[day].push({
                interestName: schedule.interestname,
                count: schedule.count
            });
        });

        return res.status(200).json({
            list: scheduleList
        });
    }catch(err){
        return next(err);
    }
})

// 특정 날짜에서 특정 관심사 불러오기
router.get("/details/interest", checkAuth(), async (req, res, next) => {
    const { date, interestIdx} = req.query;

    try{
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day =  date.substring(6, 8)

        // 빈 리스트 초기화
        let scheduleList = [];

        // 관심사 스케줄 불러오기
        const interestSchedule = await getManyResults(`
            SELECT interest_schedule.idx, interest_schedule.time, interest_schedule.contents, interest_schedule.priority, interest.interest as name
            FROM calenduck.interest_schedule
            INNER JOIN calenduck.interest ON interest_schedule.interest_idx = interest.idx
            WHERE EXTRACT(YEAR FROM interest_schedule.time) = $1 
            AND EXTRACT(MONTH FROM interest_schedule.time) = $2
            AND EXTRACT(DAY FROM interest_schedule.time) = $3
            AND interest_schedule.interest_idx = $4
            ORDER BY interest_schedule.time ASC
        `, [year, month, day, interestIdx])

        // 스케줄이 없는 경우
        if (interestSchedule.length === 0) {
            return res.sendStatus(204); 
        }

        // 관심사 스케줄을 리스트에 추가
        interestSchedule.forEach(schedule => {
            scheduleList.push({
                idx: schedule.idx,
                name: schedule.name,
                time: schedule.time,
                contents: schedule.contents,
                priority: schedule.priority
            });
        });

        // 결과 반환
        return res.status(200).json({
            list: scheduleList
        });
    }catch(err){
        return next(err);
    }
})

// 특정 날짜 스케줄 전체 불러오기
router.get("/details", checkAuth(), async (req, res, next) => {
    const { date } = req.query;

    try{
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day =  date.substring(6, 8)

        // 빈 리스트 초기화
        let scheduleList = [];

        // 개인 스케줄 가져오기
        const personalSchedule = await getManyResults(`
            SELECT personal_schedule.idx AS idx, personal_schedule.time AS time, personal_schedule.contents AS contents, personal_schedule.priority AS priority
            FROM calenduck.personal_schedule
            WHERE EXTRACT(YEAR FROM personal_schedule.time) = $1 
            AND EXTRACT(MONTH FROM personal_schedule.time) = $2
            AND EXTRACT(DAY FROM personal_schedule.time) = $3
        `, [year, month, day]);

        // 관심사 스케줄 가져오기
        const interestSchedule = await getManyResults(`
            SELECT interest_schedule.idx AS idx, interest_schedule.time AS time, interest_schedule.contents AS contents, interest_schedule.priority AS priority, interest.interest AS name
            FROM calenduck.interest_schedule
            INNER JOIN calenduck.interest ON interest_schedule.interest_idx = interest.idx
            WHERE EXTRACT(YEAR FROM interest_schedule.time) = $1 
            AND EXTRACT(MONTH FROM interest_schedule.time) = $2
            AND EXTRACT(DAY FROM interest_schedule.time) = $3
        `, [year, month, day]);

        // 스케줄이 없는 경우
        if (personalSchedule === 0 && interestSchedule.length === 0) {
            return res.sendStatus(204);
        }

        // 개인 스케줄을 리스트에 추가
        personalSchedule.forEach(schedule => {
            scheduleList.push({
                idx: schedule.idx,
                name: null,
                time: schedule.time,
                type: 'personal',
                contents: schedule.contents,
                priority: schedule.priority
            });
        });

        // 관심사 스케줄을 리스트에 추가
        interestSchedule.forEach(schedule => {
            scheduleList.push({
                idx: schedule.idx,
                name: schedule.name,
                time: schedule.time,
                type: 'interest',
                contents: schedule.contents,
                priority: schedule.priority
            });
        });
       
        // 결과 반환
        return res.status(200).json({
            list: scheduleList
        });
    }catch(err){
        return next(err);
    }
})

// 스케줄 검색
router.get("/searches", checkAuth(), async (req, res, next) => {
    const { startDate, endDate, content } = req.query;

    try {
        // 빈 리스트 초기화
        let scheduleList = [];

        // 개인 스케줄 검색
        const personalSchedule = await getManyResults(`
            SELECT personal_schedule.idx, personal_schedule.time, personal_schedule.contents, personal_schedule.priority
            FROM calenduck.personal_schedule
            WHERE (personal_schedule.time BETWEEN TO_DATE($1, 'YYYYMMDD') AND TO_DATE($2, 'YYYYMMDD'))
            AND personal_schedule.contents ILIKE '%' || $3 || '%'
        `, [startDate, endDate, content]);

        // 관심사 스케줄 검색
        const interestSchedule = await getManyResults(`
            SELECT interest_schedule.idx, interest_schedule.time, interest_schedule.contents, interest_schedule.priority, interest.interest
            FROM calenduck.interest_schedule
            INNER JOIN calenduck.interest ON interest_schedule.interest_idx = interest.idx
            WHERE (interest_schedule.time BETWEEN TO_DATE($1, 'YYYYMMDD') AND TO_DATE($2, 'YYYYMMDD'))
            AND interest_schedule.contents ILIKE '%' || $3 || '%'
        `, [startDate, endDate, content]);

        // 스케줄이 없는 경우
        if (personalSchedule.length === 0 && interestSchedule.length === 0) {
            return res.sendStatus(204);
        }

        // 개인 스케줄을 리스트에 추가
        personalSchedule.forEach(schedule => {
            scheduleList.push({
                idx: schedule.idx,
                name: null,
                date_time: schedule.time,
                type: 'personal',
                contents: schedule.contents,
                priority: schedule.priority
            });
        });

        // 관심사 스케줄을 리스트에 추가
        interestSchedule.forEach(schedule => {
            scheduleList.push({
                idx: schedule.idx,
                name: schedule.interest,
                date_time: schedule.time,
                type: 'interest',
                contents: schedule.contents,
                priority: schedule.priority
            });
        });

        // 결과 반환
        return res.status(200).json({
            list: scheduleList
        });
    }catch(err){
        return next(err);
    }
})

// 스케줄 중요 알림 설정
router.put("/:idx/notify", async (req, res, next) => {
    const { idx } = req.params;

    try {
        // 해당 스케줄의 현재 priority 값 조회
        const schedule = await getOneResult(`
            SELECT priority
            FROM calenduck.personal_schedule
            WHERE idx = $1
        `, [idx]);

        // priority 값을 토글
        const newPriority = !schedule.priority;

        // priority 값 업데이트
        await psql.query(`
            UPDATE calenduck.personal_schedule
            SET priority = $1
            WHERE idx = $2
        `, [newPriority, idx]);

        return res.sendStatus(201);
    }catch(err){
        return next(err);
    }
}) 

// 관심사 스케줄 중요 알림 설정
router.put("/interest/:idx/notify", async (req, res, next) => {
    const { idx } = req.params;

    try {
        // 해당 관심사 스케줄의 현재 priority 값 조회
        const interest_schedule = await getOneResult(`
            SELECT priority
            FROM calenduck.interest_schedule
            WHERE idx = $1
        `, [idx]);

        // priority 값을 토글
        const newPriority = !interest_schedule.priority;

        // priority 값 업데이트
        await psql.query(`
            UPDATE calenduck.interest_schedule
            SET priority = $1
            WHERE idx = $2
        `, [newPriority, idx]);

        return res.sendStatus(201);
    }catch(err){
        return next(err);
    }
}) 

// 스케줄 생성
router.post("/", checkAuth(), async (req, res, next) => {
    const { dateTime, contents } = req.body;
    const loginUser = req.decoded;

    try {
        await psql.query(`
            INSERT INTO calenduck.personal_schedule (user_idx, time, contents)
            VALUES ($1, $2, $3)
        `, [loginUser, dateTime, contents]);
 
        return res.sendStatus(201);
    }catch(err){
        return next(err);
    }
})

// 스케줄 수정
router.put("/:idx", checkAuth(), async (req, res, next) => {
    const { dateTime, contents } = req.body;
    const { idx } = req.params;
    const loginUser = req.decoded;

    try {
        const personalSchedule = await psql.query(`
            UPDATE calenduck.personal_schedule
            SET time = $1, contents = $2
            WHERE idx = $3 AND user_idx = $4 
        `, [dateTime, contents, idx, loginUser]);

        if (personalSchedule.length === 0) {
            return res.sendStatus(404);
        }

        return res.sendStatus(201);
    }catch(err){
        return next(err);
    }
})

// 스케줄 삭제
router.delete("/:idx", async (req, res, next) => {
    const { idx } = req.params;

    // userId를 직접 설정 (임시 테스트)
    const userIdx = 2;

    try {
        await psql.query(`
            DELETE FROM calenduck.personal_schedule
            WHERE idx = $1 AND user_idx = $2
        `, [idx, userIdx]);

        return res.sendStatus(201);
    }catch(err){
        return next(err);
    }
})

module.exports = router;