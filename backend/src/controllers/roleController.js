const roleService = require('../services/roleService');
const taskService = require('../services/taskService');
const { ok, created, noContent, fail } = require('../utils/response');

async function create(req, res, next) {
  try {
    return created(res, await roleService.createRole(req.params.projectId, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    return ok(
      res,
      await roleService.updateRole(req.params.projectId, req.params.roleId, req.user.id, req.body)
    );
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const confirm = req.query.confirm === 'true';
    const result = await roleService.deleteRole(
      req.params.projectId,
      req.params.roleId,
      req.user.id,
      confirm
    );
    if (result.requiresConfirmation) return fail(res, 409, result.message, result);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

// Task sub-routes nested under a role — kept in roleController per the
// folder structure's route grouping (projects/:projectId/roles/:roleId/tasks).
async function createTask(req, res, next) {
  try {
    return created(
      res,
      await taskService.createTask(req.params.projectId, req.params.roleId, req.user.id, req.body)
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { create, update, remove, createTask };
