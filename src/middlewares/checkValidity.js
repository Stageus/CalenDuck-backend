const checkValidity = (req, res, next) => {
    const regexId = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/; // 영어 + 숫자, 각 최소 1개 이상, 6~12
    const regexPw = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?)[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/; // 영어 + 숫자 + 특수문자, 각 최소 1개 이상, 8~16
    const regexEmail = /^(?!\.)(?!.*\.\.)[a-zA-Z\d.!#$%&'*+/=?^_{|}~-]+(?<!\.)@(?!-)(?!.*--)(?=.{1,253}$)([a-zA-Z\d-]{1,63}(?:\.[a-zA-Z\d-]{1,63})*(?<!-)\.[a-zA-Z]{2,6})$/

    const { userId, userPw, userEmail } = req.body;

    if (userId && !regexId.test(userId)) {
        return res.status(400).end();
    }
    if (userPw && !regexPw.test(userPw)) {
        return res.status(400).end();
    }
    if (userEmail && !regexEmail.test(userEmail)) {
        return res.status(400).end();
    }
    return next();
}

module.exports = checkValidity;