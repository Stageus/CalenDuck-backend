const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const connectMongoDB = async () => {
    try {
        const client = await MongoClient.connect(uri, {
            maxPoolSize: process.env.MONGODB_MAX
        });
        console.log('Connected');
        return client.db('backend');
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = connectMongoDB;