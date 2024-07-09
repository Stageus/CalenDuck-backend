// checkValidity 정규식
const idRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/; // 영어 + 숫자, 각 최소 1개 이상, 6~12
const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/; // 영어 + 숫자 + 특수문자, 각 최소 1개 이상, 8~16
const emailRegex = /^(?!\.)(?!.*\.\.)[a-zA-Z\d.!#$%&'*+/=?^_{|}~-]+(?<!\.)@(?!-)(?!.*--)(?=.{1,253}$)([a-zA-Z\d-]{1,63}(?:\.[a-zA-Z\d-]{1,63})*(?<!-)\.[a-zA-Z]{2,6})$/
const nameRegex = /^[a-zA-Zㄱ-ㅎ가-힣]{2,32}$/;
const whitespaceRegex = /[\r\n\t ]+/g;
const paramRegex = /^(?!0)[\d]+$/
const codeRegex = /^[\d]{6}$/;

// /notification
const pageSize = 20;

// /auth
const min = 100000;
const max = 999999;
const range = max - min + 1;

// token 발급시간
const expiresIn = "1h";

module.exports = {
    idRegex,
    pwRegex,
    emailRegex,
    nameRegex,
    whitespaceRegex,
    paramRegex,
    codeRegex,
    pageSize,
    min,
    max,
    range,
    expiresIn
};