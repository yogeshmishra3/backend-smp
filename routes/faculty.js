const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');

// Create faculty
router.post('/', async (req, res) => {
  try {
    const { name, role, employmentStatus, username, password } = req.body;
    const faculty = new Faculty({ name, role, employmentStatus, username, password });
    await faculty.save();
    res.status(201).json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all faculty
router.get('/', async (req, res) => {
  try {
    const faculty = await Faculty.find();
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update employment status
router.put('/:id/status', async (req, res) => {
  try {
    const { employmentStatus } = req.body;
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { employmentStatus },
      { new: true }
    );
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete faculty
router.delete('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json({ message: 'Faculty deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
