const mongoose = require('mongoose');

const casteSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subcastes: [{ type: String }] // Add this
});

module.exports = mongoose.model('Caste', casteSchema);
