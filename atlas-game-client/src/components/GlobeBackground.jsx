import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Globe from 'react-globe.gl';

const socket = io('https://the-game-1.onrender.com');

export default function GamePage() {
  const [placePins, setPlacePins] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [currentLetter, setCurrentLetter] = useState('');
  const [inputValue, setInputValue] = useState('');
  const globeEl = useRef();

  useEffect(() => {
    globeEl.current.controls().autoRotate = true;
    globeEl.current.controls().autoRotateSpeed = 0.5;
  }, []);

  useEffect(() => {
    socket.on('playerJoined', (playerList) => {
      setPlayers(playerList);
    });

    socket.on('gameStart', ({ currentLetter, currentPlayer, players }) => {
      setCurrentLetter(currentLetter);
      setCurrentPlayer(currentPlayer);
      setPlayers(players);
    });

    socket.on('letterChanged', ({ newLetter }) => {
      setCurrentLetter(newLetter);
    });

    socket.on('turnChanged', ({ nextPlayer }) => {
      setCurrentPlayer(nextPlayer);
    });

    socket.on('placeResult', async (data) => {
      if (!data.valid) {
        alert(data.error || "Invalid place");
        return;
      }

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.place)}`);
        const result = await res.json();
        if (result && result.length > 0) {
          const { lat, lon } = result[0];
          setPlacePins((prev) => [
            ...prev,
            { lat: parseFloat(lat), lng: parseFloat(lon), name: data.place }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch coordinates", err);
      }
    });

    return () => {
      socket.off('playerJoined');
      socket.off('gameStart');
      socket.off('letterChanged');
      socket.off('turnChanged');
      socket.off('placeResult');
    };
  }, []);

  const submitPlace = () => {
    if (inputValue.trim() !== '') {
      socket.emit('submitPlace', { sessionId: sessionStorage.getItem('sessionId'), place: inputValue });
      setInputValue('');
    }
  };

  const passTurn = () => {
    socket.emit('pass', { sessionId: sessionStorage.getItem('sessionId') });
  };

  return (
    <div style={styles.container}>
      <div style={styles.globeContainer}>
        <div style={{ width: '100%', height: '80vh' }}>
          <Globe
            ref={globeEl}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            pointsData={placePins}
            pointLat={(d) => d.lat}
            pointLng={(d) => d.lng}
            pointColor={() => 'red'}
            pointAltitude={0.02}
            pointLabel={(d) => d.name}
          />
        </div>
      </div>

      <div style={styles.panel}>
        <h2 style={styles.title}>🌍 Atlas Game</h2>
        <p><strong>Players:</strong> {players.join(', ')}</p>
        <p><strong>Current Player:</strong> {currentPlayer}</p>
        <p><strong>Current Letter:</strong> {currentLetter}</p>

        <input
          type="text"
          placeholder="Enter a place"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={styles.input}
        />

        <div style={styles.buttonGroup}>
          <button onClick={submitPlace} style={styles.button}>✅ Submit</button>
          <button onClick={passTurn} style={{ ...styles.button, backgroundColor: '#444' }}>⏭️ Pass</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    backgroundColor: '#121212',
    color: '#fff',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
  },
  globeContainer: {
    flex: 1.2,
    maxWidth: '60vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    flex: 1,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
    boxShadow: '0 0 20px rgba(0,0,0,0.4)',
    borderLeft: '1px solid #333',
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '1rem',
    color: '#00d4ff',
  },
  input: {
    padding: '12px',
    margin: '1rem 0',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #333',
    outline: 'none',
    backgroundColor: '#2a2a2a',
    color: 'white',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#00d4ff',
    border: 'none',
    color: 'black',
    transition: '0.2s ease',
  },
};

// Media query for mobile
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (max-width: 768px) {
      div[style*="flex-direction: row"] {
        flex-direction: column !important;
      }
      div[style*="flex: 1"][style*="padding: 2rem"] {
        padding: 1rem !important;
      }
    }
  `;
  document.head.appendChild(style);
}

