const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users/me/analytics', requireAuth, analyticsController.getPersonalAnalytics);

module.exports = router;
