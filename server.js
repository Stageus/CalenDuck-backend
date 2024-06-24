const express = require("express");
const app = express();
const errorHandler = require("./src/middlewares/errorHandler");
const notFoundApi = require("./src/middlewares/notFoundApi");

app.use(notFoundApi);
app.use(errorHandler);
