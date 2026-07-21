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

export interface MappedMachineStatus {
  id: string;
  code: string;
  tonnage: string;
  isAbnormal: boolean;
  isAbnormalLong: boolean;
  isNgActive: boolean;
  isDandori: boolean;
  isRunning: boolean;
  isIdle: boolean;
  activeJob?: Job;
}

export interface FactoryLayoutItem {
  name: string;
  machines: MappedMachineStatus[];
  fuka: number;
  maxFuka: number;
  status: 'Normal' | 'Warning' | 'Over';
}

export interface ResinPlantGroup {
  plant: string;
  factories: FactoryLayoutItem[];
}

export interface PaintingLineItem {
  name: string;
  fuka: number;
  maxFuka: number;
  status: string;
  note: string;
}

export interface PaintingPlantGroup {
  plant: string;
  lines: PaintingLineItem[];
}

export interface ProductionContextType {
  machineJobs: Record<string, Job[]>;
  machineAvgJobs: Record<string, Job[]>;
  logs: Record<string, AbnormalityLog[]>;
  dayOTs: Record<string, string>;
  nightOTs: Record<string, string>;
  activeAbnormalities: Record<string, ActiveAbnormality>;
  activeNgs: Record<string, ActiveNg>;
  isLoading: boolean;
  errorMsg: string | null;
  
  // Dashboard & FUKA controls
  activeTab: 'resin' | 'painting';
  setActiveTab: (tab: 'resin' | 'painting') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  machinesData: any[];
  partsData: any[];
  dynamicResinData: ResinPlantGroup[];
  paintingData: PaintingPlantGroup[];
  allMachinesList: Array<{ id: string; code: string; tonnage: string; factory: string }>;

  fetchPlans: () => Promise<void>;
  initializeMachineIfEmpty: (machineId: string, dateStr: string, parts: any[]) => void;
  incrementJobProgress: (
    machineId: string,
    jobId: string,
    qty: number,
    dateStr: string,
    parts: any[],
    logMessage?: { type: string; note: string }
  ) => void;
  updateJobStatus: (
    machineId: string,
    jobId: string,
    action: 'complete-running' | 'complete-dandori' | 'complete-final-dandori',
    dateStr?: string,
    parts?: any[],
    logMessage?: { type: string; note: string },
    closedNgQty?: number,
    closedOkQty?: number
  ) => void;
  closeShiftProduction: (
    machineId: string,
    shift: 'day' | 'night',
    dateStr: string,
    userInitials?: string,
    machineDisplayName?: string,
    autoFinalize?: boolean
  ) => void;
  addJobDowntime: (
    machineId: string,
    jobId: string,
    downtimeMins: number,
    dateStr: string,
    logMessage?: { type: string; note: string }
  ) => void;
  setMachineAbnormal: (
    machineId: string,
    isAbnormal: boolean,
    type?: string,
    start?: string,
    dateStr?: string,
    logMessage?: { type: string; note: string; timeStr?: string },
    downtimeMins?: number,
    downtimeJobId?: string
  ) => void;
  setMachineNg: (
    machineId: string,
    isNg: boolean,
    type?: string,
    start?: string,
    dateStr?: string,
    logMessage?: { type: string; note: string; timeStr?: string }
  ) => void;
  reorderMachineJobs: (machineId: string, jobs: Job[], dateStr?: string) => void;
  reorderMachineAvgJobs: (machineId: string, jobs: Job[], dateStr?: string) => void;
  resetAllMachines: (dateStr?: string, parts?: any[]) => void;
  updateOTSettings: (machineId: string, dayOT: string, nightOT: string, dateStr?: string) => void;
  reviseJobNgQty: (
    machineId: string,
    jobId: string,
    newNgQty: number,
    newOkQty: number,
    dateStr?: string,
    logMessage?: { type: string; note: string }
  ) => void;
  updateMonthlyPlans: (updatedParts: any[], dateStr?: string) => Promise<void>;
}
