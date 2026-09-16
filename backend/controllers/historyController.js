const { PresentationRepo, AnalysisResultRepo, WeakSectionRepo, PracticeAttemptRepo } = require('../models/repo');

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'demo-user';
    const presentations = await PresentationRepo.find({ userId });
    presentations.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const enrichedHistory = await Promise.all(
      presentations.map(async (p) => {
        const analysis = await AnalysisResultRepo.findOne({ presentationId: p.id });
        const weakSections = await WeakSectionRepo.find({ presentationId: p.id });
        const practiceCount = await PracticeAttemptRepo.find({ presentationId: p.id });

        return {
          id: p.id,
          title: p.title,
          inputType: p.inputType,
          date: p.date || p.createdAt,
          duration: p.duration,
          overallScore: p.overallScore || (analysis ? analysis.overallScore : 0),
          performanceLevel: p.performanceLevel || (analysis ? analysis.performanceLevel : 'Pending'),
          processingStatus: p.processingStatus,
          individualScores: analysis ? {
            eyeContact: analysis.eyeContact,
            facialExpression: analysis.facialExpression,
            posture: analysis.posture,
            voice: analysis.voice,
            speakingSpeed: analysis.speakingSpeed,
            wpm: analysis.wpm,
            fillerWordCount: analysis.fillerWordCount
          } : null,
          totalWeakSections: weakSections.length,
          completedPractices: practiceCount.length
        };
      })
    );

    res.json(enrichedHistory);
  } catch (error) {
    console.error('Error fetching presentation history:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

exports.getHistoryComparison = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'demo-user';
    const presentations = await PresentationRepo.find({ userId });
    presentations.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)); // chronological

    const trend = presentations
      .filter(p => p.processingStatus === 'completed')
      .map((p, index) => ({
        index: index + 1,
        id: p.id,
        title: p.title,
        date: new Date(p.date || p.createdAt).toLocaleDateString(),
        score: p.overallScore,
        performanceLevel: p.performanceLevel
      }));

    res.json({
      totalSessions: trend.length,
      averageScore: trend.length ? Math.round(trend.reduce((acc, cur) => acc + cur.score, 0) / trend.length) : 0,
      trend
    });
  } catch (error) {
    console.error('Error fetching history comparison:', error);
    res.status(500).json({ message: 'Failed to fetch trend comparison' });
  }
};
