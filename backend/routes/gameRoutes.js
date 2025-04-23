const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const GameSession = require('../models/GameSession');
const Place = require('../models/Place');
const getComputerMove = require('../utils/computerPlayer');

const router = express.Router();

function getRandomNewLetter(current) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(l => l !== current.toLowerCase());
  return letters[Math.floor(Math.random() * letters.length)];
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();
    res.status(201).json({ message: 'Registered', userId: user._id });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });
    res.status(200).json({ message: 'Login successful', userId: user._id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.post('/start-game', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await GameSession.updateMany({ userId: user._id }, { isOver: true });

    const session = new GameSession({
      userId: user._id,
      usedPlaces: [],
      currentLetter: 's',
      passCount: 0,
      isOver: false,
      turn: 'user',
      timer: 60
    });

    await session.save();
    res.status(200).json({ ...session.toObject(), userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/submit-place', async (req, res) => {
  const { userId, place } = req.body;
  const session = await GameSession.findOne({ userId, isOver: false });

  if (!session) return res.status(400).json({ error: 'No active session found.' });
  if (session.turn !== 'user') return res.status(400).json({ error: "It's not your turn." });

  const inputPlace = place.trim().toLowerCase();

  if (session.usedPlaces.includes(inputPlace)) return res.status(400).json({ error: 'Place already used.' });

  if (session.usedPlaces.length === 0 && !inputPlace.startsWith('s')) {
    return res.status(400).json({ error: 'First place must start with "S".' });
  } else if (session.usedPlaces.length > 0 && inputPlace[0] !== session.currentLetter) {
    return res.status(400).json({ error: `Place must start with "${session.currentLetter.toUpperCase()}"` });
  }

  // const valid = await Place.findOne({ name: new RegExp('^' + place + '$', 'i') });
  const valid = await Place.findOne({ name: { $regex: `^${inputPlace}$`, $options: 'i' } });

  if (!valid) return res.status(400).json({ error: 'Place not found in database.' });

  session.usedPlaces.push(inputPlace);
  session.currentLetter = inputPlace.slice(-1).toLowerCase();
  session.turn = 'computer';

  const compMove = await getComputerMove(session.usedPlaces, session.currentLetter);
  if (compMove) {
    session.usedPlaces.push(compMove.toLowerCase());
    session.currentLetter = compMove.slice(-1).toLowerCase();
    session.turn = 'user';
  } else {
    session.isOver = true;
  }

  session.timer = 60;
  await session.save();

  res.status(200).json({
    userMove: place,
    computerMove: compMove || null,
    nextLetter: session.currentLetter,
    gameOver: session.isOver,
    winner: session.isOver ? 'user' : null
  });
});

router.post('/pass', async (req, res) => {
  const { userId } = req.body;

  const session = await GameSession.findOne({ userId, isOver: false });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const computerMove = await getComputerMove(session.usedPlaces, session.currentLetter);

  if (computerMove) {
    session.usedPlaces.push(computerMove.toLowerCase());
    session.currentLetter = computerMove.slice(-1).toLowerCase();
  } else {
    session.currentLetter = getRandomNewLetter(session.currentLetter);
  }

  session.passCount += 1;
  const gameOver = session.passCount >= 3;

  if (gameOver) {
    session.isOver = true;
    await session.save();

    await GameSession.updateMany({ userId: session.userId }, { isOver: true });

    const newSession = new GameSession({
      userId: session.userId,
      usedPlaces: [],
      currentLetter: 's',
      passCount: 0,
      isOver: false,
      turn: 'user',
      timer: 60
    });

    await newSession.save();

    return res.status(200).json({
      passes: session.passCount,
      computerMove,
      newSession,
      gameOver
    });
  }

  session.timer = 60;
  session.turn = 'user';
  await session.save();

  res.status(200).json({
    passes: session.passCount,
    computerMove,
    nextLetter: session.currentLetter,
    gameOver: false
  });
});
router.post('/logout', (req, res) => {
  // If you were using sessions: req.session.destroy();
  // If JWT, the client should simply delete the token (nothing to do here).
  res.status(200).json({ message: 'Logout successful' });
});


module.exports = router;
