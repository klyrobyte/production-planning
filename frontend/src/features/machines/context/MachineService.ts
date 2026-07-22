import api from '../../../shared/lib/axios';
import type { FactoryItem, MachineItem, CreateMachinePayload, UpdateMachinePayload } from './MachineTypes';

export class MachineService {
  /**
   * Fetch all factories list for dropdown selector
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
   * Fetch all machines list from backend API
   */
  async fetchMachines(): Promise<MachineItem[]> {
    try {
      const res = await api.get('/machines');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to fetch machines:', err);
      throw err;
    }
  }

  /**
   * Register a new machine via API
   */
  async createMachine(payload: CreateMachinePayload): Promise<void> {
    try {
      await api.post('/machines', payload);
    } catch (err) {
      console.error('Failed to create machine:', err);
      throw err;
    }
  }

  /**
   * Update an existing machine by ID via API
   */
  async updateMachine(id: string, payload: UpdateMachinePayload): Promise<void> {
    try {
      await api.put(`/machines/${id}`, payload);
    } catch (err) {
      console.error('Failed to update machine:', err);
      throw err;
    }
  }

  /**
   * Delete a machine by ID via API
   */
  async deleteMachine(id: string): Promise<void> {
    try {
      await api.delete(`/machines/${id}`);
    } catch (err) {
      console.error('Failed to delete machine:', err);
      throw err;
    }
  }

  /**
   * Validate form inputs for machine creation/update
   */
  validateForm(code: string, name: string, factoryId?: string): string | null {
    if (factoryId !== undefined && !factoryId) {
      return 'Pabrik wajib dipilih.';
    }
    if (!code.trim() || !name.trim()) {
      return 'Kode Mesin dan Nama Mesin wajib diisi.';
    }
    return null;
  }
}

export const machineService = new MachineService();
