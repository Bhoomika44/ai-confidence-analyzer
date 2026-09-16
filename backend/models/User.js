const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    // Password reset fields
    resetCode: {
      type: String,
      default: null
    },

    resetCodeExpires: {
      type: Date,
      default: null
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports =
  mongoose.models.User ||
  mongoose.model('User', UserSchema);