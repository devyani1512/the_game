import React, { useState } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import GameInterface from './components/GameInterface';
import GlobeBackground from './components/GlobeBackground'; // ⬅️ import the globe

const App = () => {
  const [email, setEmail] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  if (email) {
    return (
      <>
        <GlobeBackground /> {/* ⬅️ Add the globe here */}
        <GameInterface email={email} setEmail={setEmail} />
      </>
    );
  }

  return (
    <>
      {showLogin ? (
        <Login setEmail={setEmail} switchToRegister={() => setShowLogin(false)} />
      ) : (
        <Register setEmail={setEmail} switchToLogin={() => setShowLogin(true)} />
      )}
    </>
  );
};

export default App;
