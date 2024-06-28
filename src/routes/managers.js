// 관심사 계정 관련 API
const router = require("express").Router();

const psql = require("../../database/connect/postgre");
const { NotFoundError, InternalServerError } = require("../model/customError");

// 관심사 스케줄 생성
router.post("/schedules/interests", async (req, res) => {
    const { interest_idx, date_time, contents, priority } = req.body
    const result = {
        "data": null
    }

    try {
        const insertInterestScheduleResultQuery = await psql.query(`
            INSERT INTO calenduck.interest_schedule (interest_idx, time, contents, priority) 
            VALUES ($1, $2, $3,$4)
        `, 
            [interest_idx, date_time, contents, priority]
        );

        result.data = interestScheduleInsertResultQuery.rows[0];
        return res.sendStatus(201);
    } catch (err) {
        console.error(err);
        throw new InternalServerError("Internet Server Error");
    } 
})

// 관심사 스케줄 수정
router.put("/schedules/interests/:interest_idx/:idx", async (req, res) => {
    const { interest_idx, idx } = req.params;
    const { date_time, contents, priority } = req.body;
    const result = {
        "data": null
    }

    try {
        const updateInterestScheduleResultQuery = await psql.query(
            `
            UPDATE calenduck.interest_schedule
            SET time = $1, contents = $2, priority = $3
            WHERE idx = $4 AND interest_idx = $5
            RETURNING *;
        `, 
            [date_time, contents, priority, idx, interest_idx]
        );
        
        if (updateInterestScheduleResultQuery.rows.length === 0) {
            throw new NotFoundError("Not Found");
        }

        return res.sendStatus(201);
    } catch (err) {
        console.error(err);
        if (!(err instanceof NotFoundError)) {
            throw new InternalServerError("Internal Server Error");
        }
    } 
})

module.exports = router;