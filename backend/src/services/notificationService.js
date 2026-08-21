const notificationRepository = require('../repositories/notificationRepository');
const { LOCKED_NOTIFICATION_TYPES } = require('../utils/constants');

// Central place every other service goes through to notify a user in-app.
// There is no email channel anywhere in this system by design (per the
// client — avoids issues with free hosting providers).
async function notify({ userId, type, title, message, relatedEntityType, relatedEntityId }) {
  // Respect preferences, except for locked/critical types which always fire.
  if (!LOCKED_NOTIFICATION_TYPES.includes(type)) {
    const prefs = await notificationRepository.findPreferences(userId);
    const pref = prefs.find((p) => p.type === type);
    if (pref && pref.enabled === false) return null;
  }

  return notificationRepository.create({
    userId,
    type,
    title,
    message,
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
  });
}

async function notifyMany(userIds, payloadWithoutUserId) {
  return Promise.all(userIds.map((userId) => notify({ ...payloadWithoutUserId, userId })));
}

async function listForUser(userId, { unreadOnly, page, pageSize, skip, take }) {
  const [items, total] = await notificationRepository.findByUser(userId, {
    unreadOnly,
    skip,
    take,
  });
  return { items, total };
}

async function unreadCount(userId) {
  return notificationRepository.unreadCount(userId);
}

async function markRead(userId, notificationId) {
  const AppError = require('../utils/AppError');
  const notification = await notificationRepository.findById(notificationId);
  if (!notification) throw AppError.notFound('Notification not found');
  if (notification.userId !== userId) throw AppError.forbidden('Not your notification');
  await notificationRepository.markRead(notificationId);
  return { ...notification, isRead: true, readAt: new Date() };
}

async function markAllRead(userId) {
  await notificationRepository.markAllRead(userId);
}

async function getPreferences(userId) {
  const { ALL_NOTIFICATION_TYPES, LOCKED_NOTIFICATION_TYPES: LOCKED } = require('../utils/constants');
  const existing = await notificationRepository.findPreferences(userId);
  const map = new Map(existing.map((p) => [p.type, p.enabled]));

  return ALL_NOTIFICATION_TYPES.map((type) => ({
    type,
    enabled: map.has(type) ? map.get(type) : true,
    locked: LOCKED.includes(type),
  }));
}

async function updatePreference(userId, type, enabled) {
  const AppError = require('../utils/AppError');
  if (LOCKED_NOTIFICATION_TYPES.includes(type) && enabled === false) {
    throw AppError.unprocessable('This notification type cannot be disabled');
  }
  await notificationRepository.upsertPreference(userId, type, enabled);
  return { type, enabled, locked: LOCKED_NOTIFICATION_TYPES.includes(type) };
}

module.exports = {
  notify,
  notifyMany,
  listForUser,
  unreadCount,
  markRead,
  markAllRead,
  getPreferences,
  updatePreference,
};
