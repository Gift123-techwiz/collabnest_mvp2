const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Rating',
  tableName: 'ratings',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    projectId: { type: 'uuid', name: 'project_id' },
    raterId: { type: 'uuid', name: 'rater_id' },
    rateeId: { type: 'uuid', name: 'ratee_id' },
    stars: { type: 'smallint' },
    feedback: { type: 'text', nullable: true },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
  },
  relations: {
    project: {
      target: 'Project',
      type: 'many-to-one',
      joinColumn: { name: 'project_id' },
      onDelete: 'CASCADE',
    },
    rater: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'rater_id' },
      onDelete: 'CASCADE',
    },
    ratee: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'ratee_id' },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    { name: 'idx_ratings_ratee', columns: ['rateeId'] },
    { name: 'idx_ratings_project', columns: ['projectId'] },
    { name: 'idx_ratings_unique_pair', columns: ['projectId', 'raterId', 'rateeId'], unique: true },
  ],
});
