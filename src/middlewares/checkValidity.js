const { BadRequestException } = require("../model/customException");

const {
    ID_REGEX,
    PW_REGEX,
    EMAIL_REGEX,
    NICKNAME_REGEX,
    WHITESPACE_REGEX,
    PARAM_REGEX,
    CODE_REGEX,
    DATE_REGEX,
    DATE_TIME_REGEX,
    YEAR_MONTH_REGEX,
    MAX_LENGTH_50_REGEX,
    MAX_LENGTH_100_REGEX,
    MAX_LENGTH_300_REGEX
} = require("../constants");

/**
 * @typedef {{
 *  stringField?: string[],
 *  numberField?: string[]
 *  authField?: string[],
 *  codeField?: string[],
 *  dateField?: string[]
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
        for (typeKey in data) {
            for (const item of data[typeKey]) {
                let source;
                const value = req.body[item] ? (source = "body", req.body[item]) :
                    req.params[item] ? (source = "params", req.params[item]) :
                        req.query[item] ? (source = "query", req.query[item]) :
                            null;

                // 값이 없으면, 에러처리
                if (!value) {
                    return next(new BadRequestException());
                }

                if (typeKey === "stringField") { // 개행처리 및 글자수 정규식 처리
                    const stringRegexObj = {
                        "personalContents": MAX_LENGTH_100_REGEX,
                        "interestContents": MAX_LENGTH_100_REGEX,
                        "askTitle": MAX_LENGTH_50_REGEX,
                        "askContents": MAX_LENGTH_300_REGEX,
                        "askReply": MAX_LENGTH_300_REGEX,
                        "interestName": MAX_LENGTH_100_REGEX
                    }

                    if (item in stringRegexObj && !stringRegexObj[item].test(value)) {
                        return next(new BadRequestException());
                    }

                    req[source][item] = value.replace(WHITESPACE_REGEX, ' ');
                }
                if (typeKey === "numberField") { // 숫자 정규식 처리 및 parseInt 처리 후 넘김
                    if (!PARAM_REGEX.test(value)) {
                        return next(new BadRequestException());
                    }

                    req[source][item] = parseInt(req[source][item]);
                }
                if (typeKey === "dateField") { // 날짜 정규식 처리 및 parseInt 처리 후 넘김
                    const dateRegexObj = {
                        "fullDate": DATE_TIME_REGEX,
                        "yearMonth": YEAR_MONTH_REGEX,
                        "startDate": DATE_REGEX,
                        "endDate": DATE_REGEX
                    }

                    if (item in dateRegexObj && !dateRegexObj[item].test(value)) {
                        return next(new BadRequestException());
                    }
                }
                if (typeKey === "authField") { // 인증 관련 정규식 처리
                    const authRegexObj = {
                        "id": ID_REGEX,
                        "pw": PW_REGEX,
                        "email": EMAIL_REGEX,
                        "nickname": NICKNAME_REGEX
                    }

                    if (item in authRegexObj && !authRegexObj[item].test(value)) {
                        return next(new BadRequestException());
                    }
                }
                if (typeKey === "codeField") { // 인증코드 정규식 처리
                    if (!CODE_REGEX.test(value)) {
                        return next(new BadRequestException());
                    }
                }
            }
        }
        return next();
    }
}

module.exports = checkValidity;