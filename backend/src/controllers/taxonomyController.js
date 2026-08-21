const taxonomyService = require('../services/taxonomyService');
const { ok } = require('../utils/response');

async function listSkills(req, res, next) {
  try {
    return ok(res, await taxonomyService.listSkills(req.query.q));
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    return ok(res, await taxonomyService.listCategories());
  } catch (err) {
    next(err);
  }
}

module.exports = { listSkills, listCategories };
