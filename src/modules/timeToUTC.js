/**
 * UTC 시간으로 변경하는 함수
 * 
 * @param {Date} date
 */
const timeToUTC = (date) => {
    const timeDiff = date.getTimezoneOffset(); // 540

    date.setHours(date.getHours() + timeDiff / 60);

    return date;
};

module.exports = timeToUTC;