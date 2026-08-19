import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/axios';
import { initSocket } from '../../../shared/lib/socket';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useToastStore } from '../../../shared/store/useToastStore';
import type {
  Job,
  AbnormalityLog,
  ActiveAbnormality,
  ActiveNg,
  ProductionContextType,
} from './ProductionTypes';
import { productionService } from '../services/ProductionService';
import { paintingData as defaultPaintingData } from '../services/ProductionFukaEngine';

export * from './ProductionTypes';
export { productionService };

// Backward compatibility exports for existing components/pages
export const addWorkingMinutes = (current: Date, minutesToAdd: number) => productionService.addWorkingMinutes(current, minutesToAdd);
export const normalizeLineName = (line: string) => productionService.normalizeLineName(line);
export const parseMachineIdentifier = (str: string) => productionService.parseMachineIdentifier(str);
export const machinesMatch = (nameA: string, nameB: string) => productionService.machinesMatch(nameA, nameB);
export const getHeijunkaJobsForMachine = (machineId: string, dateStr: string, parts: any[]) => productionService.getHeijunkaJobsForMachine(machineId, dateStr, parts);
export const getTodayDateString = () => productionService.getTodayDateString();
export const getUniqueMachineKey = (factory: string, machine: string) => productionService.getUniqueMachineKey(factory, machine);

const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

export function ProductionProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [machineJobs, setMachineJobs] = useState<Record<string, Job[]>>({});
  const [machineAvgJobs, setMachineAvgJobs] = useState<Record<string, Job[]>>({});
  const [logs, setLogs] = useState<Record<string, AbnormalityLog[]>>({});
  const [dayOTs, setDayOTs] = useState<Record<string, string>>({});
  const [nightOTs, setNightOTs] = useState<Record<string, string>>({});
  const [activeAbnormalities, setActiveAbnormalities] = useState<Record<string, ActiveAbnormality>>({});
  const [activeNgs, setActiveNgs] = useState<Record<string, ActiveNg>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  // Tab & Date State
  const [activeTab, setActiveTab] = useState<'resin' | 'painting'>('resin');
  const [selectedDate, setSelectedDate] = useState<string>(() => productionService.getTodayDateString());

  // REST API query for master machines
  const { data: machinesData = [] } = useQuery<any[]>({
    queryKey: ['machines'],
    queryFn: async () => (await api.get('/machines')).data?.data || [],
    staleTime: 60_000,
    enabled: isAuthenticated,
  });

  // REST API query for master parts
  const { data: partsData = [] } = useQuery<any[]>({
    queryKey: ['parts'],
    queryFn: async () => (await api.get('/parts')).data?.data || [],
    staleTime: 60_000,
    enabled: isAuthenticated,
  });

  // Calculate dynamic resin data via ProductionService
  const dynamicResinData = useMemo(() => {
    return productionService.calculateDynamicResinData(
      machinesData,
      partsData,
      machineJobs,
      selectedDate,
      activeAbnormalities,
      activeNgs
    );
  }, [machinesData, partsData, machineJobs, selectedDate, activeAbnormalities, activeNgs]);

  // Flatten machines list for navigation
  const allMachinesList = useMemo(() => {
    return productionService.flattenMachinesList(dynamicResinData);
  }, [dynamicResinData]);

  const lastLocalWriteRef = useRef<Record<string, number>>({});
  const logsRef = useRef(logs);
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Saves a production plan record into PostgreSQL database via the service
  const savePlanToDatabase = async (
    id: string,
    planType: 'daily' | 'avg',
    machineId: string,
    dateKey: string,
    jobs: Job[],
    dayOT?: string,
    nightOT?: string,
    logsArray?: AbnormalityLog[],
    isAbnormal?: boolean,
    abnormalType?: string,
    abnormalStart?: string,
    isNg?: boolean,
    ngType?: string,
    ngStart?: string
  ) => {
    await productionService.savePlanToDatabase(
      id,
      planType,
      machineId,
      dateKey,
      jobs,
      dayOT || 'teiji',
      nightOT || 'teiji',
      logsArray || [],
      isAbnormal,
      abnormalType,
      abnormalStart,
      isNg,
      ngType,
      ngStart,
      activeAbnormalities,
      activeNgs
    );
  };

  // Queries all active plans from Express server to populate layout state
  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const rows = await productionService.fetchPlansFromApi();
      const loadedJobs: Record<string, Job[]> = {};
      const loadedAvgJobs: Record<string, Job[]> = {};
      const loadedDayOTs: Record<string, string> = {};
      const loadedNightOTs: Record<string, string> = {};
      const loadedAbnormalities: Record<string, ActiveAbnormality> = {};
      const loadedNgs: Record<string, ActiveNg> = {};
      const loadedLogs: Record<string, AbnormalityLog[]> = {};

      rows.forEach((row: any) => {
        if (row.plan_type === 'daily') {
          loadedJobs[row.id] = row.jobs || [];
        } else if (row.plan_type === 'avg') {
          loadedAvgJobs[row.id] = row.jobs || [];
        }
        if (row.day_ot) loadedDayOTs[row.id] = row.day_ot;
        if (row.night_ot) loadedNightOTs[row.id] = row.night_ot;
        if (row.logs) loadedLogs[row.id] = row.logs;
        loadedAbnormalities[row.id] = {
          isAbnormal: !!row.is_abnormal,
          type: row.abnormal_type || '',
          start: row.abnormal_start || '',
        };
        loadedNgs[row.id] = {
          isNg: !!row.is_ng,
          type: row.ng_type || '',
          start: row.ng_start || '',
        };
      });

      const filterStateByLockout = <T,>(prev: Record<string, T>, loaded: Record<string, T>): Record<string, T> => {
        const next = { ...prev };
        Object.keys(loaded).forEach((key) => {
          const lastWrite = lastLocalWriteRef.current[key];
          if (!lastWrite || Date.now() - lastWrite >= 5000) {
            next[key] = loaded[key];
          }
        });
        return next;
      };

      setMachineJobs((prev) => filterStateByLockout(prev, loadedJobs));
      setMachineAvgJobs((prev) => filterStateByLockout(prev, loadedAvgJobs));
      setDayOTs((prev) => filterStateByLockout(prev, loadedDayOTs));
      setNightOTs((prev) => filterStateByLockout(prev, loadedNightOTs));
      setLogs((prev) => filterStateByLockout(prev, loadedLogs));
      setActiveAbnormalities((prev) => filterStateByLockout(prev, loadedAbnormalities));
      setActiveNgs((prev) => filterStateByLockout(prev, loadedNgs));
      setErrorMsg(null);
    } catch (e) {
      console.error('Error fetching production plans:', e);
      setErrorMsg('Gagal terhubung ke database plans.');
      useToastStore.getState().showToast('Gagal memuat rencana produksi dari server.', 'error');
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  // Reorders machine jobs and saves changes to PostgreSQL
  const reorderMachineJobs = (machineId: string, jobs: Job[], dateStr?: string) => {
    const date = dateStr || productionService.getTodayDateString();
    const finalKey = `${date}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    const solved = productionService.recalculateTimeline(jobs);
    setMachineJobs((prev) => ({ ...prev, [finalKey]: solved }));
    savePlanToDatabase(
      finalKey,
      'daily',
      machineId,
      date,
      solved,
      dayOTs[finalKey] || 'teiji',
      nightOTs[finalKey] || 'teiji',
      logs[finalKey] || []
    );
  };

  const reorderMachineAvgJobs = (machineId: string, jobs: Job[], dateStr?: string) => {
    const selectedDate = dateStr || productionService.getTodayDateString();
    const monthStr = selectedDate.substring(0, 7);
    const avgKey = `${monthStr}_avg_${machineId}`;
    lastLocalWriteRef.current[avgKey] = Date.now();
    const solved = productionService.recalculateTimeline(jobs);
    setMachineAvgJobs((prev) => ({ ...prev, [avgKey]: solved }));
    savePlanToDatabase(avgKey, 'avg', machineId, monthStr, solved, 'teiji', 'teiji', []);
  };

  const resetAllMachines = (dateStr?: string, parts?: any[]) => {
    const date = dateStr || productionService.getTodayDateString();
    const monthStr = date.substring(0, 7);
    const ALL_ACTIVE_MACHINES = [
      ...new Set([
        ...Object.keys(machineJobs).map((k) => k.split('_')[1]),
        ...Object.keys(machineAvgJobs).map((k) => k.split('_')[2] || k.split('_')[1]),
      ].filter(Boolean)),
    ];
    if (ALL_ACTIVE_MACHINES.length === 0) {
      ALL_ACTIVE_MACHINES.push(
        'MC 1', 'MC 2', 'MC 3', 'MC 4', 'MC 5', 'MC 6', 'MC 7', 'MC 8', 'MC 9', 'MC 10',
        'MC 11', 'MC 12', 'MC 13', 'MC 14', 'MC 15', 'MC 16', 'MC 17', 'MC 18', 'MC 19', 'MC 20', 'MC 21'
      );
    }

    const nextJobs: Record<string, Job[]> = {};
    const nextAvgJobs: Record<string, Job[]> = {};

    for (const machine of ALL_ACTIVE_MACHINES) {
      const initialJobs = parts && parts.length > 0 ? productionService.getHeijunkaJobsForMachine(machine, date, parts) : [];

      const finalKey = `${date}_${machine}`;
      lastLocalWriteRef.current[finalKey] = Date.now();
      nextJobs[finalKey] = initialJobs;
      savePlanToDatabase(finalKey, 'daily', machine, date, initialJobs, 'teiji', 'teiji', []);

      const avgKey = `${monthStr}_avg_${machine}`;
      lastLocalWriteRef.current[avgKey] = Date.now();
      nextAvgJobs[avgKey] = initialJobs;
      savePlanToDatabase(avgKey, 'avg', machine, monthStr, initialJobs, 'teiji', 'teiji', []);
    }

    setMachineJobs((prev) => ({ ...prev, ...nextJobs }));
    setMachineAvgJobs((prev) => ({ ...prev, ...nextAvgJobs }));
    useToastStore.getState().showToast('Rencana jadwal seluruh mesin telah di-reset.', 'info');
  };

  const updateOTSettings = (machineId: string, dayOT: string, nightOT: string, dateStr?: string) => {
    const date = dateStr || productionService.getTodayDateString();
    const finalKey = `${date}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    setDayOTs((prev) => ({ ...prev, [finalKey]: dayOT }));
    setNightOTs((prev) => ({ ...prev, [finalKey]: nightOT }));
    const list = machineJobs[finalKey] || [];
    const solved = productionService.recalculateTimeline(list);
    setMachineJobs((prev) => ({ ...prev, [finalKey]: solved }));
    savePlanToDatabase(
      finalKey,
      'daily',
      machineId,
      date,
      solved,
      dayOT,
      nightOT,
      logs[finalKey] || []
    );
    useToastStore.getState().showToast(`Pengaturan OT (${machineId}) berhasil diperbarui.`, 'success');
  };

  const reviseJobNgQty = (
    machineId: string,
    jobId: string,
    newNgQty: number,
    newOkQty: number,
    dateStr?: string,
    logMessage?: { type: string; note: string }
  ) => {
    const date = dateStr || productionService.getTodayDateString();
    const finalKey = `${date}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    let nextLogs = logs[finalKey] || [];
    if (logMessage) {
      const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const recordDate = new Date().toLocaleDateString();
      const newRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: logMessage.type,
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`,
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs((prev) => ({ ...prev, [finalKey]: nextLogs }));
    }
    const list = machineJobs[finalKey] || [];
    const updated = list.map((j) => {
      if (j.id === jobId) {
        return {
          ...j,
          closedNgQty: newNgQty,
          closedOkQty: newOkQty,
          actualQty: newOkQty,
        };
      }
      return j;
    });
    const solved = productionService.recalculateTimeline(updated);
    setMachineJobs((prev) => ({ ...prev, [finalKey]: solved }));
    savePlanToDatabase(
      finalKey,
      'daily',
      machineId,
      date,
      solved,
      dayOTs[finalKey] || 'teiji',
      nightOTs[finalKey] || 'teiji',
      nextLogs
    );
    useToastStore.getState().showToast('Revisi hasil produksi OK/NG berhasil disimpan.', 'success');
  };

  const updateMonthlyPlans = async (updatedParts: any[], dateStr?: string) => {
    const date = dateStr || productionService.getTodayDateString();
    const monthStr = date.substring(0, 7);

    const machinesSet = new Set<string>();
    updatedParts.forEach((p) => {
      if (p.home_line) {
        const parsed = productionService.parseMachineIdentifier(p.home_line);
        if (parsed && parsed.factory !== 'UNKNOWN' && parsed.machine) {
          const key = productionService.getUniqueMachineKey(parsed.factory, parsed.machine);
          machinesSet.add(key);
        }
      }
    });

    const activeMachines = Array.from(machinesSet);
    const nextAvgJobs: Record<string, Job[]> = {};

    for (const machineId of activeMachines) {
      const initialJobs = productionService.getHeijunkaJobsForMachine(machineId, date, updatedParts);
      const avgKey = `${monthStr}_avg_${machineId}`;
      lastLocalWriteRef.current[avgKey] = Date.now();
      nextAvgJobs[avgKey] = initialJobs;

      await savePlanToDatabase(avgKey, 'avg', machineId, monthStr, initialJobs, 'teiji', 'teiji', []);
    }

    setMachineAvgJobs((prev) => ({ ...prev, ...nextAvgJobs }));
  };

  // Connects Socket.io client and binds broadcast listeners for real-time telemetry updates
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchPlans();

    const socket = initSocket();
    socket.connect();

    const handleConnect = () => {
      console.log('[Socket] Connected to telemetry room');
    };

    const handleConnectError = (err: any) => {
      console.error('[Socket] Connection error:', err.message || err);
    };

    const isSamePlanKey = (keyA: string, keyB: string): boolean => {
      if (!keyA || !keyB) return false;
      if (keyA.toLowerCase() === keyB.toLowerCase()) return true;
      const cleanA = keyA.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanB = keyB.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanA === cleanB;
    };

    const handlePlanUpdated = (row: any) => {
      if (!row || !row.id) return;
      const lastWrite = lastLocalWriteRef.current[row.id];
      if (lastWrite && Date.now() - lastWrite < 5000) return;

      const updateKeyMap = <T,>(prev: Record<string, T>, value: T) => {
        const next = { ...prev, [row.id]: value };
        Object.keys(prev).forEach((k) => {
          if (isSamePlanKey(k, row.id)) {
            next[k] = value;
          }
        });
        return next;
      };

      if (row.plan_type === 'daily') {
        setMachineJobs((prev) => updateKeyMap(prev, row.jobs || []));
      }
      if (row.day_ot) setDayOTs((prev) => updateKeyMap(prev, row.day_ot));
      if (row.night_ot) setNightOTs((prev) => updateKeyMap(prev, row.night_ot));
      if (row.logs) setLogs((prev) => updateKeyMap(prev, row.logs || []));

      const abnVal = { isAbnormal: !!row.is_abnormal, type: row.abnormal_type || '', start: row.abnormal_start || '' };
      setActiveAbnormalities((prev) => updateKeyMap(prev, abnVal));

      const ngVal = { isNg: !!row.is_ng, type: row.ng_type || '', start: row.ng_start || '' };
      setActiveNgs((prev) => updateKeyMap(prev, ngVal));
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('production_plan_updated', handlePlanUpdated);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('production_plan_updated', handlePlanUpdated);
      socket.disconnect();
    };
  }, [isAuthenticated]);

  // Initializes a machine plan with generated leveled Heijunka schedules if empty
  const initializeMachineIfEmpty = (machineId: string, dateStr: string, parts: any[]) => {
    if (!hasFetched) return;
    const finalKey = `${dateStr}_${machineId}`;
    const monthStr = dateStr.substring(0, 7);
    const avgKey = `${monthStr}_avg_${machineId}`;

    if (machineJobs[finalKey] !== undefined) return;

    const initialJobs = productionService.getHeijunkaJobsForMachine(machineId, dateStr, parts);

    setMachineJobs((prev) => ({ ...prev, [finalKey]: initialJobs }));
    setDayOTs((prev) => ({ ...prev, [finalKey]: 'teiji' }));
    setNightOTs((prev) => ({ ...prev, [finalKey]: 'teiji' }));
    setLogs((prev) => ({ ...prev, [finalKey]: [] }));
    setActiveAbnormalities((prev) => ({ ...prev, [finalKey]: { isAbnormal: false, type: '', start: '' } }));
    setActiveNgs((prev) => ({ ...prev, [finalKey]: { isNg: false, type: '', start: '' } }));

    setMachineAvgJobs((prev) => {
      if (prev[avgKey] === undefined) {
        savePlanToDatabase(
          avgKey,
          'avg',
          machineId,
          monthStr,
          initialJobs,
          'teiji',
          'teiji',
          [],
          false,
          '',
          '',
          false,
          '',
          ''
        );
        return { ...prev, [avgKey]: initialJobs };
      }
      return prev;
    });

    savePlanToDatabase(
      finalKey,
      'daily',
      machineId,
      dateStr,
      initialJobs,
      'teiji',
      'teiji',
      [],
      false,
      '',
      '',
      false,
      '',
      ''
    );
  };

  // Increments job volume and appends audit trace records
  const incrementJobProgress = (
    machineId: string,
    jobId: string,
    qty: number,
    dateStr: string,
    parts: any[],
    logMessage?: { type: string; note: string }
  ) => {
    const finalKey = `${dateStr}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    let nextLogs = logs[finalKey] || [];
    if (logMessage) {
      const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const recordDate = new Date().toLocaleDateString();
      const newRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: logMessage.type,
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`,
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs((prev) => ({ ...prev, [finalKey]: nextLogs }));
    }
    let list = machineJobs[finalKey] || [];
    if (list.length === 0) {
      list = productionService.getHeijunkaJobsForMachine(machineId, dateStr, parts);
    }
    const updated = list.map((j) => {
      if (j.id === jobId) {
        const newQty = Math.min(j.qtyLot, j.actualQty + qty);
        return { ...j, actualQty: newQty };
      }
      return j;
    });
    setMachineJobs((prev) => ({ ...prev, [finalKey]: updated }));
    savePlanToDatabase(
      finalKey,
      'daily',
      machineId,
      dateStr,
      updated,
      dayOTs[finalKey] || 'teiji',
      nightOTs[finalKey] || 'teiji',
      nextLogs
    );
    useToastStore.getState().showToast(`Progress hasil produksi ditambah +${qty}.`, 'success');
  };

  // Modifies a job's status and cascades timeline changes downstream
  const updateJobStatus = (
    machineId: string,
    jobId: string,
    action: 'complete-running' | 'complete-dandori' | 'complete-final-dandori',
    dateStr: string = productionService.getTodayDateString(),
    parts: any[] = [],
    logMessage?: { type: string; note: string },
    closedNgQty?: number,
    closedOkQty?: number
  ) => {
    const finalKey = `${dateStr}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    let nextLogs = logs[finalKey] || [];
    if (logMessage) {
      const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const recordDate = new Date().toLocaleDateString();
      const newRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: logMessage.type,
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`,
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs((prev) => ({ ...prev, [finalKey]: nextLogs }));
    }
    let list = machineJobs[finalKey] || [];
    if (list.length === 0) {
      list = productionService.getHeijunkaJobsForMachine(machineId, dateStr, parts);
    }
    const idx = list.findIndex((j) => j.id === jobId);
    if (idx !== -1) {
      const updated = [...list];
      const nowTimeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      if (action === 'complete-running') {
        const closedNg = closedNgQty ?? updated[idx].closedNgQty ?? 0;
        const defaultOk = updated[idx].actualQty || 0;
        const closedOk = closedOkQty !== undefined ? closedOkQty : defaultOk;

        const remainingInShift = updated.filter(
          (j, fIdx) => fIdx > idx && j.shift === updated[idx].shift && j.status !== 'completed'
        );
        const isLastInShift = remainingInShift.length === 0;

        const completedJob = {
          ...updated[idx],
          status: 'completed' as const,
          actualProductionEnd: nowTimeStr,
          actualQty: closedOk,
          closedNgQty: closedNg,
          closedOkQty: closedOk,
          needsFinalDandori: isLastInShift ? true : updated[idx].needsFinalDandori,
          finalDandoriCompleted: isLastInShift ? false : updated[idx].finalDandoriCompleted,
          finalDandoriStart: isLastInShift ? updated[idx].finalDandoriStart || nowTimeStr : updated[idx].finalDandoriStart,
        };
        updated[idx] = completedJob;
        if (idx + 1 < updated.length && updated[idx + 1].shift === updated[idx].shift) {
          updated[idx + 1] = {
            ...updated[idx + 1],
            status: 'dandori',
            actualDandoriStart: nowTimeStr,
          };
        }
        useToastStore.getState().showToast(`Job ${completedJob.model} selesai diproduksi.`, 'success');
      } else if (action === 'complete-dandori') {
        updated[idx] = {
          ...updated[idx],
          status: 'running',
          actualDandoriEnd: nowTimeStr,
          actualProductionStart: nowTimeStr,
        };
        useToastStore.getState().showToast(`Proses Dandori selesai, mesin ${machineId} mulai berjalan.`, 'info');
      } else if (action === 'complete-final-dandori') {
        const startStr = updated[idx].finalDandoriStart || updated[idx].actualProductionEnd || nowTimeStr;
        updated[idx] = {
          ...updated[idx],
          needsFinalDandori: true,
          finalDandoriCompleted: true,
          finalDandoriStart: startStr,
          finalDandoriEnd: nowTimeStr,
        };
        useToastStore.getState().showToast(`Dandori Akhir Shift selesai.`, 'success');
      }
      const solved = productionService.recalculateTimeline(updated);
      setMachineJobs((prev) => ({ ...prev, [finalKey]: solved }));
      savePlanToDatabase(
        finalKey,
        'daily',
        machineId,
        dateStr,
        solved,
        dayOTs[finalKey] || 'teiji',
        nightOTs[finalKey] || 'teiji',
        nextLogs
      );
    }
  };

  // Closes out scheduled jobs for a specific shift in one batch action
  const closeShiftProduction = (
    machineId: string,
    shift: 'day' | 'night',
    dateStr: string,
    userInitials: string = 'SU',
    machineDisplayName?: string,
    _autoFinalize: boolean = true
  ) => {
    const finalKey = `${dateStr}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const recordDate = new Date().toLocaleDateString();

    const list = machineJobs[finalKey] || [];
    const shiftJobs = list.filter((j) => j.shift === shift);
    const mName = machineDisplayName || `MC ${machineId}`;

    if (shiftJobs.length === 0) return;

    const shiftClosedKey = `[SHIFT CLOSED] Penutupan produksi shift ${shift.toUpperCase()}`;
    const alreadyClosed = (logs[finalKey] || []).some((l) => l.message && l.message.includes(shiftClosedKey));
    const allCompletedInShift = shiftJobs.every(
      (j) => j.status === 'completed' && (j.finalDandoriCompleted || !j.needsFinalDandori)
    );

    if (alreadyClosed && allCompletedInShift) {
      return;
    }

    const lastJobInShift = shiftJobs[shiftJobs.length - 1];
    let nextLogs = [...(logs[finalKey] || [])];

    const updated = list.map((j) => {
      if (j.shift === shift) {
        const closedNg = j.closedNgQty || 0;
        const effectiveOk = j.closedOkQty !== undefined ? j.closedOkQty : (j.actualQty || 0);
        const hasStarted = !!j.actualProductionStart;
        const isLast = j.id === lastJobInShift.id;

        if (j.status !== 'completed') {
          const autoLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            machineId,
            date: recordDate,
            time,
            type: 'info',
            message: `[AUTO-COMPLETE] Job ${j.model} diselesaikan otomatis di akhir shift ${shift.toUpperCase()}. OK: ${effectiveOk}, NG: ${closedNg}. (${userInitials})`,
          };
          nextLogs.unshift(autoLog);
        }

        return {
          ...j,
          actualQty: effectiveOk,
          closedOkQty: effectiveOk,
          closedNgQty: closedNg,
          status: 'completed' as const,
          actualProductionEnd: hasStarted ? j.actualProductionEnd || time : undefined,
          needsFinalDandori: isLast ? true : j.needsFinalDandori,
          finalDandoriCompleted: true,
          finalDandoriStart: isLast ? j.finalDandoriStart || j.actualProductionEnd || time : j.finalDandoriStart,
          finalDandoriEnd: isLast ? j.finalDandoriEnd || time : j.finalDandoriEnd,
        };
      }
      return j;
    });

    const logNoteText = `Dandori Akhir Shift selesai untuk mesin ${mName}. (${userInitials})`;
    const existingFinalLog = nextLogs.find((l) => l.message && l.message.includes(`Dandori Akhir Shift selesai untuk mesin`));
    if (!existingFinalLog || existingFinalLog.time !== time) {
      const finalDandoriLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: 'success',
        message: `[SUCCESS] ${logNoteText}`,
      };
      nextLogs.unshift(finalDandoriLog);
    }

    if (!alreadyClosed) {
      const shiftClosedLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: 'success',
        message: `[SHIFT CLOSED] Penutupan produksi shift ${shift.toUpperCase()} selesai. (${userInitials})`,
      };
      nextLogs.unshift(shiftClosedLog);
    }

    const deduplicatedLogs: AbnormalityLog[] = [];
    const seenShiftClosedMsg = new Set<string>();
    for (const logItem of nextLogs) {
      if (logItem.message && logItem.message.includes('[SHIFT CLOSED] Penutupan produksi shift')) {
        if (seenShiftClosedMsg.has(logItem.message)) {
          continue;
        }
        seenShiftClosedMsg.add(logItem.message);
      }
      deduplicatedLogs.push(logItem);
    }

    setLogs((prev) => ({ ...prev, [finalKey]: deduplicatedLogs }));

    let solved = productionService.recalculateTimeline(updated);

    setMachineJobs((prev) => ({ ...prev, [finalKey]: solved }));
    savePlanToDatabase(
      finalKey,
      'daily',
      machineId,
      dateStr,
      solved,
      dayOTs[finalKey] || 'teiji',
      nightOTs[finalKey] || 'teiji',
      deduplicatedLogs
    );

    useToastStore.getState().showToast(`Penutupan shift ${shift.toUpperCase()} (${mName}) telah diproses.`, 'success');
  };

  // Logs unexpected job downtime durations and recalculates Heijunka schedules
  const addJobDowntime = (
    machineId: string,
    jobId: string,
    downtimeMins: number,
    dateStr: string,
    logMessage?: { type: string; note: string }
  ) => {
    const finalKey = `${dateStr}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    let nextLogs = logs[finalKey] || [];
    if (logMessage) {
      const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const recordDate = new Date().toLocaleDateString();
      const newRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: logMessage.type,
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`,
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs((prev) => ({ ...prev, [finalKey]: nextLogs }));
    }
    const list = machineJobs[finalKey] || [];
    const updated = list.map((j) => {
      if (j.id === jobId) {
        const prevDowntime = j.downtimeMinutes || 0;
        return { ...j, downtimeMinutes: prevDowntime + downtimeMins, time: j.time + downtimeMins };
      }
      return j;
    });
    const solved = productionService.recalculateTimeline(updated);
    setMachineJobs((prev) => ({ ...prev, [finalKey]: solved }));
    savePlanToDatabase(
      finalKey,
      'daily',
      machineId,
      dateStr,
      solved,
      dayOTs[finalKey] || 'teiji',
      nightOTs[finalKey] || 'teiji',
      nextLogs
    );
    useToastStore.getState().showToast(`Downtime ${downtimeMins} menit ditambahkan ke jadwal.`, 'warning');
  };

  // Submits a change in abnormal running state for a specific machine
  const setMachineAbnormal = (
    machineId: string,
    isAbnormal: boolean,
    type = '',
    start = '',
    dateStr?: string,
    logMessage?: { type: string; note: string; timeStr?: string },
    downtimeMins?: number,
    downtimeJobId?: string
  ) => {
    const date = dateStr || productionService.getTodayDateString();
    const finalKey = `${date}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    let nextLogs = logs[finalKey] || [];
    if (logMessage) {
      const time = logMessage.timeStr || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const recordDate = new Date().toLocaleDateString();
      const newRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: logMessage.type,
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`,
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs((prev) => ({ ...prev, [finalKey]: nextLogs }));
    }
    setActiveAbnormalities((prev) => ({
      ...prev,
      [finalKey]: { isAbnormal, type, start },
    }));

    if (downtimeMins && downtimeJobId) {
      const list = machineJobs[finalKey] || [];
      const updated = list.map((j) => {
        if (j.id === downtimeJobId) {
          const prevDowntime = j.downtimeMinutes || 0;
          return { ...j, downtimeMinutes: prevDowntime + downtimeMins, time: j.time + downtimeMins };
        }
        return j;
      });
      const solved = productionService.recalculateTimeline(updated);
      setMachineJobs((prev) => ({ ...prev, [finalKey]: solved }));
      savePlanToDatabase(
        finalKey,
        'daily',
        machineId,
        date,
        solved,
        dayOTs[finalKey] || 'teiji',
        nightOTs[finalKey] || 'teiji',
        nextLogs,
        isAbnormal,
        type,
        start
      );
    } else {
      savePlanToDatabase(
        finalKey,
        'daily',
        machineId,
        date,
        machineJobs[finalKey] || [],
        dayOTs[finalKey] || 'teiji',
        nightOTs[finalKey] || 'teiji',
        nextLogs,
        isAbnormal,
        type,
        start
      );
    }

    if (isAbnormal) {
      useToastStore.getState().showToast(`Status Abnormality (${machineId}) AKTIF: ${type}`, 'error');
    } else {
      useToastStore.getState().showToast(`Status Abnormality (${machineId}) telah diselesaikan.`, 'success');
    }
  };

  // Submits a change in quality NG state for a specific machine
  const setMachineNg = (
    machineId: string,
    isNg: boolean,
    type = '',
    start = '',
    dateStr?: string,
    logMessage?: { type: string; note: string; timeStr?: string }
  ) => {
    const date = dateStr || productionService.getTodayDateString();
    const finalKey = `${date}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    let nextLogs = logs[finalKey] || [];
    if (logMessage) {
      const time = logMessage.timeStr || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const recordDate = new Date().toLocaleDateString();
      const newRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: logMessage.type,
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`,
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs((prev) => ({ ...prev, [finalKey]: nextLogs }));
    }
    setActiveNgs((prev) => ({
      ...prev,
      [finalKey]: { isNg, type, start },
    }));
    savePlanToDatabase(
      finalKey,
      'daily',
      machineId,
      date,
      machineJobs[finalKey] || [],
      dayOTs[finalKey] || 'teiji',
      nightOTs[finalKey] || 'teiji',
      nextLogs,
      undefined,
      undefined,
      undefined,
      isNg,
      type,
      start
    );

    if (isNg) {
      useToastStore.getState().showToast(`Status Quality NG (${machineId}) AKTIF: ${type}`, 'warning');
    } else {
      useToastStore.getState().showToast(`Status Quality NG (${machineId}) telah diselesaikan.`, 'success');
    }
  };

  const machineJobsRef = useRef(machineJobs);
  useEffect(() => {
    machineJobsRef.current = machineJobs;
  }, [machineJobs]);

  const closeShiftRef = useRef(closeShiftProduction);
  useEffect(() => {
    closeShiftRef.current = closeShiftProduction;
  }, [closeShiftProduction]);

  const dayOTsRef = useRef(dayOTs);
  useEffect(() => {
    dayOTsRef.current = dayOTs;
  }, [dayOTs]);

  const nightOTsRef = useRef(nightOTs);
  useEffect(() => {
    nightOTsRef.current = nightOTs;
  }, [nightOTs]);

  const activeAbnormalitiesRef = useRef(activeAbnormalities);
  useEffect(() => {
    activeAbnormalitiesRef.current = activeAbnormalities;
  }, [activeAbnormalities]);

  const activeNgsRef = useRef(activeNgs);
  useEffect(() => {
    activeNgsRef.current = activeNgs;
  }, [activeNgs]);

  const machinesDataRef = useRef(machinesData);
  useEffect(() => {
    machinesDataRef.current = machinesData;
  }, [machinesData]);

  const setMachineAbnormalRef = useRef(setMachineAbnormal);
  useEffect(() => {
    setMachineAbnormalRef.current = setMachineAbnormal;
  }, [setMachineAbnormal]);

  const setMachineNgRef = useRef(setMachineNg);
  useEffect(() => {
    setMachineNgRef.current = setMachineNg;
  }, [setMachineNg]);

  // Global background shift rollover check (evaluates every 10 seconds ONLY for today's active production date)
  useEffect(() => {
    const checkShiftRollover = () => {
      const now = new Date();
      const todayDate = productionService.getTodayDateString();
      const currentJobsMap = machineJobsRef.current || {};
      const allKeys = Object.keys(currentJobsMap).filter(
        (k) => k.startsWith(`${todayDate}_`) && !k.includes('_avg_')
      );

      allKeys.forEach((planKey) => {
        const parts = planKey.split('_');
        if (parts.length < 2) return;
        const dateStr = parts[0];
        const machineKey = parts[1];
        if (!dateStr || !machineKey) return;

        const jobs = currentJobsMap[planKey] || [];
        if (jobs.length === 0) return;

        const abnormality = activeAbnormalitiesRef.current[planKey];
        const ngState = activeNgsRef.current[planKey];

        const mcObj = (machinesDataRef.current || []).find((m: any) => m.code === machineKey);
        const mName = mcObj ? mcObj.name : `MC ${machineKey}`;

        const memberName = useAuthStore.getState().memberName;
        const activePortal = useAuthStore.getState().activePortal;
        const userInitials = memberName
          ? memberName
              .trim()
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 3)
              .toUpperCase()
          : activePortal === 'member'
          ? 'MB'
          : 'SYS';

        const dayJobs = jobs.filter((j) => j.shift === 'day');
        const nightJobs = jobs.filter((j) => j.shift === 'night');

        // 1. Evaluate Day Shift Closure (Fixed: 19:00 WIB)
        if (dayJobs.length > 0) {
          const dayEndStr = '19:00';
          const [h, m] = dayEndStr.split(':').map((n) => parseInt(n, 10));
          const dayEndClock = new Date(dateStr + 'T00:00:00');
          dayEndClock.setHours(h, m, 0, 0);

          const isDayShiftPending = dayJobs.some((j) => j.status !== 'completed' || !j.finalDandoriCompleted);
          if (now.getTime() >= dayEndClock.getTime() && isDayShiftPending) {
            if (abnormality?.isAbnormal) {
              setMachineAbnormalRef.current(machineKey, false, undefined, undefined, dateStr, {
                type: 'success',
                note: `[AUTO-RESOLVE] Abnormality di-resolve otomatis karena shift DAY berakhir. (${userInitials})`,
              });
            }
            if (ngState?.isNg) {
              setMachineNgRef.current(machineKey, false, undefined, undefined, dateStr, {
                type: 'success',
                note: `[AUTO-RESOLVE] Issue NG Quality di-resolve otomatis karena shift DAY berakhir. (${userInitials})`,
              });
            }
            closeShiftRef.current(machineKey, 'day', dateStr, userInitials, mName, true);
          }
        }

        // 2. Evaluate Night Shift Closure (Fixed: 07:00 WIB)
        if (nightJobs.length > 0) {
          const nightEndStr = '07:00';
          const [h, m] = nightEndStr.split(':').map((n) => parseInt(n, 10));
          const nightEndClock = new Date(dateStr + 'T00:00:00');
          nightEndClock.setDate(nightEndClock.getDate() + 1);
          nightEndClock.setHours(h, m, 0, 0);

          const isNightShiftPending = nightJobs.some((j) => j.status !== 'completed' || !j.finalDandoriCompleted);
          if (now.getTime() >= nightEndClock.getTime() && isNightShiftPending) {
            if (abnormality?.isAbnormal) {
              setMachineAbnormalRef.current(machineKey, false, undefined, undefined, dateStr, {
                type: 'success',
                note: `[AUTO-RESOLVE] Abnormality di-resolve otomatis karena shift NIGHT berakhir. (${userInitials})`,
              });
            }
            if (ngState?.isNg) {
              setMachineNgRef.current(machineKey, false, undefined, undefined, dateStr, {
                type: 'success',
                note: `[AUTO-RESOLVE] Issue NG Quality di-resolve otomatis karena shift NIGHT berakhir. (${userInitials})`,
              });
            }
            closeShiftRef.current(machineKey, 'night', dateStr, userInitials, mName, true);
          }
        }
      });
    };

    checkShiftRollover();
    const timer = setInterval(checkShiftRollover, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ProductionContext.Provider
      value={{
        machineJobs,
        machineAvgJobs,
        logs,
        dayOTs,
        nightOTs,
        activeAbnormalities,
        activeNgs,
        isLoading,
        errorMsg,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        machinesData,
        partsData,
        dynamicResinData,
        paintingData: defaultPaintingData,
        allMachinesList,
        fetchPlans,
        initializeMachineIfEmpty,
        incrementJobProgress,
        updateJobStatus,
        closeShiftProduction,
        addJobDowntime,
        setMachineAbnormal,
        setMachineNg,
        reorderMachineJobs,
        reorderMachineAvgJobs,
        resetAllMachines,
        updateOTSettings,
        reviseJobNgQty,
        updateMonthlyPlans,
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
}

export function useProduction() {
  const context = useContext(ProductionContext);
  if (context === undefined) {
    throw new Error('useProduction must be used within a ProductionProvider');
  }
  return context;
}
