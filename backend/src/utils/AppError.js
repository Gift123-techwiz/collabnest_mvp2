// Custom error class carrying an HTTP status code. Thrown from services,
// caught centrally by errorMiddleware so controllers stay free of try/catch
// boilerplate for expected error cases (404, 403, 409, 422, etc).
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(403, message);
  }
  static notFound(message = 'Not found') {
    return new AppError(404, message);
  }
  static conflict(message, details) {
    return new AppError(409, message, details);
  }
  static unprocessable(message, details) {
    return new AppError(422, message, details);
  }
  static paymentRequired(message, details) {
    return new AppError(402, message, details);
  }
  static tooManyRequests(message = 'Too many requests') {
    return new AppError(429, message);
  }
}

module.exports = AppError;
