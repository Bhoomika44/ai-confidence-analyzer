const { WeakSectionRepo, PracticeAttemptRepo, PresentationRepo } = require('../models/repo');
const { runPythonAnalysis } = require('../services/pythonBridge');
const ComparisonService = require('../services/comparisonService');

exports.startPractice = async (req, res) => {
  try {
    const { weakSectionId } = req.body;
    if (!weakSectionId) {
      return res.status(400).json({ message: 'weakSectionId is required' });
    }

    const weakSection = await WeakSectionRepo.findById(weakSectionId);
    if (!weakSection) {
      return res.status(404).json({ message: 'Weak section not found' });
    }

    res.json({
      message: 'Practice session initialized',
      weakSection
    });
  } catch (error) {
    console.error('Error starting practice session:', error);
    res.status(500).json({ message: 'Failed to initialize practice session' });
  }
};

exports.analyzePractice = async (req, res) => {
  try {
    const { id } = req.params; // weakSectionId
    const { videoPath, duration } = req.body;

    if (!videoPath) {
      return res.status(400).json({ message: 'videoPath is required for practice analysis' });
    }

    const weakSection = await WeakSectionRepo.findById(id);
    if (!weakSection) {
      return res.status(404).json({ message: 'Weak section not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`weakSection_${id}`).emit('practice_progress', {
        step: 'Analyzing practice attempt...',
        progress: 30
      });
    }

    // Run Python analyzer in practice mode
    const practiceRawResult = await runPythonAnalysis(
      videoPath,
      null,
      'practice',
      io,
      null
    );

    if (io) {
      io.to(`weakSection_${id}`).emit('practice_progress', {
        step: 'Calculating Before vs After comparison...',
        progress: 90
      });
    }

    // Compute Before vs After Comparison
    const comparison = ComparisonService.compare(weakSection.metrics, practiceRawResult);

    // Save Practice Attempt
    const attempt = await PracticeAttemptRepo.create({
      weakSectionId: id,
      presentationId: weakSection.presentationId,
      videoPath,
      originalMetrics: weakSection.metrics,
      newMetrics: {
        eyeContact: practiceRawResult.individual_scores?.eye_contact || 75,
        speakingSpeed: practiceRawResult.audio_metrics?.speaking_speed?.wpm || 145,
        fillerWords: practiceRawResult.audio_metrics?.filler_words?.total_count ?? 1,
        voice: practiceRawResult.individual_scores?.voice || 78,
        posture: practiceRawResult.individual_scores?.posture || 82,
        overallScore: practiceRawResult.overall_score || 78
      },
      improvementValues: comparison.detailedMetrics,
      overallImproved: comparison.isImproved,
      practiceFeedback: practiceRawResult.strengths?.length ? practiceRawResult.strengths[0] : "Good targeted practice execution.",
      verdictMessage: comparison.verdictMessage,
      comparisonTable: comparison.comparisonTable
    });

    // Mark weak section as completed
    await WeakSectionRepo.findByIdAndUpdate(id, {
      practiceCompleted: true,
      latestAttemptId: attempt.id
    });

    res.json({
      attemptId: attempt.id,
      comparison,
      practiceMetrics: attempt.newMetrics,
      isImproved: comparison.isImproved,
      verdictMessage: comparison.verdictMessage,
      comparisonTable: comparison.comparisonTable
    });
  } catch (error) {
    console.error('Error analyzing practice attempt:', error);
    res.status(500).json({ message: 'Failed to analyze practice attempt' });
  }
};

exports.getComparison = async (req, res) => {
  try {
    const { id } = req.params; // attemptId or weakSectionId
    let attempt = await PracticeAttemptRepo.findById(id);
    if (!attempt) {
      const attempts = await PracticeAttemptRepo.find({ weakSectionId: id });
      if (attempts && attempts.length > 0) {
        attempt = attempts[attempts.length - 1]; // latest
      }
    }

    if (!attempt) {
      return res.status(404).json({ message: 'Comparison data not found' });
    }

    const weakSection = await WeakSectionRepo.findById(attempt.weakSectionId);

    res.json({
      attempt,
      weakSection
    });
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({ message: 'Failed to fetch comparison data' });
  }
};
