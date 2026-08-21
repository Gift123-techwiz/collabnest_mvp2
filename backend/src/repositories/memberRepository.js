const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('ProjectMember');

module.exports = {
  repo,
  findById: (id, relations = []) => repo().findOne({ where: { id }, relations }),
  findByProject: (projectId, filters = {}) =>
    repo().find({ where: { projectId, ...filters }, relations: ['user', 'role'] }),
  findActiveByUser: (userId) => repo().findOne({ where: { userId, status: 'active' } }),
  create: (data) => repo().save(repo().create(data)),
  save: (member) => repo().save(member),
  update: (id, data) => repo().update({ id }, data),
};
