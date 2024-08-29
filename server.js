const express = require("express");
const cors = require("cors");
// const session = require('express-session');
require("dotenv").config();

const mongoose = require("./database/connect/mongodb");
// const cookieParser = require("cookie-parser");
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
const asksApi = require("./src/routes/asks")

const app = express();
const port = process.env.HTTP_PORT;
// const sslPort = process.env.HTTPS_PORT;
// const fs = require("fs") //외부 파일을 가져옴
// const https = require("https")


// const options = {
//   "key": fs.readFileSync(`${__dirname}/ssl/key.pem`),
//   "cert": fs.readFileSync(`${__dirname}/ssl/cert.pem`),
//   "passphrase": "1234"
// }


app.use(express.json());
// app.use(session({
//   secret: 'SECRET_CODE',
//   resave: false,
//   saveUninitialized: false,
//   checkPeriod: 30 * 60 * 1000
// }));
app.use(cors({
  origin: "*"
}))
mongoose();
// app.use(cookieParser());
app.use(limiter);
app.use(interceptor);

app.use("/auth", authApi);
app.use("/managers", managersApi);
app.use("/master", masterApi);
app.use("/notifications", notificationsApi);
app.use("/schedules", schedulesApi);
app.use("/users", usersApi);
app.use("/interests", interestsApi);
app.use("/asks", asksApi);

app.use(notFoundApi);
app.use(errorHandler);


//https 실행 파일
// https.createServer(options, app).listen(sslPort, () =>{
//   console.log(`${sslPort}번에서 HTTPS Web Server 실행`)
// })

app.listen(port, () => {
  console.log(`${port}번에서 HTTP Web Server 실행`);
});
