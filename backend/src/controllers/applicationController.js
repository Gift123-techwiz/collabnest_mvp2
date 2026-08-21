const applicationService = require('../services/applicationService');
const { ok, created } = require('../utils/response');

async function apply(req, res, next) {
  try {
    return created(
      res,
      await applicationService.apply(req.params.projectId, req.params.roleId, req.user.id, req.body)
    );
  } catch (err) {
    next(err);
  }
}

async function listForProject(req, res, next) {
  try {
    return ok(
      res,
      await applicationService.listForProject(req.params.projectId, req.user.id, req.query)
    );
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    return ok(res, await applicationService.listMine(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function accept(req, res, next) {
  try {
    return ok(res, await applicationService.accept(req.params.id, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    return ok(res, await applicationService.reject(req.params.id, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { apply, listForProject, listMine, accept, reject };
