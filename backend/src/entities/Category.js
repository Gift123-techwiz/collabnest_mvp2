const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Category',
  tableName: 'categories',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'varchar', length: 100, unique: true },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
  },
});
