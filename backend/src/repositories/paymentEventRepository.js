const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('PaymentEvent');

module.exports = {
  repo,
  // Append-only by convention — this module never exposes an update/delete.
  create: (data) => repo().save(repo().create(data)),
  findByReference: (paystackReference) =>
    repo().find({ where: { paystackReference }, order: { createdAt: 'ASC' } }),
  findByProject: (projectId) =>
    repo().find({ where: { projectId }, order: { createdAt: 'DESC' } }),
  hasSucceeded: async (paystackReference) => {
    const count = await repo().count({
      where: { paystackReference, eventType: 'succeeded' },
    });
    return count > 0;
  },
};
