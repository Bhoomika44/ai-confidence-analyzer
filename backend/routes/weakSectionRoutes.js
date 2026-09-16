const express = require('express');
const router = express.Router();
const weakSectionController = require('../controllers/weakSectionController');

router.get('/:id', weakSectionController.getWeakSectionById);

module.exports = router;
