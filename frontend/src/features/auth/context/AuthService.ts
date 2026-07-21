import api from '../../../shared/lib/axios';
import type { FactoryData, MachineData } from './AuthTypes';

export class AuthService {
  /**
   * Fetch factories list from backend API
   */
  async getFactories(): Promise<FactoryData[]> {
    try {
      const res = await api.get('/factories');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to load factories:', err);
      throw err;
    }
  }

  /**
   * Fetch machines list by factory ID from backend API
   */
  async getMachinesByFactory(factoryId: string): Promise<MachineData[]> {
    if (!factoryId) return [];
    try {
      const res = await api.get(`/machines?factory_id=${factoryId}`);
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to load machines:', err);
      throw err;
    }
  }

  /**
   * Validate device login form input fields
   */
  validateDeviceForm(username: string): string | null {
    if (username.trim().length < 3) {
      return 'Username harus minimal 3 karakter.';
    }
    return null;
  }

  /**
   * Validate member operator login form input fields
   */
  validateMemberForm(machineId: string, memberName: string, pin: string): string | null {
    if (!machineId) {
      return 'Silakan pilih mesin terlebih dahulu.';
    }
    if (memberName.trim().length === 0) {
      return 'Nama operator wajib diisi.';
    }
    if (pin.length !== 4) {
      return 'PIN harus berupa 4 karakter alfanumerik.';
    }
    return null;
  }
}

export const authService = new AuthService();
