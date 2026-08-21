const AppDataSource = require('../config/database');

const projectRepo = () => AppDataSource.getRepository('Project');
const applicationRepo = () => AppDataSource.getRepository('Application');
const memberRepo = () => AppDataSource.getRepository('ProjectMember');
const notificationRepo = () => AppDataSource.getRepository('Notification');

// Shapes a raw Project row into the summary card fields the frontend
// dashboard/list screens need (team size, open roles, tag names) without
// making the client fan out N follow-up requests per project.
async function summarizeProject(project) {
  const [teamCount, openRolesAgg] = await Promise.all([
    memberRepo().count({ where: { projectId: project.id, status: 'active' } }),
    AppDataSource.getRepository('ProjectRole')
      .createQueryBuilder('role')
      .select('COALESCE(SUM(role.openings - role.filledCount), 0)', 'remaining')
      .where('role.projectId = :projectId', { projectId: project.id })
      .andWhere("role.status != 'closed'")
      .getRawOne(),
  ]);

  return {
    id: project.id,
    title: project.title,
    status: project.status,
    currentPlan: project.currentPlan,
    category: project.category ? { id: project.category.id, name: project.category.name } : null,
    technologies: (project.technologies || []).map((t) => t.skill?.name).filter(Boolean),
    teamCount: teamCount + 1, // +1 for the owner
    openRoles: Math.max(0, parseInt(openRolesAgg?.remaining, 10) || 0),
    createdAt: project.createdAt,
  };
}

// Single call backing the Dashboard Overview — everything the screen needs
// in one round trip, per the spec ("loads within 2 seconds").
async function getOverview(userId) {
  const [
    projectsCreated,
    pendingApplicationsSent,
    applicationsReceivedCount,
    unreadNotificationCount,
    ownedProjects,
    activeMemberships,
  ] = await Promise.all([
    projectRepo().count({ where: { ownerId: userId } }),
    applicationRepo().count({ where: { applicantId: userId, status: 'pending' } }),
    applicationRepo()
      .createQueryBuilder('application')
      .innerJoin('application.project', 'project')
      .where('project.ownerId = :userId', { userId })
      .andWhere('application.status = :status', { status: 'pending' })
      .getCount(),
    notificationRepo().count({ where: { userId, isRead: false } }),
    projectRepo().find({
      where: { ownerId: userId },
      relations: ['category', 'technologies', 'technologies.skill'],
      order: { createdAt: 'DESC' },
    }),
    memberRepo().find({
      where: { userId },
      relations: ['project', 'project.category', 'project.technologies', 'project.technologies.skill'],
      order: { createdAt: 'DESC' },
    }),
  ]);

  const activeRaw = [
    ...ownedProjects.filter((p) => ['recruiting', 'paused', 'in_progress', 'draft', 'payment_required'].includes(p.status)),
    ...activeMemberships.filter((m) => m.status === 'active' && m.project).map((m) => m.project),
  ];
  const completedRaw = [
    ...ownedProjects.filter((p) => p.status === 'completed'),
    ...activeMemberships
      .filter((m) => m.status === 'completed' && m.project)
      .map((m) => m.project),
  ];

  const activeProjects = await Promise.all(dedupeById(activeRaw).map(summarizeProject));
  const completedProjects = await Promise.all(dedupeById(completedRaw).map(summarizeProject));

  // Split out for the two separate Dashboard tabs ("My Projects" vs
  // "Joined Projects") — activeProjects above stays as the combined list
  // for anything that doesn't need the distinction.
  const myProjects = await Promise.all(ownedProjects.map(summarizeProject));
  const joinedProjects = await Promise.all(
    activeMemberships
      .filter((m) => m.project)
      .map((m) => summarizeProject(m.project).then((p) => ({ ...p, membershipStatus: m.status })))
  );

  const projectsJoined = activeMemberships.length;

  return {
    projectsCreated,
    projectsJoined,
    pendingApplicationsSent,
    applicationsReceived: applicationsReceivedCount,
    activeProjects,
    completedProjects,
    myProjects,
    joinedProjects,
    unreadNotificationCount,
  };
}

function dedupeById(list) {
  const map = new Map();
  for (const item of list) {
    if (item && item.id && !map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values());
}

module.exports = { getOverview, summarizeProject };
