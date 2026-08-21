const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('ProjectRole');
const skillJoinRepo = () => AppDataSource.getRepository('ProjectRoleSkill');

module.exports = {
  repo,
  skillJoinRepo,
  findById: (id, relations = []) => repo().findOne({ where: { id }, relations }),
  findByProject: (projectId) =>
    repo().find({ where: { projectId }, relations: ['requiredSkills', 'requiredSkills.skill'] }),
  create: (data) => repo().save(repo().create(data)),
  save: (role) => repo().save(role),
  update: (id, data) => repo().update({ id }, data),
  delete: (id) => repo().delete({ id }),
  countTotalOpenings: async (projectId) => {
    const { sum } = await repo()
      .createQueryBuilder('role')
      .select('COALESCE(SUM(role.openings), 0)', 'sum')
      .where('role.projectId = :projectId', { projectId })
      .getRawOne();
    return parseInt(sum, 10) || 0;
  },
};
