import bcrypt from 'bcrypt';
import { authRepository } from './auth.repository';
import { signToken } from './jwt.util';
import { verifyPin } from './pin-crypto.util';
import { AppError } from '../../common/errors/AppError';

export const authService = {
  // Validates credentials and returns a signed JWT
  login: async (username: string, password: string): Promise<string> => {
    const user = await authRepository.findByUsername(username.toLowerCase().trim());
    if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Username atau password salah.');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Username atau password salah.');

    return signToken({ id: user.id, username: user.username, role: user.role, name: user.name });
  },

  // Returns the current user's profile (no sensitive fields)
  me: async (userId: string) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Session tidak valid.');
    return user;
  },

  // Verifies a member PIN for a specific machine
  verifyMemberPin: async (machineId: string, pin: string): Promise<boolean> => {
    const pinHash = await authRepository.findMachinePin(machineId);
    if (!pinHash) throw new AppError(404, 'NOT_FOUND', 'Mesin tidak ditemukan atau tidak aktif.');
    const valid = await verifyPin(pin, pinHash);
    if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'PIN tidak valid.');
    return true;
  },
};
