const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('ProjectSubscription');

module.exports = {
  repo,
  create: (data) => repo().save(repo().create(data)),
  findByProject: (projectId) =>
    repo().find({ where: { projectId }, order: { createdAt: 'DESC' } }),
  findLatestActive: (projectId) =>
    repo().findOne({ where: { projectId, status: 'active' }, order: { createdAt: 'DESC' } }),
  findByReference: (paystackReference) => repo().findOne({ where: { paystackReference } }),
  update: (id, data) => repo().update({ id }, data),
};
