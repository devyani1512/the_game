// // ✅ Updated index.js with fixed timer logic per player (interval-based)
// const express = require('express');
// const http = require('http');
// const axios = require('axios');
// const mongoose = require('mongoose');
// const { Server } = require('socket.io');
// const cors = require('cors');
// require('dotenv').config();

// const GameSession = require('./models/GameSession');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });

// app.use(cors());
// app.use(express.json());

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log("✅ MongoDB connected"))
//   .catch(err => console.log("❌ MongoDB error:", err));

// const sessions = {}; // session data

// function getNextTurnIndex(currentIndex) {
//   return (currentIndex + 1) % 2;
// }

// function getRandomLetterDifferentFrom(current) {
//   const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//   let newLetter;
//   do {
//     newLetter = alphabet[Math.floor(Math.random() * 26)];
//   } while (newLetter === current);
//   return newLetter;
// }

// function generateGameCode(length = 5) {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
// }

// app.get('/', (req, res) => res.send("Atlas game backend running 🚀"));

// app.post('/create-session', async (req, res) => {
//   try {
//     const code = generateGameCode();
//     await GameSession.create({
//       code,
//       players: [],
//       usedPlaces: [],
//       passesInRow: 0,
//       turnIndex: 0,
//       currentLetter: 'A'
//     });
//     res.json({ success: true, code });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// function startTurnTimer(sessionId, socketId) {
//   const session = sessions[sessionId];
//   if (!session) return;

//   // Clear previous interval
//   if (session.interval) {
//     clearInterval(session.interval);
//   }

//   session.currentPlayerSocket = socketId;
//   session.startTime = Date.now();

//   session.interval = setInterval(() => {
//     const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
//     const remaining = session.timeRemaining[socketId] - elapsed;

//     if (remaining <= 0) {
//       clearInterval(session.interval);
//       session.timeRemaining[socketId] = 0;

//       io.to(sessionId).emit('timerUpdate', session.timeRemaining);
//       io.to(sessionId).emit('gameOver', {
//         loser: session.playerNames[socketId],
//         reason: 'Time ran out'
//       });
//     } else {
//       io.to(sessionId).emit('timerUpdate', {
//         ...session.timeRemaining,
//         [socketId]: remaining
//       });
//     }
//   }, 1000);
// }

// async function handlePass(sessionId, socketId, auto = false) {
//   const session = await GameSession.findOne({ code: sessionId });
//   if (!session) return;

//   if (sessions[sessionId].interval) {
//     clearInterval(sessions[sessionId].interval);
//   }

//   sessions[sessionId].passCount[socketId]++;
//   if (sessions[sessionId].passCount[socketId] >= 3) {
//     io.to(sessionId).emit('gameOver', {
//       loser: sessions[sessionId].playerNames[socketId],
//       reason: 'Max passes reached'
//     });
//     return;
//   }

//   session.passesInRow += 1;
//   if (session.passesInRow >= 2) {
//     session.currentLetter = getRandomLetterDifferentFrom(session.currentLetter);
//     session.passesInRow = 0;
//     io.to(sessionId).emit('letterChanged', { newLetter: session.currentLetter });
//   }

//   session.turnIndex = getNextTurnIndex(session.turnIndex);
//   await session.save();

//   const nextSocketId = session.players[session.turnIndex];
//   io.to(sessionId).emit('turnChanged', {
//     nextPlayer: sessions[sessionId].playerNames[nextSocketId],
//     currentLetter: session.currentLetter
//   });

//   startTurnTimer(sessionId, nextSocketId);

//   io.to(sessionId).emit('playerPassed', {
//     player: sessions[sessionId].playerNames[socketId],
//     auto
//   });
// }

// io.on('connection', socket => {
//   socket.on('join-game', async ({ sessionId, playerName }) => {
//     const session = await GameSession.findOne({ code: sessionId });
//     if (!session) {
//       socket.emit('invalidCode');
//       return;
//     }

//     socket.join(sessionId);
//     if (!sessions[sessionId]) {
//       sessions[sessionId] = {
//         interval: null,
//         playerNames: {},
//         timeRemaining: {},
//         passCount: {}
//       };
//     }
//     sessions[sessionId].playerNames[socket.id] = playerName;
//     sessions[sessionId].timeRemaining[socket.id] = 300;
//     sessions[sessionId].passCount[socket.id] = 0;

//     if (!session.players.includes(socket.id)) {
//       session.players.push(socket.id);
//       await session.save();
//     }

//     const playerList = session.players.map(id => sessions[sessionId].playerNames[id]);
//     io.to(sessionId).emit('playerJoined', playerList);

//     if (session.players.length === 2) {
//       const firstPlayer = session.players[session.turnIndex];
//       io.to(sessionId).emit('gameStart', {
//         currentLetter: session.currentLetter,
//         currentPlayer: sessions[sessionId].playerNames[firstPlayer],
//         players: playerList
//       });
//       startTurnTimer(sessionId, firstPlayer);
//     }
//   });

//   socket.on('submitPlace', async ({ sessionId, place }) => {
//   const session = await GameSession.findOne({ code: sessionId });
//   if (!session) return;

//   const now = Date.now();
//   const elapsed = Math.floor((now - sessions[sessionId].startTime) / 1000);
//   sessions[sessionId].timeRemaining[socket.id] -= elapsed;

//   clearInterval(sessions[sessionId].interval);

//   if (sessions[sessionId].timeRemaining[socket.id] <= 0) {
//     io.to(sessionId).emit('gameOver', {
//       loser: sessions[sessionId].playerNames[socket.id],
//       reason: 'Time ran out'
//     });
//     return;
//   }

//   try {
//     const trimmedPlace = place.trim();
//     const firstLetter = trimmedPlace[0].toUpperCase();
//     const expectedLetter = session.currentLetter;

//     // 🔧 Validate with microservice
//     const { data } = await axios.post('http://127.0.0.1:5001/validate', { place: trimmedPlace });

//     // 🔧 Check if valid place and starts with correct letter
//     const alreadyUsed = session.usedPlaces.includes(trimmedPlace);
//     const startsWrong = firstLetter !== expectedLetter;
//     const notValid = !data.valid;

//     if (notValid || alreadyUsed || startsWrong) {
//       let errorMsg = "Invalid place";
//       if (alreadyUsed) errorMsg = "Already used";
//       else if (startsWrong) errorMsg = `Must start with '${expectedLetter}'`;

//       io.to(sessionId).emit('placeResult', {
//         player: sessions[sessionId].playerNames[socket.id],
//         place: trimmedPlace,
//         valid: false,
//         error: errorMsg
//       });

//       await handlePass(sessionId, socket.id);
//       return;
//     }

//     // ✅ Valid submission
//     session.usedPlaces.push(trimmedPlace);
//     session.passesInRow = 0;
//     session.currentLetter = trimmedPlace.slice(-1).toUpperCase();
//     session.turnIndex = getNextTurnIndex(session.turnIndex);
//     await session.save();

//     const nextSocketId = session.players[session.turnIndex];

//     io.to(sessionId).emit('placeResult', {
//       player: sessions[sessionId].playerNames[socket.id],
//       place: trimmedPlace,
//       valid: true
//     });

//     io.to(sessionId).emit('letterChanged', { newLetter: session.currentLetter });

//     io.to(sessionId).emit('turnChanged', {
//       nextPlayer: sessions[sessionId].playerNames[nextSocketId],
//       currentLetter: session.currentLetter
//     });

//     if (elapsed <= 10) {
//       sessions[sessionId].timeRemaining[socket.id] += 5;
//     }

//     startTurnTimer(sessionId, nextSocketId);
//   } catch (err) {
//     io.to(sessionId).emit('placeResult', {
//       player: sessions[sessionId].playerNames[socket.id],
//       place,
//       valid: false,
//       error: "Validation failed"
//     });
//   }
// });


//   socket.on('pass', async ({ sessionId }) => {
//     await handlePass(sessionId, socket.id);
//   });

//   socket.on('disconnect', () => {
//     for (const sessionId in sessions) {
//       delete sessions[sessionId]?.playerNames[socket.id];
//     }
//   });
// });

// server.listen(3000, () => {
//   console.log("🌍 Backend running at http://localhost:3000");
// });
// ✅ Updated index.js with full win condition logic
const express = require('express');
const http = require('http');
const axios = require('axios');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const GameSession = require('./models/GameSession');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

const sessions = {}; // session data

function getNextTurnIndex(currentIndex) {
  return (currentIndex + 1) % 2;
}

function getRandomLetterDifferentFrom(current) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let newLetter;
  do {
    newLetter = alphabet[Math.floor(Math.random() * 26)];
  } while (newLetter === current);
  return newLetter;
}

function generateGameCode(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

app.get('/', (req, res) => res.send("Atlas game backend running 🚀"));

app.post('/create-session', async (req, res) => {
  try {
    const code = generateGameCode();
    await GameSession.create({
      code,
      players: [],
      usedPlaces: [],
      passesInRow: 0,
      turnIndex: 0,
      currentLetter: 'A'
    });
    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function startTurnTimer(sessionId, socketId) {
  const session = sessions[sessionId];
  if (!session) return;

  if (session.interval) {
    clearInterval(session.interval);
  }

  session.currentPlayerSocket = socketId;
  session.startTime = Date.now();

  session.interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
    const remaining = session.timeRemaining[socketId] - elapsed;

    if (remaining <= 0) {
      clearInterval(session.interval);
      session.timeRemaining[socketId] = 0;

      io.to(sessionId).emit('timerUpdate', session.timeRemaining);
      io.to(sessionId).emit('gameOver', {
        loser: session.playerNames[socketId],
        reason: 'Time ran out'
      });
    } else {
      io.to(sessionId).emit('timerUpdate', {
        ...session.timeRemaining,
        [socketId]: remaining
      });
    }
  }, 1000);
}

async function handlePass(sessionId, socketId, auto = false) {
  const session = await GameSession.findOne({ code: sessionId });
  if (!session) return;

  if (sessions[sessionId].interval) {
    clearInterval(sessions[sessionId].interval);
  }

  sessions[sessionId].passCount[socketId]++;

  const playerIds = session.players;
  const bothPassed = playerIds.every(id => sessions[sessionId].passCount[id] >= 3);

  if (bothPassed) {
    io.to(sessionId).emit('gameOver', {
      reason: 'Both players reached max passes'
    });
    return;
  }

  if (sessions[sessionId].passCount[socketId] >= 3) {
    const nextIndex = getNextTurnIndex(session.turnIndex);
    session.turnIndex = nextIndex;
    await session.save();

    const nextSocketId = session.players[nextIndex];
    io.to(sessionId).emit('turnChanged', {
      nextPlayer: sessions[sessionId].playerNames[nextSocketId],
      currentLetter: session.currentLetter
    });
    startTurnTimer(sessionId, nextSocketId);
    io.to(sessionId).emit('playerPassed', {
      player: sessions[sessionId].playerNames[socketId],
      auto
    });
    return;
  }

  session.passesInRow += 1;
  if (session.passesInRow >= 2) {
    session.currentLetter = getRandomLetterDifferentFrom(session.currentLetter);
    session.passesInRow = 0;
    io.to(sessionId).emit('letterChanged', { newLetter: session.currentLetter });
  }

  session.turnIndex = getNextTurnIndex(session.turnIndex);
  await session.save();

  const nextSocketId = session.players[session.turnIndex];
  io.to(sessionId).emit('turnChanged', {
    nextPlayer: sessions[sessionId].playerNames[nextSocketId],
    currentLetter: session.currentLetter
  });

  startTurnTimer(sessionId, nextSocketId);

  io.to(sessionId).emit('playerPassed', {
    player: sessions[sessionId].playerNames[socketId],
    auto
  });
}

io.on('connection', socket => {
  socket.on('join-game', async ({ sessionId, playerName }) => {
    const session = await GameSession.findOne({ code: sessionId });
    if (!session) {
      socket.emit('invalidCode');
      return;
    }

    socket.join(sessionId);
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        interval: null,
        playerNames: {},
        timeRemaining: {},
        passCount: {}
      };
    }
    sessions[sessionId].playerNames[socket.id] = playerName;
    sessions[sessionId].timeRemaining[socket.id] = 300;
    sessions[sessionId].passCount[socket.id] = 0;

    if (!session.players.includes(socket.id)) {
      session.players.push(socket.id);
      await session.save();
    }

    const playerList = session.players.map(id => sessions[sessionId].playerNames[id]);
    io.to(sessionId).emit('playerJoined', playerList);

    if (session.players.length === 2) {
      const firstPlayer = session.players[session.turnIndex];
      io.to(sessionId).emit('gameStart', {
        currentLetter: session.currentLetter,
        currentPlayer: sessions[sessionId].playerNames[firstPlayer],
        players: playerList
      });
      startTurnTimer(sessionId, firstPlayer);
    }
  });

  socket.on('submitPlace', async ({ sessionId, place }) => {
    const session = await GameSession.findOne({ code: sessionId });
    if (!session) return;

    const now = Date.now();
    const elapsed = Math.floor((now - sessions[sessionId].startTime) / 1000);
    sessions[sessionId].timeRemaining[socket.id] -= elapsed;

    clearInterval(sessions[sessionId].interval);

    if (sessions[sessionId].timeRemaining[socket.id] <= 0) {
      io.to(sessionId).emit('gameOver', {
        loser: sessions[sessionId].playerNames[socket.id],
        reason: 'Time ran out'
      });
      return;
    }

    try {
      const trimmedPlace = place.trim();
      const firstLetter = trimmedPlace[0].toUpperCase();
      const expectedLetter = session.currentLetter;

axios.post('https://fur-python.onrender.com/validate', { place: trimmedPlace });


      const alreadyUsed = session.usedPlaces.includes(trimmedPlace);
      const startsWrong = firstLetter !== expectedLetter;
      const notValid = !data.valid;

      if (notValid || alreadyUsed || startsWrong) {
        let errorMsg = "Invalid place";
        if (alreadyUsed) errorMsg = "Already used";
        else if (startsWrong) errorMsg = `Must start with '${expectedLetter}'`;

        io.to(sessionId).emit('placeResult', {
          player: sessions[sessionId].playerNames[socket.id],
          place: trimmedPlace,
          valid: false,
          error: errorMsg
        });

        await handlePass(sessionId, socket.id);
        return;
      }

      session.usedPlaces.push(trimmedPlace);
      session.passesInRow = 0;
      session.currentLetter = trimmedPlace.slice(-1).toUpperCase();
      session.turnIndex = getNextTurnIndex(session.turnIndex);
      await session.save();

      const nextSocketId = session.players[session.turnIndex];

      io.to(sessionId).emit('placeResult', {
        player: sessions[sessionId].playerNames[socket.id],
        place: trimmedPlace,
        valid: true
      });

      io.to(sessionId).emit('letterChanged', { newLetter: session.currentLetter });

      io.to(sessionId).emit('turnChanged', {
        nextPlayer: sessions[sessionId].playerNames[nextSocketId],
        currentLetter: session.currentLetter
      });

      if (elapsed <= 10) {
        sessions[sessionId].timeRemaining[socket.id] += 5;
      }

      startTurnTimer(sessionId, nextSocketId);
    } catch (err) {
      io.to(sessionId).emit('placeResult', {
        player: sessions[sessionId].playerNames[socket.id],
        place,
        valid: false,
        error: "Validation failed"
      });
    }
  });

  socket.on('pass', async ({ sessionId }) => {
    await handlePass(sessionId, socket.id);
  });

  socket.on('disconnect', () => {
    for (const sessionId in sessions) {
      delete sessions[sessionId]?.playerNames[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log("🌍 Backend running at http://localhost:3000");
});
