const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'RefreshToken',
  tableName: 'refresh_tokens',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    userId: { type: 'uuid', name: 'user_id' },
    tokenHash: { type: 'varchar', name: 'token_hash' },
    rememberMe: { type: 'boolean', default: false, name: 'remember_me' },
    expiresAt: { type: 'timestamptz', name: 'expires_at' },
    revokedAt: { type: 'timestamptz', nullable: true, name: 'revoked_at' },
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
  indices: [{ name: 'idx_refresh_tokens_user', columns: ['userId'] }],
});
