const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['holiday', 'exam'], required: true },
  description: { type: String },
});

module.exports = mongoose.model('Event', eventSchema);
