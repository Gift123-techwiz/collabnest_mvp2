const projectService = require('../services/projectService');
const { ok, created, noContent } = require('../utils/response');

async function create(req, res, next) {
  try {
    return created(res, await projectService.createProject(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    return ok(res, await projectService.searchProjects(req.query));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    return ok(res, await projectService.getProjectDetail(req.params.id, req.user?.id));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    return ok(res, await projectService.updateProject(req.params.id, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id, req.user.id);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

async function pause(req, res, next) {
  try {
    return ok(res, await projectService.pauseProject(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function resume(req, res, next) {
  try {
    return ok(res, await projectService.resumeProject(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function closeRecruitment(req, res, next) {
  try {
    return ok(res, await projectService.closeRecruitment(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function reopenRecruitment(req, res, next) {
  try {
    return ok(res, await projectService.reopenRecruitment(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function archive(req, res, next) {
  try {
    return ok(res, await projectService.archiveProject(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    return ok(res, await projectService.completeProject(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  search,
  getById,
  update,
  remove,
  pause,
  resume,
  closeRecruitment,
  reopenRecruitment,
  archive,
  complete,
};
