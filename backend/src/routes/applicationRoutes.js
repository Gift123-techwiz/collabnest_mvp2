const express = require('express');
const applicationController = require('../controllers/applicationController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { validateAccept, validateReject } = require('../validators/applicationValidators');

const router = express.Router();

// Owner reviews all applicants on their project.
router.get('/projects/:projectId/applications', requireAuth, applicationController.listForProject);

// Applicant's own applications with live status.
router.get('/users/me/applications', requireAuth, applicationController.listMine);

// Accept optionally carries a workspace link (never required — see
// membershipRoutes for editing it later).
router.post(
  '/applications/:id/accept',
  requireAuth,
  validate(validateAccept),
  applicationController.accept
);
router.post(
  '/applications/:id/reject',
  requireAuth,
  validate(validateReject),
  applicationController.reject
);

module.exports = router;
