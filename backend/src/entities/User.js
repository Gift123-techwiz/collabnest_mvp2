const { EntitySchema } = require('typeorm');
const { EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS } = require('../utils/constants');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    fullName: { type: 'varchar', length: 150, name: 'full_name' },
    email: { type: 'varchar', length: 255, unique: true },
    passwordHash: { type: 'varchar', name: 'password_hash', select: false },
    profilePictureUrl: { type: 'varchar', nullable: true, name: 'profile_picture_url' },
    profilePicturePublicId: { type: 'varchar', nullable: true, name: 'profile_picture_public_id' },
    country: { type: 'varchar', length: 100, nullable: true },
    phoneNumber: { type: 'varchar', length: 30, nullable: true, name: 'phone_number' },
    // Age is derived from this at read time (see utils/age.js) — never
    // stored separately so it can't go stale. Required at registration per
    // the PRD; minimum age enforced in authValidators (MINIMUM_AGE).
    dateOfBirth: { type: 'date', nullable: true, name: 'date_of_birth' },
    bio: { type: 'varchar', length: 300, nullable: true },
    experienceLevel: {
      type: 'enum',
      enum: EXPERIENCE_LEVELS,
      default: 'not_specified',
      name: 'experience_level',
    },
    yearsOfExperience: { type: 'int', nullable: true, name: 'years_of_experience' },
    availability: { type: 'enum', enum: AVAILABILITY_OPTIONS, nullable: true },
    preferredRoles: { type: 'simple-array', nullable: true, name: 'preferred_roles' },
    profileComplete: { type: 'boolean', default: false, name: 'profile_complete' },
    profileCompletionPercentage: {
      type: 'int',
      default: 0,
      name: 'profile_completion_percentage',
    },
    activeProjectId: { type: 'uuid', nullable: true, name: 'active_project_id' },
    isDeleted: { type: 'boolean', default: false, name: 'is_deleted' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
    updatedAt: { type: 'timestamptz', updateDate: true, name: 'updated_at' },
  },
  relations: {
    skills: {
      target: 'UserSkill',
      type: 'one-to-many',
      inverseSide: 'user',
    },
    portfolioLinks: {
      target: 'UserPortfolioLink',
      type: 'one-to-many',
      inverseSide: 'user',
    },
    ownedProjects: {
      target: 'Project',
      type: 'one-to-many',
      inverseSide: 'owner',
    },
  },
  indices: [{ name: 'idx_users_email', columns: ['email'] }],
});
