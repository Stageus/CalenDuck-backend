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
        WHERE role = 'general'
        ORDER BY nickname ASC
    `);

    if (userList.length === 0) return res.sendStatus(204);

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

    if (interestList.length === 0) return res.sendStatus(204);

    return res.status(200).send({
        list: interestList
    });
}))

// 모든 관심사 목록 불러오기
router.get("/interest/all", checkAuth(LOGIN), endRequestHandler(async (req, res, next) => {
    const interestList = await getManyResults(`
      SELECT idx AS "interestIdx", interest AS "interestName"
      FROM calenduck.interest
      ORDER BY idx ASC
    `);

    if (interestList.length === 0) return res.sendStatus(204);

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

    if (managerList.length === 0) return res.sendStatus(204);

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

    if (askList.length === 0) return res.sendStatus(204);

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
router.post("/users/permission", checkAuth("master"), checkValidity({ "numberField": ["userIdx", "interestIdx"] }), endRequestHandler(async (req, res, next) => {
    const { userIdx, interestIdx } = req.body;

    const userAndInterest = await getOneResult(`
        SELECT CU.idx AS user_idx, CI.idx AS interest_idx, CI.interest AS interest
        FROM calenduck.user CU
        CROSS JOIN calenduck.interest CI
        WHERE CU.idx = $1 AND CI.idx = $2
    `, [userIdx, interestIdx]); // userIdx와 interestIdx가 있는지 확인하기 위해서 cross join 후 확인. 알림을 위해서 interest 받기.

    if (!userAndInterest) return next(new NotFoundException());

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
router.post("/users/asks/:idx/reply", checkAuth("master"), checkValidity({ "stringField": ["askReply"], "numberField": ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { askReply } = req.body;
    const askIdx = req.params.idx;

    const ask = await getOneResult(`
        SELECT title FROM calenduck.ask
        WHERE idx = $1
    `, [askIdx]); // 문의가 존재하는지 확인

    if (!ask) return next(new NotFoundException());

    await psql.query(`
        UPDATE calenduck.ask
        SET reply = $1
        WHERE idx = $2
    `, [askReply, askIdx]);

    makeNotification(req.decoded.idx, "reply", { "title": ask.title, "reply": askReply });

    return res.sendStatus(201);
}))

// 관심사 수정
router.put("/interest/:idx", checkAuth("master"), checkValidity({ "stringField": ["interestName"], "numberField": ["idx"] }), endRequestHandler(async (req, res, next) => {
    const { interestName } = req.body;
    const interestIdx = req.params.idx;

    const interest = await getOneResult(`
        SELECT 1 FROM calenduck.interest
        WHERE idx = $1
    `, [interestIdx]); // 관심사가 존재하는지 확인

    if (!interest) return next(new NotFoundException());

    await psql.query(`
        UPDATE calenduck.interest
        SET interest = $1
        WHERE idx = $2
    `, [interestName, interestIdx]);

    return res.sendStatus(201);
}))

// 관심사 연결 수정
router.put("/managers/assignment", checkAuth("master"), checkValidity({ "numberField": ["beforeManagerIdx", "afterManagerIdx", "interestIdx"] }), endRequestHandler(async (req, res, next) => {
    const { beforeManagerIdx, afterManagerIdx, interestIdx } = req.body;

    const managerAndInterest = await getOneResult(`
        SELECT 1 FROM calenduck.manager
        WHERE user_idx = $1 AND interest_idx = $2
    `, [beforeManagerIdx, interestIdx]); // 수정하려는 row(manager와 interest)가 존재하는지 확인

    if (!managerAndInterest) return next(new NotFoundException());

    const user = await getOneResult(`
        SELECT 1
        FROM calenduck.user
        WHERE idx = $1    
    `, [afterManagerIdx]); // 수정되는 manager가 존재하는지 확인

    if (!user) return next(new NotFoundException());

    const psqlClient = await psql.connect();

    await psqlClient.query("BEGIN");

    await psqlClient.query(`
        UPDATE calenduck.manager
        SET user_idx = $1
        WHERE interest_idx = $2            
    `, [afterManagerIdx, interestIdx]);
    await psqlClient.query(`
        UPDATE calenduck.user
        SET role = CASE
        WHEN idx = $1 THEN 'general'::role
        WHEN idx = $2 THEN 'manager'::role
        END
        WHERE idx IN($3, $4)
    `, [beforeManagerIdx, afterManagerIdx, beforeManagerIdx, afterManagerIdx]);

    await psqlClient.query("COMMIT");

    return res.sendStatus(201);
}))

// 관심사 삭제
router.delete("/interest/:idx", checkAuth("master"), checkValidity({ "numberField": ["idx"] }), endRequestHandler(async (req, res, next) => {
    const interestIdx = req.params.idx;

    const manager = await getOneResult(`
        SELECT user_idx FROM calenduck.manager
        WHERE interest_idx = $1
    `, [interestIdx]);

    if (!manager) return res.sendStatus(201); // null인 경우 바로 응답.

    const psqlClient = await psql.connect();

    await psqlClient.query("BEGIN");

    await psqlClient.query(`
        DELETE FROM calenduck.interest
        WHERE idx = $1
    `, [interestIdx]);
    await psqlClient.query(`
        UPDATE calenduck.user
        SET role = 'general'
        WHERE idx = $1
    `, [manager.user_idx]);

    await psqlClient.query("COMMIT");

    return res.sendStatus(201);
}))

// 관심사 계정 권한 삭제
router.delete("/managers/:idx/permission", checkAuth("master"), checkValidity({ "numberField": ["idx"] }), endRequestHandler(async (req, res, next) => {
    const managerIdx = req.params.idx;

    const manager = await getOneResult(`
        SELECT interest_idx FROM calenduck.manager
        WHERE user_idx = $1
    `, [managerIdx]);

    if (!manager) return res.sendStatus(201); // null인 경우 바로 응답.

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