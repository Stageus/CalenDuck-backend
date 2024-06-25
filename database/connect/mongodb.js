const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const connectMongoDB = async () => {
    try {
        const client = await MongoClient.connect(uri, {
            maxPoolSize: process.env.MONGODB_MAX
        });
        console.log("Connected");
        return client.db("calenduck");
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = connectMongoDB;