const express = require('express');
const router = express.Router();
const Student = require('../models/StudentManagement');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');

// CREATE Student Admission
router.post('/', async (req, res) => {
  try {
    const {
      firstName, middleName, lastName,
      fatherName, unicodeFatherName,
      motherName, unicodeMotherName,
      unicodeName, enrollmentNumber,
      gender, mobileNumber, casteCategory, subCaste,
      email, section, admissionType, admissionThrough, remark,
      stream, department, subjects, // Array of subject IDs
      semester
    } = req.body;

    // Validation check for required fields
    if (!firstName || !email || !mobileNumber || !gender || !stream || !department || !subjects || !semester || !admissionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure subjects is a non-empty array
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Subjects must be a non-empty array' });
    }

    // Validate admissionType
    if (!['Regular', 'Direct Second Year', 'Lateral Entry'].includes(admissionType)) {
      return res.status(400).json({ error: 'Invalid admissionType. Must be Regular, Direct Second Year, or Lateral Entry' });
    }

    // Validate semester
    const semesterDoc = await Semester.findById(semester).populate('subjects');
    if (!semesterDoc) {
      return res.status(400).json({ error: 'Invalid semester ID' });
    }

    // Validate subjects against semester and department
    const validSubjects = semesterDoc.subjects
      .filter((sub) => sub.department && String(sub.department) === department)
      .map((sub) => String(sub._id));
    if (!subjects.every((subId) => validSubjects.includes(String(subId)))) {
      return res.status(400).json({ error: 'One or more subject IDs are not valid for this semester and department' });
    }

    // Create the student object
    const student = new Student({
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

    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ All Students
router.get('/', async (req, res) => {
  try {
    const { admissionType } = req.query;
    const query = {};
    
    // Filter by admissionType if provided
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

    // Filter out invalid semesterRecords and backlogs
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

// READ Single Student
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

    // Filter out invalid semesterRecords and backlogs
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

// UPDATE Student Info
router.put('/:id', async (req, res) => {
  try {
    const { semesterRecords, admissionType, ...updateFields } = req.body;

    console.log("Received semesterRecords:", semesterRecords);

    // Find the student
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Validate admissionType if provided
    if (admissionType && !['Regular', 'Direct Second Year', 'Lateral Entry'].includes(admissionType)) {
      return res.status(400).json({ error: 'Invalid admissionType. Must be Regular, Direct Second Year, or Lateral Entry' });
    }

    // Update basic student info (like name, department, etc.)
    Object.assign(student, updateFields);
    if (admissionType) student.admissionType = admissionType;

    // Handle semesterRecords update
    if (semesterRecords && Array.isArray(semesterRecords)) {
      for (const record of semesterRecords) {
        // Extract semester ID (whether full object or just ID)
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

          // Format each subject record properly
          record.subjects = record.subjects.map((sub) => ({
            subject: sub.subject._id || sub.subject,
            status: sub.status || 'Pending',
            marks: sub.status === 'Passed' ? (sub.marks || 50) : (sub.marks || 0)
          }));
        }

        // Replace semester object with just the ID
        record.semester = semesterId;
      }

      // Save all semester records
      student.semesterRecords = semesterRecords;

      // Derive student.subjects from latest semester's pending subjects
      const latestRecord = semesterRecords[semesterRecords.length - 1];
      if (latestRecord.subjects && Array.isArray(latestRecord.subjects)) {
        student.subjects = latestRecord.subjects
          .filter(sub => sub.status === 'Pending')
          .map(sub => sub.subject);
      }
    }

    // Save the updated student
    await student.save();

    res.json(student);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Student
router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROMOTE Student to Next Semester
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

    // Get subjects for the next semester and department
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
    console.error('Promote Error:', error);
    res.status(500).json({ error: 'Server error during promotion' });
  }
});

// DEMOTE or EDIT Student's Current Semester
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

    // Update semester and add new semester record with subjects
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
    console.error('Error updating student semester:', err);
    res.status(500).json({ error: err.message });
  }
});

// ADD/UPDATE Backlog
router.post('/:id/add-backlog', async (req, res) => {
  try {
    const { subjectIds, semesterId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Validate semester
    const semester = await Semester.findById(semesterId).populate('subjects');
    if (!semester) return res.status(400).json({ error: 'Invalid semester ID' });

    // Validate subjects
    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ error: 'subjectIds must be a non-empty array' });
    }
    const validSubjectIds = semester.subjects.map((sub) => String(sub._id));
    if (!subjectIds.every((id) => validSubjectIds.includes(String(id)))) {
      return res.status(400).json({ error: 'One or more subject IDs are invalid for this semester' });
    }

    // Add each subject to backlogs if not already present
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

// UPDATE Backlog Status (Pending -> Cleared)
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

// GET Subjects for a Specific Semester and Department
router.get('/subjects/:semesterId/:departmentId', async (req, res) => {
  try {
    const { semesterId, departmentId } = req.params;

    // Validate semester
    const semester = await Semester.findById(semesterId).populate('subjects');
    if (!semester) {
      return res.status(400).json({ error: 'Invalid semester ID' });
    }

    // Filter subjects by department
    const subjects = semester.subjects.filter(
      (subject) => subject.department && String(subject.department) === departmentId
    );

    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;