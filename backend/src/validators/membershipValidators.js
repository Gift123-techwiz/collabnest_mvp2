function validateLeave(req) {
  const errors = [];
  const { exitReason } = req.body || {};

  if (!exitReason || typeof exitReason !== 'string' || exitReason.trim().length === 0) {
    errors.push({ field: 'exitReason', message: 'exitReason is required' });
  }
  if (req.body && req.body.deliverableLinks !== undefined) {
    if (!Array.isArray(req.body.deliverableLinks)) {
      errors.push({ field: 'deliverableLinks', message: 'Must be an array of URLs' });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateSetWorkspaceLink(req) {
  const errors = [];
  const { workspaceLink } = req.body || {};
  // Explicitly optional/nullable — owner can clear it by passing null/''.
  if (workspaceLink !== undefined && workspaceLink !== null && typeof workspaceLink !== 'string') {
    errors.push({ field: 'workspaceLink', message: 'workspaceLink must be a string' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateLeave, validateSetWorkspaceLink };
