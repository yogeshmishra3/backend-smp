const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Faculty = require('../models/Faculty');
const router = express.Router();


// Create faculty
// router.post('/', async (req, res) => {
//   try {
//     const { name, role, employmentStatus, username, password } = req.body;
//     const faculty = new Faculty({ name, role, employmentStatus, username, password });
//     await faculty.save();
//     res.status(201).json(faculty);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });



router.post('/', async (req, res) => {
  try {
    const { name, role, employmentStatus, username, password } = req.body;

    // Hash the password using bcrypt before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = new Faculty({ 
      name, 
      role, 
      employmentStatus, 
      username, 
      password: hashedPassword 
    });

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



// Faculty Login (Role-based, only Permanent Employee allowed)
router.post('/rolelogin', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find faculty by username
    const faculty = await Faculty.findOne({ username });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Check if employment status is 'Permanent Employee'
    if (faculty.employmentStatus !== 'Permanent Employee') {
      return res.status(403).json({ error: 'Only Permanent Employees can log in' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, faculty.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create a JWT token
    const token = jwt.sign({ id: faculty._id, role: faculty.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with the token
    res.json({ token, faculty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;