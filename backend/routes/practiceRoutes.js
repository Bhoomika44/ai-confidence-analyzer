const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');

router.post('/start', practiceController.startPractice);
router.post('/:id/analyze', practiceController.analyzePractice);
router.get('/:id/comparison', practiceController.getComparison);

module.exports = router;
