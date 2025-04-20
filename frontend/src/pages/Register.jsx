import React, { useState } from 'react';
import axios from 'axios';
import MapBackground from "../components/MapBackground";


const Register = ({ setEmail, switchToLogin }) => {
  const [email, setEmailInput] = useState('');
  const [password, setPassword] = useState('');

  const register = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/register', { email, password });
      alert('Registered! You can now play.');
      setEmail(email);
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <MapBackground />
      <div style={formBox}>
        <h1>Register</h1>
        <input
          placeholder="Username"
          value={email}
          onChange={e => setEmailInput(e.target.value)}
          style={input}
        /><br />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={input}
        /><br />
        <button onClick={register} style={button}>Register & Play</button>
        <p>
          Already have an account?{' '}
          <button onClick={switchToLogin} style={linkBtn}>Login</button>
        </p>
      </div>
    </div>
  );
};

const formBox = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  padding: '30px',
  borderRadius: '15px',
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  width: '320px',
  color: '#fff',
  textAlign: 'center',
  fontFamily: 'Segoe UI, sans-serif'
};

const input = {
  width: '100%',
  padding: '10px',
  margin: '10px 0',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.1)',
  color: '#fff',
  outline: 'none'
};

const button = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: 'none',
  background: '#28a745',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px'
};

const linkBtn = {
  background: 'none',
  color: '#1e90ff',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default Register;
