import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyToken } from '../modules/auth/jwt.util';
import { env } from '../config/env';

// Creates and configures the Socket.io server
export const createSocketServer = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate socket connections using the same JWT cookie
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.cookie
      ?.split(';')
      .find((c) => c.trim().startsWith(`${env.cookieName}=`))
      ?.split('=')[1];

    if (!token) return next(new Error('Unauthorized: no token.'));

    const payload = verifyToken(token);
    if (!payload) return next(new Error('Unauthorized: invalid token.'));

    (socket as any).user = payload;
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`[Socket] Connected: ${user?.username} (${socket.id})`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
};
