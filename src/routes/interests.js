const router = require("express").Router();

const checkAuth = require("../middlewares/checkAuth");

const {
    getManyResults
} = require("../modules/sqlHandler");
const endRequestHandler = require("../modules/endRequestHandler");

// 관심사 목록 불러오기
router.get("/", checkAuth("login"), endRequestHandler(async (req, res, next) => {
    const interestList = await getManyResults(`
        SELECT idx, interest
        FROM calenduck.interest
        ORDER BY idx ASC
    `);

    if (interestList.length === 0) {
        return res.sendStatus(204);
    }

    return res.status(200).send({
        list: interestList
    });
}))

module.exports = router;