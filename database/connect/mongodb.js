const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.MONGODB_URI;

const connectMongoose = () => {
  mongoose
    .connect(uri)
    .then(() => {
      console.log("mongoose connected");
    })
    .catch((err) => {
      console.log("mongoose connection fail", err);
    });
};

module.exports = connectMongoose;
