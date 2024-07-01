// 관심사 계정 관련 API
const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const checkAuth = require("../middlewares/checkAuth");
const checkValidity = require("../middlewares/checkValidity");


const { BadRequestError, ForbiddenError, NotFoundError, InternalServerError } = require("../model/customError");

// 관심사 스케줄 생성
router.post("/schedules/interests", async (req, res) => {
    const { interest_idx, date_time, contents, priority } = req.body

    try {
        const insertInterestScheduleResultQuery = await psql.query(`
            INSERT INTO calenduck.interest_schedule (interest_idx, time, contents, priority) 
            VALUES ($1, $2, $3,$4)
        `, 
            [interest_idx, date_time, contents, priority]
        );

        return res.sendStatus(201);
    } catch (err) {
        console.error(err);
        throw new InternalServerError("Internet Server Error");
    } 
})

// 관심사 스케줄 수정
router.put("/schedules/interests/:idx", async (req, res) => {
    const { interest_idx, idx } = req.params;
    const { date_time, contents, priority } = req.body;
    
    try {
        // 스케줄 존재 여부 확인
        const selectInterestScheduleResultQuery = await psql.query(`
            SELECT * FROM calenduck.interest_schedule
            WHERE idx = $1 AND interest_idx = $2;
        `, 
            [idx, interest_idx]
        );

        if (selectInterestScheduleResultQuery.rows.length === 0) {
            throw new NotFoundError("Not Found");
        }

        // 스케줄 수정
        const updateInterestScheduleResultQuery = await psql.query(`
            UPDATE calenduck.interest_schedule
            SET time = $1, contents = $2, priority = $3
            WHERE idx = $4 AND interest_idx = $5
            RETURNING *;
        `, 
            [date_time, contents, priority, idx, interest_idx]
        );

        return res.sendStatus(201);
    } catch (err) {
        console.error(err);
        throw new InternalServerError("Internal Server Error");
    } 
})

// 관심사 스케줄 삭제
router.put("/schedules/interests/:idx", async (req, res) => {
    const { interest_idx, idx } = req.params;

    try {
        // 스케줄 존재 여부 확인
        const selectInterestScheduleResultQuery = await psql.query(`
            SELECT * FROM calenduck.interest_schedule
            WHERE idx = $1 AND interest_idx = $2;
        `, 
            [idx, interest_idx]
        );

        if (selectInterestScheduleResultQuery.rows.length === 0) {
            throw new NotFoundError("Not Found");
        }

        // 스케줄 삭제
        const deleteInterestScheduleResultQuery = await psql.query(`
            DELETE FROM calenduck.interest_schedule
            WHERE idx = $1 AND interest_idx = $2
            RETURNING *
        `, 
            [idx, interest_idx]
        );
        
        return res.sendStatus(201);
    } catch (err) {
        console.error(err);
        throw new InternalServerError("Internal Server Error");
    } 
})

module.exports = router;