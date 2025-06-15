// src/socket.js
import { io } from "socket.io-client";

const socket = io("https://the-game-q9mr.onrender.com"); // Make sure this is your backend URL

export default socket;
