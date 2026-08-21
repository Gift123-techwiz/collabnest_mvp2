const { EntitySchema } = require('typeorm');
const { TASK_STATUSES } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'Task',
  tableName: 'tasks',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    roleId: { type: 'uuid', name: 'role_id' },
    // Nullable: a role's tasks can be defined before someone fills the role;
    // assignment happens once a member occupies the role.
    assignedMemberId: { type: 'uuid', nullable: true, name: 'assigned_member_id' },
    title: { type: 'varchar', length: 150 },
    description: { type: 'text', nullable: true },
    status: { type: 'enum', enum: TASK_STATUSES, default: 'assigned' },
    submittedAt: { type: 'timestamptz', nullable: true, name: 'submitted_at' },
    reviewedAt: { type: 'timestamptz', nullable: true, name: 'reviewed_at' },
    reviewedBy: { type: 'uuid', nullable: true, name: 'reviewed_by' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
    updatedAt: { type: 'timestamptz', updateDate: true, name: 'updated_at' },
  },
  relations: {
    role: {
      target: 'ProjectRole',
      type: 'many-to-one',
      joinColumn: { name: 'role_id' },
      onDelete: 'CASCADE',
      inverseSide: 'tasks',
    },
    assignedMember: {
      target: 'ProjectMember',
      type: 'many-to-one',
      joinColumn: { name: 'assigned_member_id' },
      nullable: true,
      onDelete: 'SET NULL',
    },
  },
  indices: [
    { name: 'idx_tasks_role', columns: ['roleId'] },
    { name: 'idx_tasks_assigned_member', columns: ['assignedMemberId'] },
  ],
});
