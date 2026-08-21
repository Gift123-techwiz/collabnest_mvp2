const AppDataSource = require('../config/database');
const projectRepository = require('../repositories/projectRepository');
const AppError = require('../utils/AppError');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');
const notificationService = require('./notificationService');
const subscriptionService = require('./subscriptionService');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const techJoinRepo = () => AppDataSource.getRepository('ProjectTechnology');
const memberRepo = () => AppDataSource.getRepository('ProjectMember');

async function createProject(ownerId, payload) {
  const project = await projectRepository.create({
    ownerId,
    title: payload.title.trim(),
    description: payload.description,
    problemStatement: payload.problemStatement || null,
    categoryId: payload.categoryId || null,
    country: payload.country || null,
    expectedDuration: payload.expectedDuration || null,
    status: 'draft',
  });

  if (Array.isArray(payload.technologySkillIds) && payload.technologySkillIds.length > 0) {
    await techJoinRepo().save(
      payload.technologySkillIds.map((skillId) =>
        techJoinRepo().create({ projectId: project.id, skillId })
      )
    );
  }

  // Every project starts on the Free plan (Months 1-2, 0 naira) the moment
  // it's created — see subscriptionService for the full plan lifecycle.
  await subscriptionService.initializeFreePlan(project);

  return getProjectDetail(project.id);
}

async function getProjectDetail(id, viewerId = null) {
  let project = await projectRepository.findById(id, [
    'owner',
    'category',
    'roles',
    'roles.requiredSkills',
    'roles.requiredSkills.skill',
    'technologies',
    'technologies.skill',
  ]);
  if (!project) throw AppError.notFound('Project not found');

  // Lazily flip to 'payment_required' if the subscription has lapsed since
  // the last time anyone looked at this project — see subscriptionService.
  project = await subscriptionService.lazyRefreshAccess(project);

  const rolesWithRemaining = (project.roles || []).map((role) => ({
    ...role,
    remainingOpenings: Math.max(0, role.openings - role.filledCount),
    requiredSkills: (role.requiredSkills || []).map((rs) => rs.skill),
  }));

  const isOwner = viewerId && project.ownerId === viewerId;

  return {
    ...project,
    owner: project.owner
      ? {
          id: project.owner.id,
          fullName: project.owner.fullName,
          profilePictureUrl: project.owner.profilePictureUrl,
        }
      : null,
    roles: rolesWithRemaining,
    technologies: (project.technologies || []).map((t) => t.skill),
    // Billing/plan internals are only meaningful to the owner — hidden
    // from every other viewer of an otherwise-public project page.
    ...(isOwner
      ? {}
      : {
          currentPlan: undefined,
          freePlanUsed: undefined,
          freeExtensionUsed: undefined,
          subscriptionExpiresAt: undefined,
          statusBeforeLock: undefined,
        }),
  };
}

async function searchProjects(query) {
  const { page, pageSize, skip, take } = parsePagination(query);

  // Step 1: find the correct PAGE of distinct project IDs first. Joining
  // one-to-many relations (roles, technologies) and then applying
  // skip/take directly on that joined query is a well-known TypeORM
  // footgun — a project with 3 roles produces 3 joined rows, so
  // LIMIT/OFFSET slices through duplicated rows instead of distinct
  // projects, corrupting pagination. Selecting only distinct IDs first
  // avoids that entirely; the joins below still work fine for filtering.
  const idQb = projectRepository
    .queryBuilder('project')
    .leftJoin('project.category', 'category')
    .leftJoin('project.technologies', 'projectTech')
    .leftJoin('projectTech.skill', 'techSkill')
    .where('project.status = :status', { status: 'recruiting' });

  if (query.categoryId) {
    idQb.andWhere('project.categoryId = :categoryId', { categoryId: query.categoryId });
  }
  if (query.country) {
    idQb.andWhere('project.country = :country', { country: query.country });
  }
  if (query.technologyIds) {
    const ids = Array.isArray(query.technologyIds) ? query.technologyIds : [query.technologyIds];
    idQb.andWhere('techSkill.id IN (:...techIds)', { techIds: ids });
  }
  if (query.skillIds) {
    const ids = Array.isArray(query.skillIds) ? query.skillIds : [query.skillIds];
    idQb.andWhere(
      `project.id IN (
        SELECT pr.project_id FROM project_role_skills prsk
        INNER JOIN project_roles pr ON pr.id = prsk.role_id
        WHERE prsk.skill_id IN (:...skillIds)
      )`,
      { skillIds: ids }
    );
  }

  let matchedOn = null;
  if (query.q) {
    const q = `%${query.q}%`;
    idQb.andWhere(
      '(project.title ILIKE :q OR project.description ILIKE :q OR category.name ILIKE :q OR techSkill.name ILIKE :q)',
      { q }
    );
    matchedOn = 'title,description,category,technology';
  }

  const total = await idQb.clone().select('project.id').distinct(true).getCount();
  const idRows = await idQb
    .select('project.id', 'id')
    .addSelect('project.createdAt', 'createdAt')
    .distinct(true)
    .orderBy('project.createdAt', 'DESC')
    .skip(skip)
    .take(take)
    .getRawMany();
  const pageIds = idRows.map((row) => row.id);

  if (pageIds.length === 0) {
    return buildPaginatedResponse([], total, page, pageSize);
  }

  // Step 2: now that we have the exact right IDs for this page, fetch the
  // full entities with every relation — no pagination here, so the joins
  // are safe and every project comes back complete.
  const projects = await projectRepository
    .queryBuilder('project')
    .leftJoinAndSelect('project.owner', 'owner')
    .leftJoinAndSelect('project.category', 'category')
    .leftJoinAndSelect('project.roles', 'role')
    .leftJoinAndSelect('project.technologies', 'projectTech')
    .leftJoinAndSelect('projectTech.skill', 'techSkill')
    .whereInIds(pageIds)
    .getMany();

  // whereInIds doesn't preserve order, so re-sort to match the page order
  // we already determined above.
  const byId = new Map(projects.map((p) => [p.id, p]));
  const orderedProjects = pageIds.map((id) => byId.get(id)).filter(Boolean);

  const items = orderedProjects.map((project) => ({
    ...project,
    // Never expose the full owner entity (email/phone/DOB) to other users —
    // same public-safe subset as getProjectDetail below.
    owner: project.owner
      ? {
          id: project.owner.id,
          fullName: project.owner.fullName,
          profilePictureUrl: project.owner.profilePictureUrl,
        }
      : null,
    ...(matchedOn ? { matchedOn } : {}),
    roles: (project.roles || []).map((role) => ({
      ...role,
      remainingOpenings: Math.max(0, role.openings - role.filledCount),
    })),
    technologies: (project.technologies || []).map((t) => t.skill),
  }));

  return buildPaginatedResponse(items, total, page, pageSize);
}

async function assertOwner(projectId, userId, { allowLocked = false } = {}) {
  let project = await projectRepository.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== userId) throw AppError.forbidden('Only the project owner can do this');

  project = await subscriptionService.lazyRefreshAccess(project);
  if (!allowLocked) subscriptionService.assertAccessible(project);

  return project;
}

async function updateProject(projectId, userId, updates) {
  await assertOwner(projectId, userId);
  const allowed = [
    'title',
    'description',
    'problemStatement',
    'categoryId',
    'country',
    'expectedDuration',
  ];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }
  await projectRepository.update(projectId, payload);
  return getProjectDetail(projectId);
}

async function deleteProject(projectId, userId) {
  await assertOwner(projectId, userId);
  const activeMembers = await memberRepo().count({ where: { projectId, status: 'active' } });
  if (activeMembers > 0) {
    throw AppError.conflict('Project has active members — archive it instead of deleting');
  }
  await projectRepository.delete(projectId);
}

function assertTransition(current, allowedFrom, action) {
  if (!allowedFrom.includes(current)) {
    throw AppError.conflict(`Cannot ${action} a project with status '${current}'`);
  }
}

async function pauseProject(projectId, userId) {
  const project = await assertOwner(projectId, userId);
  assertTransition(project.status, ['recruiting'], 'pause');
  await projectRepository.update(projectId, { status: 'paused' });
  return getProjectDetail(projectId);
}

async function resumeProject(projectId, userId) {
  const project = await assertOwner(projectId, userId);
  assertTransition(project.status, ['paused'], 'resume');
  await projectRepository.update(projectId, { status: 'recruiting' });
  return getProjectDetail(projectId);
}

async function closeRecruitment(projectId, userId) {
  const project = await assertOwner(projectId, userId);
  assertTransition(project.status, ['recruiting', 'paused'], 'close recruitment on');
  await projectRepository.update(projectId, { status: 'in_progress' });
  return getProjectDetail(projectId);
}

async function reopenRecruitment(projectId, userId) {
  const project = await assertOwner(projectId, userId);
  assertTransition(project.status, ['in_progress'], 'reopen recruitment on');
  await projectRepository.update(projectId, { status: 'recruiting' });
  return getProjectDetail(projectId);
}

async function archiveProject(projectId, userId) {
  // Archiving is allowed even on a locked (payment_required) project — an
  // owner who doesn't want to pay again should still be able to close the
  // book on it rather than being stuck.
  const project = await assertOwner(projectId, userId, { allowLocked: true });
  assertTransition(
    project.status,
    ['recruiting', 'paused', 'in_progress', 'completed', 'payment_required'],
    'archive'
  );
  await projectRepository.update(projectId, { status: 'archived' });
  return getProjectDetail(projectId);
}

async function completeProject(projectId, userId) {
  const project = await assertOwner(projectId, userId);
  if (project.status === 'completed' || project.status === 'archived') {
    throw AppError.conflict('Project is already completed or archived');
  }

  const members = await AppDataSource.getRepository('ProjectMember').find({
    where: { projectId, status: 'active' },
  });

  await AppDataSource.transaction(async (manager) => {
    await manager.getRepository('Project').update({ id: projectId }, { status: 'completed' });

    for (const member of members) {
      await manager
        .getRepository('ProjectMember')
        .update({ id: member.id }, { status: 'completed' });
      await manager
        .getRepository('User')
        .update({ id: member.userId, activeProjectId: projectId }, { activeProjectId: null });
    }
  });

  // Fire rating-request + project-completed notifications to every member
  // immediately — satisfies the "prompt within 24h" rule without a
  // scheduled job.
  for (const member of members) {
    await notificationService.notify({
      userId: member.userId,
      type: NOTIFICATION_TYPES.PROJECT_COMPLETED,
      title: 'Project marked complete',
      message: `"${project.title}" has been marked complete by the project owner.`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
    });
    await notificationService.notify({
      userId: member.userId,
      type: NOTIFICATION_TYPES.RATING_REQUEST,
      title: 'Rate your teammates',
      message: `"${project.title}" is complete — rate your teammates while it's fresh.`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
    });
  }

  return getProjectDetail(projectId);
}

module.exports = {
  createProject,
  getProjectDetail,
  searchProjects,
  updateProject,
  deleteProject,
  pauseProject,
  resumeProject,
  closeRecruitment,
  reopenRecruitment,
  archiveProject,
  completeProject,
  assertOwner,
};
