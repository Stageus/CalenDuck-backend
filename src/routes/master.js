const router = require("express").Router();

const { InternalSercerError } = require("../model/customError");

const psql = require("../../database/connect/postgre");

router.get("/users", async (req, res) => {
    const result = {
        "data": null
    }
    req.api = "GET /master/users";

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
        throw new InternalSercerError("Internet Server Error");
    }
})

module.exports = router;