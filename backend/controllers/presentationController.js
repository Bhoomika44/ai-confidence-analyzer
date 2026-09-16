const { PresentationRepo, AnalysisResultRepo, WeakSectionRepo, PracticeAttemptRepo } = require('../models/repo');
const fs = require('fs');

exports.createPresentation = async (req, res) => {
  try {
    const { title, inputType, videoPath, duration } = req.body;
    const userId = req.user ? req.user.id : 'demo-user';

    if (!videoPath) {
      return res.status(400).json({ message: 'videoPath is required' });
    }

    const presentation = await PresentationRepo.create({
      userId,
      title: title || `Presentation ${new Date().toLocaleDateString()}`,
      inputType: inputType || 'recording',
      videoPath,
      duration: duration || 0,
      processingStatus: 'recording_completed',
      processingStep: 'Recording completed',
      processingProgress: 0,
      overallScore: 0,
      performanceLevel: 'Pending Analysis'
    });

    res.status(201).json(presentation);
  } catch (error) {
    console.error('Error creating presentation:', error);
    res.status(500).json({ message: 'Failed to create presentation record' });
  }
};

exports.getPresentations = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'demo-user';
    const presentations = await PresentationRepo.find({ userId });
    // Sort descending by date
    presentations.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    res.json(presentations);
  } catch (error) {
    console.error('Error fetching presentations:', error);
    res.status(500).json({ message: 'Failed to fetch presentations' });
  }
};

exports.getPresentationById = async (req, res) => {
  try {
    const { id } = req.params;
    const presentation = await PresentationRepo.findById(id);
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    const analysis = await AnalysisResultRepo.findOne({ presentationId: id });
    const weakSections = await WeakSectionRepo.find({ presentationId: id });

    res.json({
      presentation,
      analysis,
      weakSections
    });
  } catch (error) {
    console.error('Error fetching presentation details:', error);
    res.status(500).json({ message: 'Failed to fetch presentation details' });
  }
};

exports.deletePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    const presentation = await PresentationRepo.findById(id);
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    // Delete associated files if present
    if (presentation.videoPath && fs.existsSync(presentation.videoPath)) {
      try { fs.unlinkSync(presentation.videoPath); } catch (e) {}
    }

    await PresentationRepo.findByIdAndDelete(id);
    await AnalysisResultRepo.deleteMany({ presentationId: id });
    await WeakSectionRepo.deleteMany({ presentationId: id });
    await PracticeAttemptRepo.deleteMany({ presentationId: id });

    res.json({ message: 'Presentation and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting presentation:', error);
    res.status(500).json({ message: 'Failed to delete presentation' });
  }
};
