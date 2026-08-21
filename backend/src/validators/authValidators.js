const { isPasswordStrong } = require('../utils/password');
const { calculateAge } = require('../utils/age');
const { MINIMUM_AGE } = require('../utils/constants');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateRegister(req) {
  const errors = [];
  const { fullName, email, password, dateOfBirth } = req.body || {};

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Full name is required (min 2 characters)' });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    errors.push({ field: 'email', message: 'A valid email is required' });
  }
  if (!password || !isPasswordStrong(password)) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters and include a number',
    });
  }

  // Required at registration per the PRD's data-collection section, with a
  // minimum-age floor since the target audience includes under-18 students.
  if (!dateOfBirth || typeof dateOfBirth !== 'string' || !DATE_REGEX.test(dateOfBirth)) {
    errors.push({ field: 'dateOfBirth', message: 'A valid date of birth (YYYY-MM-DD) is required' });
  } else {
    const parsed = new Date(dateOfBirth);
    if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
      errors.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future' });
    } else {
      const age = calculateAge(dateOfBirth);
      if (age < MINIMUM_AGE) {
        errors.push({
          field: 'dateOfBirth',
          message: `You must be at least ${MINIMUM_AGE} years old to use CollabNest`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateLogin(req) {
  const errors = [];
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return { valid: errors.length === 0, errors };
}

function validateRefresh(req) {
  const errors = [];
  if (!req.body || !req.body.refreshToken) {
    errors.push({ field: 'refreshToken', message: 'refreshToken is required' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateRegister, validateLogin, validateRefresh };
