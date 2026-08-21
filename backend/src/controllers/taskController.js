const taskService = require('../services/taskService');
const { ok } = require('../utils/response');

async function listByProject(req, res, next) {
  try {
    return ok(res, await taskService.listByProject(req.params.projectId, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    return ok(res, await taskService.updateTask(req.params.id, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    return ok(res, await taskService.submit(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    return ok(res, await taskService.approve(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    return ok(res, await taskService.reject(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { listByProject, update, submit, approve, reject };
