const Place = require('../models/Place');

async function getComputerMove(used, letter) {
  const regex = new RegExp('^' + letter, 'i');

  // Normalize used places to lowercase for safer matching
  const usedLower = used.map(name => name.toLowerCase());

  // Find available places starting with the required letter and not used yet
  const choices = await Place.find({
    name: regex
  }).lean();

  // Filter choices manually to ensure case-insensitive comparison with used list
  const validChoices = choices.filter(place => !usedLower.includes(place.name.toLowerCase()));

  if (validChoices.length === 0) return null;

  const pick = validChoices[Math.floor(Math.random() * validChoices.length)].name;
  return pick;
}

module.exports = getComputerMove;
