const express = require("express");
const mongoose = require("./database/connect/mongodb");

const errorHandler = require("./src/middlewares/errorHandler");
const interceptor = require("./src/middlewares/interceptor");
const notFoundApi = require("./src/middlewares/notFoundApi");
const limiter = require("./src/middlewares/apiLimiter");
const checkDuplicatedId = require("./src/middlewares/checkDuplicatedId");

const authApi = require("./src/routes/auth");
const managersApi = require("./src/routes/managers");
const masterApi = require("./src/routes/master");
const notificationsApi = require("./src/routes/notifications");
const schedulesApi = require("./src/routes/schedules");
const usersApi = require("./src/routes/users");
const utillsApi = require("./src/routes/utills");

require("dotenv").config();
const app = express();
const port = process.env.HTTP_PORT;
app.use(express.json());
mongoose();

app.use(limiter);

//app.use("/auth", authApi);
// app.use("/managers", managersApi);
// app.use("/master", masterApi);
// app.use("/notifications", notificationsApi);
// app.use("/schedules", schedulesApi);
// app.use("/users", usersApi);
// app.use("/", utillsApi);

// app.use(interceptor);
app.use(notFoundApi);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`${port}번에서 HTTP Web Server 실행`);
});