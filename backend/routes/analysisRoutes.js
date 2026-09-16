const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

router.post('/start', analysisController.startAnalysis);
router.get('/:id', analysisController.getAnalysisResult);
router.get('/:id/status', analysisController.getAnalysisStatus);

module.exports = router;
