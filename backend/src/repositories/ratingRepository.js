const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('Rating');

module.exports = {
  repo,
  findExisting: (projectId, raterId, rateeId) =>
    repo().findOne({ where: { projectId, raterId, rateeId } }),
  findByRatee: (rateeId) =>
    repo().find({ where: { rateeId }, relations: ['rater', 'project'], order: { createdAt: 'DESC' } }),
  create: (data) => repo().save(repo().create(data)),
  averageForUser: async (userId) => {
    const { avg, count } = await repo()
      .createQueryBuilder('rating')
      .select('AVG(rating.stars)', 'avg')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.rateeId = :userId', { userId })
      .getRawOne();
    return { average: avg ? parseFloat(parseFloat(avg).toFixed(2)) : null, count: parseInt(count, 10) || 0 };
  },
};
