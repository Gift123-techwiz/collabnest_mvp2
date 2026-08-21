const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

// Requires a valid access token. Attaches req.user = { id, email }.
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(AppError.unauthorized('Invalid or expired access token'));
  }
}

// Same as requireAuth, but never throws — used on routes that behave
// differently for logged-in vs anonymous callers (e.g. GET /api/projects).
function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email };
    }
  } catch (err) {
    // Ignore invalid tokens on optional-auth routes — treat as anonymous.
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
