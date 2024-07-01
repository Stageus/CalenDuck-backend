class CustomError extends Error {
  statusCode;
  constructor(statuseCode, message) {
    super(message);
    this.statusCode = statuseCode;
  }
}

class BadRequestError extends CustomError {
  constructor() {
    super(400, "입력한 데이터가 올바르지 않습니다.");
  }
}

class UnauthorizedError extends CustomError {
  constructor() {
    super(401, "인증되지 않은 접근입니다.");
  }
}

class ForbiddenError extends CustomError {
  constructor() {
    super(403, "접근 권한이 없습니다.");
  }
}

class NotFoundError extends CustomError {
  constructor() {
    super(404, "요청하신 정보를 찾을 수 없습니다.");
  }
}

class ConflictError extends CustomError {
  constructor() {
    super(409, "동일한 값이 이미 데이터베이스에 존재합니다.");
  }
}

class TooManyRequestsError extends CustomError {
  constructor() {
    super(429, "요청 횟수 제한을 초과하였습니다. 잠시 후 다시 시도해 주세요.");
  }
}

module.exports = {
  CustomError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
};
