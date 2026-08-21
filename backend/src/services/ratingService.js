const AppDataSource = require('../config/database');
const ratingRepository = require('../repositories/ratingRepository');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const projectRepo = () => AppDataSource.getRepository('Project');
const memberRepo = () => AppDataSource.getRepository('ProjectMember');

async function createRating(projectId, raterId, { rateeId, stars, feedback }) {
  if (rateeId === raterId) throw AppError.unprocessable('You cannot rate yourself');

  const project = await projectRepo().findOne({ where: { id: projectId } });
  if (!project) throw AppError.notFound('Project not found');
  if (project.status !== 'completed') {
    throw AppError.forbidden('You can only rate teammates on a completed project');
  }

  const raterMembership = await memberRepo().findOne({ where: { projectId, userId: raterId } });
  if (!raterMembership) throw AppError.forbidden('You were not part of this project');

  const rateeMembership = await memberRepo().findOne({ where: { projectId, userId: rateeId } });
  if (!rateeMembership) throw AppError.unprocessable('This person was not part of this project');

  const existing = await ratingRepository.findExisting(projectId, raterId, rateeId);
  if (existing) throw AppError.conflict('You already rated this person for this project');

  const rating = await ratingRepository.create({
    projectId,
    raterId,
    rateeId,
    stars,
    feedback: feedback || null,
  });

  await notificationService.notify({
    userId: rateeId,
    type: NOTIFICATION_TYPES.RATING_RECEIVED,
    title: 'You received a new rating',
    message: `A teammate from "${project.title}" left you a ${stars}-star rating.`,
    relatedEntityType: 'project',
    relatedEntityId: projectId,
  });

  return rating;
}

async function listForUser(userId) {
  return ratingRepository.findByRatee(userId);
}

module.exports = { createRating, listForUser };
