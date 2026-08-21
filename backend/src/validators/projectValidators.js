const { PROJECT_TITLE_MAX_LENGTH, PROJECT_DESCRIPTION_MIN_LENGTH } = require('../utils/constants');

function validateCreateProject(req) {
  const errors = [];
  const { title, description } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.length > PROJECT_TITLE_MAX_LENGTH) {
    errors.push({
      field: 'title',
      message: `Title must be at most ${PROJECT_TITLE_MAX_LENGTH} characters`,
    });
  }

  if (!description || typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (description.length < PROJECT_DESCRIPTION_MIN_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description must be at least ${PROJECT_DESCRIPTION_MIN_LENGTH} characters`,
    });
  }

  return { valid: errors.length === 0, errors };
}

function validateUpdateProject(req) {
  const errors = [];
  const { title, description } = req.body || {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title cannot be empty' });
    } else if (title.length > PROJECT_TITLE_MAX_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title must be at most ${PROJECT_TITLE_MAX_LENGTH} characters`,
      });
    }
  }
  if (description !== undefined) {
    if (typeof description !== 'string' || description.length < PROJECT_DESCRIPTION_MIN_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description must be at least ${PROJECT_DESCRIPTION_MIN_LENGTH} characters`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateCreateRole(req) {
  const errors = [];
  const { name, openings } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Role name is required' });
  }
  if (openings !== undefined && (!Number.isInteger(openings) || openings < 1)) {
    errors.push({ field: 'openings', message: 'openings must be a positive integer' });
  }

  return { valid: errors.length === 0, errors };
}

function validateUpdateRole(req) {
  const errors = [];
  const { openings } = req.body || {};
  if (openings !== undefined && (!Number.isInteger(openings) || openings < 0)) {
    errors.push({ field: 'openings', message: 'openings must be a non-negative integer' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateCreateProject,
  validateUpdateProject,
  validateCreateRole,
  validateUpdateRole,
};
