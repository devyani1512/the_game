const mongoose = require('mongoose');
require("../db");
const placeSchema = new mongoose.Schema({
  name: String,
  type: String, // 'city' or 'country'
  country: String // for cities only
});

module.exports = mongoose.model('Place', placeSchema);
