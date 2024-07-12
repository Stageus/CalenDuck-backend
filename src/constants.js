// checkValidity 정규식
const IDREGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/; // 영어 + 숫자, 각 최소 1개 이상, 6~12
const PWREGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/; // 영어 + 숫자 + 특수문자, 각 최소 1개 이상, 8~16
const EMAILREGEX = /^(?!\.)(?!.*\.\.)(?=.{5,320})[a-zA-Z\d.!#$%&'*+/=?^_{|}~-]{1,64}(?<!\.)@(?!-)(?!.*--)(?=.{3,255}$)([a-zA-Z\d-]{1,63}(?:\.[a-zA-Z\d-]{1,63})*(?<!-)\.[a-zA-Z]{1,63})$/
const NICKNAMEREGEX = /^[a-zA-Zㄱ-ㅎ가-힣]{2,32}$/;
const WHITESPACEREGEX = /[\r\n\t ]+/g;
const PARAMREGEX = /^(?!0)[\d]+$/
const CODEREGEX = /^[\d]{6}$/;
const FULLDATEREGEX = /^(?:(?:20(?:2[\d]|30)(?:(?:0[13578]|1[02])(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)(?:0[1-9]|[12]\d|30)|02(?:0[1-9]|1\d|2[0-8])))|(?:202[48])0229)$/
const YEARMONTHREGEX = /^20(?:2[\d]|30)(?:0[1-9]|1[0-2])$/

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