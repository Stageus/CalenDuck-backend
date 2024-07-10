// checkValidity 정규식
const IDREGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/; // 영어 + 숫자, 각 최소 1개 이상, 6~12
const PWREGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/; // 영어 + 숫자 + 특수문자, 각 최소 1개 이상, 8~16
const EMAILREGEX = /^(?!\.)(?!.*\.\.)[a-zA-Z\d.!#$%&'*+/=?^_{|}~-]+(?<!\.)@(?!-)(?!.*--)(?=.{1,253}$)([a-zA-Z\d-]{1,63}(?:\.[a-zA-Z\d-]{1,63})*(?<!-)\.[a-zA-Z]{2,6})$/
const NICKNAMEREGEX = /^[a-zA-Zㄱ-ㅎ가-힣]{2,32}$/;
const WHITESPACEREGEX = /[\r\n\t ]+/g;
const PARAMREGEX = /^(?!0)[\d]+$/
const CODEREGEX = /^[\d]{6}$/;

// /notification
const PAGESIZE = 20;

// /auth
const MIN = 100000;
const MAX = 999999;
const RANGE = MAX - MIN + 1;

// token 발급시간
const EXPIRESIN = "1h";

// validType
const SIGNUP = "signup";
const FINDID = "findId";
const FINDPW = "findPw";
const LOGIN = "login";
const MASTER = "master";
const MANAGER = "manager";

module.exports = {
    IDREGEX,
    PWREGEX,
    EMAILREGEX,
    NICKNAMEREGEX,
    WHITESPACEREGEX,
    PARAMREGEX,
    CODEREGEX,
    PAGESIZE,
    MIN,
    MAX,
    RANGE,
    EXPIRESIN,
    SIGNUP,
    FINDID,
    FINDPW,
    LOGIN,
    MASTER,
    MANAGER
};