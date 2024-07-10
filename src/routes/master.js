const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const checkValidity = require("../middlewares/checkValidity");
const checkAuth = require("../middlewares/checkAuth");

const { NotFoundException } = require("../model/customException");

const {
    getOneResult,
    getManyResults
} = require("../modules/sqlHandler");
const makeNotification = require("../modules/makeNotification");
const endRequestHandler = require("../modules/endRequestHandler");

// 일반 계정 목록 불러오기 (general)
router.get("/users", checkAuth("master"), endRequestHandler(async (req, res, next) => {
    const userList = await getManyResults(`
        SELECT idx AS "userIdx", nickname AS "userNickname"
        FROM calenduck.user
        ORDER BY nickname ASC
    `);

    if (userList.length === 0) {
        return res.sendStatus(204);
    }

    return res.status(200).send({
        list: userList
    });
}))

// 관심사 목록 불러오기 (배정 받은 것 제외)
router.get("/interests", checkAuth("master"), endRequestHandler(async (req, res, next) => {
    const interestList = await getManyResults(`
        SELECT idx AS "interestIdx", interest AS "interestName"
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
}))

// 관심사 계정 목록 불러오기 (manager)
router.get("/managers", checkAuth("master"), endRequestHandler(async (req, res, next) => {
    const managerList = await getManyResults(`
        SELECT CM.user_idx AS "managerIdx", CU.nickname AS "managerNickname", CM.interest_idx AS "interetIdx", CI.interest
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
}))

router.get("/asks", checkAuth("master"), checkValidity({ "numberField": ["categoryIdx"] }), endRequestHandler(async (req, res, next) => {
    const { categoryIdx } = req.query;

    const askList = await getManyResults(`
        SELECT CA.idx AS "askIdx", CU.nickname, CA.title, CA.contents, CA.reply, CA.created_at As "createdAt"
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
}))

// 관심사 추가
router.post("/interests", checkAuth("master"), checkValidity({ "stringField": ["interestName"] }), endRequestHandler(async (req, res, next) => {
    const { interestName } = req.body;

    await psql.query(`
        INSERT INTO calenduck.interest(interest)
        VALUES($1)
    `, [interestName]);

    return res.sendStatus(201);
}))

// 관심사 계정 권한 부여
router.post("/users/permission", checkAuth("master"), checkValidity({ "stringField": ["interestIdx"], "numberField": ["userIdx"] }), endRequestHandler(async (req, res, next) => {
    const { userIdx, interestIdx } = req.body;

    const userAndInterest = await getOneResult(`
        SELECT CU.idx AS user_idx, CI.idx AS interest_idx, CI.interest AS interest
        FROM calenduck.user CU
        CROSS JOIN calenduck.interest CI
        WHERE CU.idx = $1 AND CI.idx = $2
    `, [userIdx, interestIdx]); // userIdx와 interestIdx가 있는지 확인하기 위해서 cross join 후 확인. 알림을 위해서 interest 받기.

    if (!userAndInterest) {
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
    await psqlClient.query(`
        UPDATE calenduck.interest
        SET is_assigned = true
        WHERE idx = $1    
    `, [interestIdx]);

    await psqlClient.query("COMMIT");

    makeNotification(userIdx, "manager", { "interest": userAndInterest.interest });

    return res.sendStatus(201);
}))

// 문의 답변 작성
router.post("/users/asks/:idx/reply", checkAuth("master"), checkValidity({ "stringField": ["contents"] }), endRequestHandler(async (req, res, next) => {
    const { contents } = req.body;
    const askIdx = req.params.idx;

    const ask = await getOneResult(`
        SELECT title FROM calenduck.ask
        WHERE idx = $1
    `, [askIdx]); // 문의가 존재하는지 확인

    if (!ask) {
        return next(new NotFoundException());
    }

    await psql.query(`
        UPDATE calenduck.ask
        SET reply = $1
        WHERE idx = $2
    `, [contents, askIdx]);

    makeNotification(req.decoded.idx, "reply", { "title": ask.title, "reply": contents });

    return res.sendStatus(201);
}))

// 관심사 수정
router.put("/interest/:idx", checkAuth("master"), checkValidity({ "stringField": ["interestName"], "numberField": ["interestIdx"] }), endRequestHandler(async (req, res, next) => {
    const { interestName } = req.body;
    const interestIdx = req.params.idx;

    const interest = await getOneResult(`
        SELECT 1 FROM calenduck.interest
        WHERE idx = $1
    `, [interestIdx]); // 관심사가 존재하는지 확인

    if (!interest) {
        return next(new NotFoundException());
    }

    await psql.query(`
        UPDATE calenduck.interest
        SET interest = $1
        WHERE idx = $2
    `, [interestName, interestIdx]);

    return res.sendStatus(201);
}))

// 관심사 연결 수정
router.put("/managers/assignment", checkAuth("master"), checkValidity({ "numberField": ["beforeManagerIdx", "afterManagerIdx", "afterInterestIdx"] }), endRequestHandler(async (req, res, next) => {
    const { beforeManagerIdx, afterManagerIdx, afterInterestIdx } = req.body;

    const interest = await getOneResult(`
        SELECT 1 FROM calenduck.interest
        WHERE idx = $1
    `, [afterInterestIdx]); // 수정하려는 관심사가 존재하는지 확인

    if (!interest) {
        return next(new NotFoundException());
    }

    const userList = await getManyResults(`
        SELECT 1
        FROM calenduck.user
        WHERE idx IN($1, $2)    
    `, [beforeManagerIdx, afterManagerIdx]);

    if (userList.length !== 2) {
        return next(new NotFoundException());
    }

    const manager = await getOneResult(`
        SELECT interest_idx
        FROM calenduck.manager
        WHERE user_idx = $1    
    `, [beforeManagerIdx]);

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
}))

// 관심사 삭제
router.delete("/interest/:idx", checkAuth("master"), checkValidity({ "numberField": ["interestIdx"] }), endRequestHandler(async (req, res, next) => {
    const interestIdx = req.params.idx;

    await psql.query(`
        DELETE FROM calenduck.interest
        WHERE idx = $1
    `, [interestIdx]);

    return res.sendStatus(201);
}))

// 관심사 계정 권한 삭제
router.delete("/managers/:idx/permission", checkAuth("master"), checkValidity({ "numberField": ["managerIdx"] }), endRequestHandler(async (req, res, next) => {
    const managerIdx = req.params.idx;

    const manager = await getOneResult(`
        SELECT 1 FROM calenduck.manager
        WHERE user_idx = $1
    `, [managerIdx]);

    if (!manager) { // null인 경우 바로 응답.
        return res.sendStatus(201);
    }

    const interestIdx = manager.interest_idx;

    // manager에서 general로 전환 -> 관심사 is_assigned를 true로 전환 -> manager 테이블에서 삭제
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
}))

module.exports = router;