const { EntitySchema } = require('typeorm');
const { PROJECT_MEMBER_STATUSES } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'ProjectMember',
  tableName: 'project_members',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    projectId: { type: 'uuid', name: 'project_id' },
    roleId: { type: 'uuid', name: 'role_id' },
    userId: { type: 'uuid', name: 'user_id' },
    applicationId: { type: 'uuid', nullable: true, name: 'application_id' },
    status: { type: 'enum', enum: PROJECT_MEMBER_STATUSES, default: 'active' },
    // Addition: optional workspace link (WhatsApp/ClickUp/etc.) the owner can
    // set at acceptance time or any time afterwards. Never required.
    workspaceLink: { type: 'varchar', length: 500, nullable: true, name: 'workspace_link' },
    workspaceLinkUpdatedAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'workspace_link_updated_at',
    },
    joinedAt: { type: 'timestamptz', nullable: true, name: 'joined_at' },
    leftAt: { type: 'timestamptz', nullable: true, name: 'left_at' },
    exitReason: { type: 'text', nullable: true, name: 'exit_reason' },
    completedTasksBeforeLeaving: {
      type: 'boolean',
      nullable: true,
      name: 'completed_tasks_before_leaving',
    },
    // Addition: links to what the member actually delivered, captured when
    // they leave — protects their portfolio image if the rest of the team
    // stalls the project.
    deliverableLinks: { type: 'simple-array', nullable: true, name: 'deliverable_links' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
    updatedAt: { type: 'timestamptz', updateDate: true, name: 'updated_at' },
  },
  relations: {
    project: {
      target: 'Project',
      type: 'many-to-one',
      joinColumn: { name: 'project_id' },
      onDelete: 'CASCADE',
    },
    role: {
      target: 'ProjectRole',
      type: 'many-to-one',
      joinColumn: { name: 'role_id' },
      onDelete: 'CASCADE',
    },
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
    },
    application: {
      target: 'Application',
      type: 'many-to-one',
      joinColumn: { name: 'application_id' },
      nullable: true,
      onDelete: 'SET NULL',
    },
  },
  indices: [
    { name: 'idx_project_members_project', columns: ['projectId'] },
    { name: 'idx_project_members_user', columns: ['userId'] },
    { name: 'idx_project_members_status', columns: ['status'] },
  ],
});
