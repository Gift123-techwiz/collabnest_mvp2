const { SUBSCRIPTION_PLANS } = require('../utils/constants');

function validateInitiatePayment(req) {
  const errors = [];
  const { plan, months } = req.body || {};

  if (!plan || !Object.values(SUBSCRIPTION_PLANS).includes(plan)) {
    errors.push({ field: 'plan', message: 'plan must be one of: free, standard, advanced' });
  }

  if (plan === SUBSCRIPTION_PLANS.FREE) {
    // months is fixed (the 1-month extension) — ignored if sent.
  } else if (!Number.isInteger(months) || months < 1) {
    errors.push({ field: 'months', message: 'months is required and must be a positive integer' });
  }

  return { valid: errors.length === 0, errors };
}

function validateVerifyPayment(req) {
  const errors = [];
  if (!req.query || !req.query.reference) {
    errors.push({ field: 'reference', message: 'reference query param is required' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateInitiatePayment, validateVerifyPayment };
