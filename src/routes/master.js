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
const makeNotification = require("../modules/makeNotification");

// 일반 계정 목록 불러오기 (general)
router.get("/users", async (req, res, next) => {
    try {
        const userList = await getManyResults(`
            SELECT idx, nickname
            FROM calenduck.user
            ORDER BY nickname ASC
        `);

        if (userList.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: userList
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

// 관심사 목록 불러오기 (배정 받은 것 제외)
router.get("/interests", async (req, res, next) => {
    try {
        const interestList = await getManyResults(`
            SELECT idx, interest
            FROM calenduck.interest
            WHERE is_assigned=false
            ORDER BY interest ASC
        `)

        if (interestList.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: interestList
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

// 관심사 계정 목록 불러오기 (manager)
router.get("/managers", async (req, res, next) => {
    try {
        const managerList = await getManyResults(`
            SELECT CM.user_idx, CU.nickname, CM.interest_idx, CI.interest
            FROM calenduck.manager CM
            JOIN calenduck.user CU
            ON CM.user_idx = CU.idx
            JOIN calenduck.interest CI
            ON CM.interest_idx = CI.idx
            ORDER BY CM.user_idx ASC
        `); // manager, user, interest 테이블 join. 정렬은 user_idx 오름차순

        if (managerList.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: managerList
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

router.get("/asks", async (req, res, next) => {
    const { categoryIdx } = req.query;

    if (!categoryIdx) {
        return next(new BadRequestException());
    }

    try {
        const askList = await getManyResults(`
            SELECT CA.idx, CU.nickname, CA.title, CA.contents, CA.reply, CA.created_at
            FROM calenduck.ask CA
            JOIN calenduck.user CU
            ON CA.user_idx = CU.idx
            WHERE CA.ask_category_idx = $1
            ORDER BY CA.created_at DESC
        `, [categoryIdx]); // ask, user 테이블 join. 정렬은 최신순

        if (askList.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: askList
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

// 관심사 추가
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
            return next(new ConflictException());
        } // unique 위반 시
        return next(err);
    }
})

// 관심사 계정 권한 부여
router.post("/users/permission", async (req, res, next) => {
    const { userIdx, interestIdx } = req.body;

    if (!userIdx || !interestIdx) {
        return next(new BadRequestException());
    }

    try {
        const userAndInterest = await getOneResult(`
            SELECT CU.idx AS user_idx, CI.idx AS interest_idx
            FROM calenduck.user CU
            CROSS JOIN calenduck.interest CI
            WHERE CU.idx = $1 AND CI.idx = $2
        `, [userIdx, interestIdx]); // userIdx와 interestIdx가 있는지 확인하기 위해서 cross join 후 확인
        // 111, 7 하면 null 나옴.

        if (userAndInterest.length === 0) {
            return next(new NotFoundException());
        }

        const psqlClient = await psql.connect();
        await psqlClient.query("BEGIN");

        await psqlClient.query(`
            INSERT INTO calenduck.manager(user_idx, interest_idx)
            VALUES($1, $2)
        `, [userIdx, interestIdx]);
        await psqlClient.query(`
            UPDATE calenduck.user
            SET role = 'manager'
            WHERE idx = $1    
        `, [userIdx]);

        await psqlClient.query("COMMIT");

        return res.sendStatus(201);
    } catch (err) {
        if (err.constraint === "manager_user_idx_key" || err.constraint === "manager_interest_idx_key") {
            return next(new ConflictException());
        } // unique 위반 시
        return next(err);
    }
})

// 문의 답변 작성
router.post("/users/asks/:idx/reply", async (req, res, next) => {
    const { contents } = req.body;
    const askIdx = parseInt(req.params.idx);

    if (!askIdx) {
        return next(new BadRequestException());
    }

    try {
        const ask = await getOneResult(`
            SELECT idx FROM calenduck.ask
            WHERE idx = $1
        `, [askIdx]); // 문의가 존재하는지 확인

        if (ask.length === 0) {
            return next(new NotFoundException());
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

// 관심사 수정
router.put("/interest/:idx", async (req, res, next) => {
    const { interestName } = req.body;
    const interestIdx = parseInt(req.params.idx);

    if (!interestIdx) {
        return next(new BadRequestException());
    }

    try {
        const interest = await getOneResult(`
            SELECT idx FROM calenduck.interest
            WHERE idx = $1
        `, [interestIdx]); // 관심사가 존재하는지 확인
        console.log(interest);

        if (interest.length === 0) {
            return next(new NotFoundException());
        }

        await psql.query(`
            UPDATE calenduck.interest
            SET interest = $1
            WHERE idx = $2
        `, [interestName, interestIdx]);

        return res.sendStatus(201);
    } catch (err) {
        if (err.constraint === "interest_interest_key") {
            return next(new ConflictException());
        } // unique 위반 시
        return next(err);
    }
})

// 관심사 연결 수정
router.put("/managers/assignment", async (req, res, next) => {
    const { beforeManagerIdx, afterManagerIdx, afterInterestIdx } = req.body;

    if (!afterManagerIdx || !afterInterestIdx || !beforeManagerIdx) {
        return next(new BadRequestException());
    }

    try {
        const interest = await getOneResult(`
            SELECT idx FROM calenduck.interest
            WHERE idx = $1
        `, [afterInterestIdx]); // 수정하려는 관심사가 존재하는지 확인
        console.log(interest);

        if (interest.length === 0) {
            return next(new NotFoundException());
        }

        const userList = await getManyResults(`
            SELECT idx
            FROM calenduck.user
            WHERE idx IN($1, $2)    
        `, [beforeManagerIdx, afterManagerIdx]);
        console.log(userList);

        if (userList.length != 2) {
            return next(new NotFoundException());
        }

        const manager = await getOneResult(`
            SELECT interest_idx
            FROM calenduck.manager
            WHERE user_idx = $1    
        `, [beforeManagerIdx]);
        console.log(manager);

        if (!manager) {
            return next(new NotFoundException());
        }

        const beforeInterestIdx = manager.interest_idx;
        console.log(beforeInterestIdx)
        // const managerList = await getManyResults(`
        //     SELECT CM.interest_idx FROM calenduck.user CU
        //     CROSS JOIN calenduck.manager CM
        //     WHERE CU.role = 'general' AND CU.idx IN($1, $2)
        // `, [beforeManagerIdx, afterManagerIdx]); // 기존 관심사 계정과 수정하려는 관심사 계정이 존재하는지 확인
        // console.log(managerList);

        // if (managerList.length === 0) {
        //     return next(new NotFoundException());
        // }

        // const beforeInterestIdx = managerList[0].interest_idx;
        // console.log(beforeInterestIdx);
        const psqlClient = await psql.connect();

        if (beforeInterestIdx === afterInterestIdx) { // 기존 관심사와 수정하려는 관심사가 동일 할 때,
            await psql.query(`
                UPDATE calenduck.manager
                SET user_idx = $1
                WHERE user_idx = $2
            `, [afterManagerIdx, beforeManagerIdx]);
        } else { // 기존 관심사와 수정하려는 관심사가 동일하지 않을 때
            await psqlClient.query("BEGIN");

            await psqlClient.query(`
                UPDATE calenduck.manager
                SET user_idx = $1, interest_idx = $2
                WHERE user_idx = $3
                
            `, [afterManagerIdx, afterInterestIdx, beforeManagerIdx]);
            await psqlClient.query(`
                UPDATE calenduck.interest
                SET is_assigned = CASE
                WHEN idx = $1 THEN false
                WHEN idx = $2 THEN true
                END
                WHERE idx IN($3, $4)
            `, [beforeInterestIdx, afterInterestIdx, beforeInterestIdx, afterInterestIdx]);

            await psqlClient.query("COMMIT");
        }

        return res.sendStatus(201);
    } catch (err) {
        if (err.constraint === "manager_user_idx_key" || err.constraint === "manager_interest_idx_key") {
            return next(new ConflictException());
        }
        return next(err);
    }
})

// 관심사 삭제
router.delete("/interest/:idx", async (req, res, next) => {
    const interestIdx = parseInt(req.params.idx);

    if (!interestIdx) {
        return next(new BadRequestException());
    }

    try {
        await psql.query(`
            DELETE FROM calenduck.interest
            WHERE idx = $1
        `, [interestIdx]);

        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

// 관심사 계정 권한 삭제
router.delete("/managers/:idx/permission", async (req, res, next) => {
    const managerIdx = parseInt(req.params.idx);

    if (!managerIdx) {
        return next(new BadRequestException());
    }

    try {
        const manager = await getOneResult(`
            SELECT interest_idx FROM calenduck.manager
            WHERE user_idx = $1
        `, [managerIdx]);
        const interestIdx = manager.interest_idx;
        console.log(interestIdx);

        const psqlClient = await psql.connect();
        await psqlClient.query("BEGIN");

        await psqlClient.query(`
            UPDATE calenduck.user
            SET role = 'general'
            WHERE idx = $1
        `, [managerIdx]);
        await psqlClient.query(`
            UPDATE calenduck.interest
            SET is_assigned = false
            WHERE idx = $1
        `, [interestIdx])
        await psqlClient.query(`
            DELETE FROM calenduck.manager
            WHERE user_idx = $1
        `, [managerIdx])

        await psqlClient.query("COMMIT");

        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

module.exports = router;