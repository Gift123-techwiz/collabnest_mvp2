const userService = require('../services/userService');
const { ok, created, noContent } = require('../utils/response');

async function getMe(req, res, next) {
  try {
    return ok(res, await userService.getMe(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    return ok(res, await userService.updateMe(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function uploadProfilePicture(req, res, next) {
  try {
    return ok(res, await userService.uploadProfilePicture(req.user.id, req.file));
  } catch (err) {
    next(err);
  }
}

async function getPublicProfile(req, res, next) {
  try {
    return ok(res, await userService.getPublicProfile(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function addSkill(req, res, next) {
  try {
    return created(res, await userService.addSkill(req.user.id, req.body.skillId));
  } catch (err) {
    next(err);
  }
}

async function removeSkill(req, res, next) {
  try {
    await userService.removeSkill(req.user.id, req.params.skillId);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

async function addPortfolioLink(req, res, next) {
  try {
    return created(res, await userService.addPortfolioLink(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function removePortfolioLink(req, res, next) {
  try {
    await userService.removePortfolioLink(req.user.id, req.params.id);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    return ok(res, await userService.getStats(req.user.id));
  } catch (err) {
    next(err);
  }
}

// Addition: shareable public profile link, so a user can copy/share their
// CollabNest profile outside the platform (e.g. when applying elsewhere).
async function getShareLink(req, res, next) {
  try {
    return ok(res, { url: userService.getShareableLink(req.user.id) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  uploadProfilePicture,
  getPublicProfile,
  addSkill,
  removeSkill,
  addPortfolioLink,
  removePortfolioLink,
  getStats,
  getShareLink,
};
