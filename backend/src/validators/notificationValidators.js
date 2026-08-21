const { ALL_NOTIFICATION_TYPES } = require('../utils/constants');

function validateUpdatePreference(req) {
  const errors = [];
  const { type, enabled } = req.body || {};

  if (!type || !ALL_NOTIFICATION_TYPES.includes(type)) {
    errors.push({ field: 'type', message: 'Invalid notification type' });
  }
  if (typeof enabled !== 'boolean') {
    errors.push({ field: 'enabled', message: 'enabled must be a boolean' });
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateUpdatePreference };
