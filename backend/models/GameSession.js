const mongoose = require('mongoose');
require("../db");
const Schema = mongoose.Schema;

const gameSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  usedPlaces: [String],
  currentLetter: { type: String, default: 's' },
  passCount: { type: Number, default: 0 },
  isOver: { type: Boolean, default: false },
  turn: { type: String, enum: ['user', 'computer'], default: 'user' },
  timer: { type: Date, default: null }  // Store the timestamp of the end of the user's turn
});


module.exports = mongoose.model('GameSession', gameSessionSchema);
