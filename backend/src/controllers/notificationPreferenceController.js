const notificationService = require('../services/notificationService');
const { ok } = require('../utils/response');

async function getPreferences(req, res, next) {
  try {
    return ok(res, await notificationService.getPreferences(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function updatePreference(req, res, next) {
  try {
    const { type, enabled } = req.body;
    return ok(res, await notificationService.updatePreference(req.user.id, type, enabled));
  } catch (err) {
    next(err);
  }
}

module.exports = { getPreferences, updatePreference };
