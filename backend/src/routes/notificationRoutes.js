const express = require('express');
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/notifications', requireAuth, notificationController.list);
router.get('/notifications/unread-count', requireAuth, notificationController.unreadCount);
router.patch('/notifications/:id/read', requireAuth, notificationController.markRead);
router.post('/notifications/read-all', requireAuth, notificationController.markAllRead);

module.exports = router;
