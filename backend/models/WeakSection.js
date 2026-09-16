const mongoose = require('mongoose');

const WeakSectionSchema = new mongoose.Schema({
  presentationId: { type: String, required: true },
  startSec: { type: Number, required: true },
  endSec: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  durationSec: { type: Number, default: 0 },
  problems: [{ type: String }],
  metrics: { type: Object, default: {} },
  explanation: { type: String, required: true },
  practiceInstruction: { type: String, required: true },
  practiceCompleted: { type: Boolean, default: false },
  latestAttemptId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.WeakSection || mongoose.model('WeakSection', WeakSectionSchema);
