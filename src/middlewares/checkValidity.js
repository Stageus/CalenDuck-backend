const { BadRequestException } = require("../model/customException");

const checkValidity = (req, res, next) => {
    const regexId = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/; // 영어 + 숫자, 각 최소 1개 이상, 6~12
    const regexPw = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?)[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/; // 영어 + 숫자 + 특수문자, 각 최소 1개 이상, 8~16
    const regexEmail = /^(?!\.)(?!.*\.\.)[a-zA-Z\d.!#$%&'*+/=?^_{|}~-]+(?<!\.)@(?!-)(?!.*--)(?=.{1,253}$)([a-zA-Z\d-]{1,63}(?:\.[a-zA-Z\d-]{1,63})*(?<!-)\.[a-zA-Z]{2,6})$/
    const regexName = /^[a-zA-Zㄱ-ㅎ가-힣]{2,32}$/;
    const whitespaceRegex = /[\r\n\t ]+/g;

    const { userId, userPw, userEmail, userName } = req.body;

    if (userId && !regexId.test(userId)) {
        return next(new BadRequestException());

    }
    if (userPw && !regexPw.test(userPw)) {
        return next(new BadRequestException());

    }
    if (userEmail && !regexEmail.test(userEmail)) {
        return next(new BadRequestException());

    }
    if (userName && !regexName.test(userName)) {
        return next(new BadRequestException());
    }
    return next();
}

module.exports = checkValidity;