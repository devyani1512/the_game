
import React, { useEffect, useRef, useState } from "react";
import socket from "../socket";
// Inside GameInterface.jsx
const [gameEnded, setGameEnded] = useState(false);
const [winnerName, setWinnerName] = useState("");
const [endReason, setEndReason] = useState("");

useEffect(() => {
  const onGameOver = ({ loser, reason }) => {
    setGameEnded(true);
    setEndReason(reason);
    const winner = playerName === loser ? "Opponent" : playerName;
    setWinnerName(winner);
    clearInterval(intervalRef.current);
  };

  socket.on("gameOver", onGameOver);
  return () => socket.off("gameOver", onGameOver);
}, [playerName]);

if (gameEnded) {
  return (
    <div className="end-screen">
      <h2>🏁 Game Over</h2>
      <p>Reason: {endReason}</p>
      <p>Winner: {winnerName}</p>
    </div>
  );
}
const GameInterface = ({ sessionId, playerName, currentPlayer, usedPlaces }) => {
  const [placeInput, setPlaceInput] = useState("");
  const [log, setLog] = useState([]);
  const [yourTurn, setYourTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [currentLetter, setCurrentLetter] = useState("A"); // <-- this is now state

  const intervalRef = useRef(null);
  const timeRef = useRef(300);

  useEffect(() => {
    const isYourTurn = currentPlayer === playerName;
    setYourTurn(isYourTurn);

    if (isYourTurn) {
      intervalRef.current = setInterval(() => {
        timeRef.current -= 1;
        setTimeLeft(timeRef.current);

        if (timeRef.current <= 0) {
          clearInterval(intervalRef.current);
          socket.emit("out-of-time", { sessionId });
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [currentPlayer, playerName, sessionId]);

  useEffect(() => {
    socket.on("timerUpdate", (timeRemainingMap) => {
      const myTime = timeRemainingMap[socket.id];
      if (myTime !== undefined) {
        timeRef.current = myTime;
        setTimeLeft(myTime);
      }
    });

    return () => {
      socket.off("timerUpdate");
    };
  }, []);

  useEffect(() => {
    socket.on("placeResult", ({ player, place, valid, error }) => {
      const message = valid
        ? ` ${player} played: ${place}`
        : ` ${player} submitted an invalid place: ${place} (${error})`;
      setLog((prev) => [message, ...prev]);
    });

    socket.on("turnChanged", ({ nextPlayer, currentLetter }) => {
      setYourTurn(nextPlayer === playerName);
      setCurrentLetter(currentLetter); // 🔤 Update on turn change
    });

    socket.on("letterChanged", ({ newLetter }) => {
      setCurrentLetter(newLetter); // 🔤 Update current letter
      setLog((prev) => [` New Letter: ${newLetter}`, ...prev]);
    });

    socket.on("playerPassed", ({ player, auto }) => {
      const msg = auto ? ` ${player} auto-passed!` : `⏭ ${player} passed!`;
      setLog((prev) => [msg, ...prev]);
    });

    return () => {
      socket.off("placeResult");
      socket.off("turnChanged");
      socket.off("letterChanged");
      socket.off("playerPassed");
    };
  }, [playerName]);

  const handleSubmit = () => {
    if (!placeInput) return;

    const alreadyUsed = usedPlaces.includes(placeInput.toLowerCase());
    if (alreadyUsed) {
      setLog((prev) => [` "${placeInput}" was already used!`, ...prev]);
      setPlaceInput("");
      return;
    }

    socket.emit("submitPlace", { sessionId, place: placeInput });

    if (300 - timeRef.current <= 10) {
      timeRef.current += 5;
      setTimeLeft(timeRef.current);
    }

    setPlaceInput("");
  };

  const handlePass = () => {
    socket.emit("pass", { sessionId });
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-zinc-900 text-white rounded-2xl shadow-xl">
      <p className="text-xl font-semibold mb-2">
         Current Letter: <strong>{currentLetter}</strong>
      </p>
      <p className="text-sm"> You: <strong>{playerName}</strong></p>
      <p className="text-sm"> Turn: <strong>{currentPlayer}</strong></p>
      <p className="text-sm"> Time Left: <strong>{Math.floor(timeLeft / 60)}m {timeLeft % 60}s</strong></p>

      {yourTurn ? (
        <div className="mt-4 space-y-2">
          <input
            type="text"
            value={placeInput}
            placeholder={`Enter a place starting with ${currentLetter}`}
            onChange={(e) => setPlaceInput(e.target.value)}
            className="w-full p-2 rounded bg-zinc-800 border border-zinc-600 placeholder-zinc-400 focus:outline-none"
          />
          <br></br>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow"
            >
              Submit
            </button>
            
            <button
              onClick={handlePass}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded shadow"
            >
              Pass
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-zinc-400"> Waiting for opponent's turn...</p>
      )}

      <div className="mt-6">
        <h4 className="text-lg font-bold mb-2"> Game Log:</h4>
        <ul className="space-y-1 text-sm max-h-48 overflow-y-auto bg-zinc-800 rounded p-2">
          {log.map((entry, idx) => (
            <li key={idx} className="text-zinc-300">{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameInterface;

