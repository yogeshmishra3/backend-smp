const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., "CSE-IT"
  count: { type: Number, default: 0 },
});

module.exports = mongoose.model("StudentCounter", counterSchema);
