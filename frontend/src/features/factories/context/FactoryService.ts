import api from '../../../shared/lib/axios';
import type { FactoryItem, FactoryPayload } from './FactoryTypes';

export class FactoryService {
  /**
   * Fetch all factories list from backend API
   */
  async fetchFactories(): Promise<FactoryItem[]> {
    try {
      const res = await api.get('/factories');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to fetch factories:', err);
      throw err;
    }
  }

  /**
   * Register a new factory via API
   */
  async createFactory(payload: FactoryPayload): Promise<void> {
    try {
      await api.post('/factories', payload);
    } catch (err) {
      console.error('Failed to create factory:', err);
      throw err;
    }
  }

  /**
   * Update an existing factory by ID via API
   */
  async updateFactory(id: string, payload: FactoryPayload): Promise<void> {
    try {
      await api.put(`/factories/${id}`, payload);
    } catch (err) {
      console.error('Failed to update factory:', err);
      throw err;
    }
  }

  /**
   * Delete a factory by ID via API
   */
  async deleteFactory(id: string): Promise<void> {
    try {
      await api.delete(`/factories/${id}`);
    } catch (err) {
      console.error('Failed to delete factory:', err);
      throw err;
    }
  }

  /**
   * Validate form inputs for factory creation/update
   */
  validateForm(code: string, name: string): string | null {
    if (!code.trim() || !name.trim()) {
      return 'Kode dan Nama Pabrik wajib diisi.';
    }
    return null;
  }
}

export const factoryService = new FactoryService();
