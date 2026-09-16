const express = require('express');
const router = express.Router();
const presentationController = require('../controllers/presentationController');
const weakSectionController = require('../controllers/weakSectionController');

router.post('/', presentationController.createPresentation);
router.get('/', presentationController.getPresentations);
router.get('/:id', presentationController.getPresentationById);
router.delete('/:id', presentationController.deletePresentation);
router.get('/:id/weak-sections', weakSectionController.getWeakSectionsByPresentation);

module.exports = router;
