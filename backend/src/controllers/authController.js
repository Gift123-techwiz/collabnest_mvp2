const authService = require('../services/authService');
const { ok, created, noContent } = require('../utils/response');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return created(res, result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
