import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { factoryService } from './FactoryService';
import type { FactoryItem, DeleteTarget } from './FactoryTypes';

interface FactoryContextType {
  // Theme & Auth State
  isSuperAdmin: boolean;
  colorPrimary: string;

  // Data & Search States
  factories: FactoryItem[];
  filteredFactories: FactoryItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Notification States
  successMsg: string | null;
  errorMsg: string | null;

  // Form Modal States & Input Setters
  showFormModal: boolean;
  modalType: 'add' | 'edit';
  factoryCode: string;
  setFactoryCode: (val: string) => void;
  factoryName: string;
  setFactoryName: (val: string) => void;
  factoryLocation: string;
  setFactoryLocation: (val: string) => void;
  isSubmitting: boolean;

  // Delete Modal States
  showDeleteModal: boolean;
  deleteTarget: DeleteTarget | null;

  // Modal Handlers
  openAddModal: () => void;
  openEditModal: (factory: FactoryItem) => void;
  closeFormModal: () => void;
  handleFormSubmit: (e: React.FormEvent) => Promise<void>;
  
  triggerDelete: (id: string, name: string) => void;
  closeDeleteModal: () => void;
  handleDeleteConfirm: () => Promise<void>;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export function FactoryProvider({ children }: { children: React.ReactNode }) {
  const activePortal = useAuthStore((state) => state.activePortal);
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const isSuperAdmin = activePortal === 'super-admin';

  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedFactory, setSelectedFactory] = useState<FactoryItem | null>(null);
  const [factoryCode, setFactoryCode] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [factoryLocation, setFactoryLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Fetch Factories
  const loadFactories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await factoryService.fetchFactories();
      setFactories(data);
    } catch (e) {
      console.error('Failed to load factories:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFactories();
  }, [loadFactories]);

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
    setSelectedFactory(null);
    setFactoryCode('');
    setFactoryName('');
    setFactoryLocation('');
    setErrorMsg(null);
    setShowFormModal(true);
  }, []);

  const openEditModal = useCallback((factory: FactoryItem) => {
    setModalType('edit');
    setSelectedFactory(factory);
    setFactoryCode(factory.code);
    setFactoryName(factory.name);
    setFactoryLocation(factory.location || '');
    setErrorMsg(null);
    setShowFormModal(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setErrorMsg(null);
  }, []);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validationMsg = factoryService.validateForm(factoryCode, factoryName);
    if (validationMsg) {
      setErrorMsg(validationMsg);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        code: factoryCode,
        name: factoryName,
        location: factoryLocation || null,
      };

      if (modalType === 'add') {
        await factoryService.createFactory(payload);
        triggerNotification('Pabrik baru berhasil didaftarkan.');
      } else {
        if (!selectedFactory) return;
        await factoryService.updateFactory(selectedFactory.id, payload);
        triggerNotification('Data pabrik berhasil diperbarui.');
      }
      setShowFormModal(false);
      loadFactories();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan data pabrik.');
    } finally {
      setIsSubmitting(false);
    }
  }, [factoryCode, factoryName, factoryLocation, modalType, selectedFactory, loadFactories]);

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
      await factoryService.deleteFactory(deleteTarget.id);
      triggerNotification('Pabrik berhasil dihapus.');
      loadFactories();
      setShowDeleteModal(false);
    } catch (err: any) {
      triggerNotification(err.response?.data?.message || 'Gagal menghapus pabrik.', true);
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadFactories]);

  const filteredFactories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return factories.filter((f) => (
      f.code.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q) ||
      (f.location && f.location.toLowerCase().includes(q))
    ));
  }, [factories, searchQuery]);

  return (
    <FactoryContext.Provider
      value={{
        isSuperAdmin,
        colorPrimary,
        factories,
        filteredFactories,
        isLoading,
        searchQuery,
        setSearchQuery,
        successMsg,
        errorMsg,
        showFormModal,
        modalType,
        factoryCode,
        setFactoryCode,
        factoryName,
        setFactoryName,
        factoryLocation,
        setFactoryLocation,
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
    </FactoryContext.Provider>
  );
}

export function useFactoryContext() {
  const context = useContext(FactoryContext);
  if (!context) {
    throw new Error('useFactoryContext must be used within a FactoryProvider');
  }
  return context;
}
