import api from '../../../shared/lib/axios';
import type { UserItem, CreateUserPayload, UpdateUserPayload } from './UserTypes';

export class UserService {
  /**
   * Fetch all user accounts from backend API
   */
  async fetchUsers(): Promise<UserItem[]> {
    try {
      const res = await api.get('/users');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to fetch users:', err);
      throw err;
    }
  }

  /**
   * Register a new user account via API
   */
  async createUser(payload: CreateUserPayload): Promise<void> {
    try {
      await api.post('/users', payload);
    } catch (err) {
      console.error('Failed to create user:', err);
      throw err;
    }
  }

  /**
   * Update an existing user account by ID via API
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<void> {
    try {
      await api.put(`/users/${id}`, payload);
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  }

  /**
   * Delete a user account by ID via API
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (err) {
      console.error('Failed to delete user:', err);
      throw err;
    }
  }

  /**
   * Return CSS badge class matching the user's role
   */
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'super-admin':
        return 'bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400';
      case 'planner':
        return 'bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400';
      case 'leader':
        return 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400';
      case 'member':
        return 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400';
      case 'production-board':
        return 'bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300';
    }
  }

  /**
   * Validate form inputs for user creation
   */
  validateAddForm(username: string, name: string, password: string): string | null {
    if (!username.trim() || !name.trim() || !password.trim()) {
      return 'Semua kolom bertanda bintang wajib diisi.';
    }
    return null;
  }

  /**
   * Validate form inputs for user update
   */
  validateEditForm(name: string): string | null {
    if (!name.trim()) {
      return 'Nama lengkap wajib diisi.';
    }
    return null;
  }
}

export const userService = new UserService();
