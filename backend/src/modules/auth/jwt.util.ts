import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

interface TokenPayload {
  id: string;
  username: string;
  role: string;
  name: string;
}

// Signs a JWT valid for 30 days
export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' });

// Verifies a JWT and returns its payload, or null if invalid/expired
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
};
