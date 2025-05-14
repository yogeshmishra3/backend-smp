// const mongoose = require('mongoose');

// const departmentSchema = new mongoose.Schema({
//   name: { type: String, required: true, unique: true },
// });

// module.exports = mongoose.model('Department', departmentSchema);
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', required: true },
});

module.exports = mongoose.model('Department', departmentSchema);
