const express = require("express");

const errorHandler = require("./src/middlewares/errorHandler");
const interceptor = require("./src/middlewares/interceptor")

const authApi = require("./src/routes/auth");
const managersApi = require("./src/routes/managers");
const masterApi = require("./src/routes/master");
const notificationsApi = require("./src/routes/notifications");
const schedulesApi = require("./src/routes/schedules");
const usersApi = require("./src/routes/users");
const utillsApi = require("./src/routes/utills");
const errorHandler = require("./src/middlewares/errorHandler");
const notFoundApi = require("./src/middlewares/notFoundApi");

const app = express();
const port = process.env.HTTP_PORT;

require("dotenv").config();

app.use(interceptor);

app.use("/auth", authApi);
app.use("/managers", managersApi);
app.use("/master", masterApi);
app.use("/notifications", notificationsApi);
app.use("/schedules", schedulesApi);
app.use("/users", usersApi);
app.use("/", utillsApi);

app.use(notFoundApi);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`${port}번에서 HTTP Web Server 실행`);
})