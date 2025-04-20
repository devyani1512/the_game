import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GameInterface = ({ email, setEmail }) => {
  const [session, setSession] = useState(null);
  const [place, setPlace] = useState('');
  const [used, setUsed] = useState([]);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [passes, setPasses] = useState(0);
  const [gameStatus, setGameStatus] = useState('');
  const [timer, setTimer] = useState(60);
  const [isUserTurn, setIsUserTurn] = useState(true);

  useEffect(() => {
    axios.post('http://localhost:3000/api/start-game', { email })
      .then(res => {
        setSession(res.data);
        setUsed(res.data.usedPlaces || []);
        setCurrentLetter(res.data.currentLetter || 's');
        setIsUserTurn(res.data.turn === 'user');
      })
      .catch(err => console.error(err));
  }, [email]);

  useEffect(() => {
    let timerInterval;
    if (isUserTurn && timer > 0) {
      timerInterval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isUserTurn) {
      passTurn();
    }

    return () => clearInterval(timerInterval);
  }, [isUserTurn, timer]);

  const submitPlace = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/submit-place', {
        userId: session.userId,
        place
      });

      const newUsed = [...used, res.data.userMove, res.data.computerMove].filter(Boolean);
      setUsed(newUsed);
      setCurrentLetter(res.data.nextLetter);
      setPlace('');
      setTimer(60);
      setIsUserTurn(res.data.gameOver ? false : true);

      if (res.data.gameOver) {
        setGameStatus(res.data.winner === 'user' ? 'You won!' : 'You lost!');
        alert(gameStatus);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    }
  };

  const passTurn = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/pass', {
        userId: session.userId
      });

      if (res.data.gameOver) {
        setGameStatus('Game Over. Thanks for playing!');
        const confirmRestart = window.confirm("All passes used. Start a new game?");
        if (confirmRestart) {
          const newSession = res.data.newSession;
          setSession(newSession);
          setUsed([]);
          setCurrentLetter(newSession.currentLetter || 's');
          setPasses(0);
          setPlace('');
          setTimer(60);
          setIsUserTurn(true);
        }
        return;
      }

      if (res.data.computerMove) {
        alert(`Computer played: ${res.data.computerMove}`);
        setUsed(prev => [...prev, res.data.computerMove]);
      } else {
        alert(`No move for computer. New letter is '${res.data.nextLetter.toUpperCase()}'`);
      }

      setCurrentLetter(res.data.nextLetter);
      setPasses(res.data.passes);
      setTimer(60);
      setIsUserTurn(true);
    } catch (err) {
      alert('Failed to pass turn.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    axios.post('http://localhost:3000/api/logout')
      .then(() => setEmail(null))
      .catch(err => alert('Logout failed.'));
  };

  return (
    <div style={{ ...styles.container }}>
      <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
        <button onClick={handleLogout} style={styles.button}>Logout</button>
      </div>

      <h2>Used Places</h2>
      <ul style={styles.list}>
        {used.map((u, i) => <li key={i}>{u}</li>)}
      </ul>

      <p>{currentLetter ? `Enter a place starting with '${currentLetter.toUpperCase()}'` : 'Enter a place'}:</p>

      <form onSubmit={(e) => { e.preventDefault(); submitPlace(); }}>
        <input value={place} onChange={(e) => setPlace(e.target.value)} style={styles.input} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={styles.button}>Submit</button>
          <button
            type="button"
            onClick={passTurn}
            disabled={passes >= 3 || !isUserTurn}
            style={{
              ...styles.button,
              background: passes >= 3 || !isUserTurn ? 'gray' : styles.button.background,
              cursor: passes >= 3 || !isUserTurn ? 'not-allowed' : 'pointer'
            }}
          >
            Pass ({3 - passes})
          </button>
        </div>
      </form>

      {gameStatus && <p style={{ color: '#ff6347' }}>{gameStatus}</p>}
      <p>Time remaining: {timer}s</p>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: '50%',
    right: '5%',
    transform: 'translateY(-50%)',
    width: '360px',
    padding: '25px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(14px)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.15)'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    marginBottom: '14px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff'
  },
  button: {
    flex: 1,
    padding: '10px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px'
  },
  list: {
    maxHeight: '120px',
    overflowY: 'auto',
    listStyle: 'circle',
    paddingLeft: '20px'
  }
};

export default GameInterface;
