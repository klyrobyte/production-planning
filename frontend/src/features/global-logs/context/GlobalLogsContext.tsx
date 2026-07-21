import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToastStore } from '../../../shared/store/useToastStore';
import type { LogItem, LogMetaData, GlobalLogsContextType } from './GlobalLogsTypes';
import { globalLogsService } from './GlobalLogsService';

const GlobalLogsContext = createContext<GlobalLogsContextType | undefined>(undefined);

export function GlobalLogsProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [meta, setMeta] = useState<LogMetaData>({ page: 1, limit: 25, total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number | string>(25);

  // Filter States
  const [searchUsername, setSearchUsername] = useState('');
  const [searchEndpoint, setSearchEndpoint] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [searchStatusCode, setSearchStatusCode] = useState('');

  // Confirmation Modal & Loading
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time highlight state
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());

  // Fetch logs with active filters and pagination
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await globalLogsService.fetchLogs({
        page,
        limit,
        username: searchUsername,
        endpoint: searchEndpoint,
        method: selectedMethod,
        status_code: searchStatusCode,
      });
      setLogs(result.logs);
      setMeta(result.meta);
    } catch (e) {
      useToastStore.getState().showToast('Gagal memuat log data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchUsername, searchEndpoint, selectedMethod, searchStatusCode]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time EventSource connection for Server-Sent Events (SSE)
  useEffect(() => {
    if (page !== 1) return;

    const cleanupSSE = globalLogsService.connectSSEStream((newLog) => {
      // Evaluate active filters via service
      const isMatch = globalLogsService.matchesFilter(newLog, {
        page,
        limit,
        username: searchUsername,
        endpoint: searchEndpoint,
        method: selectedMethod,
        status_code: searchStatusCode,
      });

      if (!isMatch) return;

      setLogs((prev) => {
        if (prev.some((item) => item.id === newLog.id)) return prev;

        // Trigger highlight
        setNewLogIds((prevIds) => {
          const nextIds = new Set(prevIds);
          nextIds.add(newLog.id);
          return nextIds;
        });

        // Auto-remove highlight after 3 seconds
        setTimeout(() => {
          setNewLogIds((prevIds) => {
            const nextIds = new Set(prevIds);
            nextIds.delete(newLog.id);
            return nextIds;
          });
        }, 3000);

        const maxItems = globalLogsService.parseLimitValue(limit);
        return [newLog, ...(maxItems === Infinity ? prev : prev.slice(0, maxItems - 1))];
      });

      setMeta((prev) => ({
        ...prev,
        total: prev.total + 1,
      }));
    });

    return () => {
      cleanupSSE();
    };
  }, [page, limit, searchUsername, searchEndpoint, selectedMethod, searchStatusCode]);

  // Handle clearing all logs database entries
  const handleClearAllLogs = useCallback(async () => {
    setIsClearing(true);
    try {
      await globalLogsService.clearAllLogs();
      setShowClearModal(false);
      setPage(1);
      useToastStore.getState().showToast('Seluruh riwayat audit log berhasil dihapus.', 'success');
      fetchLogs();
    } catch (e) {
      useToastStore.getState().showToast('Gagal menghapus riwayat audit log.', 'error');
    } finally {
      setIsClearing(false);
    }
  }, [fetchLogs]);

  // Reset all search parameter inputs
  const handleResetFilters = useCallback(() => {
    setSearchUsername('');
    setSearchEndpoint('');
    setSelectedMethod('');
    setSearchStatusCode('');
    setPage(1);
  }, []);

  return (
    <GlobalLogsContext.Provider
      value={{
        logs,
        meta,
        page,
        limit,
        setPage,
        setLimit,
        searchUsername,
        setSearchUsername,
        searchEndpoint,
        setSearchEndpoint,
        selectedMethod,
        setSelectedMethod,
        searchStatusCode,
        setSearchStatusCode,
        handleResetFilters,
        newLogIds,
        showClearModal,
        setShowClearModal,
        isClearing,
        isLoading,
        fetchLogs,
        handleClearAllLogs,
      }}
    >
      {children}
    </GlobalLogsContext.Provider>
  );
}

export function useGlobalLogsContext() {
  const context = useContext(GlobalLogsContext);
  if (!context) {
    throw new Error('useGlobalLogsContext must be used within a GlobalLogsProvider');
  }
  return context;
}
