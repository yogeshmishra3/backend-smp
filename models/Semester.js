// const mongoose = require('mongoose');

// const SemesterSchema = new mongoose.Schema({
//   number: {
//     type: Number,
//     required: true,
//     min: 1,
//     max: 9
//   }
// });

// module.exports = mongoose.model('Semester', SemesterSchema);


const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    min: 1,
    max: 9
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }]
});

module.exports = mongoose.model('Semester', SemesterSchema);