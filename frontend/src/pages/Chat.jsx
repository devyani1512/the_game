import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

export default function Chat() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    socket.emit('join', userId);
    socket.on('receive_message', (msg) => {
      if (msg.senderId === selectedUser?._id || msg.receiverId === selectedUser?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => socket.off();
  }, [selectedUser]);

  const searchUsers = async () => {
    const res = await axios.get(`http://localhost:3000/api/chat/users?q=${search}`);
    setUsers(res.data.filter((u) => u._id !== userId));
  };

  const sendMessage = () => {
    const msg = {
      senderId: userId,
      receiverId: selectedUser._id,
      text: input,
      timestamp: new Date()
    };
    socket.emit('send_message', msg);
    setMessages((prev) => [...prev, msg]);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div>
        <h3>Welcome {username}</h3>
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={searchUsers}>Search</button>
        <ul>
          {users.map((user) => (
            <li key={user._id} onClick={() => { setSelectedUser(user); setMessages([]); }}>
              {user.username}
            </li>
          ))}
        </ul>
      </div>

      <div>
        {selectedUser && (
          <>
            <h3>Chat with {selectedUser.username}</h3>
            <div style={{ border: '1px solid #ccc', padding: 10, height: 300, overflowY: 'scroll' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ textAlign: m.senderId === userId ? 'right' : 'left' }}>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
            <input value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
          </>
        )}
      </div>
    </div>
  );
}
