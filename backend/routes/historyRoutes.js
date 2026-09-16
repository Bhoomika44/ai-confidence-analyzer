const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.get('/', historyController.getHistory);
router.get('/comparison', historyController.getHistoryComparison);

module.exports = router;
