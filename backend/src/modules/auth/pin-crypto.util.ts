import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../../config/env';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(env.pinEncryptionKey, 'hex'); // 32 bytes

// Hashes a plain-text PIN using bcrypt (cost 10)
export const hashPin = (pin: string): Promise<string> => bcrypt.hash(pin, 10);

// Verifies a plain-text PIN against a bcrypt hash
export const verifyPin = (pin: string, hash: string): Promise<boolean> => bcrypt.compare(pin, hash);

// Encrypts a PIN for "reveal PIN" feature — result is hex-encoded ciphertext
export const encryptPin = (pin: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(pin, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
};

// Decrypts an encrypted PIN — returns the original plain-text PIN
export const decryptPin = (ciphertext: string): string => {
  const [ivHex, encHex, tagHex] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') + decipher.final('utf8');
};
