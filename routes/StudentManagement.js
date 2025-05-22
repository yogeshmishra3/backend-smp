const express = require('express');
const router = express.Router();
const Student = require('../models/StudentManagement');
const stream = require('../models/stream');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');

router.post('/', async (req, res) => {
  try {
    const {
      firstName, middleName, lastName,
      fatherName, unicodeFatherName,
      motherName, unicodeMotherName,
      unicodeName, enrollmentNumber,
      gender, mobileNumber, casteCategory, subCaste,
      email, section, admissionType, admissionThrough, remark,
      stream, department, subjects,
      semester
    } = req.body;

    if (!firstName || !email || !mobileNumber || !gender || !stream || !department || !subjects || !semester || !admissionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Subjects must be a non-empty array' });
    }

    if (!['Regular', 'Direct Second Year', 'Lateral Entry'].includes(admissionType)) {
      return res.status(400).json({ error: 'Invalid admissionType. Must be Regular, Direct Second Year, or Lateral Entry' });
    }

    const semesterDoc = await Semester.findById(semester).populate('subjects');
    if (!semesterDoc) {
      return res.status(400).json({ error: 'Invalid semester ID' });
    }

    const validSubjects = semesterDoc.subjects
      .filter((sub) => sub.department && String(sub.department) === department)
      .map((sub) => String(sub._id));
    if (!subjects.every((subId) => validSubjects.includes(String(subId)))) {
      return res.status(400).json({ error: 'One or more subject IDs are not valid for this semester and department' });
    }

    const student = await Student.createWithStudentId({
      firstName, middleName, lastName,
      fatherName, unicodeFatherName,
      motherName, unicodeMotherName,
      unicodeName, enrollmentNumber,
      gender, mobileNumber, casteCategory, subCaste,
      email, section, admissionType, admissionThrough, remark,
      stream, department, subjects,
      semester,
      semesterRecords: [{
        semester,
        subjects: subjects.map(sub => ({ subject: sub, status: 'Pending', marks: 0 })),
        isBacklog: false
      }]
    });

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { admissionType } = req.query;
    const query = {};

    if (admissionType) {
      if (!['Regular', 'Direct Second Year', 'Lateral Entry'].includes(admissionType)) {
        return res.status(400).json({ error: 'Invalid admissionType. Must be Regular, Direct Second Year, or Lateral Entry' });
      }
      query.admissionType = admissionType;
    }

    const students = await Student.find(query)
      .populate('stream')
      .populate('department')
      .populate({
        path: 'semester',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'semesterRecords.semester',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'semesterRecords.subjects.subject',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'backlogs.subject',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'backlogs.semester',
        match: { _id: { $exists: true } }
      });

    const cleanedStudents = students.map(student => ({
      ...student._doc,
      semesterRecords: student.semesterRecords.filter(
        record => record.semester && record.semester._id &&
          record.subjects.every(sub => sub.subject && sub.subject._id)
      ),
      backlogs: student.backlogs.filter(
        backlog => backlog.subject && backlog.subject._id && backlog.semester && backlog.semester._id
      )
    }));

    res.json(cleanedStudents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('stream')
      .populate('department')
      .populate({
        path: 'semester',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'semesterRecords.semester',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'semesterRecords.subjects.subject',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'backlogs.subject',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'backlogs.semester',
        match: { _id: { $exists: true } }
      });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const cleanedStudent = {
      ...student._doc,
      semesterRecords: student.semesterRecords.filter(
        record => record.semester && record.semester._id &&
          record.subjects.every(sub => sub.subject && sub.subject._id)
      ),
      backlogs: student.backlogs.filter(
        backlog => backlog.subject && backlog.subject._id && backlog.semester && backlog.semester._id
      )
    };

    res.json(cleanedStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student-id/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId })
      .populate('stream')
      .populate('department')
      .populate({
        path: 'semester',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'semesterRecords.semester',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'semesterRecords.subjects.subject',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'backlogs.subject',
        match: { _id: { $exists: true } }
      })
      .populate({
        path: 'backlogs.semester',
        match: { _id: { $exists: true } }
      });

    if (!student) return res.status(404).json({ error: 'Student not found with this Student ID' });

    const cleanedStudent = {
      ...student._doc,
      semesterRecords: student.semesterRecords.filter(
        record => record.semester && record.semester._id &&
          record.subjects.every(sub => sub.subject && sub.subject._id)
      ),
      backlogs: student.backlogs.filter(
        backlog => backlog.subject && backlog.subject._id && backlog.semester && backlog.semester._id
      )
    };

    res.json(cleanedStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { semesterRecords, admissionType, ...updateFields } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (admissionType && !['Regular', 'Direct Second Year', 'Lateral Entry'].includes(admissionType)) {
      return res.status(400).json({ error: 'Invalid admissionType. Must be Regular, Direct Second Year, or Lateral Entry' });
    }

    Object.assign(student, updateFields);
    if (admissionType) student.admissionType = admissionType;

    if (semesterRecords && Array.isArray(semesterRecords)) {
      for (const record of semesterRecords) {
        const semesterId = record.semester?._id || record.semester;
        if (!semesterId) {
          return res.status(400).json({ error: 'Semester ID is required in semesterRecords' });
        }

        const semester = await Semester.findById(semesterId).populate('subjects');
        if (!semester) {
          return res.status(400).json({ error: `Invalid semester ID: ${semesterId}` });
        }

        if (record.subjects && Array.isArray(record.subjects)) {
          const validSubjectIds = semester.subjects.map((sub) => String(sub._id));

          const subjectIds = record.subjects
            .map((sub) => sub.subject?._id || sub.subject)
            .filter(Boolean);

          if (!subjectIds.every((id) => validSubjectIds.includes(String(id)))) {
            return res.status(400).json({ error: 'One or more subject IDs are invalid for this semester' });
          }

          record.subjects = record.subjects.map((sub) => ({
            subject: sub.subject._id || sub.subject,
            status: sub.status || 'Pending',
            marks: sub.status === 'Passed' ? (sub.marks || 50) : (sub.marks || 0)
          }));
        }

        record.semester = semesterId;
      }

      student.semesterRecords = semesterRecords;

      const latestRecord = semesterRecords[semesterRecords.length - 1];
      if (latestRecord.subjects && Array.isArray(latestRecord.subjects)) {
        student.subjects = latestRecord.subjects
          .filter(sub => sub.status === 'Pending')
          .map(sub => sub.subject);
      }
    }

    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/promote/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('semester');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const currentSemesterNumber = student.semester?.number;
    if (!currentSemesterNumber || currentSemesterNumber >= 8) {
      return res.status(400).json({ error: 'Student is already in the final semester or has no current semester' });
    }

    const nextSemester = await Semester.findOne({ number: currentSemesterNumber + 1 }).populate('subjects');
    if (!nextSemester) {
      return res.status(404).json({ error: 'Next semester not found in database' });
    }

    const nextSemesterSubjects = nextSemester.subjects
      .filter((sub) => sub.department && String(sub.department) === String(student.department))
      .map((sub) => ({
        subject: sub._id,
        status: 'Pending',
        marks: 0
      }));

    student.semester = nextSemester._id;
    student.semesterRecords.push({
      semester: nextSemester._id,
      subjects: nextSemesterSubjects,
      isBacklog: false
    });

    await student.save();
    res.status(200).json({ message: `Student promoted to semester ${nextSemester.number}`, student });
  } catch (error) {
    res.status(500).json({ error: 'Server error during promotion' });
  }
});

router.put('/edit-semester/:id', async (req, res) => {
  try {
    const { semesterId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const semester = await Semester.findById(semesterId).populate('subjects');
    if (!semester) {
      return res.status(400).json({ error: 'Invalid semester ID' });
    }

    if (String(student.semester) === String(semesterId)) {
      return res.status(400).json({ error: 'Student is already in the selected semester' });
    }

    const semesterSubjects = semester.subjects
      .filter((sub) => sub.department && String(sub.department) === String(student.department))
      .map((sub) => ({
        subject: sub._id,
        status: 'Pending',
        marks: 0
      }));

    student.semester = semesterId;
    if (!student.semesterRecords.some((record) => String(record.semester) === String(semesterId))) {
      student.semesterRecords.push({
        semester: semesterId,
        subjects: semesterSubjects,
        isBacklog: false
      });
    }

    if (student.semesterRecords && student.semesterRecords.length > 0) {
      student.semesterRecords = student.semesterRecords.filter(
        record => record.semester && String(record.semester) <= String(semesterId)
      );
    }

    await student.save();
    res.status(200).json({
      message: `Student's current semester updated to ${semester.number}`,
      student
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/add-backlog', async (req, res) => {
  try {
    const { subjectIds, semesterId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const semester = await Semester.findById(semesterId).populate('subjects');
    if (!semester) return res.status(400).json({ error: 'Invalid semester ID' });

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ error: 'subjectIds must be a non-empty array' });
    }
    const validSubjectIds = semester.subjects.map((sub) => String(sub._id));
    if (!subjectIds.every((id) => validSubjectIds.includes(String(id)))) {
      return res.status(400).json({ error: 'One or more subject IDs are invalid for this semester' });
    }

    subjectIds.forEach(subjectId => {
      const existingBacklog = student.backlogs.find(
        backlog => backlog.subject && backlog.semester &&
          String(backlog.subject) === String(subjectId) && String(backlog.semester) === String(semesterId)
      );
      if (!existingBacklog) {
        student.backlogs.push({
          subject: subjectId,
          semester: semesterId,
          status: 'Pending'
        });
      }
    });

    await student.save();
    res.json({ message: 'Backlog(s) added', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/update-backlog/:backlogId', async (req, res) => {
  try {
    const { status } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const backlog = student.backlogs.id(req.params.backlogId);
    if (!backlog) return res.status(404).json({ error: 'Backlog not found' });

    if (!['Pending', 'Cleared'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use Pending or Cleared' });
    }

    backlog.status = status;
    await student.save();
    res.json({ message: 'Backlog status updated', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subjects/:semesterId/:departmentId', async (req, res) => {
  try {
    const { semesterId, departmentId } = req.params;

    const semester = await Semester.findById(semesterId).populate('subjects');
    if (!semester) {
      return res.status(400).json({ error: 'Invalid semester ID' });
    }

    const subjects = semester.subjects.filter(
      (subject) => subject.department && String(subject.department) === departmentId
    );

    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;