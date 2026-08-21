const bcrypt = require('bcryptjs');
const { PASSWORD_MIN_LENGTH } = require('./constants');

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

// Password rule: 8+ characters and at least one number.
function isPasswordStrong(plainPassword) {
  if (typeof plainPassword !== 'string') return false;
  if (plainPassword.length < PASSWORD_MIN_LENGTH) return false;
  if (!/\d/.test(plainPassword)) return false;
  return true;
}

module.exports = { hashPassword, comparePassword, isPasswordStrong };
