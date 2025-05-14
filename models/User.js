// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin'], default: 'super_admin' }, // Only super_admin role allowed
});

module.exports = mongoose.model('User', UserSchema);
