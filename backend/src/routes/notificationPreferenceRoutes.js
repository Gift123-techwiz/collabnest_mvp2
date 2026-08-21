const express = require('express');
const notificationPreferenceController = require('../controllers/notificationPreferenceController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { validateUpdatePreference } = require('../validators/notificationValidators');

const router = express.Router();

router.get(
  '/users/me/notification-preferences',
  requireAuth,
  notificationPreferenceController.getPreferences
);
router.patch(
  '/users/me/notification-preferences',
  requireAuth,
  validate(validateUpdatePreference),
  notificationPreferenceController.updatePreference
);

module.exports = router;
