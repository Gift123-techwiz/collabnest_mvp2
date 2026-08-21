const AppDataSource = require('../config/database');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const { comparePassword, hashPassword } = require('../utils/password');
const notificationService = require('./notificationService');
const { calculateAge } = require('../utils/age');
const {
  PROFILE_COMPLETION_THRESHOLD,
  NOTIFICATION_TYPES,
} = require('../utils/constants');

const userSkillRepo = () => AppDataSource.getRepository('UserSkill');
const skillRepo = () => AppDataSource.getRepository('Skill');
const portfolioLinkRepo = () => AppDataSource.getRepository('UserPortfolioLink');
const projectRepo = () => AppDataSource.getRepository('Project');
const memberRepo = () => AppDataSource.getRepository('ProjectMember');
const ratingRepo = () => AppDataSource.getRepository('Rating');

function sanitize(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  // age is always derived from dateOfBirth, never stored — see utils/age.js
  return { ...safe, age: calculateAge(safe.dateOfBirth) };
}

// Recomputes and persists profile completion %. Called after any profile
// mutation (update, skill add/remove, picture upload) so the stored value
// never drifts from the underlying fields.
async function recalculateCompletion(userId) {
  const user = await userRepository.findById(userId);
  if (!user) return null;

  const skillCount = await userSkillRepo().count({ where: { userId } });

  const checks = [
    !!user.profilePictureUrl,
    !!user.bio,
    !!user.country,
    !!user.phoneNumber,
    skillCount > 0,
    !!user.experienceLevel && user.experienceLevel !== 'not_specified',
    user.yearsOfExperience !== null && user.yearsOfExperience !== undefined,
    !!user.availability,
  ];

  const completedCount = checks.filter(Boolean).length;
  const percentage = Math.round((completedCount / checks.length) * 100);
  const wasComplete = user.profileComplete;
  const isComplete = percentage >= PROFILE_COMPLETION_THRESHOLD && skillCount > 0;

  await userRepository.update(userId, {
    profileCompletionPercentage: percentage,
    profileComplete: isComplete,
  });

  // Fire a one-time nudge notification when the profile is still incomplete
  // and has been for a while — kept simple: notify whenever it crosses
  // below-threshold after an edit that didn't complete it, so the user
  // always has a fresh reminder + progress bar value to act on.
  if (!isComplete) {
    await notificationService.notify({
      userId,
      type: NOTIFICATION_TYPES.PROFILE_COMPLETION_REMINDER,
      title: 'Finish setting up your profile',
      message: `Your profile is ${percentage}% complete. Complete it to start applying and creating projects with full visibility.`,
    });
  } else if (!wasComplete && isComplete) {
    await notificationService.notify({
      userId,
      type: NOTIFICATION_TYPES.PROFILE_COMPLETION_REMINDER,
      title: 'Your profile is complete!',
      message: 'Nice work — your profile is now fully set up and visible to project owners.',
    });
  }

  return { percentage, isComplete };
}

async function getMe(userId) {
  const user = await userRepository.findById(userId, {
    relations: ['skills', 'skills.skill', 'portfolioLinks'],
  });
  if (!user) throw AppError.notFound('User not found');
  return sanitize(user);
}

async function updateMe(userId, updates) {
  const allowed = [
    'fullName',
    'country',
    'phoneNumber',
    'bio',
    'experienceLevel',
    'yearsOfExperience',
    'availability',
    'preferredRoles',
  ];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }
  if (payload.fullName) payload.fullName = payload.fullName.trim();
  await userRepository.update(userId, payload);
  await recalculateCompletion(userId);
  return getMe(userId);
}

async function uploadProfilePicture(userId, file) {
  if (!file) throw AppError.unprocessable('An image file is required');

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'collabnest/profile-pictures', resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(file.buffer);
  });

  await userRepository.update(userId, {
    profilePictureUrl: uploadResult.secure_url,
    profilePicturePublicId: uploadResult.public_id,
  });
  await recalculateCompletion(userId);

  return { profilePictureUrl: uploadResult.secure_url };
}

async function getPublicProfile(userId) {
  const user = await userRepository.findById(userId, {
    relations: ['skills', 'skills.skill', 'portfolioLinks'],
  });
  if (!user) throw AppError.notFound('User not found');

  const [projectsCompleted, ratingStats] = await Promise.all([
    memberRepo().count({ where: { userId, status: 'completed' } }),
    require('../repositories/ratingRepository').averageForUser(userId),
  ]);

  return {
    id: user.id,
    fullName: user.fullName,
    profilePictureUrl: user.profilePictureUrl,
    country: user.country,
    // Exact date of birth is never exposed publicly (data minimisation per
    // the security doc) — only the derived age, same as private profile.
    age: calculateAge(user.dateOfBirth),
    bio: user.bio,
    experienceLevel: user.experienceLevel,
    yearsOfExperience: user.yearsOfExperience,
    availability: user.availability,
    preferredRoles: user.preferredRoles,
    skills: (user.skills || []).map((us) => us.skill),
    portfolioLinks: user.portfolioLinks || [],
    projectsCompleted,
    averageRating: ratingStats.average,
    reviewCount: ratingStats.count,
    createdAt: user.createdAt,
  };
}

async function addSkill(userId, skillId) {
  const skill = await skillRepo().findOne({ where: { id: skillId } });
  if (!skill) throw AppError.notFound('Skill not found');

  const existing = await userSkillRepo().findOne({ where: { userId, skillId } });
  if (existing) throw AppError.conflict('Skill already added');

  await userSkillRepo().save(userSkillRepo().create({ userId, skillId }));
  await recalculateCompletion(userId);
  return skill;
}

async function removeSkill(userId, skillId) {
  const count = await userSkillRepo().count({ where: { userId } });
  if (count <= 1) {
    throw AppError.unprocessable('Cannot remove the last skill from a profile');
  }
  await userSkillRepo().delete({ userId, skillId });
  await recalculateCompletion(userId);
}

async function addPortfolioLink(userId, { platform, url }) {
  const link = await portfolioLinkRepo().save(
    portfolioLinkRepo().create({ userId, platform, url })
  );
  return link;
}

async function removePortfolioLink(userId, linkId) {
  const link = await portfolioLinkRepo().findOne({ where: { id: linkId } });
  if (!link) throw AppError.notFound('Portfolio link not found');
  if (link.userId !== userId) throw AppError.forbidden('Not your portfolio link');
  await portfolioLinkRepo().delete({ id: linkId });
}

async function getStats(userId) {
  const [projectsCreated, projectsJoined, projectsCompleted, ratingStats] = await Promise.all([
    projectRepo().count({ where: { ownerId: userId } }),
    memberRepo().count({ where: { userId } }),
    memberRepo().count({ where: { userId, status: 'completed' } }),
    require('../repositories/ratingRepository').averageForUser(userId),
  ]);

  return {
    projectsCreated,
    projectsJoined,
    projectsCompleted,
    averageRating: ratingStats.average,
    reviewCount: ratingStats.count,
  };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) throw AppError.notFound('User not found');

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) throw AppError.unauthorized('Current password is incorrect');

  const newHash = await hashPassword(newPassword);
  await userRepository.update(userId, { passwordHash: newHash });
}

async function deleteAccount(userId, { password }) {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) throw AppError.notFound('User not found');

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) throw AppError.unauthorized('Password is incorrect');

  // Soft delete: irreversible from the product's point of view, but keeps
  // referential integrity for projects/ratings/portfolio history that other
  // users' records still legitimately point to.
  await userRepository.softDelete(userId);
  await userRepository.update(userId, {
    email: `deleted_${userId}@collabnest.invalid`,
  });
}

function getShareableLink(userId) {
  return `${env.FRONTEND_PUBLIC_PROFILE_BASE_URL}/${userId}`;
}

module.exports = {
  getMe,
  updateMe,
  uploadProfilePicture,
  getPublicProfile,
  addSkill,
  removeSkill,
  addPortfolioLink,
  removePortfolioLink,
  getStats,
  changePassword,
  deleteAccount,
  getShareableLink,
  recalculateCompletion,
};
