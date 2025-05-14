const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Basic Info
  firstName: String,
  middleName: String,
  lastName: String,
  fatherName: String,
  unicodeFatherName: String,
  motherName: String,
  unicodeMotherName: String,
  unicodeName: String,
  enrollmentNumber: String,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Transgender']
  },
  mobileNumber: {
    type: String,
    validate: {
      validator: v => /^\d{10}$/.test(v),
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    }
  },
  casteCategory: String,
  subCaste: String,
  email: {
    type: String,
    validate: {
      validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} is not a valid email!`
    }
  },
  section: String,

  // 🔁 Updated Admission Fields
  admissionType: {
    type: String,
    enum: ['Regular', 'Direct Second Year', 'Lateral Entry'],
    required: true
  },
  admissionThrough: {
    type: String
  },
  remark: String,

  // Current Semester (Live Progress)
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },

  // Academic Record - Past and Present
  semesterRecords: [
    {
      semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
      },
      subjects: [
        {
          subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true
          },
          status: {
            type: String,
            enum: ['Passed', 'Failed', 'Pending'],
            default: 'Pending'
          },
          marks: Number
        }
      ],
      isBacklog: {
        type: Boolean,
        default: false
      }
    }
  ],

  // Backlog Subjects
  backlogs: [
    {
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester'
      },
      status: {
        type: String,
        enum: ['Pending', 'Cleared'],
        default: 'Pending'
      }
    }
  ],

  // Admission/Course Details
  stream: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stream',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  }],

  admissionDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);