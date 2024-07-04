const router = require("express").Router();

const {
    getManyResults
} = require("../modules/sqlHandler");

// 관심사 목록 불러오기
router.get("/", async (req, res, next) => {
    try {
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
    } catch (err) {
        console.log(err);
        return next(err);
    }
})

module.exports = router;