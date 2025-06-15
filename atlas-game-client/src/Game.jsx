import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("https://the-game-1.onrender.com"); // Replace with env if needed

export default function Game({ sessionId, playerId }) {
  const [currentLetter, setCurrentLetter] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [guess, setGuess] = useState("");

  useEffect(() => {
    socket.on("game-started", ({ currentLetter, currentPlayer }) => {
      setCurrentLetter(currentLetter);
      setCurrentPlayer(currentPlayer);
    });

    socket.on("turnChanged", ({ nextPlayer }) => {
      setCurrentPlayer(nextPlayer);
    });

    return () => {
      socket.off("game-started");
      socket.off("turnChanged");
    };
  }, []);

  const handleSubmit = () => {
    socket.emit("submitPlace", { sessionId, place: guess });
    setGuess("");
  };

  const handlePass = () => {
    socket.emit("pass", { sessionId });
  };

  const isMyTurn = playerId === currentPlayer;

  return (
    <div>
      <h2>Atlas Game</h2>
      <p>🧩 Starting Letter: {currentLetter}</p>
      <p>🕹️ Current Player: {currentPlayer}</p>
      <p>🧠 Your ID: {playerId}</p>

      {isMyTurn ? (
        <>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={`Place starting with ${currentLetter}`}
          />
          <button onClick={handleSubmit}>Submit</button>
          <button onClick={handlePass}>Pass</button>
        </>
      ) : (
        <p>⏳ Waiting for opponent's turn...</p>
      )}
    </div>
  );
}
