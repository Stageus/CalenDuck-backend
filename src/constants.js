// checkValidity 정규식
const ID_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/; // 영어 + 숫자, 각 최소 1개 이상, 6~12
const PW_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/; // 영어 + 숫자 + 특수문자, 각 최소 1개 이상, 8~16
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)(?=.{5,320})[a-zA-Z\d.!#$%&'*+/=?^_{|}~-]{1,64}(?<!\.)@(?!-)(?!.*--)(?=.{3,255}$)([a-zA-Z\d-]{1,63}(?:\.[a-zA-Z\d-]{1,63})*(?<!-)\.[a-zA-Z]{1,63})$/
const NICKNAME_REGEX = /^[a-zA-Zㄱ-ㅎ가-힣]{2,32}$/;
const WHITESPACE_REGEX = /[\r\n\t ]+/g;
const PARAM_REGEX = /^(?!0)[\d]+$/
const CODE_REGEX = /^[\d]{6}$/;
const FULL_DATE_REGEX = /^(?:(?:20(?:2[\d]|30)(?:(?:0[13578]|1[02])(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)(?:0[1-9]|[12]\d|30)|02(?:0[1-9]|1\d|2[0-8])))|(?:202[48])0229)$/;
const YEAR_MONTH_REGEX = /^20(?:2[\d]|30)(?:0[1-9]|1[0-2])$/;
const MAX_LENGTH_50_REGEX = /^.{1,50}$/;
const MAX_LENGTH_100_REGEX = /^.{1,100}$/;
const MAX_LENGTH_300_REGEX = /^.{1,300}$/;

// /notification
const IMPORT = "import";
const REPLY = "reply";

// /auth
const MIN = 100000;
const MAX = 999999;
const RANGE = MAX - MIN + 1;

// token 발급시간
const EXPIRESIN = "1h";

// validType
const SIGNUP = "signup";
const FIND_ID = "findId";
const FIND_PW = "findPw";
const LOGIN = "login";
const MASTER = "master";
const MANAGER = "manager";

module.exports = {
    ID_REGEX,
    PW_REGEX,
    EMAIL_REGEX,
    NICKNAME_REGEX,
    WHITESPACE_REGEX,
    PARAM_REGEX,
    CODE_REGEX,
    MIN,
    MAX,
    RANGE,
    EXPIRESIN,
    SIGNUP,
    FIND_ID,
    FIND_PW,
    LOGIN,
    MASTER,
    MANAGER,
    FULL_DATE_REGEX,
    YEAR_MONTH_REGEX,
    MAX_LENGTH_50_REGEX,
    MAX_LENGTH_100_REGEX,
    MAX_LENGTH_300_REGEX
};