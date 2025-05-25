const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: {
    type: String,
    enum: [
      "Teaching",
      "HOD",
      "Student Management",
      "Account Section Management",
      "Document Section Management",
      "Notification System Management",
      "Library Management",
      "Bus Management",
      "Hostel Management",
    ],
    required: true,
  },
  employmentStatus: {
    type: String,
    enum: ["Probation Period", "Permanent Employee"],
    default: "Probation Period",
  },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String }, // Added to align with frontend department-based grouping
});

module.exports = mongoose.model("Faculty", facultySchema);
