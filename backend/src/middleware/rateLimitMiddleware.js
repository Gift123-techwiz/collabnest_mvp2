const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// General API-wide limiter.
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests, please try again later' } },
});

// Security doc: auth endpoints (register/login/refresh) limited to 10
// requests/minute per IP.
const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests. Please try again shortly.' } },
});

// Tighter limiter specifically on failed logins — PRD / auth doc: max 5
// failed attempts per minute per IP before a temporary lockout.
const loginLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { message: 'Too many login attempts. Please try again in a minute.' },
  },
});

// Security doc Module 6 (Discovery/Search): 60 requests/minute per IP —
// anti-scraping control on the public project search endpoint.
const searchLimiter = rateLimit({
  windowMs: env.SEARCH_RATE_LIMIT_WINDOW_MS,
  max: env.SEARCH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many search requests. Slow down a little.' } },
});

module.exports = { generalLimiter, authLimiter, loginLimiter, searchLimiter };
