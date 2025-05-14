const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Stream = mongoose.model('Stream', streamSchema);

module.exports = Stream;
