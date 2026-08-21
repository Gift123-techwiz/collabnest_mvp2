const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('Application');

module.exports = {
  repo,
  findById: (id, relations = []) => repo().findOne({ where: { id }, relations }),
  findPendingByApplicantAndRole: (applicantId, roleId) =>
    repo().findOne({ where: { applicantId, roleId, status: 'pending' } }),
  findByProject: (projectId, filters = {}) =>
    repo().find({
      where: { projectId, ...filters },
      relations: ['role'],
      order: { createdAt: 'DESC' },
    }),
  findByApplicant: (applicantId) =>
    repo().find({
      where: { applicantId },
      relations: ['project', 'role'],
      order: { createdAt: 'DESC' },
    }),
  create: (data) => repo().save(repo().create(data)),
  save: (application) => repo().save(application),
};
