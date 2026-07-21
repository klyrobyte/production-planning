import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useToastStore } from '../../../shared/store/useToastStore';
import { databaseService } from './DatabaseService';

export type DatabaseTab = 'parts' | 'conversions' | 'leaders';

interface DatabaseContextType {
  // Current Active Sub-Tab State
  pageTab: DatabaseTab;
  setPageTab: (tab: DatabaseTab) => void;

  // Refresh Triggers for Sub-Tabs
  partsRefreshTrigger: number;
  conversionsRefreshTrigger: number;
  leadersRefreshTrigger: number;
  triggerPartsRefresh: () => void;
  triggerConversionsRefresh: () => void;
  triggerLeadersRefresh: () => void;

  // User Role
  userRole: string | undefined;
  isLoading: boolean;

  // Bulk Deletion Actions for Super-Admin
  handleDeleteAllParts: () => Promise<void>;
  handleDeleteAllConversions: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;

  const [pageTab, setPageTab] = useState<DatabaseTab>('parts');
  const [partsRefreshTrigger, setPartsRefreshTrigger] = useState(0);
  const [conversionsRefreshTrigger, setConversionsRefreshTrigger] = useState(0);
  const [leadersRefreshTrigger, setLeadersRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const triggerPartsRefresh = useCallback(() => {
    setPartsRefreshTrigger((prev) => prev + 1);
  }, []);

  const triggerConversionsRefresh = useCallback(() => {
    setConversionsRefreshTrigger((prev) => prev + 1);
  }, []);

  const triggerLeadersRefresh = useCallback(() => {
    setLeadersRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleDeleteAllParts = useCallback(async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menghapus SELURUH master parts dari database? Tindakan ini tidak dapat dibatalkan.'
      )
    )
      return;

    setIsLoading(true);
    try {
      await databaseService.deleteAllParts();
      const msg = 'Seluruh master parts berhasil dihapus dari database.';
      useToastStore.getState().showToast(msg, 'success');
      triggerPartsRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menghapus seluruh master parts.';
      useToastStore.getState().showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [triggerPartsRefresh]);

  const handleDeleteAllConversions = useCallback(async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menghapus SELURUH mapping order conversions? Tindakan ini tidak dapat dibatalkan.'
      )
    )
      return;

    setIsLoading(true);
    try {
      await databaseService.deleteAllConversions();
      const msg = 'Seluruh mapping order conversions berhasil dihapus.';
      useToastStore.getState().showToast(msg, 'success');
      triggerConversionsRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menghapus seluruh mapping.';
      useToastStore.getState().showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [triggerConversionsRefresh]);

  return (
    <DatabaseContext.Provider
      value={{
        pageTab,
        setPageTab,
        partsRefreshTrigger,
        conversionsRefreshTrigger,
        leadersRefreshTrigger,
        triggerPartsRefresh,
        triggerConversionsRefresh,
        triggerLeadersRefresh,
        userRole,
        isLoading,
        handleDeleteAllParts,
        handleDeleteAllConversions,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
}
