import { Request, Response } from 'express';
import { authService } from './auth.service';
import { verifyToken } from './jwt.util';
import { env } from '../../config/env';

const cookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? ('none' as const) : ('lax' as const),
  maxAge: env.cookieMaxAge * 1000, // ms
};

export const authController = {
  // POST /api/auth/login
  login: async (req: Request, res: Response) => {
    // Prevent double login
    const existingToken = req.cookies?.[env.cookieName];
    if (existingToken && verifyToken(existingToken)) {
      res.status(400).json({
        status: 'error',
        code: 'ALREADY_AUTHENTICATED',
        message: 'Anda sudah login. Silakan logout terlebih dahulu.',
      });
      return;
    }

    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'Username dan password wajib diisi.' });
      return;
    }
    const token = await authService.login(username, password);
    res.cookie(env.cookieName, token, cookieOpts).json({ status: 'ok', message: 'Login berhasil.' });
  },

  // POST /api/auth/logout
  logout: (_req: Request, res: Response) => {
    res.clearCookie(env.cookieName, cookieOpts).json({ status: 'ok', message: 'Logout berhasil.' });
  },

  // GET /api/auth/me
  me: async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    res.json({ status: 'ok', data: user });
  },

  // POST /api/auth/verify-member-pin
  verifyMemberPin: async (req: Request, res: Response) => {
    const { machine_id, pin } = req.body;
    if (!machine_id || !pin) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'machine_id dan pin wajib diisi.' });
      return;
    }
    await authService.verifyMemberPin(machine_id, String(pin));
    res.json({ status: 'ok', message: 'PIN valid.' });
  },
};
