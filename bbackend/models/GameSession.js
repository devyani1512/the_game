const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema({
  code: { type: String, unique: true }, // 👈 add this line
  players: [String],
  turnIndex: { type: Number, default: 0 },
  usedPlaces: [String],
  passesInRow: { type: Number, default: 0 },
  currentLetter: { type: String }
});

module.exports = mongoose.model("GameSession", GameSessionSchema);
