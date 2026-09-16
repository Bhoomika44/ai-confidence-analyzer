const mongoose = require('mongoose');

const PracticeAttemptSchema = new mongoose.Schema({
  weakSectionId: { type: String, required: true },
  presentationId: { type: String, required: true },
  videoPath: { type: String, required: true },
  originalMetrics: { type: Object, required: true },
  newMetrics: { type: Object, required: true },
  improvementValues: { type: Object, required: true },
  overallImproved: { type: Boolean, default: false },
  practiceFeedback: { type: String, required: true },
  verdictMessage: { type: String, required: true },
  practiceTimestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.models.PracticeAttempt || mongoose.model('PracticeAttempt', PracticeAttemptSchema);
