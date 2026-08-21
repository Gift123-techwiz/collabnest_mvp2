function validateCreateRating(req) {
  const errors = [];
  const { rateeId, stars, feedback } = req.body || {};

  if (!rateeId) {
    errors.push({ field: 'rateeId', message: 'rateeId is required' });
  }
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    errors.push({ field: 'stars', message: 'stars must be an integer from 1 to 5' });
  }
  if (feedback !== undefined && feedback !== null && typeof feedback !== 'string') {
    errors.push({ field: 'feedback', message: 'feedback must be a string' });
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateCreateRating };
