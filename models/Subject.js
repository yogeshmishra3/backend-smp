

const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
});

// Use `mongoose.models` to check if the model already exists, 
// otherwise create a new model
module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);



