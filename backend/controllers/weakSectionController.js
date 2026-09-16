const { WeakSectionRepo, PresentationRepo, PracticeAttemptRepo } = require('../models/repo');

exports.getWeakSectionsByPresentation = async (req, res) => {
  try {
    const { id } = req.params;
    const weakSections = await WeakSectionRepo.find({ presentationId: id });
    res.json(weakSections);
  } catch (error) {
    console.error('Error fetching weak sections:', error);
    res.status(500).json({ message: 'Failed to fetch weak sections' });
  }
};

exports.getWeakSectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const weakSection = await WeakSectionRepo.findById(id);
    if (!weakSection) {
      return res.status(404).json({ message: 'Weak section not found' });
    }

    const presentation = await PresentationRepo.findById(weakSection.presentationId);
    const attempts = await PracticeAttemptRepo.find({ weakSectionId: id });

    res.json({
      weakSection,
      presentation,
      attempts
    });
  } catch (error) {
    console.error('Error fetching weak section:', error);
    res.status(500).json({ message: 'Failed to fetch weak section details' });
  }
};
