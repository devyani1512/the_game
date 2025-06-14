// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // Make sure this is your backend URL

export default socket;
