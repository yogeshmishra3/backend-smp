const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: {
    type: String,
    enum: [
      'Student Management',
      'Account Section Management',
      'Document Section Management',
      'Notification System Management',
      'Library Management',
      'bus Management',
      'Hostel Management'
   ],
    required: true
  },
  employmentStatus: {
    type: String,
    enum: ['Probation Period', 'Permanent Employee'],
    default: 'Probation Period'
  },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('Faculty', facultySchema);
