import { leadersRepository } from './leaders.repository';
import { hashPin, encryptPin, verifyPin, decryptPin } from '../auth/pin-crypto.util';
import { AppError } from '../../common/errors/AppError';

export const leadersService = {
  getAll: () => leadersRepository.findAll(),

  create: async (name: string, pin: string) => {
    const [pinHash, pinEncrypted] = await Promise.all([hashPin(pin), Promise.resolve(encryptPin(pin))]);
    return leadersRepository.create(name, pinHash, pinEncrypted);
  },

  verifyPin: async (id: string | undefined, pin: string): Promise<boolean> => {

    if (!id) {
      // If no leader ID was specified, verify the PIN against all leaders in the database
      const leaders = await leadersRepository.findAllWithHash();
      for (const leader of leaders) {
        const valid = await verifyPin(pin, leader.pin_hash);
        if (valid) return true;
      }
      throw new AppError(401, 'INVALID_CREDENTIALS', 'PIN leader tidak valid.');
    }

    const leader = await leadersRepository.findByIdForVerify(id);
    if (!leader) throw new AppError(404, 'NOT_FOUND', 'Leader tidak ditemukan.');
    const valid = await verifyPin(pin, leader.pin_hash);
    if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'PIN leader tidak valid.');
    return true;
  },

  // Decrypts and returns the plain-text PIN — planner only
  revealPin: async (id: string): Promise<string> => {
    const leader = await leadersRepository.findWithPin(id);
    if (!leader) throw new AppError(404, 'NOT_FOUND', 'Leader tidak ditemukan.');
    return decryptPin(leader.pin_encrypted);
  },

  delete: async (id: string) => {
    const deleted = await leadersRepository.delete(id);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Leader tidak ditemukan.');
  },
};
