class CustomError extends Error {
  statusCode;
  constructor(statuseCode, message) {
    super(message);
    this.statusCode = statuseCode;
  }
}

class BadRequestError extends CustomError {
  constructor(message) {
    super(400, message);
  }
}

class UnAuthorizedError extends CustomError {
  constructor(message) {
    super(401, message);
  }
}

class ForbiddenError extends CustomError {
  constructor(message) {
    super(403, message);
  }
}

class NotFoundError extends CustomError {
  constructor(message) {
    super(404, message);
  }
}

class ConflictError extends CustomError {
  constructor(message) {
    super(409, message);
  }
}

class TooManyRequests extends CustomError {
  constructor(message) {
    super(429, message);
  }
}

class InternalSercerError extends CustomError {
  constructor(message) {
    super(500, message);
  }
}

module.exports = {
  BadRequestError,
  UnAuthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalSercerError,
};
