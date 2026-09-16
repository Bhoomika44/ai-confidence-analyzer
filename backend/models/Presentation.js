const mongoose = require('mongoose');

const PresentationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  inputType: {
    type: String,
    enum: ['recording', 'upload'],
    default: 'recording'
  },

  videoPath: {
    type: String,
    required: true
  },

  audioPath: {
    type: String,
    default: null
  },

  duration: {
    type: Number,
    default: 0
  },

  date: {
    type: Date,
    default: Date.now
  },

  // NULL until a valid speech analysis is completed
  overallScore: {
    type: Number,
    default: null
  },

  performanceLevel: {
    type: String,
    default: 'Not Analyzed'
  },

  // True only when speech is detected
  speechDetected: {
    type: Boolean,
    default: false
  },

  processingStatus: {
    type: String,
    enum: [
      'pending',
      'recording_completed',
      'processing',
      'completed',
      'failed'
    ],
    default: 'pending'
  },

  processingStep: {
    type: String,
    default: 'Initialized'
  },

  processingProgress: {
    type: Number,
    default: 0
  }
});

module.exports =
  mongoose.models.Presentation ||
  mongoose.model('Presentation', PresentationSchema);