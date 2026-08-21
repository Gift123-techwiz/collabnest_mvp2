const crypto = require('crypto');
const env = require('./env');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function paystackRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok || json.status === false) {
    const err = new Error(json.message || 'Paystack request failed');
    err.paystack = json;
    err.statusCode = res.status;
    throw err;
  }
  return json;
}

// Initializes a transaction and returns the hosted checkout URL. Amount is
// always in kobo (₦1 = 100 kobo) and always NGN — see subscriptionService
// for why we don't do custom FX conversion (Paystack + card networks
// already handle foreign-currency charges against a fixed NGN amount).
function initializeTransaction({ email, amountNaira, reference, metadata, callbackUrl }) {
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: {
      email,
      amount: Math.round(amountNaira * 100),
      currency: 'NGN',
      reference,
      metadata,
      callback_url: callbackUrl,
    },
  });
}

function verifyTransaction(reference) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}

// Paystack signs every webhook body with your secret key (HMAC SHA512) in
// the x-paystack-signature header — always verify before trusting a
// webhook payload (security doc, Module 11).
function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signatureHeader;
}

module.exports = { initializeTransaction, verifyTransaction, verifyWebhookSignature };
