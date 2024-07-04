const router = require("express").Router();

const psql = require("../../database/connect/postgre");

const {
    NotFoundException
} = require("../model/customException");

const {
    getManyResults,
    getOneResult
} = require("../modules/sqlHandler");

// 관심사 목록 불러오기
router.get("/category", async (req, res, next) => {
    try {
        const askCategoryList = await getManyResults(`
            SELECT idx, name
            FROM calenduck.ask_category
            WHERE is_deleted = false
            ORDER BY idx ASC
        `);

        if (askCategoryList.length === 0) {
            return res.sendStatus(204);
        }

        return res.status(200).send({
            list: askCategoryList
        });
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

// 문의 추가
router.post("/", async (req, res, next) => {
    const { categoryIdx, title, contents } = req.body;

    try {
        const askCategory = await getOneResult(`
            SELECT idx
            FROM calenduck.ask_category
            WHERE idx = $1
        `, [categoryIdx]);

        if (!askCategory) {
            return next(new NotFoundException());
        }

        await psql.query(`
            INSERT INTO calenduck.ask(user_idx, ask_category_idx, title, contents)
            VALUES($1, $2, $3, $4)
        `, [req.decoded.idx, categoryIdx, title, contents]);

        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

module.exports = router;