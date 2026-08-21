const express = require('express');
const ratingController = require('../controllers/ratingController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { validateCreateRating } = require('../validators/ratingValidators');

const router = express.Router();

router.post(
  '/projects/:id/ratings',
  requireAuth,
  validate(validateCreateRating),
  ratingController.create
);
router.get('/users/:id/ratings', ratingController.listForUser);

module.exports = router;
