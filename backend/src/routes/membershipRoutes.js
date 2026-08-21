const express = require('express');
const membershipController = require('../controllers/membershipController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  validateLeave,
  validateSetWorkspaceLink,
} = require('../validators/membershipValidators');

const router = express.Router();

router.get('/projects/:id/members', requireAuth, membershipController.listMembers);

router.post(
  '/memberships/:id/leave',
  requireAuth,
  validate(validateLeave),
  membershipController.leave
);

// Addition: owner can set/update the workspace link any time after
// acceptance — never required, and the member is notified whenever it's
// added or changed.
router.patch(
  '/memberships/:id/workspace-link',
  requireAuth,
  validate(validateSetWorkspaceLink),
  membershipController.setWorkspaceLink
);

module.exports = router;
