const AppDataSource = require('../config/database');
const ratingRepository = require('../repositories/ratingRepository');

const memberRepo = () => AppDataSource.getRepository('ProjectMember');

// Personal Analytics — same aggregation family as GET /api/users/me/stats,
// exposed as its own endpoint per the spec (Module 12).
async function getPersonalAnalytics(userId) {
  const [projectsCompleted, ratingStats] = await Promise.all([
    memberRepo().count({ where: { userId, status: 'completed' } }),
    ratingRepository.averageForUser(userId),
  ]);

  return {
    projectsCompleted,
    averageRating: ratingStats.average,
    reviewsReceived: ratingStats.count,
  };
}

module.exports = { getPersonalAnalytics };
