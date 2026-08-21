const subscriptionService = require('../services/subscriptionService');
const { ok, created } = require('../utils/response');

async function getBillingStatus(req, res, next) {
  try {
    return ok(res, await subscriptionService.getBillingStatus(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
}

async function initiatePayment(req, res, next) {
  try {
    return created(
      res,
      await subscriptionService.initiatePayment(req.params.id, req.user.id, req.body)
    );
  } catch (err) {
    next(err);
  }
}

async function verifyPayment(req, res, next) {
  try {
    return ok(res, await subscriptionService.verifyPayment(req.query.reference));
  } catch (err) {
    next(err);
  }
}

// Paystack webhook — no auth (Paystack calls this directly), signature
// verified inside the service instead. Must always return 200 quickly so
// Paystack doesn't retry-storm us; errors are logged, not surfaced to them.
async function webhook(req, res) {
  try {
    await subscriptionService.handleWebhook(req.body, req.headers['x-paystack-signature']);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[paystack webhook]', err.message);
  }
  return res.status(200).send('ok');
}

module.exports = { getBillingStatus, initiatePayment, verifyPayment, webhook };
