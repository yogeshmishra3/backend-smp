const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));

// Import routes
const authRoutes = require('./routes/auth');
const superAdminRoutes = require('./routes/superAdmin');
const casteRoutes = require('./routes/caste');
const departmentRoutes = require('./routes/department');
const subjectRoutes = require('./routes/subject');
const eventRoutes = require('./routes/event');
const facultyRoutes = require('./routes/faculty');
const facultyAuthRoutes = require('./routes/facultyAuth');
const semesterRoutes = require('./routes/semester'); // ✅ ADD SEMESTER ROUTES
const streamRoutes = require('./routes/stream'); // ✅ ADD STREAM ROUTES
const studentManagementRoutes = require('./routes/StudentManagement');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/superadmin/castes', casteRoutes);
app.use('/api/superadmin/departments', departmentRoutes);
app.use('/api/superadmin/subjects', subjectRoutes);
app.use('/api/superadmin/events', eventRoutes);
app.use('/api/superadmin/semesters', semesterRoutes); // ✅ MOUNT SEMESTER ROUTES HERE
app.use('/api/faculty', facultyAuthRoutes); // ✅ MOUNT FACULTY AUTH ROUTES HERE
app.use('/api/streams', streamRoutes); // ✅ MOUNT STREAM ROUTES HERE
app.use('/api/students', studentManagementRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected ✅'))
  .catch((err) => console.log(err));

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Root route
app.get('/', (req, res) => {
  res.send('✅ Server is up and running!');
});

