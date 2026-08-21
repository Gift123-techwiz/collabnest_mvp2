const notificationService = require('../services/notificationService');
const { ok, noContent } = require('../utils/response');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

async function list(req, res, next) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const unreadOnly = req.query.unreadOnly === 'true';
    const { items, total } = await notificationService.listForUser(req.user.id, {
      unreadOnly,
      page,
      pageSize,
      skip,
      take,
    });
    return ok(res, buildPaginatedResponse(items, total, page, pageSize));
  } catch (err) {
    next(err);
  }
}

async function unreadCount(req, res, next) {
  try {
    const count = await notificationService.unreadCount(req.user.id);
    return ok(res, { count });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    return ok(res, await notificationService.markRead(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user.id);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, unreadCount, markRead, markAllRead };
