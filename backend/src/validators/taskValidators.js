function validateCreateTask(req) {
  const errors = [];
  const { title } = req.body || {};
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Task title is required' });
  }
  return { valid: errors.length === 0, errors };
}

function validateUpdateTask(req) {
  const errors = [];
  const { title } = req.body || {};
  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    errors.push({ field: 'title', message: 'Task title cannot be empty' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateCreateTask, validateUpdateTask };
