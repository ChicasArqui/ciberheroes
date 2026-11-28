
const mongoose = require('mongoose');

const childProfileSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
    index: true
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  avatarId: {
    type: String,
    required: true,
    trim: true
  },
  pinHash: {
    type: String,
    required: true,
    select: false
  },
  mustChangePin: {
    type: Boolean,
    default: true,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ChildProfile', childProfileSchema);
