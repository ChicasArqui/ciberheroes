const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  familyCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: /^[A-Z0-9]{8}$/
  }
}, { timestamps: true });

module.exports = mongoose.model('Family', familySchema);