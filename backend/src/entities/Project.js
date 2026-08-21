const { EntitySchema } = require('typeorm');
const { PROJECT_STATUSES, SUBSCRIPTION_PLANS } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'Project',
  tableName: 'projects',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    ownerId: { type: 'uuid', name: 'owner_id' },
    title: { type: 'varchar', length: 80 },
    description: { type: 'text' },
    problemStatement: { type: 'text', nullable: true, name: 'problem_statement' },
    categoryId: { type: 'uuid', nullable: true, name: 'category_id' },
    country: { type: 'varchar', length: 100, nullable: true },
    expectedDuration: { type: 'varchar', length: 100, nullable: true, name: 'expected_duration' },
    status: { type: 'enum', enum: PROJECT_STATUSES, default: 'draft' },
    applicantCount: { type: 'int', default: 0, name: 'applicant_count' },
    coverImageUrl: { type: 'varchar', nullable: true, name: 'cover_image_url' },
    coverImagePublicId: { type: 'varchar', nullable: true, name: 'cover_image_public_id' },
    // ---- Subscription / plan tracking (denormalised for fast access
    // checks on every request; ProjectSubscription holds the full history) ----
    currentPlan: {
      type: 'enum',
      enum: Object.values(SUBSCRIPTION_PLANS),
      default: SUBSCRIPTION_PLANS.FREE,
      name: 'current_plan',
    },
    // A project's Free plan can only ever be used once, ever — even after
    // it lapses and the owner upgrades. This flag never resets.
    freePlanUsed: { type: 'boolean', default: false, name: 'free_plan_used' },
    // The one-time ₦2,500 Month-3 extension — also usable only once.
    freeExtensionUsed: { type: 'boolean', default: false, name: 'free_extension_used' },
    subscriptionExpiresAt: {
      type: 'timestamptz',
      nullable: true,
      name: 'subscription_expires_at',
    },
    // Snapshot of `status` the instant a subscription lapses and the
    // project gets locked, so paying again can restore exactly where it
    // left off (e.g. 'recruiting' vs 'in_progress') instead of guessing.
    statusBeforeLock: {
      type: 'enum',
      enum: PROJECT_STATUSES,
      nullable: true,
      name: 'status_before_lock',
    },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
    updatedAt: { type: 'timestamptz', updateDate: true, name: 'updated_at' },
  },
  relations: {
    owner: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'owner_id' },
      onDelete: 'CASCADE',
      inverseSide: 'ownedProjects',
    },
    category: {
      target: 'Category',
      type: 'many-to-one',
      joinColumn: { name: 'category_id' },
      onDelete: 'SET NULL',
      nullable: true,
    },
    roles: {
      target: 'ProjectRole',
      type: 'one-to-many',
      inverseSide: 'project',
    },
    technologies: {
      target: 'ProjectTechnology',
      type: 'one-to-many',
      inverseSide: 'project',
    },
    subscriptions: {
      target: 'ProjectSubscription',
      type: 'one-to-many',
      inverseSide: 'project',
    },
  },
  indices: [
    { name: 'idx_projects_status', columns: ['status'] },
    { name: 'idx_projects_owner', columns: ['ownerId'] },
    { name: 'idx_projects_category', columns: ['categoryId'] },
  ],
});
