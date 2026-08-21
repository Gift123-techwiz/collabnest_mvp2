const express = require('express');
const taxonomyController = require('../controllers/taxonomyController');

const router = express.Router();

router.get('/skills', taxonomyController.listSkills);
router.get('/categories', taxonomyController.listCategories);

module.exports = router;
