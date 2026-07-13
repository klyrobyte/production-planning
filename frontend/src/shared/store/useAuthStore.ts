import { create } from 'zustand';
import api from '../lib/axios';

export type UserRole = 'super-admin' | 'planner' | 'leader' | 'production-board' | 'member' | 'guest';

export interface DeviceUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: DeviceUser | null;
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  activePortal: UserRole;
  activeMachineId: string | null;
  activeFactoryId: string | null;
  memberName: string | null;
  isOperatorAuthenticated: boolean;
  loginDevice: (username: string, password: string) => Promise<void>;
  logoutDevice: () => Promise<void>;
  checkSession: () => Promise<void>;
  verifyOperatorPin: (factoryId: string, machineId: string, pin: string, memberName: string) => Promise<void>;
  logoutOperator: () => void;
  setPortal: (portal: UserRole) => void;
  checkShiftCutoff: () => void;
}

// Load initial operator status from localStorage if present
const getSavedOperatorState = () => {
  try {
    const saved = localStorage.getItem('sugity_operator_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Verify login timestamp is still within the current shift
      const now = new Date();
      const loginTime = new Date(parsed.timestamp);
      if (now.getTime() - loginTime.getTime() < 12 * 60 * 60 * 1000) {
        return {
          activeMachineId: parsed.machineId,
          activeFactoryId: parsed.factoryId,
          memberName: parsed.memberName,
          isOperatorAuthenticated: true,
        };
      }
    }
  } catch (e) {
    console.warn('LocalStorage error reading operator session:', e);
  }
  return { activeMachineId: null, activeFactoryId: null, memberName: null, isOperatorAuthenticated: false };
};

// Manage auth states for device authentication and operator PIN validation
export const useAuthStore = create<AuthState>((set, get) => {
  const initialOperator = getSavedOperatorState();

  return {
    user: null,
    isAuthenticated: false,
    isCheckingSession: true,
    activePortal: 'guest',
    activeMachineId: initialOperator.activeMachineId,
    activeFactoryId: initialOperator.activeFactoryId,
    memberName: initialOperator.memberName,
    isOperatorAuthenticated: initialOperator.isOperatorAuthenticated,

    // Log in workstation device using credentials
    loginDevice: async (username, password) => {
      await api.post('/auth/login', { username, password });
      const meResponse = await api.get('/auth/me');
      const userData = meResponse.data.data;
      set({
        user: userData,
        isAuthenticated: true,
        activePortal: userData.role,
      });
    },

    // Log out workstation device and clear session cookie
    logoutDevice: async () => {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.warn('Logout request exception:', e);
      } finally {
        get().logoutOperator();
        set({
          user: null,
          isAuthenticated: false,
          activePortal: 'guest',
        });
      }
    },

    // Verify current workstation device session status on app mount
    checkSession: async () => {
      set({ isCheckingSession: true });
      try {
        const meResponse = await api.get('/auth/me');
        const userData = meResponse.data.data;
        set({
          user: userData,
          isAuthenticated: true,
          activePortal: userData.role,
        });
      } catch (err) {
        set({ user: null, isAuthenticated: false, activePortal: 'guest' });
      } finally {
        set({ isCheckingSession: false });
      }
    },

    // Validate operator PIN for a specific machine and store session
    verifyOperatorPin: async (factoryId, machineId, pin, memberName) => {
      await api.post('/auth/verify-member-pin', { machine_id: machineId, pin });
      
      const sessionPayload = {
        factoryId,
        machineId,
        memberName,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('sugity_operator_session', JSON.stringify(sessionPayload));

      set({
        activeMachineId: machineId,
        activeFactoryId: factoryId,
        memberName,
        isOperatorAuthenticated: true,
      });
    },


    // Log out operator session and clear storage variables
    logoutOperator: () => {
      localStorage.removeItem('sugity_operator_session');
      set({
        activeMachineId: null,
        activeFactoryId: null,
        memberName: null,
        isOperatorAuthenticated: false,
      });
    },

    // Set the currently active board portal (e.g. planner, leader)
    setPortal: (portal) => {
      set({ activePortal: portal });
    },

    // Perform periodic checks to trigger automatic logout at shift boundaries (07:00 & 21:00)
    checkShiftCutoff: () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      // Check if current time is exactly at shift boundary (07:00:00 or 21:00:00)
      if ((currentHours === 7 && currentMinutes === 0) || (currentHours === 21 && currentMinutes === 0)) {
        get().logoutOperator();
        get().logoutDevice();
      }
    },
  };
});
