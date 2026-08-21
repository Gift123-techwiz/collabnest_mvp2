// Seed data for the Skills taxonomy — read-only via GET /api/skills, used
// for the multi-select UI on profiles, project technologies, and role
// required-skills.
const SKILLS = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby',
  'Swift', 'Kotlin', 'Dart',
  // Frontend
  'React', 'Vue.js', 'Angular', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS', 'Redux',
  // Backend
  'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'Laravel', 'Spring Boot', 'Ruby on Rails',
  // Mobile
  'React Native', 'Flutter', 'Android (Native)', 'iOS (Native)',
  // Data / Infra
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'GraphQL', 'REST APIs', 'CI/CD',
  // Data / AI
  'Machine Learning', 'Data Analysis', 'Data Engineering', 'SQL', 'Pandas', 'TensorFlow',
  'PyTorch',
  // Design
  'UI Design', 'UX Design', 'UX Research', 'Figma', 'Adobe XD', 'Illustrator', 'Photoshop',
  'Brand Design', 'Motion Design',
  // Product / Soft
  'Product Management', 'Project Management', 'Technical Writing', 'QA / Testing',
  'DevOps', 'Blockchain / Web3', 'Cybersecurity',
];

async function seedSkills(dataSource) {
  const repo = dataSource.getRepository('Skill');
  let created = 0;
  for (const name of SKILLS) {
    const existing = await repo.findOne({ where: { name } });
    if (!existing) {
      await repo.save(repo.create({ name }));
      created += 1;
    }
  }
  // eslint-disable-next-line no-console
  console.log(`[seed:skills] ${created} new skill(s) inserted (${SKILLS.length} total in list)`);
}

module.exports = { seedSkills, SKILLS };
