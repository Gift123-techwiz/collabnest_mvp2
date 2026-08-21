const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('Notification');
const prefRepo = () => AppDataSource.getRepository('NotificationPreference');

module.exports = {
  repo,
  prefRepo,
  create: (data) => repo().save(repo().create(data)),
  bulkCreate: (rows) => repo().save(rows.map((r) => repo().create(r))),
  findById: (id) => repo().findOne({ where: { id } }),
  findByUser: (userId, { unreadOnly = false, skip = 0, take = 10 } = {}) => {
    const where = { userId };
    if (unreadOnly) where.isRead = false;
    return repo().findAndCount({ where, order: { createdAt: 'DESC' }, skip, take });
  },
  unreadCount: (userId) => repo().count({ where: { userId, isRead: false } }),
  markRead: (id) => repo().update({ id }, { isRead: true, readAt: new Date() }),
  markAllRead: (userId) =>
    repo().update({ userId, isRead: false }, { isRead: true, readAt: new Date() }),
  findPreferences: (userId) => prefRepo().find({ where: { userId } }),
  upsertPreference: (userId, type, enabled) =>
    prefRepo()
      .createQueryBuilder()
      .insert()
      .values({ userId, type, enabled })
      .orUpdate(['enabled'], ['user_id', 'type'])
      .execute(),
};
