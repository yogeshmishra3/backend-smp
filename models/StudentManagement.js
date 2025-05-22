const mongoose = require('mongoose');
const Department = require('./Department');
const StudentCounter = require('./StudentCounter');
// const Stream = require('./Stream');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  unicodeFatherName: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    required: true,
    trim: true
  },
  unicodeMotherName: {
    type: String,
    trim: true
  },
  unicodeName: {
    type: String,
    trim: true
  },
  enrollmentNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Transgender'],
    required: true
  },
  mobileNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    }
  },
  casteCategory: {
    type: String,
    trim: true
  },
  subCaste: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  section: {
    type: String,
    trim: true
  },
  admissionType: {
    type: String,
    enum: ['Regular', 'Direct Second Year', 'Lateral Entry'],
    required: true
  },
  admissionThrough: {
    type: String,
    trim: true
  },
  remark: {
    type: String,
    trim: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
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
          marks: {
            type: Number,
            min: 0,
            max: 100
          }
        }
      ],
      isBacklog: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date
      }
    }
  ],
  backlogs: [
    {
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
      },
      semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
      },
      status: {
        type: String,
        enum: ['Pending', 'Cleared'],
        default: 'Pending'
      },
      clearedAt: {
        type: Date
      }
    }
  ],
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
    ref: 'Subject'
  }],
  admissionDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  graduationDate: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

studentSchema.virtual('fullName').get(function () {
  const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
  return parts.join(' ');
});

studentSchema.virtual('activeBacklogsCount').get(function () {
  return this.backlogs.filter(backlog => backlog.status === 'Pending').length;
});

studentSchema.index({ department: 1, stream: 1 });
studentSchema.index({ semester: 1 });
studentSchema.index({ studentId: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ enrollmentNumber: 1 });

studentSchema.pre('save', async function (next) {
  if (this.isNew && !this.studentId) {
    try {
      const department = await Department.findById(this.department);
      const stream = await Stream.findById(this.stream);

      if (!department || !stream) {
        const error = new Error('Invalid department or stream reference');
        error.status = 400;
        return next(error);
      }

      const deptName = department.name.replace(/\s+/g, '').toUpperCase();
      const streamName = stream.name.replace(/\s+/g, '').toUpperCase();
      const key = `${deptName}-${streamName}`;

      const counter = await StudentCounter.findOneAndUpdate(
        { key },
        { $inc: { count: 1 } },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

      if (!counter) {
        const error = new Error('Failed to generate student counter');
        error.status = 500;
        return next(error);
      }

      const paddedCount = String(counter.count).padStart(3, '0');
      this.studentId = `${deptName}${streamName}${paddedCount}`;

      this.markModified('studentId');

      next();
    } catch (error) {
      error.status = error.status || 500;
      next(error);
    }
  } else {
    next();
  }
});

studentSchema.pre('save', async function (next) {
  if (this.isNew && !this.studentId) {
    return next(new Error('StudentID generation failed'));
  }

  if (this.isModified('department') || this.isModified('stream')) {
    try {
      const department = await Department.findById(this.department);
      const stream = await Stream.findById(this.stream);

      if (!department || !stream) {
        const error = new Error('Invalid department or stream reference');
        error.status = 400;
        return next(error);
      }

      next();
    } catch (error) {
      error.status = error.status || 500;
      next(error);
    }
  } else {
    next();
  }
});

studentSchema.statics.createWithStudentId = async function (studentData) {
  try {
    const student = new this(studentData);
    const savedStudent = await student.save();

    if (!savedStudent.studentId) {
      throw new Error('Failed to generate studentId during creation');
    }

    return savedStudent;
  } catch (error) {
    throw error;
  }
};

studentSchema.methods.addSemesterRecord = function (semesterData) {
  this.semesterRecords.push(semesterData);
  return this.save();
};

studentSchema.methods.addBacklog = function (backlogData) {
  this.backlogs.push(backlogData);
  return this.save();
};

studentSchema.methods.clearBacklog = function (backlogId) {
  const backlog = this.backlogs.id(backlogId);
  if (backlog) {
    backlog.status = 'Cleared';
    backlog.clearedAt = new Date();
  }
  return this.save();
};

studentSchema.statics.findByDepartment = function (departmentId) {
  return this.find({ department: departmentId });
};

studentSchema.statics.findWithActiveBacklogs = function () {
  return this.find({ 'backlogs.status': 'Pending' });
};

module.exports = mongoose.model('Student', studentSchema);