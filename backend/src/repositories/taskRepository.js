const AppDataSource = require('../config/database');

const repo = () => AppDataSource.getRepository('Task');

module.exports = {
  repo,
  findById: (id, relations = []) => repo().findOne({ where: { id }, relations }),
  findByRole: (roleId) => repo().find({ where: { roleId }, order: { createdAt: 'ASC' } }),
  findByProject: (projectId) =>
    repo()
      .createQueryBuilder('task')
      .innerJoinAndSelect('task.role', 'role')
      .leftJoinAndSelect('task.assignedMember', 'assignedMember')
      .leftJoinAndSelect('assignedMember.user', 'assignedUser')
      .where('role.projectId = :projectId', { projectId })
      .orderBy('task.createdAt', 'ASC')
      .getMany(),
  create: (data) => repo().save(repo().create(data)),
  save: (task) => repo().save(task),
  update: (id, data) => repo().update({ id }, data),
};
