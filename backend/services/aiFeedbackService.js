class AiFeedbackService {
  /**
   * Generates actionable feedback and weakness explanations based on measured presentation metrics.
   */
  static generateFeedback(analysisResult) {
    const { individualScores, strengths, weaknesses, audioMetrics, visualMetrics } = analysisResult;
    
    const summaryTips = [];

    if (individualScores.eyeContact < 65) {
      summaryTips.push("Practice aligning your gaze directly with the camera lens rather than looking at notes.");
    }
    if (individualScores.fillerWords < 70) {
      summaryTips.push("Use brief 1-second silent pauses to organize thoughts rather than saying 'um' or 'like'.");
    }
    if (audioMetrics.speakingSpeed?.wpm > 160) {
      summaryTips.push("Consciously slow down your delivery during key transition sentences to enhance comprehension.");
    }
    if (individualScores.posture < 70) {
      summaryTips.push("Keep both feet planted and shoulders square to maintain an authoritative, balanced presence.");
    }

    if (summaryTips.length === 0) {
      summaryTips.push("Your delivery demonstrated high poise and clear structure. Focus on subtle vocal inflection for emphasis.");
    }

    return {
      personalizedSummary: `Presentation analyzed with an overall estimated confidence score of ${analysisResult.overallScore}%.`,
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      keyRecommendations: summaryTips
    };
  }

  /**
   * Generates targeted practice coaching prompt for a detected weak section.
   */
  static generatePracticeInstruction(weakSection) {
    const problems = weakSection.problems || [];
    const problemsStr = problems.join(', ');
    const duration = weakSection.durationSec || 30;

    return `Explain this same key point again in a short ~${Math.round(duration)}-second practice attempt. Address: ${problemsStr}. Maintain continuous eye contact, steady cadence, and upright posture.`;
  }
}

module.exports = AiFeedbackService;
