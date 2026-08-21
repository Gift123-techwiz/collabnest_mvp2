const dashboardService = require('../services/dashboardService');
const { ok } = require('../utils/response');

async function getOverview(req, res, next) {
  try {
    return ok(res, await dashboardService.getOverview(req.user.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview };
