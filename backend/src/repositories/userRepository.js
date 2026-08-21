const AppDataSource = require('../config/database');

// Thin wrapper around TypeORM's repository for User. Keeping this layer
// means services never call AppDataSource.getRepository directly — if the
// ORM or query strategy changes later, only this file needs to change.
const repo = () => AppDataSource.getRepository('User');

module.exports = {
  repo,
  findById: (id, options = {}) => repo().findOne({ where: { id }, ...options }),
  findByIdWithPassword: (id) =>
    repo()
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne(),
  findByEmail: (email) =>
    repo()
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .andWhere('user.isDeleted = false')
      .getOne(),
  create: (data) => repo().save(repo().create(data)),
  save: (user) => repo().save(user),
  update: (id, data) => repo().update({ id }, data),
  softDelete: (id) => repo().update({ id }, { isDeleted: true }),
};
