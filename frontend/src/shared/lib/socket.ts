import { io, Socket } from 'socket.io-client';

let _socket: Socket | null = null;

// Baca token dari cookie sugity_session
const getTokenFromCookie = (): string => {
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('sugity_session='));
  return match ? match.split('=')[1] : '';
};

// Singleton — panggil initSocket() berkali-kali tetap return instance yang sama
export const initSocket = (): Socket => {
  const token = getTokenFromCookie();

  if (_socket) {
    _socket.auth = {
      token: token,
    };
    return _socket;
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;

  _socket = io(socketUrl, {
    autoConnect: false,
    transports: ['polling', 'websocket'],
    withCredentials: true,
    auth: {
      token: token,
    },
  });

  return _socket;
};

// Panggil saat logout untuk bersihkan singleton
export const destroySocket = (): void => {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
};