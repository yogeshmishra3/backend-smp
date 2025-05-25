// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const router = express.Router();

// // Middleware to verify token
// const verifyToken = (req, res, next) => {
//   const token = req.header('Authorization')?.split(' ')[1];  // Bearer <token>
//   if (!token) {
//     return res.status(401).json({ message: 'Access Denied' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(400).json({ message: 'Invalid Token' });
//   }
// };

// // Create Super Admin
// router.post('/create', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({
//       username,
//       password: hashedPassword,
//       role: 'super_admin',
//     });

//     await newUser.save();
//     res.status(201).json({ message: 'Super Admin created successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

// // Super Admin Login
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     if (user.role !== 'super_admin') {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     const token = jwt.sign(
//       { userId: user._id, username: user.username, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.json({ token });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

// // GET route for Super Admin details
// router.get('/', verifyToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).select('-password');
//     if (!user || user.role !== 'super_admin') {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     res.json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

// module.exports = router;
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const asyncHandler = require("express-async-handler"); // For cleaner error handling

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Create Super Admin
router.post(
  "/create",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate password strength (example: minimum 8 characters)
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new super admin
    const newUser = new User({
      username,
      password: hashedPassword,
      role: "super_admin",
    });

    await newUser.save();
    res.status(201).json({ message: "Super Admin created successfully" });
  })
);

// Super Admin Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check role
    if (user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  })
);

// GET route for Super Admin details
router.get(
  "/",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user || user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(user);
  })
);

module.exports = router;
