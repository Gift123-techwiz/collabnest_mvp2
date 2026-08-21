const { EntitySchema } = require('typeorm');
const { PORTFOLIO_LINK_PLATFORMS } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'UserPortfolioLink',
  tableName: 'user_portfolio_links',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    userId: { type: 'uuid', name: 'user_id' },
    platform: { type: 'enum', enum: PORTFOLIO_LINK_PLATFORMS },
    url: { type: 'varchar', length: 500 },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
  },
  relations: {
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
      inverseSide: 'portfolioLinks',
    },
  },
});
