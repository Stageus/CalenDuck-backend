const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const {
    BadRequestException,
    ConflictException,
    NotFoundException
} = require("../model/customException");
const {
    getOneResult,
    getManyResults
} = require("../modules/sqlHandler");

router.get("/users", async (req, res, next) => {
    try {
        const users = await getManyResults(`
            SELECT idx, name FROM calenduck.user
        `);

        if (users.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: users
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

router.get("/interest", async (req, res, next) => {
    try {
        const interests = await getManyResults(`
            SELECT idx, interest FROM calenduck.interest
            WHERE is_assigned=false
        `)

        if (interests.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: interests
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

router.get("/users/manager", async (req, res, next) => {
    try {
        const managers = await getManyResults(`
            SELECT CM.user_idx, CM.interest_idx, CI.idx, CI.interest
            FROM calenduck.manager CM
            JOIN calenduck.interest CI
            ON CM.interest_idx = CI.idx; 
        `);

        if (managers.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: managers
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

router.get("/asks", async (req, res, next) => {
    const { categoryIdx } = req.query;

    if (!categoryIdx) {
        return next(new BadRequestException);
    }

    try {
        const asks = await getManyResults(`
            SELECT CA.idx, CA.title, CA.contents, CA.reply, CA.created_at, CU.nickname
            FROM calenduck.ask CA
            JOIN calenduck.user CU
            ON CA.user_idx=CU.idx
            WHERE CA.ask_category_idx = $1; 
        `, [categoryIdx]);

        if (asks.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: asks
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

router.post("/interests", async (req, res, next) => {
    const { interestName } = req.body;

    try {
        await psql.query(`
            INSERT INTO calenduck.interest(interest)
            VALUES($1)
        `, [interestName]);

        return res.sendStatus(201);
    } catch (err) {
        if (err.constraint === "interest_interest_key") {
            return next(new ConflictException);
        }
        return next(err);
    }
})

router.post("/users/permission", async (req, res, next) => {
    const { userIdx, interestIdx } = req.body;

    if (!userIdx || !interestIdx) {
        return next(new BadRequestException);
    }

    try {
        const userAndInterest = await getOneResult(`
            SELECT CU.idx, CI.idx
            FROM calenduck.user CU
            CROSS JOIN calenduck.interest CI
            WHERE CU.idx = $1 AND CI.idx = $2;    
        `, [userIdx, interestIdx]);

        if (userAndInterest.length === 0) {
            return next(new NotFoundException);
        }

        await psql.query(`
            INSERT INTO calenduck.manager(user_idx, interest_idx)
            VALUES($1, $2)
        `, [userIdx, interestIdx]);

        return res.sendStatus(201);
    } catch (err) {
        if (err.constraint === "manager_user_idx_key" || err.constraint === "manager_interest_idx_key") {
            return next(new ConflictException);
        }
        return next(err);
    }
})

router.post("/users/asks/:idx/reply", async (req, res, next) => {
    const { contents } = req.body;
    const askIdx = req.params;

    if (!askIdx) {
        return next(new BadRequestException);
    }

    try {
        const ask = await getOneResult(`
            SELECT idx FROM calenduck.ask
            WHERE idx = $1
        `, [askIdx]);

        if (ask.length === 0) {
            return next(new NotFoundException);
        }

        await psql.query(`
            UPDATE calenduck.ask
            SET reply = $1
            WHERE idx = $2
        `, [contents, askIdx]);

        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

router.put("/interest/:idx", async (req, res, next) => {
    const { interestName } = req.body;
    const { interestIdx } = req.params;

    if (!interestIdx) {
        return next(new BadRequestException);
    }

    try {
        const interest = await getOneResult(`
            SELECT idx FROM calenduck.interest
            WHERE idx = $1
        `, [interestIdx]);

        if (interest.length === 0) {
            return next(new NotFoundException);
        }

        await psql.query(`
            UPDATE calenduck.interest
            SET interest = $1
            WHERE idx = $2
        `, [interestName, interestIdx]);

        return res.sendStatus(201);
    } catch (err) {
        if (err.constraint === "interest_interest_key") {
            return next(new ConflictException);
        }
        return next(err);
    }
})

router.put("/users/:idx/manager", async (req, res, next) => {
    const { afterManagerIdx, beforeInterestIdx, afterInterestIdx } = req.body;
    const { beforeManagerIdx } = req.params;

    if (!afterManagerIdx || !beforeInterestIdx || !afterInterestIdx || !beforeManagerIdx) {
        return next(new BadRequestException);
    }

    try {
        const interests = await getManyResults(`
            SELECT idx FROM calenduck.interest
            WHERE idx IN($1, $2)
        `, [beforeInterestIdx, afterInterestIdx]);

        if (interests.length !== 2) {
            return next(new NotFoundException);
        }

        const managers = await getManyResults(`
            SELECT user_idx FROM calenduck.manager
            WHERE user_idx IN($1, $2)
        `, [beforeManagerIdx, afterManagerIdx]);

        if (managers.length === 0) {
            return next(new NotFoundException);
        }

        if (beforeInterestIdx === afterInterestIdx) {
            await psql.query(`
                UPDATE calenduck.manager
                SET user_idx = $1
                WHERE user_idx = $2
            `, [afterManagerIdx, beforeManagerIdx]);
        } else {
            await psql.query(`
                BEGIN;
                UPDATE calenduck.manager
                SET user_idx = $1, interest_idx = $2
                WHERE user_idx = $3;
                UPDATE calenduck.interest
                SET is_assigned = CASE
                WHEN idx = $4 THEN false
                WHEN idx = $5 THEN true
                END
                WHERE idx IN($6, $7);
                COMMIT;
            `, [afterManagerIdx, afterInterestIdx, beforeManagerIdx, beforeInterestIdx, afterInterestIdx, beforeInterestIdx, afterInterestIdx]);
        }

        return res.sendStatus(201);
    } catch (err) {
        if (err.constraint === "manager_user_idx_key" || err.constraint === "manager_interest_idx_key") {
            return next(new ConflictException);
        }
        return next(err);
    }
})

router.delete("/interest/:idx", async (req, res, next) => {
    const { interestIdx } = req.params;

    if (!interestIdx) {
        return next(new BadRequestException);
    }

    try {
        await psql.query(`
            DELETE FROM calenduck.interest
            WHERE idx = $1
        `, [interestIdx]);

        res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

router.delete("/users/:idx/permission", async (req, res, next) => {
    const { managerIdx } = req.params;

    if (!managerIdx) {
        return next(new BadRequestException);
    }

    try {
        const manager = await getOneResult(`
            SELECT * FROM calenduck.manager
            WHERE user_idx = $1
        `, [managerIdx]);
        const interestIdx = manager.interest_idx;

        await psql.query(`
            BEGIN;
            UPDATE calenduck.user
            SET role = 'general'
            WHERE idx = 1;
            UPDATE calenduck.interest
            SET is_assigned = false
            WHERE idx = 1;
            DELETE FROM calenduck.manager
            WHERE user_idx = 1;
            COMMIT;
        `, [managerIdx, interestIdx, managerIdx]);
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

module.exports = router;