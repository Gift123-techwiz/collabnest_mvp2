const { APPLICATION_MESSAGE_MAX_LENGTH } = require('../utils/constants');

function validateApply(req) {
  const errors = [];
  const { message } = req.body || {};

  if (message !== undefined && message !== null) {
    if (typeof message !== 'string' || message.length > APPLICATION_MESSAGE_MAX_LENGTH) {
      errors.push({
        field: 'message',
        message: `Message must be at most ${APPLICATION_MESSAGE_MAX_LENGTH} characters`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateReject(req) {
  const errors = [];
  const { rejectionReason } = req.body || {};
  if (rejectionReason !== undefined && rejectionReason !== null && typeof rejectionReason !== 'string') {
    errors.push({ field: 'rejectionReason', message: 'rejectionReason must be a string' });
  }
  return { valid: errors.length === 0, errors };
}

// Accept can optionally carry a workspace link + note right at acceptance
// time (per the client's requested flow), but neither is required.
function validateAccept(req) {
  const errors = [];
  const { workspaceLink } = req.body || {};
  if (workspaceLink !== undefined && workspaceLink !== null && typeof workspaceLink !== 'string') {
    errors.push({ field: 'workspaceLink', message: 'workspaceLink must be a string' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateApply, validateReject, validateAccept };
