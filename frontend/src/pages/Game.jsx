import React from 'react';
import GlobeBackground from './GlobeBackground';
import GameInterface from './GameInterface';

const Game = ({ email, setEmail }) => {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: 'black'
    }}>
      <GlobeBackground />
      
      {/* You can also wrap this in a container if you want animations later */}
      <GameInterface email={email} setEmail={setEmail} />
    </div>
  );
};

export default Game;
