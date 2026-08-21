const AppDataSource = require('../config/database');

const skillRepo = () => AppDataSource.getRepository('Skill');
const categoryRepo = () => AppDataSource.getRepository('Category');

async function listSkills(query) {
  if (query) {
    return skillRepo()
      .createQueryBuilder('skill')
      .where('LOWER(skill.name) LIKE LOWER(:q)', { q: `%${query}%` })
      .orderBy('skill.name', 'ASC')
      .getMany();
  }
  return skillRepo().find({ order: { name: 'ASC' } });
}

async function listCategories() {
  return categoryRepo().find({ order: { name: 'ASC' } });
}

module.exports = { listSkills, listCategories };
