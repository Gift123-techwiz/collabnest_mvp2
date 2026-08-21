const AppError = require('../utils/AppError');

// Wraps a plain validator function of shape (req) => { valid, errors }.
// Keeps validators as simple, dependency-free functions (see validators/)
// rather than pulling in a schema library.
function validate(validatorFn) {
  return (req, res, next) => {
    const result = validatorFn(req);
    if (!result || result.valid) return next();
    return next(AppError.unprocessable('Validation failed', result.errors));
  };
}

module.exports = { validate };
