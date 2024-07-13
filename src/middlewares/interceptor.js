const interceptor = require("express-interceptor");

const logging = require("../modules/logging");

const intercept = interceptor((req, res) => ({
    isInterceptable: () => true,
    intercept: (body, send) => {
        if (req.decoded?.idx) {
            console.log("logging");
            logging(req.decoded.idx, `${req.method} ${req.originalUrl}`, { headers: req.headers, body: req.body, query: req.query }, res.statusCode);
        }
        send(body);
    }
}))

module.exports = intercept;