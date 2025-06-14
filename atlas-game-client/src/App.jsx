import React, { useEffect, useState } from "react";
import Globe from "react-globe.gl";
import socket from "./socket";
import GameInterface from "./components/GameInterface";

const App = () => {
  const [gameCode, setGameCode] = useState("");
  const [status, setStatus] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [currentLetter, setCurrentLetter] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [usedPlaces, setUsedPlaces] = useState([]);

  useEffect(() => {
    // Game start handler
    socket.on("gameStart", ({ currentLetter, currentPlayer, players }) => {
      setGameStarted(true);
      setCurrentLetter(currentLetter);
      setCurrentPlayer(currentPlayer);
      setPlayers(players);
      setUsedPlaces([]);
      setStatus(`🎮 Game started! Starting letter: ${currentLetter}`);
    });

    socket.on("invalidCode", () => {
      setStatus("❌ Invalid game code.");
    });

    socket.on("playerJoined", (joinedPlayers) => {
      setPlayers(joinedPlayers);
      setStatus(`👥 Players in lobby: ${joinedPlayers.join(", ")}`);
    });

    socket.on("placeResult", ({ player, place, valid, error }) => {
      if (valid) {
        setUsedPlaces((prev) => [...prev, place.toLowerCase()]);
        setStatus(`✅ ${player} played: ${place}`);
      } else {
        setStatus(`❌ ${player} failed: ${place} (${error})`);
      }
    });

    socket.on("turnChanged", ({ nextPlayer }) => {
      setCurrentPlayer(nextPlayer);
    });

    socket.on("letterChanged", ({ newLetter }) => {
      setCurrentLetter(newLetter);
      setStatus(`🔤 New letter: ${newLetter}`);
    });

    socket.on("playerPassed", ({ player, auto }) => {
      const msg = auto ? `⏱️ ${player} auto-passed` : `⏭️ ${player} passed`;
      setStatus(msg);
    });

    socket.on("usedPlacesUpdate", (places) => {
      setUsedPlaces(places.map(p => p.toLowerCase()));
    });

    return () => {
      socket.off("gameStart");
      socket.off("invalidCode");
      socket.off("playerJoined");
      socket.off("placeResult");
      socket.off("turnChanged");
      socket.off("letterChanged");
      socket.off("playerPassed");
      socket.off("usedPlacesUpdate");
    };
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch("http://localhost:3000/create-session", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setGameCode(data.code);
        setStatus(`✅ Created game with code: ${data.code}`);
      } else {
        setStatus("❌ Failed to create game session.");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Server error.");
    }
  };

  const handleJoin = () => {
    if (!playerName) {
      setStatus("⚠️ Please enter your name.");
      return;
    }
    setStatus(`🔗 Joining game: ${gameCode}`);
    socket.emit("join-game", { sessionId: gameCode, playerName });
  };

  return (
    <div className="app-container">
      <div className="globe-container">
        <Globe globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg" />
      </div>
     <div className="form-container">
  <h1>🌍 Atlas Game</h1>

  {!gameStarted ? (
    <>
      <div className="input-row">
        <input
          type="text"
          placeholder="Enter Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <br></br>
        <br></br>
        <button onClick={handleCreate}>🎮 Create New Game</button>
      </div>
<br></br>
        <br></br>
      <div className="input-row">
        <input
          type="text"
          placeholder="Enter Game Code"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
        />
        <br></br>
        <br></br>
        <button onClick={handleJoin}>🔗 Join Game</button>
      </div>

      {players.length > 0 && (
        <p>
          👥 Waiting for second player... <br />
          Current: <strong>{players.join(", ")}</strong>
        </p>
      )}

      <p>{status}</p>
    </>
  ) : (
    <>
      <GameInterface
        sessionId={gameCode}
        playerName={playerName}
        currentPlayer={currentPlayer}
        usedPlaces={usedPlaces}
      />
      <p>{status}</p>
    </>
  )}
</div>

    </div>
  );
};

export default App;
