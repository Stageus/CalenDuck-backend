const router = require("express").Router();

const { InternalServerError } = require("../model/customError");

const psql = require("../../database/connect/postgre");

router.get("/users", async (req, res, next) => {
    const result = {
        "data": null
    }

    try {
        const selectUserQueryResult = await psql.query(`
            SELECT idx, name FROM calenduck.user
        `);

        if (selectUserQueryResult.rows.length === 0) {
            return res.sendStatus(204);
        }

        result.data = selectUserQueryResult.rows;
        return res.sendStatus(200);
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internal Server Error"));
    }
})

router.get("/interest", async (req, res, next) => {
    const result = {
        "data": null
    }

    try {
        const selectInterestQueryResult = await psql.query(`
            SELECT idx, interest FROM calenduck.interest
            WHERE is_assigned=false
        `)

        if (selectInterestQueryResult.rows.length === 0) {
            return res.sendStatus(204);
        }

        result.data = selectInterestQueryResult.rows;
        return res.sendStatus(200);
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internal Server Error"));
    }
})

router.get("/users/interest-admin", async (req, res) => {
    const result = {
        "data": null
    }

    try {
        const managerWithInterest = await psql.query(`
            SELECT CM.user_idx, CM.interest_idx, CI.idx, CI.interest
            FROM calenduck.manager CM
            INNER JOIN calenduck.interest CI
            ON CM.interest_idx=CI.idx; 
        `);

        if (managerWithInterest.rows.length === 0) {
            return res.sendStatus(204);
        }

        result.data = managerWithInterest.rows;
        return res.sendStatus(200);
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internal Server Error"));
    }
})

module.exports = router;