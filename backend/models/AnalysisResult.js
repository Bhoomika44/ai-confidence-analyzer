const mongoose = require('mongoose');

const AnalysisResultSchema = new mongoose.Schema({
  presentationId: {
    type: String,
    required: true
  },

  // NULL when no speech is detected
  overallScore: {
    type: Number,
    default: null
  },

  performanceLevel: {
    type: String,
    default: 'No Speech Detected'
  },

  badge: {
    type: String,
    default: 'Record Again'
  },

  scoreLabel: {
    type: String,
    default: 'Confidence Not Available'
  },

  disclaimer: {
    type: String,
    default: 'A confidence score cannot be calculated because no speech was detected.'
  },

  // True only when actual speech is detected
  speechDetected: {
    type: Boolean,
    default: false
  },

  // Individual Scores
  eyeContact: {
    type: Number,
    default: null
  },

  facialExpression: {
    type: Number,
    default: null
  },

  headPosition: {
    type: Number,
    default: null
  },

  posture: {
    type: Number,
    default: null
  },

  handGestures: {
    type: Number,
    default: null
  },

  bodyMovement: {
    type: Number,
    default: null
  },

  voice: {
    type: Number,
    default: null
  },

  speakingSpeed: {
    type: Number,
    default: null
  },

  pauseScore: {
    type: Number,
    default: null
  },

  fillerWordScore: {
    type: Number,
    default: null
  },

  // Observable quantities
  wpm: {
    type: Number,
    default: null
  },

  pauseCount: {
    type: Number,
    default: null
  },

  longPauseCount: {
    type: Number,
    default: null
  },

  fillerWordCount: {
    type: Number,
    default: null
  },

  eyeContactPercentage: {
    type: Number,
    default: null
  },

  // Detailed analysis
  visualMetrics: {
    type: Object,
    default: {}
  },

  audioMetrics: {
    type: Object,
    default: {}
  },

  strengths: [{
    type: String
  }],

  weaknesses: [{
    type: String
  }],

  timeline: [{
    type: Object
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =
  mongoose.models.AnalysisResult ||
  mongoose.model('AnalysisResult', AnalysisResultSchema);