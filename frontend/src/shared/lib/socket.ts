import { io, Socket } from 'socket.io-client';

// Initialize a Socket.io client connection helper
export const initSocket = (): Socket => {
  return io({
    autoConnect: false,
    transports: ['websocket'],
  });
};
