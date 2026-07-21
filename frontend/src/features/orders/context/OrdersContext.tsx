import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useToastStore } from '../../../shared/store/useToastStore';
import { useProduction } from '../../production/context/ProductionContext';
import type {
  PartForecast,
  MachineItem,
  HistoryRecord,
  ColumnFilters,
  FukaFilterType,
  ActiveTabType,
  ViewStateType,
  SubTabType,
  ImportModeType,
  OrdersContextType,
} from './OrdersTypes';
import { ordersService } from './OrdersService';

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { updateMonthlyPlans } = useProduction();

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTabType>('monthly');
  const [subTab, setSubTab] = useState<SubTabType>('active');
  const [viewState, setViewState] = useState<ViewStateType>('active');
  const [importMode, setImportMode] = useState<ImportModeType>('csv');

  // Backend collections
  const [parts, setParts] = useState<any[]>([]);
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);

  // Forecast states
  const [partsForecast, setPartsForecast] = useState<PartForecast[]>([]);
  const [tempForecast, setTempForecast] = useState<PartForecast[]>([]);

  // Form & Pending States
  const [pasteData, setPasteData] = useState('');
  const [selectedManualPartNo, setSelectedManualPartNo] = useState('');
  const [manualMonthN, setManualMonthN] = useState('');
  const [manualMonthN1, setManualMonthN1] = useState('');
  const [manualMonthN2, setManualMonthN2] = useState('');
  const [manualMonthN3, setManualMonthN3] = useState('');
  const [pendingMachineChanges, setPendingMachineChanges] = useState<Record<string, string>>({});

  // Loading & Processing Flags
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Filters & Search
  const [fukaFilter, setFukaFilter] = useState<FukaFilterType>('monthN');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    sebango: '',
    partNumber: '',
    modelCode: '',
    machineId: '',
    monthN: '',
    monthN1: '',
    monthN2: '',
    monthN3: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const monthNames = useMemo(() => ordersService.getForecastMonthNames(), []);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ordersService.fetchOrdersInitialData();
      setParts(data.parts);
      setMachines(data.machines);
      setHistoryRecords(data.historyRecords);
      setConversions(data.conversions);

      // Build active plan forecast data
      const monthKeys = ordersService.getForecastMonthKeys();
      const workingDays = 20;

      const initial = data.parts.map((p: any) => {
        const dbForecasts = p.monthly_forecasts || {};
        const fN = dbForecasts[monthKeys.monthN] || {};
        const fN1 = dbForecasts[monthKeys.monthN1] || {};
        const fN2 = dbForecasts[monthKeys.monthN2] || {};
        const fN3 = dbForecasts[monthKeys.monthN3] || {};

        const dailyN = fN.daily !== undefined ? Number(fN.daily) : (p.daily_requirement_n !== undefined && p.daily_requirement_n !== null ? Number(p.daily_requirement_n) : 0);
        const dailyN1 = fN1.daily !== undefined ? Number(fN1.daily) : (p.daily_requirement_n1 !== undefined && p.daily_requirement_n1 !== null ? Number(p.daily_requirement_n1) : 0);
        const dailyN2 = fN2.daily !== undefined ? Number(fN2.daily) : (p.daily_requirement_n2 !== undefined && p.daily_requirement_n2 !== null ? Number(p.daily_requirement_n2) : 0);
        const dailyN3 = fN3.daily !== undefined ? Number(fN3.daily) : (p.daily_requirement_n3 !== undefined && p.daily_requirement_n3 !== null ? Number(p.daily_requirement_n3) : 0);

        const monthNVal = fN.volume !== undefined ? Number(fN.volume) : (p.month_n_forecast !== undefined && p.month_n_forecast !== null ? Number(p.month_n_forecast) : (dailyN * workingDays));
        const monthN1Val = fN1.volume !== undefined ? Number(fN1.volume) : (p.month_n1_forecast !== undefined && p.month_n1_forecast !== null ? Number(p.month_n1_forecast) : (dailyN1 * workingDays));
        const monthN2Val = fN2.volume !== undefined ? Number(fN2.volume) : (p.month_n2_forecast !== undefined && p.month_n2_forecast !== null ? Number(p.month_n2_forecast) : (dailyN2 * workingDays));
        const monthN3Val = fN3.volume !== undefined ? Number(fN3.volume) : (p.month_n3_forecast !== undefined && p.month_n3_forecast !== null ? Number(p.month_n3_forecast) : (dailyN3 * workingDays));

        const resolvedMc = ordersService.resolveMachineKey(p.home_line, data.machines);
        return {
          sebango: p.sebango || '',
          partNumber: p.part_number || '',
          partName: p.part_name || '',
          modelCode: p.model || '',
          machineId: resolvedMc,
          factory: ordersService.getFactoryFromHomeLine(resolvedMc, data.machines),
          area: p.area || '',
          cycleTime: Number(p.cycle_time || 60),
          cavity: Number(p.cavity || 1),
          monthN: monthNVal,
          monthN1: monthN1Val,
          monthN2: monthN2Val,
          monthN3: monthN3Val,
          dailyRequirementN: dailyN,
          dailyRequirementN1: dailyN1,
          dailyRequirementN2: dailyN2,
          dailyRequirementN3: dailyN3,
        };
      });

      setPartsForecast(initial);
    } catch (err) {
      useToastStore.getState().showToast('Gagal memuat data master parts atau mesin.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync state back to active view when committing/resetting
  useEffect(() => {
    if (viewState === 'active' && parts.length > 0) {
      const monthKeys = ordersService.getForecastMonthKeys();
      const workingDays = 20;

      const initial = parts.map((p: any) => {
        const dbForecasts = p.monthly_forecasts || {};
        const fN = dbForecasts[monthKeys.monthN] || {};
        const fN1 = dbForecasts[monthKeys.monthN1] || {};
        const fN2 = dbForecasts[monthKeys.monthN2] || {};
        const fN3 = dbForecasts[monthKeys.monthN3] || {};

        const dailyN = fN.daily !== undefined ? Number(fN.daily) : (p.daily_requirement_n !== undefined && p.daily_requirement_n !== null ? Number(p.daily_requirement_n) : 0);
        const dailyN1 = fN1.daily !== undefined ? Number(fN1.daily) : (p.daily_requirement_n1 !== undefined && p.daily_requirement_n1 !== null ? Number(p.daily_requirement_n1) : 0);
        const dailyN2 = fN2.daily !== undefined ? Number(fN2.daily) : (p.daily_requirement_n2 !== undefined && p.daily_requirement_n2 !== null ? Number(p.daily_requirement_n2) : 0);
        const dailyN3 = fN3.daily !== undefined ? Number(fN3.daily) : (p.daily_requirement_n3 !== undefined && p.daily_requirement_n3 !== null ? Number(p.daily_requirement_n3) : 0);

        const monthNVal = fN.volume !== undefined ? Number(fN.volume) : (p.month_n_forecast !== undefined && p.month_n_forecast !== null ? Number(p.month_n_forecast) : (dailyN * workingDays));
        const monthN1Val = fN1.volume !== undefined ? Number(fN1.volume) : (p.month_n1_forecast !== undefined && p.month_n1_forecast !== null ? Number(p.month_n1_forecast) : (dailyN1 * workingDays));
        const monthN2Val = fN2.volume !== undefined ? Number(fN2.volume) : (p.month_n2_forecast !== undefined && p.month_n2_forecast !== null ? Number(p.month_n2_forecast) : (dailyN2 * workingDays));
        const monthN3Val = fN3.volume !== undefined ? Number(fN3.volume) : (p.month_n3_forecast !== undefined && p.month_n3_forecast !== null ? Number(p.month_n3_forecast) : (dailyN3 * workingDays));

        const resolvedMc = ordersService.resolveMachineKey(p.home_line, machines);
        return {
          sebango: p.sebango || '',
          partNumber: p.part_number || '',
          partName: p.part_name || '',
          modelCode: p.model || '',
          machineId: resolvedMc,
          factory: ordersService.getFactoryFromHomeLine(resolvedMc, machines),
          area: p.area || '',
          cycleTime: Number(p.cycle_time || 60),
          cavity: Number(p.cavity || 1),
          monthN: monthNVal,
          monthN1: monthN1Val,
          monthN2: monthN2Val,
          monthN3: monthN3Val,
          dailyRequirementN: dailyN,
          dailyRequirementN1: dailyN1,
          dailyRequirementN2: dailyN2,
          dailyRequirementN3: dailyN3,
        };
      });
      setPartsForecast(initial);
    }
  }, [parts, viewState, machines]);

  // Handle direct machine change
  const handleMachineChange = useCallback((partNumber: string, newMachine: string) => {
    setPendingMachineChanges((prev) => ({ ...prev, [partNumber]: newMachine }));
  }, []);

  const handleSaveMachineChanges = useCallback(async () => {
    setIsCommitting(true);
    try {
      const refreshed = await ordersService.saveMachineChangesToDatabase(pendingMachineChanges, parts);
      setParts(refreshed);
      await updateMonthlyPlans(refreshed);
      setPendingMachineChanges({});
      useToastStore.getState().showToast('Perubahan penugasan mesin berhasil disimpan.', 'success');
    } catch (err) {
      useToastStore.getState().showToast('Gagal mengganti mesin.', 'error');
    } finally {
      setIsCommitting(false);
    }
  }, [pendingMachineChanges, parts, updateMonthlyPlans]);

  // Compute active list with pending machine changes
  const activeDisplayList = useMemo(() => {
    const list = viewState === 'preview' ? tempForecast : partsForecast;
    if (Object.keys(pendingMachineChanges).length === 0) return list;

    return list.map((item) => {
      const pendingMachine = pendingMachineChanges[item.partNumber];
      if (pendingMachine !== undefined) {
        return {
          ...item,
          machineId: pendingMachine,
          factory: ordersService.getFactoryFromHomeLine(pendingMachine, machines),
        };
      }
      return item;
    });
  }, [viewState, tempForecast, partsForecast, pendingMachineChanges, machines]);

  // Compute FUKA Workload Chart
  const fukaChartData = useMemo(() => {
    return ordersService.calculateFukaWorkload(activeDisplayList, machines, fukaFilter);
  }, [activeDisplayList, machines, fukaFilter]);

  // Compute Processed Display List (Filtered & Sorted)
  const processedDisplayList = useMemo(() => {
    return ordersService.filterAndSortForecasts(
      activeDisplayList,
      searchQuery,
      columnFilters,
      sortField,
      sortDirection
    );
  }, [activeDisplayList, searchQuery, columnFilters, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = useMemo(() => {
    return Math.ceil(processedDisplayList.length / itemsPerPage) || 1;
  }, [processedDisplayList.length]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedDisplayList.slice(start, start + itemsPerPage);
  }, [processedDisplayList, currentPage]);

  // File upload handler
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const parsed = ordersService.parseForecastCSVContent(text, parts, conversions, machines);
          if (parsed.length === 0) {
            useToastStore.getState().showToast('Kode Sebango tidak cocok atau kolom CSV tidak valid.', 'warning');
            setIsProcessing(false);
            return;
          }
          setTempForecast(parsed);
          setViewState('preview');
          useToastStore.getState().showToast(`Preview ${parsed.length} data forecast berhasil dimuat.`, 'info');
        } catch (err) {
          useToastStore.getState().showToast('Gagal mem-parse file CSV.', 'error');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [parts, conversions, machines]
  );

  // Paste handler
  const handlePasteSubmit = useCallback(() => {
    if (!pasteData.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const parsed = ordersService.parseForecastCSVContent(pasteData, parts, conversions, machines);
        if (parsed.length === 0) {
          useToastStore.getState().showToast('Data paste kosong atau kode Sebango tidak terdaftar.', 'warning');
          setIsProcessing(false);
          return;
        }
        setTempForecast(parsed);
        setViewState('preview');
        setPasteData('');
        useToastStore.getState().showToast(`Preview ${parsed.length} data forecast berhasil dimuat.`, 'info');
      } catch (err) {
        useToastStore.getState().showToast('Gagal mem-parse data paste.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  }, [pasteData, parts, conversions, machines]);

  // Commit forecast
  const handleCommit = useCallback(async () => {
    setIsCommitting(true);
    try {
      const monthKeys = ordersService.getForecastMonthKeys();
      const { refreshedParts, refreshedHistory } = await ordersService.commitForecastToDatabase(
        tempForecast,
        parts,
        monthKeys
      );

      setParts(refreshedParts);
      setHistoryRecords(refreshedHistory);
      await updateMonthlyPlans(refreshedParts);

      setViewState('active');
      setTempForecast([]);
      useToastStore.getState().showToast('Forecast berhasil disinkronkan ke database server!', 'success');
    } catch (err) {
      useToastStore.getState().showToast('Gagal melakukan sinkronisasi forecast ke database.', 'error');
    } finally {
      setIsCommitting(false);
    }
  }, [tempForecast, parts, updateMonthlyPlans]);

  // Restore history
  const handleRestoreHistory = useCallback(
    async (record: HistoryRecord) => {
      if (
        !window.confirm(
          `Apakah Anda yakin ingin me-restore snapshot forecast dari tanggal ${new Date(
            record.created_at
          ).toLocaleString()}? Ini akan menggantikan data forecast aktif saat ini.`
        )
      ) {
        return;
      }

      setIsCommitting(true);
      try {
        const monthKeys = ordersService.getForecastMonthKeys();
        const refreshed = await ordersService.restoreHistoryRecordToDatabase(record, parts, monthKeys);
        setParts(refreshed);
        await updateMonthlyPlans(refreshed);
        setSubTab('active');
        useToastStore.getState().showToast('Snapshot forecast berhasil dipulihkan!', 'success');
      } catch (err) {
        useToastStore.getState().showToast('Gagal me-restore snapshot forecast.', 'error');
      } finally {
        setIsCommitting(false);
      }
    },
    [parts, updateMonthlyPlans]
  );

  // Manual Form handlers
  const handleManualPartSelect = useCallback(
    (partNo: string) => {
      setSelectedManualPartNo(partNo);
      if (!partNo) {
        setManualMonthN('');
        setManualMonthN1('');
        setManualMonthN2('');
        setManualMonthN3('');
        return;
      }
      const currentForecast = partsForecast.find((p) => p.partNumber === partNo);
      if (currentForecast) {
        setManualMonthN(String(currentForecast.monthN || 0));
        setManualMonthN1(String(currentForecast.monthN1 || 0));
        setManualMonthN2(String(currentForecast.monthN2 || 0));
        setManualMonthN3(String(currentForecast.monthN3 || 0));
      } else {
        setManualMonthN('0');
        setManualMonthN1('0');
        setManualMonthN2('0');
        setManualMonthN3('0');
      }
    },
    [partsForecast]
  );

  const handleManualSubmit = useCallback(async () => {
    if (!selectedManualPartNo) return;

    setIsCommitting(true);
    try {
      const monthKeys = ordersService.getForecastMonthKeys();
      const vN = Math.max(0, parseFloat(manualMonthN) || 0);
      const vN1 = Math.max(0, parseFloat(manualMonthN1) || 0);
      const vN2 = Math.max(0, parseFloat(manualMonthN2) || 0);
      const vN3 = Math.max(0, parseFloat(manualMonthN3) || 0);

      const refreshed = await ordersService.saveManualForecastAdjustment(
        selectedManualPartNo,
        { vN, vN1, vN2, vN3 },
        parts,
        monthKeys
      );

      setParts(refreshed);
      await updateMonthlyPlans(refreshed);
      useToastStore.getState().showToast('Penyesuaian manual forecast berhasil disimpan.', 'success');
      handleManualPartSelect('');
    } catch (err) {
      useToastStore.getState().showToast('Gagal menyimpan penyesuaian manual.', 'error');
    } finally {
      setIsCommitting(false);
    }
  }, [selectedManualPartNo, manualMonthN, manualMonthN1, manualMonthN2, manualMonthN3, parts, updateMonthlyPlans, handleManualPartSelect]);

  const handleManualReset = useCallback(() => {
    handleManualPartSelect('');
  }, [handleManualPartSelect]);

  return (
    <OrdersContext.Provider
      value={{
        activeTab,
        setActiveTab,
        subTab,
        setSubTab,
        viewState,
        setViewState,
        parts,
        machines,
        conversions,
        partsForecast,
        tempForecast,
        setTempForecast,
        activeDisplayList,
        processedDisplayList,
        historyRecords,
        monthNames,
        searchQuery,
        setSearchQuery,
        fukaFilter,
        setFukaFilter,
        columnFilters,
        setColumnFilters,
        sortField,
        setSortField,
        sortDirection,
        setSortDirection,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        totalPages,
        paginatedList,
        pendingMachineChanges,
        setPendingMachineChanges,
        handleMachineChange,
        importMode,
        setImportMode,
        pasteData,
        setPasteData,
        selectedManualPartNo,
        manualMonthN,
        setManualMonthN,
        manualMonthN1,
        setManualMonthN1,
        manualMonthN2,
        setManualMonthN2,
        manualMonthN3,
        setManualMonthN3,
        isLoading,
        isProcessing,
        isCommitting,
        fukaChartData,
        fetchData,
        handleFileUpload,
        handlePasteSubmit,
        handleCommit,
        handleRestoreHistory,
        handleManualPartSelect,
        handleManualSubmit,
        handleManualReset,
        handleSaveMachineChanges,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrdersContext() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrdersContext must be used within an OrdersProvider');
  }
  return context;
}
