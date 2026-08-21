const AppDataSource = require('../config/database');
const memberRepository = require('../repositories/memberRepository');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');
const subscriptionService = require('./subscriptionService');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const roleRepo = () => AppDataSource.getRepository('ProjectRole');
const projectRepo = () => AppDataSource.getRepository('Project');

// Only public-safe fields — never the full User entity (email, phone, DOB)
// — even to teammates on the same project.
function sanitizeMember(member) {
  return {
    id: member.id,
    projectId: member.projectId,
    roleId: member.roleId,
    userId: member.userId,
    status: member.status,
    workspaceLink: member.workspaceLink,
    workspaceLinkUpdatedAt: member.workspaceLinkUpdatedAt,
    joinedAt: member.joinedAt,
    user: member.user
      ? {
          id: member.user.id,
          fullName: member.user.fullName,
          profilePictureUrl: member.user.profilePictureUrl,
        }
      : null,
    role: member.role ? { id: member.role.id, name: member.role.name } : null,
  };
}

// Restricted to the project owner or an active member of that same
// project — teammate contact/workspace info shouldn't be visible to
// unrelated logged-in users just because they know a project ID.
async function listMembers(projectId, viewerId) {
  const project = await projectRepo().findOne({ where: { id: projectId } });
  if (!project) throw AppError.notFound('Project not found');

  const isOwner = project.ownerId === viewerId;
  if (!isOwner) {
    const viewerMembership = await AppDataSource.getRepository('ProjectMember').findOne({
      where: { projectId, userId: viewerId, status: 'active' },
    });
    if (!viewerMembership) {
      throw AppError.forbidden('Only the project owner or an active member can view the team');
    }
  }

  const members = await memberRepository.findByProject(projectId, { status: 'active' });
  return members.map(sanitizeMember);
}

// Member leaves a project at any time. Reopens the role, clears
// active_project_id, notifies the owner, and — per the client's addition —
// records deliverable links so the member's portfolio isn't unfairly
// tarnished if the rest of the team stalls afterward.
async function leave(membershipId, userId, { exitReason, completedTasksBeforeLeaving, deliverableLinks }) {
  const member = await memberRepository.findById(membershipId, ['project', 'role', 'user']);
  if (!member) throw AppError.notFound('Membership not found');
  if (member.userId !== userId) throw AppError.forbidden('Only the member themself can do this');
  if (member.status !== 'active') throw AppError.conflict('This membership is not active');

  const project = await projectRepo().findOne({ where: { id: member.projectId } });
  const role = await roleRepo().findOne({ where: { id: member.roleId } });

  await AppDataSource.transaction(async (manager) => {
    await manager.getRepository('ProjectMember').update(
      { id: membershipId },
      {
        status: 'left',
        leftAt: new Date(),
        exitReason,
        completedTasksBeforeLeaving: completedTasksBeforeLeaving ?? null,
        deliverableLinks:
          Array.isArray(deliverableLinks) && deliverableLinks.length > 0 ? deliverableLinks : null,
      }
    );

    if (role) {
      const newFilledCount = Math.max(0, role.filledCount - 1);
      await manager.getRepository('ProjectRole').update(
        { id: role.id },
        { filledCount: newFilledCount, status: 'open' }
      );
    }

    await manager
      .getRepository('User')
      .update({ id: userId, activeProjectId: member.projectId }, { activeProjectId: null });
  });

  if (project) {
    await notificationService.notify({
      userId: project.ownerId,
      type: NOTIFICATION_TYPES.MEMBER_LEFT,
      title: 'A teammate left the project',
      message: `A member left "${project.title}"${role ? ` (role: ${role.name})` : ''}. The role has reopened for new applicants.`,
      relatedEntityType: 'project',
      relatedEntityId: member.projectId,
    });
    await notificationService.notify({
      userId: project.ownerId,
      type: NOTIFICATION_TYPES.ROLE_REOPENED,
      title: 'Role reopened',
      message: role
        ? `The role "${role.name}" on "${project.title}" is open again and visible in Discovery.`
        : `A role on "${project.title}" is open again.`,
      relatedEntityType: 'project',
      relatedEntityId: member.projectId,
    });
  }

  return sanitizeMember(await memberRepository.findById(membershipId, ['user', 'role']));
}

// Owner can set or update the workspace link at any time after acceptance —
// never required. Notifies the member every time it's added/changed.
async function setWorkspaceLink(membershipId, ownerId, workspaceLink) {
  const member = await memberRepository.findById(membershipId);
  if (!member) throw AppError.notFound('Membership not found');

  let project = await projectRepo().findOne({ where: { id: member.projectId } });
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== ownerId) throw AppError.forbidden('Only the project owner can do this');
  project = await subscriptionService.lazyRefreshAccess(project);
  subscriptionService.assertAccessible(project);

  const normalizedLink = workspaceLink && workspaceLink.trim().length > 0 ? workspaceLink.trim() : null;

  await memberRepository.update(membershipId, {
    workspaceLink: normalizedLink,
    workspaceLinkUpdatedAt: new Date(),
  });

  if (normalizedLink) {
    await notificationService.notify({
      userId: member.userId,
      type: NOTIFICATION_TYPES.WORKSPACE_LINK_SHARED,
      title: 'Team workspace link updated',
      message: `The project owner shared/updated the workspace link for "${project.title}": ${normalizedLink}`,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
    });
  }

  return sanitizeMember(await memberRepository.findById(membershipId, ['user', 'role']));
}

module.exports = { listMembers, leave, setWorkspaceLink };
