const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("./database/connect/mongodb");
const cookieParser = require("cookie-parser");
const errorHandler = require("./src/middlewares/errorHandler");
const interceptor = require("./src/middlewares/interceptor");
const notFoundApi = require("./src/middlewares/notFoundApi");
const limiter = require("./src/middlewares/apiLimiter");

const authApi = require("./src/routes/auth");
const managersApi = require("./src/routes/managers");
const masterApi = require("./src/routes/master");
const notificationsApi = require("./src/routes/notifications");
const schedulesApi = require("./src/routes/schedules");
const usersApi = require("./src/routes/users");
const interestsApi = require("./src/routes/interests");

const app = express();
const port = process.env.HTTP_PORT;

app.use(express.json());
app.use(cors({
  origin: ["http://calenduck.site", "https://calenduck.site", "https://d2b6dw8a7unc3s.cloudfront.net/", "http://d2b6dw8a7unc3s.cloudfront.net/"],
  credentials: true
}))
mongoose();
app.use(cookieParser());
app.use(limiter);
app.use(interceptor);

app.use("/auth", authApi);
app.use("/managers", managersApi);
app.use("/master", masterApi);
app.use("/notifications", notificationsApi);
app.use("/schedules", schedulesApi);
app.use("/users", usersApi);
app.use("/interests", interestsApi);

app.use(notFoundApi);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`${port}번에서 HTTP Web Server 실행`);
});
