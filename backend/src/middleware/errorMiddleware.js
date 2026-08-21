const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralised error handler. Every controller/service throws AppError (or
// lets TypeORM/other errors bubble) and this is the single place that turns
// it into a response.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { success: false, error: { message: err.message } };
    if (err.details) body.error.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: { message: 'A record with these details already exists' },
    });
  }

  // Postgres FK violation
  if (err.code === '23503') {
    return res.status(409).json({
      success: false,
      error: { message: 'Referenced record does not exist' },
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message || 'Unexpected error',
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
