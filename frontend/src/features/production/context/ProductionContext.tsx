import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../../../shared/lib/axios';
import { initSocket } from '../../../shared/lib/socket';
import { useAuthStore } from '../../../shared/store/useAuthStore';

export type JobStatus = 'completed' | 'dandori' | 'running' | 'queued';

export interface Job {
  id: string;
  seq: number;
  customer: string;
  model: string;
  partName: string;
  qtyDay: number;
  qtyLot: number;
  actualQty: number;
  mold: string;
  material: string;
  kav: number;
  ct: number;
  spec?: number;
  dandori: number;
  time: number;
  status: JobStatus;
  timeRange: string;
  dandoriTimeRange?: string;
  shift: 'day' | 'night' | 'overflow';
  spansOffHours?: boolean;
  triggerTime?: string;
  eta?: string;
  actualDandoriStart?: string;
  actualDandoriEnd?: string;
  actualProductionStart?: string;
  actualProductionEnd?: string;
  downtimeMinutes?: number;
  closedNgQty?: number;
  closedOkQty?: number;
  needsFinalDandori?: boolean;
  finalDandoriCompleted?: boolean;
  finalDandoriStart?: string;
  finalDandoriEnd?: string;
}

export interface AbnormalityLog {
  id: string;
  machineId: string;
  date: string;
  time: string;
  type: string;
  message: string;
}

export interface ActiveAbnormality {
  isAbnormal: boolean;
  type: string;
  start: string;
}

export interface ActiveNg {
  isNg: boolean;
  type: string;
  start: string;
}

interface ProductionContextType {
  machineJobs: Record<string, Job[]>;
  machineAvgJobs: Record<string, Job[]>;
  logs: Record<string, AbnormalityLog[]>;
  dayOTs: Record<string, string>;
  nightOTs: Record<string, string>;
  activeAbnormalities: Record<string, ActiveAbnormality>;
  activeNgs: Record<string, ActiveNg>;
  isLoading: boolean;
  errorMsg: string | null;
  fetchPlans: () => Promise<void>;
  initializeMachineIfEmpty: (machineId: string, dateStr: string, parts: any[]) => void;
  incrementJobProgress: (machineId: string, jobId: string, qty: number, dateStr: string, parts: any[], logMessage?: { type: string; note: string }) => void;
  updateJobStatus: (machineId: string, jobId: string, action: 'complete-running' | 'complete-dandori' | 'complete-final-dandori', dateStr?: string, parts?: any[], logMessage?: { type: string; note: string }, closedNgQty?: number, closedOkQty?: number) => void;
  closeShiftProduction: (machineId: string, shift: 'day' | 'night', dateStr: string, userInitials?: string, machineDisplayName?: string, autoFinalize?: boolean) => void;
  addJobDowntime: (machineId: string, jobId: string, downtimeMins: number, dateStr: string, logMessage?: { type: string; note: string }) => void;
  setMachineAbnormal: (machineId: string, isAbnormal: boolean, type?: string, start?: string, dateStr?: string, logMessage?: { type: string; note: string; timeStr?: string }, downtimeMins?: number, downtimeJobId?: string) => void;
  setMachineNg: (machineId: string, isNg: boolean, type?: string, start?: string, dateStr?: string, logMessage?: { type: string; note: string; timeStr?: string }) => void;
  reorderMachineJobs: (machineId: string, jobs: Job[], dateStr?: string) => void;
  reorderMachineAvgJobs: (machineId: string, jobs: Job[], dateStr?: string) => void;
  resetAllMachines: (dateStr?: string, parts?: any[]) => void;
  updateOTSettings: (machineId: string, dayOT: string, nightOT: string, dateStr?: string) => void;
  reviseJobNgQty: (machineId: string, jobId: string, newNgQty: number, newOkQty: number, dateStr?: string, logMessage?: { type: string; note: string }) => void;
  updateMonthlyPlans: (updatedParts: any[], dateStr?: string) => Promise<void>;
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

// Calculates working hours blocks based on Sugity shift patterns
function getWorkingBlocks() {
  const blocks: [number, number][] = [];
  blocks.push([435, 570]);
  blocks.push([580, 715]);
  blocks.push([755, 965]);
  blocks.push([980, 1140]);
  blocks.push([1260, 1440]);
  blocks.push([0, 60]);
  blocks.push([100, 280]);
  blocks.push([295, 435]);
  blocks.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const block of blocks) {
    if (merged.length === 0) {
      merged.push([...block]);
    } else {
      const last = merged[merged.length - 1];
      if (block[0] <= last[1]) {
        last[1] = Math.max(last[1], block[1]);
      } else {
        merged.push([...block]);
      }
    }
  }
  return merged;
}

// Adds working minutes to a Date object while skipping off hours and breaks
export function addWorkingMinutes(current: Date, minutesToAdd: number): Date {
  const result = new Date(current);
  let remaining = minutesToAdd;
  let iterations = 0;
  while (remaining > 0 && iterations < 100) {
    iterations++;
    const blocks = getWorkingBlocks();
    const timeInMins = result.getHours() * 60 + result.getMinutes() + result.getSeconds() / 60;
    let foundBlock = false;
    for (const block of blocks) {
      if (timeInMins >= block[0] && timeInMins < block[1]) {
        const available = block[1] - timeInMins;
        if (remaining <= available) {
          result.setMinutes(result.getMinutes() + remaining);
          remaining = 0;
          foundBlock = true;
          break;
        } else {
          remaining -= available;
          result.setHours(Math.floor(block[1] / 60), block[1] % 60, 0, 0);
          foundBlock = true;
          break;
        }
      } else if (timeInMins < block[0]) {
        result.setHours(Math.floor(block[0] / 60), block[0] % 60, 0, 0);
        foundBlock = true;
        break;
      }
    }
    if (!foundBlock) {
      result.setDate(result.getDate() + 1);
      result.setHours(0, 0, 0, 0);
    }
  }
  return result;
}

// Recalculates the timing fields of the scheduled jobs timeline
const recalculateTimelineHelper = (items: Job[]): Job[] => {
  const firstDayIdx = items.findIndex(item => item.shift === 'day');
  const firstNightIdx = items.findIndex(item => item.shift === 'night');
  const dayStart = new Date();
  dayStart.setHours(7, 15, 0, 0);
  const nightPrepStart = new Date(dayStart);
  nightPrepStart.setHours(21, 0, 0, 0);
  let lastDayEndTime = new Date(dayStart);
  lastDayEndTime.setMinutes(lastDayEndTime.getMinutes() + 15);
  let lastNightEndTime = new Date(nightPrepStart);
  lastNightEndTime.setMinutes(lastNightEndTime.getMinutes() + 10);
  let isFirstNight = true;
  return items.map((item, index) => {
    const jobShift = item.shift || 'day';
    let jobStartClock = new Date();
    if (jobShift === 'day') {
      jobStartClock = new Date(lastDayEndTime);
    } else if (jobShift === 'night') {
      if (isFirstNight) {
        let nightStart = new Date(nightPrepStart);
        if (lastDayEndTime.getTime() > nightStart.getTime()) {
          nightStart = new Date(lastDayEndTime);
        }
        jobStartClock = new Date(nightStart);
        jobStartClock.setMinutes(jobStartClock.getMinutes() + 10);
        isFirstNight = false;
      } else {
        jobStartClock = new Date(lastNightEndTime);
      }
    } else {
      jobStartClock = new Date(lastNightEndTime);
    }
    const startStr = jobStartClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const startTimeStamp = jobStartClock.getTime();
    const endJobClock = addWorkingMinutes(jobStartClock, item.time);
    const endStr = endJobClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const endTimeStamp = endJobClock.getTime();
    const actualDandori = item.dandori !== undefined ? item.dandori : 15;
    let dandoriRangeStr = '';
    let runningClock = new Date(endJobClock);
    if (actualDandori > 0 && jobShift !== 'overflow') {
      const dandoriStartClock = new Date(endJobClock);
      const dandoriEndClock = addWorkingMinutes(dandoriStartClock, actualDandori);
      const dandoriEndStr = dandoriEndClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      dandoriRangeStr = `${endStr} - ${dandoriEndStr}`;
      runningClock = dandoriEndClock;
    }
    if (jobShift === 'day') {
      lastDayEndTime = new Date(runningClock);
    } else {
      lastNightEndTime = new Date(runningClock);
    }
    const elapsedMins = Math.round((endTimeStamp - startTimeStamp) / 60000);
    const spansOffHours = elapsedMins > item.time;
    let status = item.status;
    if (status !== 'completed' && status !== 'running') {
      const dayJobs = items.filter(j => j.shift === 'day');
      const isDayShiftClosedOrDone = dayJobs.length === 0 || dayJobs.every(j => j.status === 'completed' && (!j.needsFinalDandori || j.finalDandoriCompleted));

      if (index === firstDayIdx) {
        status = 'dandori';
      } else if (index === firstNightIdx) {
        status = isDayShiftClosedOrDone ? 'dandori' : 'queued';
      } else if (index > 0 && items[index - 1].status === 'completed') {
        const prevJob = items[index - 1];
        if (prevJob.shift === item.shift) {
          status = 'dandori';
        } else {
          status = isDayShiftClosedOrDone ? 'dandori' : 'queued';
        }
      } else {
        status = 'queued';
      }
    }
    let actualDandoriStart = item.actualDandoriStart;
    let actualDandoriEnd = item.actualDandoriEnd;
    let actualProductionStart = item.actualProductionStart;
    let actualProductionEnd = item.actualProductionEnd;
    if (status === 'queued') {
      actualDandoriStart = undefined;
      actualDandoriEnd = undefined;
      actualProductionStart = undefined;
      actualProductionEnd = undefined;
    } else if (status === 'dandori' && !actualDandoriStart) {
      actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
    }
    if (status === 'running') {
      if (!actualDandoriStart) {
        actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
      }
      if (!actualDandoriEnd) {
        actualDandoriEnd = actualProductionStart || (jobShift === 'night' ? '21:10' : '07:30');
      }
      if (!actualProductionStart) {
        actualProductionStart = actualDandoriEnd;
      }
    }
    if (status === 'completed') {
      const isSkipped = (item.actualQty === undefined || item.actualQty === 0) && !item.actualProductionStart && !item.actualDandoriStart;
      if (!isSkipped) {
        if (!actualDandoriStart) {
          actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
        }
        if (!actualDandoriEnd) {
          actualDandoriEnd = jobShift === 'night' ? '21:10' : '07:30';
        }
        if (!actualProductionStart) {
          actualProductionStart = actualDandoriEnd;
        }
        if (!actualProductionEnd) {
          const [shStr, smStr] = actualProductionStart.split(':');
          const sh = parseInt(shStr, 10);
          const sm = parseInt(smStr, 10);
          const startClock = new Date();
          startClock.setHours(sh, sm, 0, 0);
          const endClock = new Date(startClock.getTime() + item.time * 60000);
          actualProductionEnd = endClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }
      } else {
        actualDandoriStart = undefined;
        actualDandoriEnd = undefined;
        actualProductionStart = undefined;
        actualProductionEnd = undefined;
      }
    }
    return {
      ...item,
      seq: index + 1,
      timeRange: `${startStr} - ${endStr}`,
      dandoriTimeRange: dandoriRangeStr,
      shift: jobShift,
      dandori: actualDandori,
      status,
      spansOffHours,
      actualDandoriStart,
      actualDandoriEnd,
      actualProductionStart,
      actualProductionEnd
    };
  });
};

// Normalizes machine codes for identification matching
export const normalizeLineName = (line: string): string => {
  if (!line) return '';
  return line.trim().toUpperCase().replace(/\s+/g, '').replace(/#/g, '').replace(/MC/g, '').replace(/-?\d+T$/g, '');
};

// Parses machine identifier details to separate factory and code
export const parseMachineIdentifier = (str: string) => {
  if (!str) return { factory: 'UNKNOWN', machine: '' };
  const upper = str.toUpperCase().replace(/\s+/g, '');
  let factory = 'UNKNOWN';
  if (upper.includes('FACT2') || upper.includes('F2') || upper.includes('FACTORY2')) {
    factory = 'F2';
  } else if (upper.includes('FACT3') || upper.includes('F3') || upper.includes('FACTORY3')) {
    factory = 'F3';
  } else if (upper.includes('FACT4') || upper.includes('F4') || upper.includes('FACTORY4')) {
    factory = 'F4';
  } else if (upper.includes('SC2')) {
    factory = 'SC2';
  }
  const remaining = upper
    .replace(/FACTORY\s*\d?/g, '')
    .replace(/FACT\s*\d?/g, '')
    .replace(/F\s*\d/g, '')
    .replace(/SC\s*\d?/g, '')
    .replace(/RESIN/g, '')
    .replace(/M\/C/g, '')
    .replace(/MC/g, '')
    .replace(/MACHINE/g, '')
    .replace(/#/g, '')
    .replace(/-?\d+T$/i, '')
    .replace(/-/g, '');
  const match = remaining.match(/([B]?[0-9]+[B]?)/);
  const machine = match ? match[1] : remaining;
  return { factory, machine };
};

// Compares two machine codes to determine if they match the same machine
export const machinesMatch = (nameA: string, nameB: string): boolean => {
  const pA = parseMachineIdentifier(nameA);
  const pB = parseMachineIdentifier(nameB);
  if (pA.factory === 'UNKNOWN' || pB.factory === 'UNKNOWN') {
    const normA = normalizeLineName(nameA);
    const normB = normalizeLineName(nameB);
    return normA.includes(normB) || normB.includes(normA);
  }
  return pA.factory === pB.factory && pA.machine === pB.machine;
};

// Obtains the calendar month boundaries for forecast mappings
const getForecastMonthKeys = () => {
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const getKey = (offset: number) => {
    const targetMonthIdx = (currentMonthIdx + offset) % 12;
    const targetYear = currentYear + Math.floor((currentMonthIdx + offset) / 12);
    const mm = String(targetMonthIdx + 1).padStart(2, '0');
    return `${targetYear}-${mm}`;
  };
  return {
    monthN: getKey(0),
    monthN1: getKey(1),
    monthN2: getKey(2),
    monthN3: getKey(3),
  };
};

// Builds Leveled Heijunka jobs for a machine based on daily requirement and Shikake counts
export const getHeijunkaJobsForMachine = (machineId: string, dateStr: string, parts: any[]): Job[] => {
  if (!parts || !Array.isArray(parts) || parts.length === 0) return [];
  const machineParts = parts.filter(p => p.home_line && machinesMatch(p.home_line, machineId));
  if (machineParts.length === 0) return [];
  const targetMonthKey = dateStr.substring(0, 7);
  const monthKeys = getForecastMonthKeys();
  const activeJobs: Job[] = [];
  const partRuns: Job[][] = machineParts.map((part, pIdx) => {
    const dbForecasts = part.monthly_forecasts || {};
    const monthForecast = dbForecasts[targetMonthKey];
    let qtyDay = 0;
    if (monthForecast && monthForecast.daily !== undefined) {
      qtyDay = Number(monthForecast.daily);
    } else {
      if (targetMonthKey === monthKeys.monthN) {
        qtyDay = part.daily_requirement_n !== undefined ? Number(part.daily_requirement_n) : 0;
      } else if (targetMonthKey === monthKeys.monthN1) {
        qtyDay = part.daily_requirement_n1 !== undefined ? Number(part.daily_requirement_n1) : 0;
      } else if (targetMonthKey === monthKeys.monthN2) {
        qtyDay = part.daily_requirement_n2 !== undefined ? Number(part.daily_requirement_n2) : 0;
      } else if (targetMonthKey === monthKeys.monthN3) {
        qtyDay = part.daily_requirement_n3 !== undefined ? Number(part.daily_requirement_n3) : 0;
      } else {
        qtyDay = part.daily_requirement_n !== undefined ? Number(part.daily_requirement_n) : 0;
      }
    }
    if (qtyDay <= 0) return [];
    const runs = part.shikake || 2;
    const kanban = part.spec && Number(part.spec) > 0 ? Number(part.spec) : 0;
    const rawQtyLot = qtyDay / runs;
    const qtyLot = kanban > 0 ? Math.ceil(rawQtyLot / kanban) * kanban : Math.round(rawQtyLot) || 200;
    const cavity = part.cavity || 1;
    const ct = part.cycle_time || 60;
    const runtimeMins = Math.round(((qtyLot / cavity) * ct) / 60);
    const jobsList: Job[] = [];
    for (let r = 0; r < runs; r++) {
      jobsList.push({
        id: `job-init-${machineId}-${part.part_number || part.sebango || pIdx}-${r}-${dateStr}`,
        seq: 0,
        customer: part.customer || 'Unknown',
        model: part.part_number || part.sebango || '',
        partName: part.part_name || 'No Name',
        qtyDay: qtyDay,
        qtyLot: qtyLot,
        actualQty: 0,
        mold: part.mold || 'MOLD-01',
        material: part.material || 'PP RESIN',
        kav: cavity,
        ct: ct,
        spec: kanban > 0 ? kanban : undefined,
        dandori: 15,
        time: runtimeMins,
        status: 'queued',
        timeRange: '',
        shift: r === 0 ? 'day' : 'night',
      });
    }
    return jobsList;
  }).filter(runs => runs.length > 0);
  let hasMore = true;
  let iteration = 0;
  while (hasMore) {
    hasMore = false;
    for (let pIdx = 0; pIdx < partRuns.length; pIdx++) {
      if (iteration < partRuns[pIdx].length) {
        activeJobs.push(partRuns[pIdx][iteration]);
        hasMore = true;
      }
    }
    iteration++;
  }
  const sortedJobs: Job[] = [
    ...activeJobs.filter(j => j.shift === 'day'),
    ...activeJobs.filter(j => j.shift === 'night'),
    ...activeJobs.filter(j => j.shift === 'overflow')
  ];
  if (sortedJobs.length > 0) {
    sortedJobs.forEach((job, idx) => {
      job.seq = idx + 1;
      job.dandori = job.dandori !== undefined ? job.dandori : 15;
    });
  }
  return recalculateTimelineHelper(sortedJobs);
};

// Resolves the current production date according to the 07:15 shift boundary
export const getTodayDateString = () => {
  const d = new Date();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const currentMins = hours * 60 + minutes;
  if (currentMins < 435) {
    d.setDate(d.getDate() - 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Resolves the unique machine key based on factory and machine name
export const getUniqueMachineKey = (factory: string, machine: string): string => {
  const cleanFact = factory.trim().toUpperCase();
  const cleanMc = machine.trim();
  
  if (cleanFact.includes('SC2')) return `SC2 ${cleanMc}`;
  if (cleanFact.includes('2') || cleanFact.includes('F2')) return `F2 ${cleanMc}`;
  if (cleanFact.includes('3') || cleanFact.includes('F3')) return `F3 ${cleanMc}`;
  if (cleanFact.includes('4') || cleanFact.includes('F4')) return `F4 ${cleanMc}`;
  
  return `${factory} ${cleanMc}`;
};

// Exposes the context state and synchronization helpers for production telemetry
export function ProductionProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
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
  const lastLocalWriteRef = useRef<Record<string, number>>({});
  const logsRef = useRef(logs);
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Saves a production plan record into PostgreSQL database via the API
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
    try {
      const currentAbnormal = activeAbnormalities[id] || { isAbnormal: false, type: '', start: '' };
      const currentNg = activeNgs[id] || { isNg: false, type: '', start: '' };
      const payload = {
        id,
        plan_type: planType,
        machine_id: machineId,
        date_key: dateKey,
        jobs,
        day_ot: dayOT || 'teiji',
        night_ot: nightOT || 'teiji',
        logs: logsArray || [],
        is_abnormal: isAbnormal !== undefined ? isAbnormal : currentAbnormal.isAbnormal,
        abnormal_type: abnormalType !== undefined ? abnormalType : currentAbnormal.type,
        abnormal_start: abnormalStart !== undefined ? abnormalStart : currentAbnormal.start,
        is_ng: isNg !== undefined ? isNg : currentNg.isNg,
        ng_type: ngType !== undefined ? ngType : currentNg.type,
        ng_start: ngStart !== undefined ? ngStart : currentNg.start
      };
      await api.post('/production-plans', payload);
    } catch (e) {
      console.error(`Error saving plan ${id} to database:`, e);
    }
  };

  // Queries all active plans from Express server to populate layout state
  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/production-plans');
      const loadedJobs: Record<string, Job[]> = {};
      const loadedAvgJobs: Record<string, Job[]> = {};
      const loadedDayOTs: Record<string, string> = {};
      const loadedNightOTs: Record<string, string> = {};
      const loadedAbnormalities: Record<string, ActiveAbnormality> = {};
      const loadedNgs: Record<string, ActiveNg> = {};
      const loadedLogs: Record<string, AbnormalityLog[]> = {};
      if (response.data?.status === 'ok') {
        const rows = response.data.data || [];
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
            start: row.abnormal_start || ''
          };
          loadedNgs[row.id] = {
            isNg: !!row.is_ng,
            type: row.ng_type || '',
            start: row.ng_start || ''
          };
        });
      }
      const filterStateByLockout = <T,>(prev: Record<string, T>, loaded: Record<string, T>): Record<string, T> => {
        const next = { ...prev };
        Object.keys(loaded).forEach(key => {
          const lastWrite = lastLocalWriteRef.current[key];
          if (!lastWrite || Date.now() - lastWrite >= 5000) {
            next[key] = loaded[key];
          }
        });
        return next;
      };
      setMachineJobs(prev => filterStateByLockout(prev, loadedJobs));
      setMachineAvgJobs(prev => filterStateByLockout(prev, loadedAvgJobs));
      setDayOTs(prev => filterStateByLockout(prev, loadedDayOTs));
      setNightOTs(prev => filterStateByLockout(prev, loadedNightOTs));
      setLogs(prev => filterStateByLockout(prev, loadedLogs));
      setActiveAbnormalities(prev => filterStateByLockout(prev, loadedAbnormalities));
      setActiveNgs(prev => filterStateByLockout(prev, loadedNgs));
      setErrorMsg(null);
    } catch (e) {
      console.error('Error fetching production plans:', e);
      setErrorMsg('Gagal terhubung ke database plans.');
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  // Reorders machine jobs and saves changes to PostgreSQL
  const reorderMachineJobs = (machineId: string, jobs: Job[], dateStr?: string) => {
    const date = dateStr || getTodayDateString();
    const finalKey = `${date}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    const solved = recalculateTimelineHelper(jobs);
    setMachineJobs(prev => ({ ...prev, [finalKey]: solved }));
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
    const selectedDate = dateStr || getTodayDateString();
    const monthStr = selectedDate.substring(0, 7);
    const avgKey = `${monthStr}_avg_${machineId}`;
    lastLocalWriteRef.current[avgKey] = Date.now();
    const solved = recalculateTimelineHelper(jobs);
    setMachineAvgJobs(prev => ({ ...prev, [avgKey]: solved }));
    savePlanToDatabase(
      avgKey,
      'avg',
      machineId,
      monthStr,
      solved,
      'teiji',
      'teiji',
      []
    );
  };

  const resetAllMachines = (dateStr?: string, parts?: any[]) => {
    const date = dateStr || getTodayDateString();
    const monthStr = date.substring(0, 7);
    const ALL_ACTIVE_MACHINES = [
      ...new Set([
        ...Object.keys(machineJobs).map(k => k.split('_')[1]),
        ...Object.keys(machineAvgJobs).map(k => k.split('_')[2] || k.split('_')[1])
      ].filter(Boolean))
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
      const initialJobs = parts && parts.length > 0 ? getHeijunkaJobsForMachine(machine, date, parts) : [];
      
      const finalKey = `${date}_${machine}`;
      lastLocalWriteRef.current[finalKey] = Date.now();
      nextJobs[finalKey] = initialJobs;
      savePlanToDatabase(finalKey, 'daily', machine, date, initialJobs, 'teiji', 'teiji', []);

      const avgKey = `${monthStr}_avg_${machine}`;
      lastLocalWriteRef.current[avgKey] = Date.now();
      nextAvgJobs[avgKey] = initialJobs;
      savePlanToDatabase(avgKey, 'avg', machine, monthStr, initialJobs, 'teiji', 'teiji', []);
    }

    setMachineJobs(prev => ({ ...prev, ...nextJobs }));
    setMachineAvgJobs(prev => ({ ...prev, ...nextAvgJobs }));
  };

  const updateOTSettings = (machineId: string, dayOT: string, nightOT: string, dateStr?: string) => {
    const date = dateStr || getTodayDateString();
    const finalKey = `${date}_${machineId}`;
    lastLocalWriteRef.current[finalKey] = Date.now();
    setDayOTs(prev => ({ ...prev, [finalKey]: dayOT }));
    setNightOTs(prev => ({ ...prev, [finalKey]: nightOT }));
    const list = machineJobs[finalKey] || [];
    const solved = recalculateTimelineHelper(list);
    setMachineJobs(prev => ({ ...prev, [finalKey]: solved }));
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
  };

  const reviseJobNgQty = (
    machineId: string,
    jobId: string,
    newNgQty: number,
    newOkQty: number,
    dateStr?: string,
    logMessage?: { type: string; note: string }
  ) => {
    const date = dateStr || getTodayDateString();
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
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs(prev => ({ ...prev, [finalKey]: nextLogs }));
    }
    const list = machineJobs[finalKey] || [];
    const updated = list.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          closedNgQty: newNgQty,
          closedOkQty: newOkQty,
          actualQty: newOkQty
        };
      }
      return j;
    });
    const solved = recalculateTimelineHelper(updated);
    setMachineJobs(prev => ({ ...prev, [finalKey]: solved }));
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
  };

  const updateMonthlyPlans = async (updatedParts: any[], dateStr?: string) => {
    const date = dateStr || getTodayDateString();
    const monthStr = date.substring(0, 7);
    
    const machinesSet = new Set<string>();
    updatedParts.forEach(p => {
      if (p.home_line) {
        const parsed = parseMachineIdentifier(p.home_line);
        if (parsed && parsed.factory !== 'UNKNOWN' && parsed.machine) {
          const key = getUniqueMachineKey(parsed.factory, parsed.machine);
          machinesSet.add(key);
        }
      }
    });

    const activeMachines = Array.from(machinesSet);
    const nextAvgJobs: Record<string, Job[]> = {};

    for (const machineId of activeMachines) {
      const initialJobs = getHeijunkaJobsForMachine(machineId, date, updatedParts);
      const avgKey = `${monthStr}_avg_${machineId}`;
      lastLocalWriteRef.current[avgKey] = Date.now();
      nextAvgJobs[avgKey] = initialJobs;
      
      await savePlanToDatabase(
        avgKey,
        'avg',
        machineId,
        monthStr,
        initialJobs,
        'teiji',
        'teiji',
        []
      );
    }

    setMachineAvgJobs(prev => ({ ...prev, ...nextAvgJobs }));
  };

  // Connects Socket.io client and binds broadcast listeners for real-time telemetry updates
  useEffect(() => {
    fetchPlans();
    if (!isAuthenticated) return;

    const socket = initSocket();
    socket.connect();
    
    const handleConnect = () => {
      console.log('[Socket] Connected to telemetry room');
    };

    const handleConnectError = (err: any) => {
      console.error('[Socket] Connection error:', err.message || err);
    };
    
    const handlePlanUpdated = (row: any) => {
      const lastWrite = lastLocalWriteRef.current[row.id];
      if (lastWrite && Date.now() - lastWrite < 5000) return;
      if (row.plan_type === 'daily') {
        setMachineJobs(prev => ({ ...prev, [row.id]: row.jobs || [] }));
      }
      if (row.day_ot) setDayOTs(prev => ({ ...prev, [row.id]: row.day_ot }));
      if (row.night_ot) setNightOTs(prev => ({ ...prev, [row.id]: row.night_ot }));
      if (row.logs) setLogs(prev => ({ ...prev, [row.id]: row.logs }));
      setActiveAbnormalities(prev => ({
        ...prev,
        [row.id]: { isAbnormal: !!row.is_abnormal, type: row.abnormal_type || '', start: row.abnormal_start || '' }
      }));
      setActiveNgs(prev => ({
        ...prev,
        [row.id]: { isNg: !!row.is_ng, type: row.ng_type || '', start: row.ng_start || '' }
      }));
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

    const initialJobs = getHeijunkaJobsForMachine(machineId, dateStr, parts);
    
    setMachineJobs(prev => ({ ...prev, [finalKey]: initialJobs }));
    setDayOTs(prev => ({ ...prev, [finalKey]: 'teiji' }));
    setNightOTs(prev => ({ ...prev, [finalKey]: 'teiji' }));
    setLogs(prev => ({ ...prev, [finalKey]: [] }));
    setActiveAbnormalities(prev => ({ ...prev, [finalKey]: { isAbnormal: false, type: '', start: '' } }));
    setActiveNgs(prev => ({ ...prev, [finalKey]: { isNg: false, type: '', start: '' } }));
    
    setMachineAvgJobs(prev => {
      if (prev[avgKey] === undefined || prev[avgKey].length === 0) {
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
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs(prev => ({ ...prev, [finalKey]: nextLogs }));
    }
    let list = machineJobs[finalKey] || [];
    if (list.length === 0) {
      list = getHeijunkaJobsForMachine(machineId, dateStr, parts);
    }
    const updated = list.map(j => {
      if (j.id === jobId) {
        const newQty = Math.min(j.qtyLot, j.actualQty + qty);
        return { ...j, actualQty: newQty };
      }
      return j;
    });
    setMachineJobs(prev => ({ ...prev, [finalKey]: updated }));
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
  };

  // Modifies a job's status and cascades the timeline changes downstream
  const updateJobStatus = (
    machineId: string,
    jobId: string,
    action: 'complete-running' | 'complete-dandori',
    dateStr: string,
    parts: any[],
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
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs(prev => ({ ...prev, [finalKey]: nextLogs }));
    }
    let list = machineJobs[finalKey] || [];
    if (list.length === 0) {
      list = getHeijunkaJobsForMachine(machineId, dateStr, parts);
    }
    const idx = list.findIndex(j => j.id === jobId);
    if (idx !== -1) {
      const updated = [...list];
      const nowTimeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      if (action === 'complete-running') {
        const closedNg = closedNgQty ?? updated[idx].closedNgQty ?? 0;
        const defaultOk = Math.max(0, (updated[idx].actualQty || 0) - closedNg);
        const closedOk = closedOkQty !== undefined ? closedOkQty : defaultOk;

        const remainingInShift = updated.filter((j, fIdx) => fIdx > idx && j.shift === updated[idx].shift && j.status !== 'completed');
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
          finalDandoriStart: isLastInShift ? (updated[idx].finalDandoriStart || nowTimeStr) : updated[idx].finalDandoriStart
        };
        updated[idx] = completedJob;

        const shortage = completedJob.qtyLot - closedOk;
        if (shortage > 0) {
          // Carry over remaining target ONLY if it is Day shift
          if (completedJob.shift === 'day') {
            const nextSameIdx = updated.findIndex((j, fIdx) => fIdx > idx && j.model === completedJob.model && j.status !== 'completed');
            if (nextSameIdx !== -1) {
              const targetJob = updated[nextSameIdx];
              const newQtyLot = targetJob.qtyLot + shortage;
              const cavity = targetJob.kav || 1;
              const ct = targetJob.ct || 60;
              const newTime = Math.round(((newQtyLot / cavity) * ct) / 60);
              updated[nextSameIdx] = {
                ...targetJob,
                qtyLot: newQtyLot,
                time: newTime
              };
            } else {
              // Create a carryover job into Night shift for this model
              const cavity = completedJob.kav || 1;
              const ct = completedJob.ct || 60;
              const newTime = Math.round(((shortage / cavity) * ct) / 60);
              const carryJob: Job = {
                ...completedJob,
                id: `job-carryover-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
                qtyLot: shortage,
                actualQty: 0,
                closedNgQty: 0,
                closedOkQty: 0,
                status: 'queued',
                shift: 'night',
                time: newTime,
                actualProductionStart: undefined,
                actualProductionEnd: undefined,
                actualDandoriStart: undefined,
                actualDandoriEnd: undefined,
                downtimeMinutes: 0
              };
              const firstNightIdx = updated.findIndex(j => j.shift === 'night');
              if (firstNightIdx !== -1) {
                updated.splice(firstNightIdx, 0, carryJob);
              } else {
                updated.push(carryJob);
              }
            }
          }
          // Night shift jobs (shift === 'night'): shortage is NOT carried over to next day!
        }
        if (idx + 1 < updated.length && updated[idx + 1].shift === updated[idx].shift) {
          updated[idx + 1] = {
            ...updated[idx + 1],
            status: 'dandori',
            actualDandoriStart: nowTimeStr
          };
        }
      } else if (action === 'complete-dandori') {
        updated[idx] = {
          ...updated[idx],
          status: 'running',
          actualDandoriEnd: nowTimeStr,
          actualProductionStart: nowTimeStr
        };
      } else if (action === 'complete-final-dandori') {
        const startStr = updated[idx].finalDandoriStart || updated[idx].actualProductionEnd || nowTimeStr;
        updated[idx] = {
          ...updated[idx],
          needsFinalDandori: true,
          finalDandoriCompleted: true,
          finalDandoriStart: startStr,
          finalDandoriEnd: nowTimeStr
        };
      }
      const solved = recalculateTimelineHelper(updated);
      setMachineJobs(prev => ({ ...prev, [finalKey]: solved }));
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
    const shiftJobs = list.filter(j => j.shift === shift);
    const mName = machineDisplayName || `MC ${machineId}`;

    if (shiftJobs.length === 0) return;

    const shiftClosedKey = `[SHIFT CLOSED] Penutupan produksi shift ${shift.toUpperCase()}`;
    const alreadyClosed = (logs[finalKey] || []).some(l => l.message && l.message.includes(shiftClosedKey));
    const allCompletedInShift = shiftJobs.every(j => j.status === 'completed' && (j.finalDandoriCompleted || !j.needsFinalDandori));

    if (alreadyClosed && allCompletedInShift) {
      return;
    }

    const lastJobInShift = shiftJobs[shiftJobs.length - 1];
    let nextLogs = [...(logs[finalKey] || [])];

    const carriedOverJobs: Job[] = [];

    // 1. Auto-complete jobs & track shortage carryover
    const updated = list.map(j => {
      if (j.shift === shift) {
        const closedNg = j.closedNgQty || 0;
        const effectiveOk = j.closedOkQty !== undefined ? j.closedOkQty : Math.max(0, (j.actualQty || 0) - closedNg);
        const hasStarted = !!j.actualProductionStart;
        const isLast = j.id === lastJobInShift.id;
        const remainingQty = j.qtyLot - effectiveOk;

        if (remainingQty > 0 && shift === 'day') {
          const cavity = j.kav || 1;
          const ct = j.ct || 60;
          const newTime = Math.round(((remainingQty / cavity) * ct) / 60);

          carriedOverJobs.push({
            ...j,
            id: `job-carryover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            qtyLot: remainingQty,
            actualQty: 0,
            closedNgQty: 0,
            closedOkQty: 0,
            status: 'queued',
            shift: 'night',
            time: newTime,
            actualProductionStart: undefined,
            actualProductionEnd: undefined,
            actualDandoriStart: undefined,
            actualDandoriEnd: undefined,
            downtimeMinutes: 0
          });
        }

        if (j.status !== 'completed') {
          const autoLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            machineId,
            date: recordDate,
            time,
            type: 'info',
            message: `[AUTO-COMPLETE] Job ${j.model} diselesaikan otomatis di akhir shift ${shift.toUpperCase()}. OK: ${effectiveOk}, NG: ${closedNg}. (${userInitials})`
          };
          nextLogs.unshift(autoLog);
        }

        return {
          ...j,
          actualQty: effectiveOk,
          closedOkQty: effectiveOk,
          closedNgQty: closedNg,
          status: 'completed' as const,
          actualProductionEnd: hasStarted ? (j.actualProductionEnd || time) : undefined,
          needsFinalDandori: isLast ? true : j.needsFinalDandori,
          finalDandoriCompleted: true,
          finalDandoriStart: isLast ? (j.finalDandoriStart || j.actualProductionEnd || time) : j.finalDandoriStart,
          finalDandoriEnd: isLast ? (j.finalDandoriEnd || time) : j.finalDandoriEnd
        };
      }
      return j;
    });

    // 2. Guarantee mandatory [SUCCESS] Dandori Akhir Shift log for this shift
    const logNoteText = `Dandori Akhir Shift selesai untuk mesin ${mName}. (${userInitials})`;
    const existingFinalLog = nextLogs.find(l => l.message && l.message.includes(`Dandori Akhir Shift selesai untuk mesin`));
    if (!existingFinalLog || existingFinalLog.time !== time) {
      const finalDandoriLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: 'success',
        message: `[SUCCESS] ${logNoteText}`
      };
      nextLogs.unshift(finalDandoriLog);
    }

    // 3. Shift closed log (unless already present)
    if (!alreadyClosed) {
      const shiftClosedLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        machineId,
        date: recordDate,
        time,
        type: 'success',
        message: `[SHIFT CLOSED] Penutupan produksi shift ${shift.toUpperCase()} selesai.${shift === 'day' ? ' Sisa target ditransfer ke shift malam.' : ' Shift malam selesai.'} (${userInitials})`
      };
      nextLogs.unshift(shiftClosedLog);
    }

    // Deduplicate any repeated [SHIFT CLOSED] entries in nextLogs
    const deduplicatedLogs: AbnormalityLog[] = [];
    const seenShiftClosedMsg = new Set<string>();
    for (const logItem of nextLogs) {
      if (logItem.message && logItem.message.includes('[SHIFT CLOSED] Penutupan produksi shift')) {
        if (seenShiftClosedMsg.has(logItem.message)) {
          continue; // skip duplicate log entry
        }
        seenShiftClosedMsg.add(logItem.message);
      }
      deduplicatedLogs.push(logItem);
    }

    setLogs(prev => ({ ...prev, [finalKey]: deduplicatedLogs }));

    let solved = recalculateTimelineHelper(updated);

    if (shift === 'day' && carriedOverJobs.length > 0) {
      const firstNightIdx = solved.findIndex(j => j.shift === 'night');
      if (firstNightIdx !== -1) {
        solved.splice(firstNightIdx, 0, ...carriedOverJobs);
      } else {
        solved.push(...carriedOverJobs);
      }
      solved.forEach((j, idx) => { j.seq = idx + 1; });
      solved = recalculateTimelineHelper(solved);
    }

    setMachineJobs(prev => ({ ...prev, [finalKey]: solved }));
    savePlanToDatabase(
      finalKey, 'daily', machineId, dateStr, solved,
      dayOTs[finalKey] || 'teiji', nightOTs[finalKey] || 'teiji', deduplicatedLogs
    );

    if (shift === 'night' && carriedOverJobs.length > 0) {
      const parts = dateStr.split('-');
      const nextDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      nextDate.setDate(nextDate.getDate() + 1);
      const nextYyyy = nextDate.getFullYear();
      const nextMm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const nextDd = String(nextDate.getDate()).padStart(2, '0');
      const nextDateStr = `${nextYyyy}-${nextMm}-${nextDd}`;

      const nextKey = `${nextDateStr}_${machineId}`;
      setMachineJobs(prev => {
        const nextList = prev[nextKey] || [];
        let nextUpdated = [...nextList];
        const firstDayIdx = nextUpdated.findIndex(j => j.shift === 'day');
        if (firstDayIdx !== -1) {
          nextUpdated.splice(firstDayIdx, 0, ...carriedOverJobs);
        } else {
          nextUpdated.unshift(...carriedOverJobs);
        }
        nextUpdated.forEach((j, idx) => { j.seq = idx + 1; });
        const nextSolved = recalculateTimelineHelper(nextUpdated);

        savePlanToDatabase(
          nextKey, 'daily', machineId, nextDateStr, nextSolved,
          dayOTs[nextKey] || 'teiji', nightOTs[nextKey] || 'teiji', logs[nextKey] || []
        );

        return { ...prev, [nextKey]: nextSolved };
      });
    }
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
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs(prev => ({ ...prev, [finalKey]: nextLogs }));
    }
    const list = machineJobs[finalKey] || [];
    const updated = list.map(j => {
      if (j.id === jobId) {
        const prevDowntime = j.downtimeMinutes || 0;
        return { ...j, downtimeMinutes: prevDowntime + downtimeMins, time: j.time + downtimeMins };
      }
      return j;
    });
    const solved = recalculateTimelineHelper(updated);
    setMachineJobs(prev => ({ ...prev, [finalKey]: solved }));
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
    const date = dateStr || getTodayDateString();
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
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs(prev => ({ ...prev, [finalKey]: nextLogs }));
    }
    setActiveAbnormalities(prev => ({
      ...prev,
      [finalKey]: { isAbnormal, type, start }
    }));
    if (downtimeMins && downtimeJobId) {
      const list = machineJobs[finalKey] || [];
      const updated = list.map(j => {
        if (j.id === downtimeJobId) {
          const prevDowntime = j.downtimeMinutes || 0;
          return { ...j, downtimeMinutes: prevDowntime + downtimeMins, time: j.time + downtimeMins };
        }
        return j;
      });
      const solved = recalculateTimelineHelper(updated);
      setMachineJobs(prev => ({ ...prev, [finalKey]: solved }));
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
    const date = dateStr || getTodayDateString();
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
        message: `[${logMessage.type.toUpperCase()}] ${logMessage.note}`
      };
      nextLogs = [newRecord, ...nextLogs];
      setLogs(prev => ({ ...prev, [finalKey]: nextLogs }));
    }
    setActiveNgs(prev => ({
      ...prev,
      [finalKey]: { isNg, type, start }
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
  };

  const machineJobsRef = useRef(machineJobs);
  useEffect(() => {
    machineJobsRef.current = machineJobs;
  }, [machineJobs]);

  const closeShiftRef = useRef(closeShiftProduction);
  useEffect(() => {
    closeShiftRef.current = closeShiftProduction;
  }, [closeShiftProduction]);

  // Auto-rollover shift evaluation every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hh = now.getHours();
      const mm = now.getMinutes();
      
      const dateStr = getTodayDateString();
      
      // Auto close day shift at 19:00
      if (hh === 19 && mm === 0) {
         const machineKeys = Object.keys(machineJobsRef.current).filter(k => k.startsWith(dateStr));
         machineKeys.forEach(key => {
            const machineId = key.split('_')[1];
            if (machineId) {
               closeShiftRef.current(machineId, 'day', dateStr);
            }
         });
      }

      // Auto close night shift at 07:15
      if (hh === 7 && mm === 15) {
         const prevDate = new Date();
         prevDate.setDate(prevDate.getDate() - 1);
         const pyyyy = prevDate.getFullYear();
         const pmm = String(prevDate.getMonth() + 1).padStart(2, '0');
         const pdd = String(prevDate.getDate()).padStart(2, '0');
         const prevDateStr = `${pyyyy}-${pmm}-${pdd}`;

         const machineKeys = Object.keys(machineJobsRef.current).filter(k => k.startsWith(prevDateStr));
         machineKeys.forEach(key => {
            const machineId = key.split('_')[1];
            if (machineId) {
               closeShiftRef.current(machineId, 'night', prevDateStr);
            }
         });
      }
    }, 60000);
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
        updateMonthlyPlans
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
}

// Custom hook to consume the production context state
export function useProduction() {
  const context = useContext(ProductionContext);
  if (context === undefined) {
    throw new Error('useProduction must be used within a ProductionProvider');
  }
  return context;
}
