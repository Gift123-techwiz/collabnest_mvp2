const { EntitySchema } = require('typeorm');
const { ALL_NOTIFICATION_TYPES } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    userId: { type: 'uuid', name: 'user_id' },
    type: { type: 'enum', enum: ALL_NOTIFICATION_TYPES },
    title: { type: 'varchar', length: 150 },
    message: { type: 'text' },
    relatedEntityType: { type: 'varchar', nullable: true, name: 'related_entity_type' },
    relatedEntityId: { type: 'uuid', nullable: true, name: 'related_entity_id' },
    isRead: { type: 'boolean', default: false, name: 'is_read' },
    readAt: { type: 'timestamptz', nullable: true, name: 'read_at' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
  },
  relations: {
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    { name: 'idx_notifications_user', columns: ['userId'] },
    { name: 'idx_notifications_user_unread', columns: ['userId', 'isRead'] },
  ],
});
