// 스케줄 관련 API
const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const { 
    
} = require("../model/customException");

const { 
    getOneResult,
    getManyResults
} = require("../modules/sqlHandler");

// 특정 년월 스케줄 전체 불러오기
router.get("/", async (req, res, next) => {
    const { date } = req.query;

    try{
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);

        // 날짜별로 빈 리스트 초기화(31개)
        let scheduleList = Array.from({ length: 31 }, () => []);

        // 개인 스케줄 가져오기
        const personal_schedule = await getManyResults(`
            SELECT COUNT(*) AS count, EXTRACT(DAY FROM time) as day
            FROM calenduck.personal_schedule
            WHERE EXTRACT(YEAR FROM time) = $1 AND EXTRACT(MONTH FROM time) = $2
            GROUP BY EXTRACT(DAY FROM time)
        `, [year, month]);
        console.log(personal_schedule);

        // 관심사 스케줄 가져오기
        const interest_schedule = await getManyResults(`
            SELECT COUNT(*) AS count, EXTRACT(DAY FROM time) as day, contents as name
            FROM calenduck.interest_schedule
            WHERE EXTRACT(YEAR FROM time) = $1 AND EXTRACT(MONTH FROM time) = $2
            GROUP BY EXTRACT(DAY FROM time), contents
        `, [year, month]);

        // 개인 스케줄을 날짜별로 리스트에 추가
        personal_schedule.forEach(schedule => {
        const day = schedule.day - 1; // index값이 day 값은 같게 하기 위해서 1을 뺌뺌
        scheduleList[day].push({
            type: 'personal',
            name: null,
            count: schedule.count
        });
        });

        // 관심사 스케줄을 날짜별로 리스트에 추가
        interest_schedule.forEach(schedule => {
            const day = schedule.day - 1; // index값이 day 값은 같게 하기 위해서 1을 뺌뺌
            scheduleList[day].push({
                type: 'interest',
                name: schedule.name,
                count: schedule.count
            });
            });

        // 결과 반환
        if ( !personal_schedule || !interest_schedule ) {
            return res.sendStatus(204); 
        }

        return res.status(200).json({
            list: scheduleList
        });
    }catch(err){
        return next(err);
    }
})

// 특정 년월 특정 관심사 불러오기
router.get("/interest", async (req, res, next) => {
    const { date, interestIdx } = req.query;

    try{
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);

        // 날짜별로 빈 리스트 초기화(31개)
        let scheduleList = Array.from({ length: 31 }, () => []);

        // 관심사 스케줄 가져오기
        const interest_schedule = await getManyResults(`
            SELECT COUNT(*) AS count, EXTRACT(DAY FROM time) as day, contents as interestName
            FROM calenduck.interest_schedule
            WHERE EXTRACT(YEAR FROM time) = $1 AND EXTRACT(MONTH FROM time) = $2 AND interest_idx = $3
            GROUP BY EXTRACT(DAY FROM time), contents
        `, [year, month, interestIdx]);

        if ( interest_schedule === 0 ) {
            return res.sendStatus(204); 
        }
    
        // 관심사 스케줄을 날짜별로 리스트에 추가
        interest_schedule.forEach(schedule => {
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

module.exports = router;