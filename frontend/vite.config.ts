import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configure Vite server proxy to forward api requests to backend
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ['.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          const originalOn = proxy.on;
          const originalAddListener = proxy.addListener;

          const wrap = (event: string, handler: any) => {
            if (event === 'error') {
              return (...args: any[]) => {
                const err = args[0];
                if (err && (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.message?.includes('ECONNRESET') || err.message?.includes('ECONNABORTED'))) {
                  return;
                }
                return handler(...args);
              };
            }
            return handler;
          };

          (proxy as any).on = function (event: string, handler: any) {
            return originalOn.call(this, event as any, wrap(event, handler));
          };

          (proxy as any).addListener = function (event: string, handler: any) {
            return originalAddListener.call(this, event as any, wrap(event, handler));
          };
        }
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => {
          const originalOn = proxy.on;
          const originalAddListener = proxy.addListener;

          const wrap = (event: string, handler: any) => {
            if (event === 'error') {
              return (...args: any[]) => {
                const err = args[0];
                if (err && (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.message?.includes('ECONNRESET') || err.message?.includes('ECONNABORTED'))) {
                  return;
                }
                return handler(...args);
              };
            }
            return handler;
          };

          (proxy as any).on = function (event: string, handler: any) {
            return originalOn.call(this, event as any, wrap(event, handler));
          };

          (proxy as any).addListener = function (event: string, handler: any) {
            return originalAddListener.call(this, event as any, wrap(event, handler));
          };

          (proxy as any).on('proxyReqWs', (...args: any[]) => {
            const socket = args[2];
            if (socket) {
              socket.on('error', () => { });
            }
          });

          (proxy as any).on('open', (...args: any[]) => {
            const proxySocket = args[0];
            if (proxySocket) {
              proxySocket.on('error', () => { });
            }
          });
        }
      }
    }
  }
})


