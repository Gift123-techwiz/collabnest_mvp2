const analyticsService = require('../services/analyticsService');
const { ok } = require('../utils/response');

async function getPersonalAnalytics(req, res, next) {
  try {
    return ok(res, await analyticsService.getPersonalAnalytics(req.user.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { getPersonalAnalytics };
