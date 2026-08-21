const ratingService = require('../services/ratingService');
const { ok, created } = require('../utils/response');

async function create(req, res, next) {
  try {
    return created(res, await ratingService.createRating(req.params.id, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function listForUser(req, res, next) {
  try {
    return ok(res, await ratingService.listForUser(req.params.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listForUser };
