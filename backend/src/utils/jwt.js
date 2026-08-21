const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

// Refresh tokens are opaque random strings, not JWTs — we store only a hash
// of them (like a password) so a leaked DB dump can't be replayed directly.
function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiryDate(rememberMe) {
  const days = rememberMe
    ? parseInt(env.JWT_REFRESH_EXPIRES_IN_REMEMBER_ME, 10) || 90
    : parseInt(env.JWT_REFRESH_EXPIRES_IN, 10) || 30;
  // env values are like "30d" — parse the leading integer defensively.
  const numDays = parseInt(String(days).replace(/[^0-9]/g, ''), 10) || 30;
  const expires = new Date();
  expires.setDate(expires.getDate() + numDays);
  return expires;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  getRefreshExpiryDate,
};
