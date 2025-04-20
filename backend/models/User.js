// models/User.js
const mongoose = require('mongoose');
require("../db");
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true }, // changed from username
  password: { type: String, required: true },
  score: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
