const membershipService = require('../services/membershipService');
const { ok } = require('../utils/response');

async function listMembers(req, res, next) {
  try {
    return ok(res, await membershipService.listMembers(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function leave(req, res, next) {
  try {
    return ok(res, await membershipService.leave(req.params.id, req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

// Addition: owner can set/update the workspace link any time after
// acceptance, not just at the moment of accepting.
async function setWorkspaceLink(req, res, next) {
  try {
    return ok(
      res,
      await membershipService.setWorkspaceLink(req.params.id, req.user.id, req.body.workspaceLink)
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { listMembers, leave, setWorkspaceLink };
