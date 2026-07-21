import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { machineService } from './MachineService';
import type { MachineItem, FactoryItem, DeleteTarget, CreateMachinePayload, UpdateMachinePayload } from './MachineTypes';

interface MachineContextType {
  // Theme & Auth State
  isSuperAdmin: boolean;
  colorPrimary: string;
  typesList: string[];

  // Data & Filter States
  machines: MachineItem[];
  factories: FactoryItem[];
  filteredMachines: MachineItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterFactoryId: string;
  setFilterFactoryId: (id: string) => void;

  // Notification States
  successMsg: string | null;
  errorMsg: string | null;

  // Form Modal States & Setters
  showFormModal: boolean;
  modalType: 'add' | 'edit';
  machineFactoryId: string;
  setMachineFactoryId: (val: string) => void;
  machineCode: string;
  setMachineCode: (val: string) => void;
  machineName: string;
  setMachineName: (val: string) => void;
  machineType: string;
  setMachineType: (val: string) => void;
  machineTonnage: string;
  setMachineTonnage: (val: string) => void;
  machineStatus: 'active' | 'inactive';
  setMachineStatus: (val: 'active' | 'inactive') => void;
  machinePin: string;
  setMachinePin: (val: string) => void;
  isSubmitting: boolean;

  // Delete Modal States
  showDeleteModal: boolean;
  deleteTarget: DeleteTarget | null;

  // Handlers
  openAddModal: () => void;
  openEditModal: (machine: MachineItem) => void;
  closeFormModal: () => void;
  handleFormSubmit: (e: React.FormEvent) => Promise<void>;
  
  triggerDelete: (id: string, name: string) => void;
  closeDeleteModal: () => void;
  handleDeleteConfirm: () => Promise<void>;
}

const MachineContext = createContext<MachineContextType | undefined>(undefined);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  const activePortal = useAuthStore((state) => state.activePortal);
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const machineTypes = useThemeStore((state) => state.machineTypes);
  const isSuperAdmin = activePortal === 'super-admin';

  const typesList = useMemo(() => {
    return machineTypes
      ? machineTypes.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : ['injection', 'painting'];
  }, [machineTypes]);

  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFactoryId, setFilterFactoryId] = useState('');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedMachine, setSelectedMachine] = useState<MachineItem | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Form Inputs
  const [machineFactoryId, setMachineFactoryId] = useState('');
  const [machineCode, setMachineCode] = useState('');
  const [machineName, setMachineName] = useState('');
  const [machineType, setMachineType] = useState('');
  const [machineTonnage, setMachineTonnage] = useState('');
  const [machineStatus, setMachineStatus] = useState<'active' | 'inactive'>('active');
  const [machinePin, setMachinePin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data
  const loadFactories = useCallback(async () => {
    try {
      const data = await machineService.fetchFactories();
      setFactories(data);
    } catch (e) {
      console.error('Failed to load factories:', e);
    }
  }, []);

  const loadMachines = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await machineService.fetchMachines();
      setMachines(data);
    } catch (e) {
      console.error('Failed to load machines:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFactories();
    loadMachines();
  }, [loadFactories, loadMachines]);

  const triggerNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const openAddModal = useCallback(() => {
    setModalType('add');
    setSelectedMachine(null);
    setMachineFactoryId(factories[0]?.id || '');
    setMachineCode('');
    setMachineName('');
    setMachineType('');
    setMachineTonnage('');
    setMachineStatus('active');
    setMachinePin('');
    setErrorMsg(null);
    setShowFormModal(true);
  }, [factories]);

  const openEditModal = useCallback((machine: MachineItem) => {
    setModalType('edit');
    setSelectedMachine(machine);
    setMachineFactoryId(machine.factory_id);
    setMachineCode(machine.code);
    setMachineName(machine.name);
    setMachineType(machine.type || '');
    setMachineTonnage(machine.tonnage || '');
    setMachineStatus(machine.status);
    setMachinePin('');
    setErrorMsg(null);
    setShowFormModal(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setErrorMsg(null);
  }, []);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validationMsg = machineService.validateForm(
      machineCode,
      machineName,
      modalType === 'add' ? machineFactoryId : undefined
    );

    if (validationMsg) {
      setErrorMsg(validationMsg);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (modalType === 'add') {
        const payload: CreateMachinePayload = {
          factory_id: machineFactoryId,
          code: machineCode,
          name: machineName,
          type: machineType || null,
          tonnage: machineTonnage || null,
        };
        await machineService.createMachine(payload);
        triggerNotification('Mesin baru berhasil didaftarkan.');
      } else {
        if (!selectedMachine) return;
        const payload: UpdateMachinePayload = {
          code: machineCode,
          name: machineName,
          type: machineType || null,
          tonnage: machineTonnage || null,
          status: machineStatus,
        };
        if (machinePin.trim()) {
          payload.pin = machinePin;
        }
        await machineService.updateMachine(selectedMachine.id, payload);
        triggerNotification('Data mesin berhasil diperbarui.');
      }
      setShowFormModal(false);
      loadMachines();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan data mesin.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    machineFactoryId,
    machineCode,
    machineName,
    machineType,
    machineTonnage,
    machineStatus,
    machinePin,
    modalType,
    selectedMachine,
    loadMachines,
  ]);

  const triggerDelete = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await machineService.deleteMachine(deleteTarget.id);
      triggerNotification('Mesin berhasil dihapus.');
      loadMachines();
      setShowDeleteModal(false);
    } catch (err: any) {
      triggerNotification(err.response?.data?.message || 'Gagal menghapus mesin.', true);
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadMachines]);

  const filteredMachines = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return machines.filter((m) => {
      const matchQuery =
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.type && m.type.toLowerCase().includes(q)) ||
        m.factory_code.toLowerCase().includes(q);
      const matchFactory = filterFactoryId ? m.factory_id === filterFactoryId : true;
      return matchQuery && matchFactory;
    });
  }, [machines, searchQuery, filterFactoryId]);

  return (
    <MachineContext.Provider
      value={{
        isSuperAdmin,
        colorPrimary,
        typesList,
        machines,
        factories,
        filteredMachines,
        isLoading,
        searchQuery,
        setSearchQuery,
        filterFactoryId,
        setFilterFactoryId,
        successMsg,
        errorMsg,
        showFormModal,
        modalType,
        machineFactoryId,
        setMachineFactoryId,
        machineCode,
        setMachineCode,
        machineName,
        setMachineName,
        machineType,
        setMachineType,
        machineTonnage,
        setMachineTonnage,
        machineStatus,
        setMachineStatus,
        machinePin,
        setMachinePin,
        isSubmitting,
        showDeleteModal,
        deleteTarget,
        openAddModal,
        openEditModal,
        closeFormModal,
        handleFormSubmit,
        triggerDelete,
        closeDeleteModal,
        handleDeleteConfirm,
      }}
    >
      {children}
    </MachineContext.Provider>
  );
}

export function useMachineContext() {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachineContext must be used within a MachineProvider');
  }
  return context;
}
