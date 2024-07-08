const { BadRequestException } = require("../model/customException");

/**
 * @typedef {{
 *  stringField?: string[],
 *  numberField?: string[]
 *  authField?: string[],
 *  codeField?: string[],
 * }} ValidityOption
 */

/**
 * Processes the data object.
 * 
 * @param {ValidityOption} data
 * @example checkValidity({ "stringField": ["interestName"] }); // 개행 처리
 * @example checkValidity({ "numberField": ["idx"] }); // 정수 정규식 처리
 * @example checkValidity({ "authField": ["id", "pw"] }); // 인증 정규식 처리
 * @example checkValidity({ "codeField": ["code"] }); // 6자리 인증코드
 * @returns {import('express').RequestHandler}
 */

const checkValidity = (data) => {
    return (req, res, next) => {
        const idRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/; // 영어 + 숫자, 각 최소 1개 이상, 6~12
        const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/; // 영어 + 숫자 + 특수문자, 각 최소 1개 이상, 8~16
        const emailRegex = /^(?!\.)(?!.*\.\.)[a-zA-Z\d.!#$%&'*+/=?^_{|}~-]+(?<!\.)@(?!-)(?!.*--)(?=.{1,253}$)([a-zA-Z\d-]{1,63}(?:\.[a-zA-Z\d-]{1,63})*(?<!-)\.[a-zA-Z]{2,6})$/
        const nameRegex = /^[a-zA-Zㄱ-ㅎ가-힣]{2,32}$/;
        const whitespaceRegex = /[\r\n\t ]+/g;
        const paramRegex = /^(?!0)[\d]+$/
        const codeRegex = /^[\d]{6}$/;

        for (typeKey in data) {
            for (const item of data[typeKey]) {
                let source;
                const value = req.body[item] ? (source = "body", req.body[item]) :
                    req.params[item] ? (source = "params", req.params[item]) :
                        req.query[item] ? (source = "query", req.query[item]) :
                            null;

                if (!value) {
                    return next(new BadRequestException());
                }

                if (typeKey === "stringField") {
                    req[source][item] = value.replace(whitespaceRegex, ' ');
                }
                if (typeKey === "numberField") {
                    if (!paramRegex.test(value)) {
                        return next(new BadRequestException());
                    }

                    req[source][item] = parseInt(req[source][item]);
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
                }
                if (typeKey === "codeField") {
                    if (!codeRegex.test(value)) {
                        return next(new BadRequestException());
                    }
                }
            }
        }
        return next();
    }
}

module.exports = checkValidity;