const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');
const {
  validateUpdateProfile,
  validateAddSkill,
  validateAddPortfolioLink,
} = require('../validators/userValidators');

const router = express.Router();

// IMPORTANT: /me/* routes must be registered before the /:id catch-all
// below, otherwise Express would try to treat "me" as a user id.
router.get('/me', requireAuth, userController.getMe);
router.patch('/me', requireAuth, validate(validateUpdateProfile), userController.updateMe);
router.post(
  '/me/profile-picture',
  requireAuth,
  uploadImage.single('image'),
  userController.uploadProfilePicture
);
router.get('/me/stats', requireAuth, userController.getStats);
router.get('/me/share-link', requireAuth, userController.getShareLink);

router.post('/me/skills', requireAuth, validate(validateAddSkill), userController.addSkill);
router.delete('/me/skills/:skillId', requireAuth, userController.removeSkill);

router.post(
  '/me/portfolio-links',
  requireAuth,
  validate(validateAddPortfolioLink),
  userController.addPortfolioLink
);
router.delete('/me/portfolio-links/:id', requireAuth, userController.removePortfolioLink);

// Public profile view by direct ID only — no user directory/search exists.
router.get('/:id', userController.getPublicProfile);

module.exports = router;
