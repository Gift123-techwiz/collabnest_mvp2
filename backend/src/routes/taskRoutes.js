const express = require('express');
const taskController = require('../controllers/taskController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { validateUpdateTask } = require('../validators/taskValidators');

const router = express.Router();

router.get('/projects/:projectId/tasks', requireAuth, taskController.listByProject);

// Addition: owner can edit a task's title/description later (client asked
// that tasks be editable/addable after initial creation).
router.patch('/tasks/:id', requireAuth, validate(validateUpdateTask), taskController.update);

router.patch('/tasks/:id/submit', requireAuth, taskController.submit);
router.post('/tasks/:id/approve', requireAuth, taskController.approve);
router.post('/tasks/:id/reject', requireAuth, taskController.reject);

module.exports = router;
