// 스케줄 관련 API
const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const checkAuth = require("../middlewares/checkAuth");
const checkValidity = require("../middlewares/checkValidity");

const timeToUTC = require("../modules/timeToUTC");

const {
    NotFoundException,
    BadRequestException
} = require("../model/customException");

const {
    getOneResult,
    getManyResults
} = require("../modules/sqlHandler");
const endRequestHandler = require("../modules/endRequestHandler");

const { DATE_REGEX,
    DATE_TIME_REGEX,
    YEAR_MONTH_REGEX,
    MAX_LENGTH_50_REGEX,
    MAX_LENGTH_100_REGEX,
    PARAM_REGEX,
    LOGIN } = require("../constants");

// 특정 년월 스케줄 전체 불러오기
router.get("/", checkAuth(LOGIN), checkValidity({ [YEAR_MONTH_REGEX]: ["yearMonth"], }), endRequestHandler(async (req, res, next) => {
    const { yearMonth } = req.query;
    const loginUser = req.decoded;

    const interestIdx = Number(req.query.interestIdx);

    if (req.query.interestIdx && isNaN(interestIdx)) {
        return next(new BadRequestException("Invalid intersest idx"));
    }

    const year = yearMonth.substring(0, 4);
    const month = yearMonth.substring(4, 6);

    // 날짜별로 빈 리스트 초기화(31개)
    const scheduleList = Array.from({ length: 31 }, () => []);

    // 관심사 스케줄 가져오기
    const interestScheduleList = await getManyResults(`
        SELECT 
            idx, 
            COUNT(*) AS count, 
            EXTRACT(DAY FROM time) as day, 
            contents as interestName
        FROM 
            calenduck.interest_schedule
        WHERE 
            EXTRACT(YEAR FROM time) = $1 
        AND 
            EXTRACT(MONTH FROM time) = $2 
        ${req.query.interestIdx ? `
        AND 
            interest_idx = $3` : ``}
        GROUP BY idx, EXTRACT(DAY FROM time), contents;
    `, req.query.interestIdx ? [year, month, interestIdx] : [year, month]);

    if (!interestIdx) {
        // 개인 스케줄 가져오기
        const personalScheduleList = await getManyResults(`
            SELECT EXTRACT(DAY FROM time) AS day, COUNT(*)::int AS count
            FROM calenduck.personal_schedule
            WHERE EXTRACT(YEAR FROM time) = $1 AND EXTRACT(MONTH FROM time) = $2 AND user_idx = $3
            GROUP BY EXTRACT(DAY FROM time)
        `, [year, month, loginUser.idx]);

        if (personalScheduleList.length === 0 && interestScheduleList.length === 0) return res.status(200).send({
            list: scheduleList
        })

        // 개인 스케줄을 날짜별로 추가
        personalScheduleList.forEach((schedule) => {
            const dayIndex = schedule.day - 1; // 배열 인덱스는 0부터 시작
            scheduleList[dayIndex].push({
                type: 'personal',
                count: schedule.count,
            });
        });
    }

    if (interestIdx && interestScheduleList.length === 0) return res.status(200).send({
        list: scheduleList
    });

    // 관심사 스케줄을 날짜별로 추가
    interestScheduleList.forEach((schedule) => {
        const dayIndex = schedule.day - 1;
        scheduleList[dayIndex].push({
            idx: schedule.idx,
            type: 'interest',
            name: schedule.name,
            count: schedule.count,
        });
    });

    // 빈 스케줄을 빈 리스트로 처리
    const responseList = scheduleList.map(daySchedules => {
        return daySchedules.length > 0 ? daySchedules : [];
    });

    return res.status(200).send({
        list: responseList
    });
}));

// 특정 년월 특정 관심사 불러오기
router.get("/interest", checkAuth(LOGIN), checkValidity({ [YEAR_MONTH_REGEX]: ["yearMonth"], [PARAM_REGEX]: ["interestIdx"] }), endRequestHandler(async (req, res, next) => {
    const { yearMonth, interestIdx } = req.query;

    // 관심사 idx 조회
    const interest = await getOneResult(`
        SELECT 1 
        FROM calenduck.interest 
        WHERE idx = $1
    `, [interestIdx]);

    // 관심사 idx가 없을 시
    if (!interest) return next(new NotFoundException());

    const year = yearMonth.substring(0, 4);
    const month = yearMonth.substring(4, 6);

    // 날짜별로 빈 리스트 초기화(31개)
    const scheduleList = Array.from({ length: 31 }, () => []);

    // 관심사 스케줄 가져오기
    const interestScheduleList = await getManyResults(`
        SELECT idx, COUNT(*) AS count, EXTRACT(DAY FROM time) as day, contents as interestName
        FROM calenduck.interest_schedule
        WHERE EXTRACT(YEAR FROM time) = $1 AND EXTRACT(MONTH FROM time) = $2 AND interest_idx = $3
        GROUP BY idx, EXTRACT(DAY FROM time), contents;
    `, [year, month, interestIdx]);

    if (interestScheduleList.length === 0) return res.status(200).send({
        list: scheduleList
    });

    // 관심사 스케줄을 날짜별로 리스트에 추가
    interestScheduleList.forEach(schedule => {
        const day = schedule.day - 1; // index값이 day 값은 같게 하기 위해서 1을 뺌
        scheduleList[day].push({
            idx: schedule.idx,
            interestName: schedule.interestname,
            count: schedule.count
        });
    });

    return res.status(200).send({
        list: scheduleList
    });
}))

// 특정 날짜에서 특정 관심사 불러오기
router.get("/details/interest", checkAuth(LOGIN), checkValidity({ [DATE_REGEX]: ["fullDate"], [PARAM_REGEX]: ["interestIdx"] }), endRequestHandler(async (req, res, next) => {
    const { fullDate, interestIdx } = req.query;

    // 관심사 idx 조회
    const interest = await getOneResult(`
        SELECT 1 
        FROM calenduck.interest 
        WHERE idx = $1
    `, [interestIdx]);

    // 관심사 idx가 없을 시
    if (!interest) return next(new NotFoundException());

    const year = fullDate.substring(0, 4);
    const month = fullDate.substring(4, 6);
    const day = fullDate.substring(6, 8)

    // 빈 리스트 초기화
    const scheduleList = [];

    // 관심사 스케줄 불러오기
    const interestScheduleList = await getManyResults(`
        SELECT interest_schedule.idx, interest_schedule.time, interest_schedule.contents, interest.interest as name
        FROM calenduck.interest_schedule
        JOIN calenduck.interest ON interest_schedule.interest_idx = interest.idx
        WHERE DATE(interest_schedule.time) = DATE($1)
        AND interest_schedule.interest_idx = $2
        ORDER BY interest_schedule.time ASC
    `, [`${year}-${month}-${day}`, interestIdx]);

    // 스케줄이 없는 경우
    if (interestScheduleList.length === 0) return res.status(200).send({
        list: scheduleList
    });

    // 관심사 스케줄을 리스트에 추가
    interestScheduleList.forEach(schedule => {
        scheduleList.push({
            idx: schedule.idx,
            name: schedule.name,
            time: timeToUTC(schedule.time),
            contents: schedule.contents,
        });
    });

    // 결과 반환
    return res.status(200).send({
        list: scheduleList
    });
}))

// 특정 날짜 스케줄 전체 불러오기
router.get("/details", checkAuth(LOGIN), checkValidity({ [DATE_REGEX]: ["fullDate"] }), endRequestHandler(async (req, res, next) => {
    const interestIdx = Number(req.query.interestIdx);

    if (req.query.interestIdx && isNaN(interestIdx)) {
        return next(new BadRequestException("Invalid intersest idx"));
    }

    const { fullDate } = req.query;
    const loginUser = req.decoded;

    const year = fullDate.substring(0, 4);
    const month = fullDate.substring(4, 6);
    const day = fullDate.substring(6, 8)

    // 빈 리스트 초기화
    const scheduleList = [];

    if (!interestIdx) {
        // 개인 스케줄 가져오기
        const personalScheduleList = await getManyResults(`
        SELECT personal_schedule.idx AS idx, personal_schedule.time AS time, personal_schedule.contents AS contents, personal_schedule.priority AS priority
        FROM calenduck.personal_schedule
        WHERE DATE(personal_schedule.time) = DATE($1) AND personal_schedule.user_idx = $2
        ORDER BY time ASC
    `, [`${year}-${month}-${day}`, loginUser.idx]);

        // 개인 스케줄을 리스트에 추가
        personalScheduleList.forEach(schedule => {
            scheduleList.push({
                idx: schedule.idx,
                time: timeToUTC(schedule.time),
                type: 'personal',
                contents: schedule.contents,
                priority: schedule.priority
            });
        });
    }

    // 관심사 스케줄 가져오기
    const interestScheduleList = await getManyResults(`
        SELECT 
            interest_schedule.idx AS idx, 
            interest_schedule.time AS time, 
            interest_schedule.contents AS contents, 
            interest.interest AS name
        FROM 
            calenduck.interest_schedule
        JOIN 
            calenduck.interest ON interest_schedule.interest_idx = interest.idx
        WHERE 
            DATE(interest_schedule.time) = DATE($1)
        ${!isNaN(interestIdx) ? `
        AND
            interest_schedule.interest_idx = $2
        ` : ``} 
        ORDER BY time ASC
    `,
        isNaN(interestIdx) ? [`${year}-${month}-${day}`] : [`${year}-${month}-${day}`, interestIdx]
    );

    // 관심사 스케줄을 리스트에 추가
    interestScheduleList.forEach(schedule => {
        scheduleList.push({
            idx: schedule.idx,
            name: schedule.name,
            time: timeToUTC(schedule.time),
            type: 'interest',
            contents: schedule.contents
        });
    });

    // 결과 반환
    return res.status(200).send({
        list: scheduleList
    });
}))

// 스케줄 검색
router.get("/searches", checkAuth(LOGIN), checkValidity({ [DATE_REGEX]: ["startDate"], [DATE_REGEX]: ["endDate"], [MAX_LENGTH_50_REGEX]: ["content"] }), endRequestHandler(async (req, res, next) => {
    const { startDate, endDate, content } = req.query;
    const loginUser = req.decoded;

    // 빈 리스트 초기화
    const scheduleList = [];

    // 개인 스케줄 검색
    const personalScheduleList = await getManyResults(`
        SELECT personal_schedule.idx, personal_schedule.time, personal_schedule.contents, personal_schedule.priority
        FROM calenduck.personal_schedule
        WHERE (personal_schedule.time BETWEEN TO_DATE($1, 'YYYYMMDD') AND TO_DATE($2, 'YYYYMMDD'))
        AND personal_schedule.contents ILIKE '%' || $3 || '%'
        AND personal_schedule.user_idx = $4
    `, [startDate, endDate, content, loginUser.idx]);

    // 관심사 스케줄 검색
    const interestScheduleList = await getManyResults(`
        SELECT interest_schedule.idx, interest_schedule.time, interest_schedule.contents, interest.interest
        FROM calenduck.interest_schedule
        JOIN calenduck.interest ON interest_schedule.interest_idx = interest.idx
        WHERE (interest_schedule.time BETWEEN TO_DATE($1, 'YYYYMMDD') AND TO_DATE($2, 'YYYYMMDD'))
        AND interest_schedule.contents ILIKE '%' || $3 || '%'
    `, [startDate, endDate, content]);

    // 스케줄이 없는 경우
    if (personalScheduleList.length === 0 && interestScheduleList.length === 0) return res.status(200).send({
        list: scheduleList
    });

    // 개인 스케줄을 리스트에 추가
    personalScheduleList.forEach(schedule => {
        scheduleList.push({
            idx: schedule.idx,
            date_time: schedule.time,
            type: 'personal',
            contents: schedule.contents,
            priority: schedule.priority
        });
    });

    // 관심사 스케줄을 리스트에 추가
    interestScheduleList.forEach(schedule => {
        scheduleList.push({
            idx: schedule.idx,
            name: schedule.interest,
            date_time: schedule.time,
            type: 'interest',
            contents: schedule.contents
        });
    });

    // 결과 반환
    return res.status(200).send({
        list: scheduleList
    });
}))

// 스케줄 중요 알림 설정 추가하기
router.post("/:idx/notify", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { idx } = req.params;
    const loginUser = req.decoded;

    // 해당 스케줄의 현재 priority 값 조회
    const schedule = await getOneResult(`
        SELECT priority
        FROM calenduck.personal_schedule
        WHERE idx = $1 AND user_idx = $2
    `, [idx, loginUser.idx]);

    // 해당 스케줄 없을 시
    if (!schedule) return next(new NotFoundException());

    // priority 값을 true로 설정ㅁ
    await psql.query(`
        UPDATE calenduck.personal_schedule
        SET priority = true
        WHERE idx = $1 AND user_idx = $2
    `, [idx, loginUser.idx]);

    return res.sendStatus(201);
}))

// 스케줄 중요 알림 설정 삭제하기
router.delete("/:idx/notify", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { idx } = req.params;
    const loginUser = req.decoded;

    // 해당 스케줄의 현재 priority 값 조회
    const schedule = await getOneResult(`
        SELECT priority
        FROM calenduck.personal_schedule
        WHERE idx = $1 AND user_idx = $2
    `, [idx, loginUser.idx]);

    // 해당 스케줄 없을 시
    if (!schedule) return next(new NotFoundException());

    // priority 값을 false로 설정
    await psql.query(`
        UPDATE calenduck.personal_schedule
        SET priority = false
        WHERE idx = $1 AND user_idx = $2
    `, [idx, loginUser.idx]);

    return res.sendStatus(201);
}))

// 관심사 스케줄 중요 알림 설정 추가하기
router.post("/interest/:idx/notify", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { idx } = req.params;
    const loginUser = req.decoded;

    // 해당 관심사 스케줄 존재 여부 조회
    const interestSchedule = await getOneResult(`
        SELECT 1
        FROM calenduck.interest_schedule
        WHERE idx = $1
    `, [idx]);

    // 해당 관심사 스케줄 없을 시
    if (!interestSchedule) return next(new NotFoundException());

    // 새로운 중요 알림 추가
    await psql.query(`
        INSERT INTO calenduck.interest_priority (user_idx, interest_schedule_idx)
        VALUES ($1, $2)
    `, [loginUser.idx, idx]);

    return res.sendStatus(201);
}))

// 관심사 스케줄 중요 알림 설정 삭제하기
router.delete("/interest/:idx/notify", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { idx } = req.params;
    const loginUser = req.decoded;

    // 해당 관심사 스케줄 존재 여부 조회
    const interestSchedule = await getOneResult(`
        SELECT 1
        FROM calenduck.interest_schedule
        WHERE idx = $1
    `, [idx]);

    // 해당 관심사 스케줄 없을 시
    if (!interestSchedule) return next(new NotFoundException());

    // 새로운 중요 알림 삭제
    await psql.query(`
        DELETE FROM calenduck.interest_priority
        WHERE interest_schedule_idx = $1 AND user_idx = $2
    `, [idx, loginUser.idx]);

    return res.sendStatus(201);
}))

// 스케줄 생성
router.post("/", checkAuth(LOGIN), checkValidity({ [DATE_TIME_REGEX]: ["fullDate"], [MAX_LENGTH_100_REGEX]: ["personalContents"] }), endRequestHandler(async (req, res, next) => {
    const { fullDate, personalContents } = req.body;
    const loginUser = req.decoded;

    await psql.query(`
        INSERT INTO calenduck.personal_schedule (user_idx, time, contents)
        VALUES ($1, $2, $3)
    `, [loginUser.idx, fullDate, personalContents]);

    return res.sendStatus(201);
}))

// 스케줄 수정
router.put("/:idx", checkAuth(LOGIN), checkValidity({ [DATE_TIME_REGEX]: ["fullDate"], [MAX_LENGTH_100_REGEX]: ["personalContents"], [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { fullDate, personalContents } = req.body;
    const { idx } = req.params;
    const loginUser = req.decoded;

    // 스케줄 존재 여부 확인 
    const personalSchedule = await getOneResult(`
        SELECT 1
        FROM calenduck.personal_schedule
        WHERE idx = $1 AND user_idx = $2
    `, [idx, loginUser.idx]);

    if (!personalSchedule) return next(new NotFoundException());

    //스케줄 수정
    await psql.query(`
        UPDATE calenduck.personal_schedule
        SET time = $1, contents = $2
        WHERE idx = $3 AND user_idx = $4 
    `, [fullDate, personalContents, idx, loginUser.idx]);

    return res.sendStatus(201);
}))

// 스케줄 삭제
router.delete("/:idx", checkAuth(LOGIN), checkValidity({ [PARAM_REGEX]: ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { idx } = req.params;
    const loginUser = req.decoded;

    // 스케줄 존재 여부 확인 
    const personalSchedule = await getOneResult(`
        SELECT 1
        FROM calenduck.personal_schedule
        WHERE idx = $1 AND user_idx = $2
    `, [idx, loginUser.idx]);

    if (!personalSchedule) return next(new NotFoundException());

    await psql.query(`
        DELETE FROM calenduck.personal_schedule
        WHERE idx = $1 AND user_idx = $2
    `, [idx, loginUser.idx]);

    return res.sendStatus(201);
}))

module.exports = router;