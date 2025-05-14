// const express = require('express');
// const router = express.Router();
// const Department = require('../models/Department');

// // Create department
// router.post('/', async (req, res) => {
//   try {
//     const { name } = req.body;
//     const dept = new Department({ name });
//     await dept.save();
//     res.status(201).json(dept);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // Get all departments
// router.get('/', async (req, res) => {
//   try {
//     const departments = await Department.find();
//     res.json(departments);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Update department
// router.put('/:id', async (req, res) => {
//   try {
//     const dept = await Department.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
//     res.json(dept);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // Delete department
// router.delete('/:id', async (req, res) => {
//   try {
//     await Department.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Department deleted' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Create department with associated stream
router.post('/', async (req, res) => {
  try {
    const { name, stream } = req.body;
    if (!name || !stream) {
      return res.status(400).json({ error: 'Name and stream are required.' });
    }
    const dept = new Department({ name, stream });
    await dept.save();
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all departments (optionally by stream)
router.get('/', async (req, res) => {
  try {
    const { streamId } = req.query;
    const filter = streamId ? { stream: streamId } : {};
    const departments = await Department.find(filter).populate('stream');
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { name, stream } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (stream) updateData.stream = stream;

    const dept = await Department.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(dept);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
