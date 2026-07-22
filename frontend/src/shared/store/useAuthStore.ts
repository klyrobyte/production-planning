import { create } from 'zustand';
import api from '../lib/axios';
import { destroySocket } from '../lib/socket';
import { clearBtPairing } from './useBtPrinterStore';

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
  activeMachineName: string | null;
  activeMachineCode: string | null;
  activeFactoryId: string | null;
  activeFactoryName: string | null;
  memberName: string | null;
  isOperatorAuthenticated: boolean;
  loginDevice: (username: string, password: string) => Promise<void>;
  logoutDevice: () => Promise<void>;
  checkSession: () => Promise<void>;
  verifyOperatorPin: (factoryId: string, factoryName: string, machineId: string, machineName: string, machineCode: string, pin: string, memberName: string) => Promise<void>;
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
          activeMachineName: parsed.machineName || null,
          activeMachineCode: parsed.machineCode || null,
          activeFactoryId: parsed.factoryId,
          activeFactoryName: parsed.factoryName || null,
          memberName: parsed.memberName,
          isOperatorAuthenticated: true,
        };
      }
    }
  } catch (e) {
    console.warn('LocalStorage error reading operator session:', e);
  }
  return { activeMachineId: null, activeMachineName: null, activeMachineCode: null, activeFactoryId: null, activeFactoryName: null, memberName: null, isOperatorAuthenticated: false };
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
    activeMachineName: initialOperator.activeMachineName,
    activeMachineCode: initialOperator.activeMachineCode,
    activeFactoryId: initialOperator.activeFactoryId,
    activeFactoryName: initialOperator.activeFactoryName,
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
      localStorage.setItem('sugity_device_session', 'true');
    },

    // Log out workstation device and clear session cookie
    logoutDevice: async () => {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.warn('Logout request exception:', e);
      } finally {
        destroySocket();
        get().logoutOperator();
        localStorage.removeItem('sugity_device_session');
        set({
          user: null,
          isAuthenticated: false,
          activePortal: 'guest',
        });
      }
    },

    // Verify current workstation device session status on app mount
    checkSession: async () => {
      const hasSession = localStorage.getItem('sugity_device_session');
      if (!hasSession) {
        set({ isCheckingSession: false, isAuthenticated: false, user: null, activePortal: 'guest' });
        return;
      }

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
    verifyOperatorPin: async (factoryId, factoryName, machineId, machineName, machineCode, pin, memberName) => {
      await api.post('/auth/verify-member-pin', { machine_id: machineId, pin });
      
      const sessionPayload = {
        factoryId,
        factoryName,
        machineId,
        machineName,
        machineCode,
        memberName,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('sugity_operator_session', JSON.stringify(sessionPayload));

      set({
        activeMachineId: machineId,
        activeMachineName: machineName,
        activeMachineCode: machineCode,
        activeFactoryId: factoryId,
        activeFactoryName: factoryName,
        memberName,
        isOperatorAuthenticated: true,
      });
    },


    // Log out operator session and clear storage variables
    logoutOperator: () => {
      localStorage.removeItem('sugity_operator_session');
      clearBtPairing(); // clears localStorage + Zustand BT store state
      set({
        activeMachineId: null,
        activeMachineName: null,
        activeMachineCode: null,
        activeFactoryId: null,
        activeFactoryName: null,
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
