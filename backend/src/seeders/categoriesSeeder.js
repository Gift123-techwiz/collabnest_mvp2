// Seed data for the fixed Project Category taxonomy — read-only via
// GET /api/categories, used for project creation and Discovery filter
// bubbles ("Type of Project Filter Bubbles", Module 6).
const CATEGORIES = [
  'Software Development',
  'Web Development',
  'Mobile App Development',
  'AI / Machine Learning',
  'Data Science',
  'Brand Design',
  'UI/UX Design',
  'Product Management',
  'Marketing',
  'Content & Writing',
  'Blockchain / Web3',
  'Game Development',
  'DevOps / Infrastructure',
  'Other',
];

async function seedCategories(dataSource) {
  const repo = dataSource.getRepository('Category');
  let created = 0;
  for (const name of CATEGORIES) {
    const existing = await repo.findOne({ where: { name } });
    if (!existing) {
      await repo.save(repo.create({ name }));
      created += 1;
    }
  }
  // eslint-disable-next-line no-console
  console.log(
    `[seed:categories] ${created} new categor${created === 1 ? 'y' : 'ies'} inserted (${CATEGORIES.length} total in list)`
  );
}

module.exports = { seedCategories, CATEGORIES };
