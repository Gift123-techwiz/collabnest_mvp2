require('reflect-metadata');
const AppDataSource = require('../config/database');
const { seedSkills } = require('./skillsSeeder');
const { seedCategories } = require('./categoriesSeeder');

async function run() {
  await AppDataSource.initialize();
  // eslint-disable-next-line no-console
  console.log('[seed] Data source initialized — seeding taxonomy tables...');

  await seedSkills(AppDataSource);
  await seedCategories(AppDataSource);

  // eslint-disable-next-line no-console
  console.log('[seed] Done.');
  await AppDataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Failed:', err);
  process.exit(1);
});
