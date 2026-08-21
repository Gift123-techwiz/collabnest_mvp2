const AppDataSource = require('../config/database');
const taskRepository = require('../repositories/taskRepository');
const roleRepository = require('../repositories/roleRepository');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');
const subscriptionService = require('./subscriptionService');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const projectRepo = () => AppDataSource.getRepository('Project');
const memberRepo = () => AppDataSource.getRepository('ProjectMember');

async function assertProjectOwner(projectId, userId) {
  let project = await projectRepo().findOne({ where: { id: projectId } });
  if (!project) throw AppError.notFound('Project not found');
  if (project.ownerId !== userId) throw AppError.forbidden('Only the project owner can do this');

  project = await subscriptionService.lazyRefreshAccess(project);
  subscriptionService.assertAccessible(project);

  return project;
}

async function assertOwnerOrMember(projectId, userId) {
  let project = await projectRepo().findOne({ where: { id: projectId } });
  if (!project) throw AppError.notFound('Project not found');

  project = await subscriptionService.lazyRefreshAccess(project);
  subscriptionService.assertAccessible(project);

  if (project.ownerId === userId) return project;
  const member = await memberRepo().findOne({ where: { projectId, userId, status: 'active' } });
  if (!member) throw AppError.forbidden('You are not part of this project');
  return project;
}

// Owner defines tasks for a role. The role's active member (if any) is
// auto-assigned; if the role isn't filled yet, the task sits unassigned
// until someone joins — see taskController for the assignment-on-accept
// hook wired from applicationService.
async function createTask(projectId, roleId, ownerId, payload) {
  await assertProjectOwner(projectId, ownerId);
  const role = await roleRepository.findById(roleId);
  if (!role || role.projectId !== projectId) throw AppError.notFound('Role not found');

  const activeMember = await memberRepo().findOne({ where: { roleId, status: 'active' } });

  const task = await taskRepository.create({
    roleId,
    assignedMemberId: activeMember ? activeMember.id : null,
    title: payload.title.trim(),
    description: payload.description || null,
    status: 'assigned',
  });

  return task;
}

async function updateTask(taskId, ownerId, updates) {
  const task = await taskRepository.findById(taskId, ['role']);
  if (!task) throw AppError.notFound('Task not found');
  await assertProjectOwner(task.role.projectId, ownerId);

  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  await taskRepository.update(taskId, payload);
  return taskRepository.findById(taskId);
}

async function listByProject(projectId, userId) {
  await assertOwnerOrMember(projectId, userId);
  return taskRepository.findByProject(projectId);
}

async function submit(taskId, userId) {
  const task = await taskRepository.findById(taskId, ['assignedMember']);
  if (!task) throw AppError.notFound('Task not found');
  if (!task.assignedMember || task.assignedMember.userId !== userId) {
    throw AppError.forbidden('Only the assigned member can submit this task');
  }
  if (task.status !== 'assigned' && task.status !== 'rejected') {
    throw AppError.conflict("Task is not in an 'assigned' state");
  }

  const role = await AppDataSource.getRepository('ProjectRole').findOne({ where: { id: task.roleId } });
  let project = await projectRepo().findOne({ where: { id: role.projectId } });
  project = await subscriptionService.lazyRefreshAccess(project);
  subscriptionService.assertAccessible(project);

  await taskRepository.update(taskId, { status: 'submitted', submittedAt: new Date() });
  await notificationService.notify({
    userId: project.ownerId,
    type: NOTIFICATION_TYPES.TASK_SUBMITTED,
    title: 'Task submitted for review',
    message: `A task ("${task.title}") was submitted for review on "${project.title}".`,
    relatedEntityType: 'task',
    relatedEntityId: taskId,
  });

  return taskRepository.findById(taskId);
}

async function approve(taskId, ownerId) {
  const task = await taskRepository.findById(taskId, ['role', 'assignedMember']);
  if (!task) throw AppError.notFound('Task not found');
  await assertProjectOwner(task.role.projectId, ownerId);

  if (task.status !== 'submitted') {
    throw AppError.conflict("Task must be 'submitted' to approve, or is already approved");
  }

  await taskRepository.update(taskId, {
    status: 'approved',
    reviewedAt: new Date(),
    reviewedBy: ownerId,
  });

  if (task.assignedMember) {
    await notificationService.notify({
      userId: task.assignedMember.userId,
      type: NOTIFICATION_TYPES.TASK_APPROVED,
      title: 'Task approved',
      message: `Your task "${task.title}" was approved and is now permanently credited to your portfolio.`,
      relatedEntityType: 'task',
      relatedEntityId: taskId,
    });
  }

  return taskRepository.findById(taskId);
}

async function reject(taskId, ownerId) {
  const task = await taskRepository.findById(taskId, ['role', 'assignedMember']);
  if (!task) throw AppError.notFound('Task not found');
  await assertProjectOwner(task.role.projectId, ownerId);

  if (task.status !== 'submitted') {
    throw AppError.conflict("Task must be 'submitted' to send it back");
  }

  await taskRepository.update(taskId, {
    status: 'rejected',
    reviewedAt: new Date(),
    reviewedBy: ownerId,
  });

  if (task.assignedMember) {
    await notificationService.notify({
      userId: task.assignedMember.userId,
      type: NOTIFICATION_TYPES.TASK_REJECTED,
      title: 'Task sent back for rework',
      message: `Your task "${task.title}" was sent back by the project owner. Resubmit once updated.`,
      relatedEntityType: 'task',
      relatedEntityId: taskId,
    });
  }

  return taskRepository.findById(taskId);
}

module.exports = { createTask, updateTask, listByProject, submit, approve, reject };
