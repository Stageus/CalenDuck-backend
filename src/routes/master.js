const router = require("express").Router();

const {
    BadRequestError,
    InternalServerError,
    ConflictError
} = require("../model/customError");

const psql = require("../../database/connect/postgre");

router.get("/users", async (req, res, next) => {
    try {
        const userData = await psql.query(`
            SELECT idx, name FROM calenduck.user
        `);

        if (userData.rows.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            data: userData.rows
        });
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internal Server Error"));
    }
})

router.get("/interest", async (req, res, next) => {
    try {
        const interestData = await psql.query(`
            SELECT idx, interest FROM calenduck.interest
            WHERE is_assigned=false
        `)

        if (interestData.rows.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            data: interestData.rows
        });
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internal Server Error"));
    }
})

router.get("/users/interest-admin", async (req, res, next) => {
    try {
        const managerWithInterest = await psql.query(`
            SELECT CM.user_idx, CM.interest_idx, CI.idx, CI.interest
            FROM calenduck.manager CM
            JOIN calenduck.interest CI
            ON CM.interest_idx = CI.idx; 
        `);

        if (managerWithInterest.rows.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            data: managerWithInterest
        });
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internal Server Error"));
    }
})

router.get("/asks", async (req, res, next) => {
    const { categoryIdx } = req.query;

    if (!categoryIdx) {
        return next(new BadRequestError("cannot find query"));
    }

    try {
        const askWithUser = await psql.query(`
            SELECT CA.idx, CA.title, CA.contents, CA.reply, CA.created_at, CU.name
            FROM calenduck.ask CA
            JOIN calenduck.user CU
            ON CA.user_idx=CU.idx
            WHERE CA.ask_category_idx = $1; 
        `, [categoryIdx]); //

        if (askWithUser.rows.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            data: askWithUser
        });
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internal Server Error"));
    }
})

router.post("/interests", async (req, res, next) => {
    const { interestName } = req.body;

    if (!interestName) {
        return next(new BadRequestError("cannot find interest name"));
    }

    try {
        const interestData = await psql.query(`
            SELECT idx FROM calenduck.interest
            WHERE interest = $1    
        `, [interestName]);

        if (interestData.rows.length !== 0) {
            return next(new ConflictError("Duplicated interest name"));
        }

        await psql.query(`
            INSERT INTO calenduck.interest(interest)
            VALUES($1)
        `, [interestData]);

        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return next(new InternalServerError("Internal Server Error"));
    }
})

module.exports = router;