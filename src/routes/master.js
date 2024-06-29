const router = require("express").Router();

const { InternalServerError } = require("../model/customError");

const psql = require("../../database/connect/postgre");

router.get("/users", async (req, res, next) => {
    const result = {
        "data": null
    }

    try {
        const selectUserQueryResult = await psql.query(`
            SELECT idx, name FROM calenduck.userr
        `);

        if (selectUserQueryResult.rows.length === 0) {
            return res.sendStatus(204);
        }

        result.data = selectUserQueryResult.rows;
        return res.sendStatus(200);
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internet Server Error"));
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
        return next(new InternalServerError("Internet Server Error"));
    }
})

module.exports = router;