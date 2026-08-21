const express = require('express');
const projectController = require('../controllers/projectController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { searchLimiter } = require('../middleware/rateLimitMiddleware');
const { validateCreateProject, validateUpdateProject } = require('../validators/projectValidators');

const router = express.Router();

router.post('/', requireAuth, validate(validateCreateProject), projectController.create);
router.get('/', searchLimiter, optionalAuth, projectController.search);
router.get('/:id', optionalAuth, projectController.getById);
router.patch('/:id', requireAuth, validate(validateUpdateProject), projectController.update);
router.delete('/:id', requireAuth, projectController.remove);

router.post('/:id/pause', requireAuth, projectController.pause);
router.post('/:id/resume', requireAuth, projectController.resume);
router.post('/:id/close-recruitment', requireAuth, projectController.closeRecruitment);
router.post('/:id/reopen-recruitment', requireAuth, projectController.reopenRecruitment);
router.post('/:id/archive', requireAuth, projectController.archive);
router.post('/:id/complete', requireAuth, projectController.complete);

module.exports = router;
