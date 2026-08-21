const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('Project');

module.exports = {
  repo,
  findById: (id, relations = []) => repo().findOne({ where: { id }, relations }),
  create: (data) => repo().save(repo().create(data)),
  save: (project) => repo().save(project),
  update: (id, data) => repo().update({ id }, data),
  delete: (id) => repo().delete({ id }),
  incrementApplicantCount: (id) =>
    repo().increment({ id }, 'applicantCount', 1),
  queryBuilder: (alias = 'project') => repo().createQueryBuilder(alias),
};
