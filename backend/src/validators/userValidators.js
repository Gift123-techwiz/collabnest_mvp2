const {
  EXPERIENCE_LEVELS,
  AVAILABILITY_OPTIONS,
  PORTFOLIO_LINK_PLATFORMS,
  BIO_MAX_LENGTH,
} = require('../utils/constants');

const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

function validateUpdateProfile(req) {
  const errors = [];
  const body = req.body || {};

  if (body.fullName !== undefined) {
    if (typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
      errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters' });
    }
  }
  if (body.bio !== undefined && body.bio !== null) {
    if (typeof body.bio !== 'string' || body.bio.length > BIO_MAX_LENGTH) {
      errors.push({ field: 'bio', message: `Bio must be at most ${BIO_MAX_LENGTH} characters` });
    }
  }
  if (body.experienceLevel !== undefined && !EXPERIENCE_LEVELS.includes(body.experienceLevel)) {
    errors.push({ field: 'experienceLevel', message: 'Invalid experience level' });
  }
  if (body.availability !== undefined && body.availability !== null) {
    if (!AVAILABILITY_OPTIONS.includes(body.availability)) {
      errors.push({ field: 'availability', message: 'Invalid availability value' });
    }
  }
  if (body.yearsOfExperience !== undefined && body.yearsOfExperience !== null) {
    if (typeof body.yearsOfExperience !== 'number' || body.yearsOfExperience < 0) {
      errors.push({ field: 'yearsOfExperience', message: 'Must be a non-negative number' });
    }
  }
  if (body.preferredRoles !== undefined && body.preferredRoles !== null) {
    if (!Array.isArray(body.preferredRoles)) {
      errors.push({ field: 'preferredRoles', message: 'Must be an array of strings' });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateAddSkill(req) {
  const errors = [];
  if (!req.body || !req.body.skillId) {
    errors.push({ field: 'skillId', message: 'skillId is required' });
  }
  return { valid: errors.length === 0, errors };
}

function validateAddPortfolioLink(req) {
  const errors = [];
  const { platform, url } = req.body || {};

  if (!platform || !PORTFOLIO_LINK_PLATFORMS.includes(platform)) {
    errors.push({ field: 'platform', message: 'Invalid platform' });
  }
  if (!url || typeof url !== 'string' || !URL_REGEX.test(url)) {
    errors.push({ field: 'url', message: 'A valid URL is required' });
  }

  return { valid: errors.length === 0, errors };
}

function validateChangePassword(req) {
  const errors = [];
  const { currentPassword, newPassword } = req.body || {};
  const { isPasswordStrong } = require('../utils/password');

  if (!currentPassword) {
    errors.push({ field: 'currentPassword', message: 'Current password is required' });
  }
  if (!newPassword || !isPasswordStrong(newPassword)) {
    errors.push({
      field: 'newPassword',
      message: 'New password must be at least 8 characters and include a number',
    });
  }
  return { valid: errors.length === 0, errors };
}

function validateDeleteAccount(req) {
  const errors = [];
  const { password, confirm } = req.body || {};
  if (!password) errors.push({ field: 'password', message: 'Password is required' });
  if (confirm !== true) errors.push({ field: 'confirm', message: 'confirm must be true' });
  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateUpdateProfile,
  validateAddSkill,
  validateAddPortfolioLink,
  validateChangePassword,
  validateDeleteAccount,
  URL_REGEX,
};
