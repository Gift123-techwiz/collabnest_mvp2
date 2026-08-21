const AppDataSource = require('../config/database');
const roleRepository = require('../repositories/roleRepository');
const projectRepository = require('../repositories/projectRepository');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');
const subscriptionService = require('./subscriptionService');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const memberRepo = () => AppDataSource.getRepository('ProjectMember');

async function assertProjectOwner(projectId, userId) {
  let project = await projectRepository.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== userId) throw AppError.forbidden('Only the project owner can do this');

  project = await subscriptionService.lazyRefreshAccess(project);
  subscriptionService.assertAccessible(project);

  return project;
}

// NOTE: the team-size cap (Free=4, Standard=6, Advanced=12, owner
// included) is enforced at the moment a seat is actually filled — i.e. in
// applicationService.accept — not here. An owner can post more openings
// than the current cap (e.g. planning ahead of an upgrade); they just
// can't fill past the cap without subscribing to a bigger plan.
async function createRole(projectId, userId, payload) {
  const project = await assertProjectOwner(projectId, userId);
  if (['completed', 'archived'].includes(project.status)) {
    throw AppError.conflict('Cannot add roles to a completed or archived project');
  }

  const role = await roleRepository.create({
    projectId,
    name: payload.name.trim(),
    description: payload.description || null,
    openings: payload.openings || 1,
    status: 'open',
  });

  if (Array.isArray(payload.requiredSkillIds) && payload.requiredSkillIds.length > 0) {
    await roleRepository
      .skillJoinRepo()
      .save(
        payload.requiredSkillIds.map((skillId) =>
          roleRepository.skillJoinRepo().create({ roleId: role.id, skillId })
        )
      );
  }

  // A project cannot "publish" (become discoverable) with zero roles. Since
  // the API has no separate publish endpoint, the first role added to a
  // draft project transitions it straight to 'recruiting'.
  if (project.status === 'draft') {
    await projectRepository.update(projectId, { status: 'recruiting' });
  }

  return roleRepository.findById(role.id, ['requiredSkills', 'requiredSkills.skill']);
}

async function updateRole(projectId, roleId, userId, updates) {
  await assertProjectOwner(projectId, userId);
  const role = await roleRepository.findById(roleId);
  if (!role) throw AppError.notFound('Role not found');
  if (role.projectId !== projectId) throw AppError.notFound('Role not found on this project');

  if (updates.openings !== undefined && updates.openings < role.filledCount) {
    throw AppError.unprocessable('openings cannot be less than the current filled_count');
  }

  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.openings !== undefined) payload.openings = updates.openings;

  await roleRepository.update(roleId, payload);

  if (Array.isArray(updates.requiredSkillIds)) {
    await roleRepository.skillJoinRepo().delete({ roleId });
    if (updates.requiredSkillIds.length > 0) {
      await roleRepository
        .skillJoinRepo()
        .save(
          updates.requiredSkillIds.map((skillId) =>
            roleRepository.skillJoinRepo().create({ roleId, skillId })
          )
        );
    }
  }

  return roleRepository.findById(roleId, ['requiredSkills', 'requiredSkills.skill']);
}

async function deleteRole(projectId, roleId, userId, confirm) {
  const project = await assertProjectOwner(projectId, userId);
  const role = await roleRepository.findById(roleId);
  if (!role || role.projectId !== projectId) throw AppError.notFound('Role not found');

  const activeMembers = await memberRepo().find({ where: { roleId, status: 'active' } });

  if (activeMembers.length > 0 && confirm !== true) {
    return {
      requiresConfirmation: true,
      message: 'This role has an active member. Pass ?confirm=true to remove them and delete the role.',
      activeMemberCount: activeMembers.length,
    };
  }

  if (activeMembers.length > 0) {
    for (const member of activeMembers) {
      await memberRepo().update(
        { id: member.id },
        { status: 'left', leftAt: new Date(), exitReason: 'Role removed by project owner' }
      );
      await AppDataSource.getRepository('User').update(
        { id: member.userId, activeProjectId: projectId },
        { activeProjectId: null }
      );
      await notificationService.notify({
        userId: member.userId,
        type: NOTIFICATION_TYPES.MEMBER_LEFT,
        title: 'You were removed from a role',
        message: `The role "${role.name}" on "${project.title}" was deleted by the project owner.`,
        relatedEntityType: 'project',
        relatedEntityId: projectId,
      });
    }
  }

  await roleRepository.delete(roleId);
  return { requiresConfirmation: false, deleted: true };
}

module.exports = { createRole, updateRole, deleteRole, assertProjectOwner };
