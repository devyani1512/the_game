// import React, { useEffect, useRef, useState } from "react";
// import socket from "../socket";

// const GameInterface = ({ sessionId, playerName, currentPlayer, usedPlaces }) => {
//   const [placeInput, setPlaceInput] = useState("");
//   const [log, setLog] = useState([]);
//   const [yourTurn, setYourTurn] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
//   const [currentLetter, setCurrentLetter] = useState("A");

//   const [gameEnded, setGameEnded] = useState(false);
//   const [winnerName, setWinnerName] = useState("");
//   const [endReason, setEndReason] = useState("");

//   const intervalRef = useRef(null);
//   const timeRef = useRef(300);

//   // ⏱ Timer for the current turn
//   useEffect(() => {
//     const isYourTurn = currentPlayer === playerName;
//     setYourTurn(isYourTurn);

//     if (isYourTurn) {
//       intervalRef.current = setInterval(() => {
//         timeRef.current -= 1;
//         setTimeLeft(timeRef.current);

//         if (timeRef.current <= 0) {
//           clearInterval(intervalRef.current);
//           socket.emit("out-of-time", { sessionId });
//         }
//       }, 1000);
//     } else {
//       clearInterval(intervalRef.current);
//     }

//     return () => clearInterval(intervalRef.current);
//   }, [currentPlayer, playerName, sessionId]);

//   // ⌛ Listen for timer updates from server
//   useEffect(() => {
//     socket.on("timerUpdate", (timeRemainingMap) => {
//       const myTime = timeRemainingMap[socket.id];
//       if (myTime !== undefined) {
//         timeRef.current = myTime;
//         setTimeLeft(myTime);
//       }
//     });

//     return () => {
//       socket.off("timerUpdate");
//     };
//   }, []);

//   // 🧠 Game events
//   useEffect(() => {
//     socket.on("placeResult", ({ player, place, valid, error }) => {
//       const message = valid
//         ? ` ${player} played: ${place}`
//         : ` ${player} submitted an invalid place: ${place} (${error})`;
//       setLog((prev) => [message, ...prev]);
//     });

//     socket.on("turnChanged", ({ nextPlayer, currentLetter }) => {
//       setYourTurn(nextPlayer === playerName);
//       setCurrentLetter(currentLetter);
//     });

//     socket.on("letterChanged", ({ newLetter }) => {
//       setCurrentLetter(newLetter);
//       setLog((prev) => [` New Letter: ${newLetter}`, ...prev]);
//     });

//     socket.on("playerPassed", ({ player, auto }) => {
//       const msg = auto ? ` ${player} auto-passed!` : `⏭ ${player} passed!`;
//       setLog((prev) => [msg, ...prev]);
//     });

//     return () => {
//       socket.off("placeResult");
//       socket.off("turnChanged");
//       socket.off("letterChanged");
//       socket.off("playerPassed");
//     };
//   }, [playerName]);

//   // 🏁 Game Over Handler
//   useEffect(() => {
//     const onGameOver = ({ loser, reason }) => {
//       setGameEnded(true);
//       setEndReason(reason);
//       const winner = playerName === loser ? "Opponent" : playerName;
//       setWinnerName(winner);
//       clearInterval(intervalRef.current);
//     };

//     socket.on("gameOver", onGameOver);
//     return () => socket.off("gameOver", onGameOver);
//   }, [playerName]);

//   // 🎯 Submit a place
//   const handleSubmit = () => {
//     if (!placeInput) return;

//     const alreadyUsed = usedPlaces.includes(placeInput.toLowerCase());
//     if (alreadyUsed) {
//       setLog((prev) => [` "${placeInput}" was already used!`, ...prev]);
//       setPlaceInput("");
//       return;
//     }

//     socket.emit("submitPlace", { sessionId, place: placeInput });

//     if (300 - timeRef.current <= 10) {
//       timeRef.current += 5;
//       setTimeLeft(timeRef.current);
//     }

//     setPlaceInput("");
//   };

//   const handlePass = () => {
//     socket.emit("pass", { sessionId });
//   };

//   // 🧾 Show Game Over
//   if (gameEnded) {
//     return (
//       <div className="p-6 max-w-xl mx-auto bg-zinc-900 text-white rounded-2xl shadow-xl text-center">
//         <h2 className="text-2xl font-bold mb-4">🏁 Game Over!</h2>
//         <p className="text-lg mb-2">Reason: <strong>{endReason}</strong></p>
//         <p className="text-lg">Winner: <strong>{winnerName}</strong></p>
//       </div>
//     );
//   }

//   // 🎮 Default Game UI
//   return (
//     <div className="p-4 max-w-xl mx-auto bg-zinc-900 text-white rounded-2xl shadow-xl">
//       <p className="text-xl font-semibold mb-2">
//          Current Letter: <strong>{currentLetter}</strong>
//       </p>
//       <p className="text-sm"> You: <strong>{playerName}</strong></p>
//       <p className="text-sm"> Turn: <strong>{currentPlayer}</strong></p>
//       <p className="text-sm"> Time Left: <strong>{Math.floor(timeLeft / 60)}m {timeLeft % 60}s</strong></p>

//       {yourTurn ? (
//         <div className="mt-4 space-y-2">
//           <input
//             type="text"
//             value={placeInput}
//             placeholder={`Enter a place starting with ${currentLetter}`}
//             onChange={(e) => setPlaceInput(e.target.value)}
//             className="w-full p-2 rounded bg-zinc-800 border border-zinc-600 placeholder-zinc-400 focus:outline-none"
//           />
//           <br />
//           <div className="flex gap-2">
//             <button
//               onClick={handleSubmit}
//               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow"
//             >
//               Submit
//             </button>

//             <button
//               onClick={handlePass}
//               className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded shadow"
//             >
//               Pass
//             </button>
//           </div>
//         </div>
//       ) : (
//         <p className="mt-4 text-zinc-400"> Waiting for opponent's turn...</p>
//       )}

//       <div className="mt-6">
//         <h4 className="text-lg font-bold mb-2"> Game Log:</h4>
//         <ul className="space-y-1 text-sm max-h-48 overflow-y-auto bg-zinc-800 rounded p-2">
//           {log.map((entry, idx) => (
//             <li key={idx} className="text-zinc-300">{entry}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default GameInterface;

import React, { useEffect, useRef, useState } from "react";
import socket from "../socket";

const GameInterface = ({ sessionId, playerName, currentPlayer, usedPlaces }) => {
  const [placeInput, setPlaceInput] = useState("");
  const [log, setLog] = useState([]);
  const [yourTurn, setYourTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentLetter, setCurrentLetter] = useState("A");
  const [gameEnded, setGameEnded] = useState(false);
  const [winnerName, setWinnerName] = useState("");
  const [endReason, setEndReason] = useState("");
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
      setCurrentLetter(currentLetter);
    });

    socket.on("letterChanged", ({ newLetter }) => {
      setCurrentLetter(newLetter);
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

  const boxStyle = {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "rgb(207, 225, 239)",
    padding: "2rem",
    borderRadius: "1rem",
    margin: "1rem auto",
    width: "100%",
    maxWidth: "600px",
    fontFamily: "Arial, sans-serif",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem",
    fontSize: "1rem",
    backgroundColor: "#000000",
    color: "aliceblue",
    border: "none",
    borderRadius: "6px",
    marginBottom: "0.5rem"
  };

  const buttonStyle = {
    backgroundColor: "#000000",
    color: "white",
    cursor: "pointer",
    padding: "0.6rem",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    width: "100%",
    transition: "background-color 0.2s"
  };

  if (gameEnded) {
    return (
      <div style={boxStyle}>
        <h2 style={{ marginBottom: "1rem" }}>🏁 Game Over!</h2>
        <p>Reason: <strong>{endReason}</strong></p>
        <p>Winner: <strong>{winnerName}</strong></p>
      </div>
    );
  }

  return (
    <div style={boxStyle}>
      <p>Current Letter: <strong>{currentLetter}</strong></p>
      <p>You: <strong>{playerName}</strong></p>
      <p>Turn: <strong>{currentPlayer}</strong></p>
      <p>Time Left: <strong>{Math.floor(timeLeft / 60)}m {timeLeft % 60}s</strong></p>

      {yourTurn ? (
        <div>
          <input
            type="text"
            value={placeInput}
            placeholder={`Enter a place starting with ${currentLetter}`}
            onChange={(e) => setPlaceInput(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleSubmit} style={buttonStyle}>Submit</button>
            <button onClick={handlePass} style={buttonStyle}>Pass</button>
          </div>
        </div>
      ) : (
        <p>Waiting for opponent's turn...</p>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <h4 style={{ marginBottom: "0.5rem" }}>Game Log:</h4>
        <ul style={{ maxHeight: "150px", overflowY: "auto", backgroundColor: "#000", padding: "1rem", borderRadius: "6px" }}>
          {log.map((entry, idx) => (
            <li key={idx}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameInterface;
