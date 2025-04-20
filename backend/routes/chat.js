const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Search users
router.get('/users', async (req, res) => {
  const { q } = req.query;
  const users = await User.find({ username: { $regex: q, $options: 'i' } });
  res.json(users);
});

module.exports = router;
