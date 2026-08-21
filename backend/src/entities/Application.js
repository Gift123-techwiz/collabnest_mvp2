const { EntitySchema } = require('typeorm');
const { APPLICATION_STATUSES, APPLICATION_MESSAGE_MAX_LENGTH } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'Application',
  tableName: 'applications',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    projectId: { type: 'uuid', name: 'project_id' },
    roleId: { type: 'uuid', name: 'role_id' },
    applicantId: { type: 'uuid', name: 'applicant_id' },
    message: { type: 'varchar', length: APPLICATION_MESSAGE_MAX_LENGTH, nullable: true },
    status: { type: 'enum', enum: APPLICATION_STATUSES, default: 'pending' },
    // Addition beyond the original spec: lets an owner tell the applicant why
    // they were rejected. Sent to the applicant via notification.
    rejectionReason: { type: 'text', nullable: true, name: 'rejection_reason' },
    decidedBy: { type: 'uuid', nullable: true, name: 'decided_by' },
    decidedAt: { type: 'timestamptz', nullable: true, name: 'decided_at' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
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
    applicant: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'applicant_id' },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    { name: 'idx_applications_project', columns: ['projectId'] },
    { name: 'idx_applications_applicant', columns: ['applicantId'] },
    { name: 'idx_applications_role', columns: ['roleId'] },
    { name: 'idx_applications_status', columns: ['status'] },
  ],
});
