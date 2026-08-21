const { EntitySchema } = require('typeorm');
const { PROJECT_ROLE_STATUSES } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'ProjectRole',
  tableName: 'project_roles',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    projectId: { type: 'uuid', name: 'project_id' },
    name: { type: 'varchar', length: 100 },
    description: { type: 'text', nullable: true },
    openings: { type: 'int', default: 1 },
    filledCount: { type: 'int', default: 0, name: 'filled_count' },
    status: { type: 'enum', enum: PROJECT_ROLE_STATUSES, default: 'open' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
    updatedAt: { type: 'timestamptz', updateDate: true, name: 'updated_at' },
  },
  relations: {
    project: {
      target: 'Project',
      type: 'many-to-one',
      joinColumn: { name: 'project_id' },
      onDelete: 'CASCADE',
      inverseSide: 'roles',
    },
    requiredSkills: {
      target: 'ProjectRoleSkill',
      type: 'one-to-many',
      inverseSide: 'role',
    },
    tasks: {
      target: 'Task',
      type: 'one-to-many',
      inverseSide: 'role',
    },
  },
  indices: [{ name: 'idx_project_roles_project', columns: ['projectId'] }],
});
