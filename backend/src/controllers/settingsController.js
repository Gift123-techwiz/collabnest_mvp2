const userService = require('../services/userService');
const { ok } = require('../utils/response');

async function changePassword(req, res, next) {
  try {
    await userService.changePassword(req.user.id, req.body);
    return ok(res, { message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    await userService.deleteAccount(req.user.id, req.body);
    return ok(res, { message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { changePassword, deleteAccount };
