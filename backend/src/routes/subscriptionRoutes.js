const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  validateInitiatePayment,
  validateVerifyPayment,
} = require('../validators/subscriptionValidators');

const router = express.Router();

router.get('/projects/:id/billing', requireAuth, subscriptionController.getBillingStatus);
router.post(
  '/projects/:id/billing/pay',
  requireAuth,
  validate(validateInitiatePayment),
  subscriptionController.initiatePayment
);
router.get(
  '/billing/verify',
  requireAuth,
  validate(validateVerifyPayment),
  subscriptionController.verifyPayment
);

module.exports = router;
