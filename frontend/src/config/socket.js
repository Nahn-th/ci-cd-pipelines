import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket = null;

/**
 * Get or create Socket.IO connection
 * @param {string} token - JWT token
 * @returns {import("socket.io-client").Socket}
 */
export const getSocket = (token) => {
  if (!socket || !socket.connected) {
    socket = io(API_BASE_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
};

export const connectSocket = (token) => {
  const s = getSocket(token);
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};