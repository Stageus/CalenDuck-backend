const router = require("express").Router();

const connectMongoDB = require("../../database/connect/mongodb");
const psql = require("../../database/connect/postgre");

router.get("/", async (req, res) => {
    try {
        const db = await connectMongoDB();
        const data = await db.collection("import_notification").find().toArray();
        console.log(data);
        await db.collection("import_notification").insertOne(
            {
                "name": "name",
                "price": 200
            }
        )

        const data1 = await psql.query("select * from test");
        console.log(data1.rows);
    } catch (err) {
        console.log(err);
    } finally {
        res.sendStatus(200);
    }
})

module.exports = router;