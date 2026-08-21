const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

// IMPORTANT: this route needs the raw request body (a Buffer) to verify
// Paystack's HMAC signature — express.raw() is applied here specifically,
// and this router must be mounted in app.js BEFORE the global
// express.json() middleware, or the body would already be parsed/consumed
// by then. No auth here by design — Paystack calls this directly, not a
// logged-in user; trust comes entirely from the verified signature.
router.post(
  '/webhooks/paystack',
  express.raw({ type: 'application/json' }),
  subscriptionController.webhook
);

module.exports = router;
