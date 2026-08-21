require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing environment variable: ${name}`);
  }
  return value;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_BASE_PATH: process.env.API_BASE_PATH || '/api',

  DB_HOST: required('DB_HOST', 'localhost'),
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USERNAME: required('DB_USERNAME', 'postgres'),
  DB_PASSWORD: required('DB_PASSWORD', 'postgres'),
  DB_NAME: required('DB_NAME', 'collabnest'),
  DB_SSL: process.env.DB_SSL === 'true',

  // Tightened to match the security doc's recommendation (15 min access /
  // 7 day refresh, rotating) — no PRD conflict, so applied directly.
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN_REMEMBER_ME: process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER_ME || '30d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // General API limiter (unrelated to the two below).
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  // Security doc: auth endpoints limited to 10 requests/minute per IP.
  AUTH_RATE_LIMIT_WINDOW_MS: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '60000', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  // PRD/auth doc: max 5 failed login attempts per minute per IP (tighter
  // than the general auth limiter above, specific to /auth/login).
  LOGIN_RATE_LIMIT_WINDOW_MS: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '60000', 10),
  LOGIN_RATE_LIMIT_MAX: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
  // Security doc Module 6: search endpoints limited to 60 requests/minute.
  SEARCH_RATE_LIMIT_WINDOW_MS: parseInt(process.env.SEARCH_RATE_LIMIT_WINDOW_MS || '60000', 10),
  SEARCH_RATE_LIMIT_MAX: parseInt(process.env.SEARCH_RATE_LIMIT_MAX || '60', 10),

  FRONTEND_PUBLIC_PROFILE_BASE_URL:
    process.env.FRONTEND_PUBLIC_PROFILE_BASE_URL || 'http://localhost:5173/profile',

  // Paystack — NGN only. See config/paystack.js for why no custom FX layer
  // is needed for foreign-currency payers.
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
  FRONTEND_BILLING_CALLBACK_URL:
    process.env.FRONTEND_BILLING_CALLBACK_URL || 'http://localhost:5173/billing/callback',
};

module.exports = env;
