const { BadRequestException } = require("../model/customException");

const checkValidity = (data) => {
    return (req, res, next) => {
        const idRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/; // 영어 + 숫자, 각 최소 1개 이상, 6~12
        const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/; // 영어 + 숫자 + 특수문자, 각 최소 1개 이상, 8~16
        const emailRegex = /^(?!\.)(?!.*\.\.)[a-zA-Z\d.!#$%&'*+/=?^_{|}~-]+(?<!\.)@(?!-)(?!.*--)(?=.{1,253}$)([a-zA-Z\d-]{1,63}(?:\.[a-zA-Z\d-]{1,63})*(?<!-)\.[a-zA-Z]{2,6})$/
        const nameRegex = /^[a-zA-Zㄱ-ㅎ가-힣]{2,32}$/;
        const whitespaceRegex = /[\r\n\t ]+/g;
        const paramRegex = /^(?!0)[\d]+$/

        for (typeKey in data) {
            for (const item of data[typeKey]) {
                const value = req.body[item] || req.params[item] || req.query[item];
                if (!value) {
                    return next(new BadRequestException());
                }

                if (typeKey === "authField") {
                    if (item === "id" && !idRegex.test(value)) {
                        return next(new BadRequestException());
                    }
                    if (item === "pw" && !pwRegex.test(value)) {
                        return next(new BadRequestException());
                    }
                    if (item === "email" && !emailRegex.test(value)) {
                        return next(new BadRequestException());
                    }
                    if (item === "name" && !nameRegex.test(value)) {
                        return next(new BadRequestException());
                    }
                } else if (typeKey === "stringField") {
                    req.body[item] ? req.body[item] = value.replace(whitespaceRegex, ' ') : req.query[item] = value.replace(whitespaceRegex, ' ');
                } else if (typeKey === "numberField") {
                    if (!paramRegex.test(value)) {
                        return next(new BadRequestException());
                    }

                    req.params[item] ? req.params[item] = parseInt(req.params[item]) : req.query[item] = parseInt(req.query[item]);
                }
            }
        }
        return next();
    }
}

module.exports = checkValidity;