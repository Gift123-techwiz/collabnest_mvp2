const { EntitySchema } = require('typeorm');
const { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } = require('../utils/constants');

// One row per paid/free period a project has run. Historical — never
// mutated after the fact except to flip status (active -> expired ->
// cancelled), so this doubles as the audit trail for "what plan was this
// project on, and when."
module.exports = new EntitySchema({
  name: 'ProjectSubscription',
  tableName: 'project_subscriptions',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    projectId: { type: 'uuid', name: 'project_id' },
    plan: { type: 'enum', enum: Object.values(SUBSCRIPTION_PLANS) },
    months: { type: 'int' }, // e.g. 2 (free), 1, 6, or 12
    amountNaira: { type: 'int', name: 'amount_naira' }, // 0 for the free months
    startDate: { type: 'timestamptz', name: 'start_date' },
    endDate: { type: 'timestamptz', name: 'end_date' },
    status: { type: 'enum', enum: SUBSCRIPTION_STATUSES, default: 'active' },
    paystackReference: { type: 'varchar', nullable: true, name: 'paystack_reference' },
    isFreeExtension: { type: 'boolean', default: false, name: 'is_free_extension' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
  },
  relations: {
    project: {
      target: 'Project',
      type: 'many-to-one',
      joinColumn: { name: 'project_id' },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    { name: 'idx_project_subscriptions_project', columns: ['projectId'] },
    { name: 'idx_project_subscriptions_status', columns: ['status'] },
  ],
});
