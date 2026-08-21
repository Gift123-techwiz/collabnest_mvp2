const { EntitySchema } = require('typeorm');
const { ALL_NOTIFICATION_TYPES } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'NotificationPreference',
  tableName: 'notification_preferences',
  columns: {
    userId: { type: 'uuid', primary: true, name: 'user_id' },
    type: { type: 'enum', enum: ALL_NOTIFICATION_TYPES, primary: true },
    enabled: { type: 'boolean', default: true },
  },
  relations: {
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
    },
  },
});
