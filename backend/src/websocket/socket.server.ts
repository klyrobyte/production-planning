import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyToken } from '../modules/auth/jwt.util';
import { env } from '../config/env';

let ioInstance: SocketServer | undefined;

export const getIo = (): SocketServer | undefined => ioInstance;

export const createSocketServer = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Auth: terima token dari handshake.auth.token (preferred)
  // atau fallback dari cookie header.
  io.use((socket, next) => {
    const authToken = socket.handshake.auth?.token as string | undefined;

    const cookieToken = socket.handshake.headers.cookie
      ?.split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${env.cookieName}=`))
      ?.split('=')[1];

    const token = authToken || cookieToken;

    if (!token) return next(new Error('Unauthorized: no token.'));

    const payload = verifyToken(token);
    if (!payload) return next(new Error('Unauthorized: invalid token.'));

    (socket as any).user = payload;
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`[Socket] Connected: ${user?.username} (${socket.id})`);

    // Client join room per plan ID agar broadcast bisa di-scope.
    // Frontend memanggil: socket.emit('join_plan', planId)
    socket.on('join_plan', (planId: string) => {
      if (typeof planId === 'string' && planId.length > 0) {
        socket.join(`plan:${planId}`);
        console.log(`[Socket] ${user?.username} joined room plan:${planId}`);
      }
    });

    socket.on('leave_plan', (planId: string) => {
      if (typeof planId === 'string' && planId.length > 0) {
        socket.leave(`plan:${planId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
};