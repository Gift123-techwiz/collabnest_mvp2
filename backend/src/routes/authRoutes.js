const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { authLimiter, loginLimiter } = require('../middleware/rateLimitMiddleware');
const {
  validateRegister,
  validateLogin,
  validateRefresh,
} = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, validate(validateRegister), authController.register);
router.post('/login', authLimiter, loginLimiter, validate(validateLogin), authController.login);
router.post('/refresh', authLimiter, validate(validateRefresh), authController.refresh);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
