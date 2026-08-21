const express = require('express');
const settingsController = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  validateChangePassword,
  validateDeleteAccount,
} = require('../validators/userValidators');

const router = express.Router();

router.patch(
  '/users/me/password',
  requireAuth,
  validate(validateChangePassword),
  settingsController.changePassword
);
router.delete(
  '/users/me',
  requireAuth,
  validate(validateDeleteAccount),
  settingsController.deleteAccount
);

module.exports = router;
