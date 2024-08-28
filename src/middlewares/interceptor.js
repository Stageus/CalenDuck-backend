const interceptor = require("express-interceptor");

const logging = require("../modules/logging");

const intercept = interceptor((req, res) => ({
    isInterceptable: () => true,
    intercept: (body, send) => {
        logging(req.decoded?.idx || "No User", `${req.method} ${req.originalUrl}`, { headers: req.headers, body: req.body, query: req.query }, res);
        send(body);
    }
}))

module.exports = intercept;