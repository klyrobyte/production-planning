import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useToastStore } from '../../../shared/store/useToastStore';
import { authService } from './AuthService';
import type { FactoryData, MachineData } from './AuthTypes';

interface AuthContextType {
  // Theme & Session Header Data
  isAuthenticated: boolean;
  user: any;
  logoutDevice: () => void;
  colorPrimary: string;
  systemTitle: string;
  systemLogo: string;

  // Device Login State & Actions
  deviceUsername: string;
  setDeviceUsername: (val: string) => void;
  devicePassword: string;
  setDevicePassword: (val: string) => void;
  deviceError: string | null;
  isDeviceLoading: boolean;
  handleDeviceSubmit: (e: React.FormEvent) => Promise<void>;

  // Member Login State & Actions
  factories: FactoryData[];
  machines: MachineData[];
  selectedFactoryId: string;
  setSelectedFactoryId: (id: string) => void;
  selectedMachineId: string;
  setSelectedMachineId: (id: string) => void;
  memberName: string;
  setMemberName: (name: string) => void;
  pin: string;
  setPin: (pin: string) => void;
  memberError: string | null;
  isMemberLoading: boolean;
  handleMemberSubmit: (e: React.FormEvent) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Global Store Access
  const loginDeviceStore = useAuthStore((state) => state.loginDevice);
  const logoutDevice = useAuthStore((state) => state.logoutDevice);
  const verifyOperatorPinStore = useAuthStore((state) => state.verifyOperatorPin);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const systemTitle = useThemeStore((state) => state.systemTitle);
  const systemLogo = useThemeStore((state) => state.systemLogo);

  // Device Form States
  const [deviceUsername, setDeviceUsername] = useState('');
  const [devicePassword, setDevicePassword] = useState('');
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);

  // Member Form States
  const [factories, setFactories] = useState<FactoryData[]>([]);
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [pin, setPin] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [isMemberLoading, setIsMemberLoading] = useState(false);

  // Fetch Factories when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    authService.getFactories().then((list) => {
      if (!isMounted) return;
      setFactories(list);
      if (list.length > 0) {
        setSelectedFactoryId(list[0].id);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  // Fetch Machines when factory changes
  useEffect(() => {
    if (!selectedFactoryId) return;
    let isMounted = true;
    authService.getMachinesByFactory(selectedFactoryId).then((list) => {
      if (!isMounted) return;
      setMachines(list);
      if (list.length > 0) {
        setSelectedMachineId(list[0].id);
      } else {
        setSelectedMachineId('');
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [selectedFactoryId]);

  // Handle Device Login Submit
  const handleDeviceSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setDeviceError(null);

    const validationMsg = authService.validateDeviceForm(deviceUsername);
    if (validationMsg) {
      setDeviceError(validationMsg);
      useToastStore.getState().showToast(validationMsg, 'warning');
      return;
    }

    setIsDeviceLoading(true);
    try {
      await loginDeviceStore(deviceUsername, devicePassword);
      useToastStore.getState().showToast('Otorisasi device berhasil.', 'success');
    } catch (err: any) {
      const responseData = err.response?.data;
      const message = responseData?.message || 'Gagal melakukan otorisasi device.';
      setDeviceError(message);
      useToastStore.getState().showToast(message, 'error');
    } finally {
      setIsDeviceLoading(false);
    }
  }, [deviceUsername, devicePassword, loginDeviceStore]);

  // Handle Member Login Submit
  const handleMemberSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);

    const validationMsg = authService.validateMemberForm(selectedMachineId, memberName, pin);
    if (validationMsg) {
      setMemberError(validationMsg);
      useToastStore.getState().showToast(validationMsg, 'warning');
      return;
    }

    setIsMemberLoading(true);
    try {
      const factoryObj = factories.find((f) => f.id === selectedFactoryId);
      const factoryName = factoryObj ? factoryObj.name : '';
      const machineObj = machines.find((m) => m.id === selectedMachineId);
      const machineName = machineObj ? machineObj.name : '';
      const machineCode = machineObj ? machineObj.code : '';

      await verifyOperatorPinStore(
        selectedFactoryId,
        factoryName,
        selectedMachineId,
        machineName,
        machineCode,
        pin,
        memberName.trim()
      );
      useToastStore.getState().showToast(`Selamat bekerja, ${memberName.trim()}!`, 'success');
    } catch (err: any) {
      const responseData = err.response?.data;
      const message = responseData?.message || 'PIN tidak valid atau terjadi kesalahan koneksi.';
      setMemberError(message);
      useToastStore.getState().showToast(message, 'error');
    } finally {
      setIsMemberLoading(false);
    }
  }, [factories, machines, selectedFactoryId, selectedMachineId, memberName, pin, verifyOperatorPinStore]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        logoutDevice,
        colorPrimary,
        systemTitle,
        systemLogo,
        deviceUsername,
        setDeviceUsername,
        devicePassword,
        setDevicePassword,
        deviceError,
        isDeviceLoading,
        handleDeviceSubmit,
        factories,
        machines,
        selectedFactoryId,
        setSelectedFactoryId,
        selectedMachineId,
        setSelectedMachineId,
        memberName,
        setMemberName,
        pin,
        setPin,
        memberError,
        isMemberLoading,
        handleMemberSubmit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
