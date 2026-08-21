const express = require('express');
const roleController = require('../controllers/roleController');
const applicationController = require('../controllers/applicationController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { validateCreateRole, validateUpdateRole } = require('../validators/projectValidators');
const { validateApply } = require('../validators/applicationValidators');
const { validateCreateTask } = require('../validators/taskValidators');

const router = express.Router();

router.post(
  '/:projectId/roles',
  requireAuth,
  validate(validateCreateRole),
  roleController.create
);
router.patch(
  '/:projectId/roles/:roleId',
  requireAuth,
  validate(validateUpdateRole),
  roleController.update
);
router.delete('/:projectId/roles/:roleId', requireAuth, roleController.remove);

router.post(
  '/:projectId/roles/:roleId/applications',
  requireAuth,
  validate(validateApply),
  applicationController.apply
);

router.post(
  '/:projectId/roles/:roleId/tasks',
  requireAuth,
  validate(validateCreateTask),
  roleController.createTask
);

module.exports = router;
