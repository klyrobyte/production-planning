export interface PartForecast {
  sebango: string;
  partNumber: string;
  partName: string;
  modelCode: string;
  machineId: string;
  factory: string;
  area: string;
  cycleTime: number;
  cavity: number;
  monthN: number;
  monthN1: number;
  monthN2: number;
  monthN3: number;
  dailyRequirementN: number;
  dailyRequirementN1: number;
  dailyRequirementN2: number;
  dailyRequirementN3: number;
}

export interface MachineItem {
  id: string;
  factory_id: string;
  factory_code: string;
  factory_name: string;
  code: string;
  name: string;
  status: string;
}

export interface HistoryRecord {
  id: string;
  created_at: string;
  itemCount: number;
  items: Array<{
    sebango: string;
    partNumber: string;
    partName: string;
    monthN: number;
    monthN1: number;
    monthN2: number;
    monthN3: number;
    dailyRequirementN: number;
    dailyRequirementN1: number;
    dailyRequirementN2: number;
    dailyRequirementN3: number;
  }>;
}

export interface ColumnFilters {
  sebango: string;
  partNumber: string;
  modelCode: string;
  machineId: string;
  monthN: string;
  monthN1: string;
  monthN2: string;
  monthN3: string;
}

export interface ForecastMonthNames {
  monthN: string;
  monthN1: string;
  monthN2: string;
  monthN3: string;
}

export interface ForecastMonthKeys {
  monthN: string;
  monthN1: string;
  monthN2: string;
  monthN3: string;
}

export type FukaFilterType = 'monthN' | 'monthN1' | 'monthN2' | 'monthN3';
export type ActiveTabType = 'annual' | 'monthly' | 'daily';
export type ViewStateType = 'active' | 'preview';
export type SubTabType = 'active' | 'history';
export type ImportModeType = 'csv' | 'paste' | 'manual';

export interface OrdersContextType {
  // Navigation
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  subTab: SubTabType;
  setSubTab: (sub: SubTabType) => void;
  viewState: ViewStateType;
  setViewState: (view: ViewStateType) => void;

  // Data lists
  parts: any[];
  machines: MachineItem[];
  conversions: any[];
  partsForecast: PartForecast[];
  tempForecast: PartForecast[];
  setTempForecast: React.Dispatch<React.SetStateAction<PartForecast[]>>;
  activeDisplayList: PartForecast[];
  processedDisplayList: PartForecast[];
  historyRecords: HistoryRecord[];
  monthNames: ForecastMonthNames;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  fukaFilter: FukaFilterType;
  setFukaFilter: (filter: FukaFilterType) => void;
  columnFilters: ColumnFilters;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFilters>>;
  sortField: string;
  setSortField: (field: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (dir: 'asc' | 'desc') => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  itemsPerPage: number;
  totalPages: number;
  paginatedList: PartForecast[];

  // Pending Changes & Form States
  pendingMachineChanges: Record<string, string>;
  setPendingMachineChanges: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleMachineChange: (partNumber: string, newMachine: string) => void;
  importMode: ImportModeType;
  setImportMode: (mode: ImportModeType) => void;
  pasteData: string;
  setPasteData: (data: string) => void;

  // Manual Form States
  selectedManualPartNo: string;
  manualMonthN: string;
  setManualMonthN: (val: string) => void;
  manualMonthN1: string;
  setManualMonthN1: (val: string) => void;
  manualMonthN2: string;
  setManualMonthN2: (val: string) => void;
  manualMonthN3: string;
  setManualMonthN3: (val: string) => void;

  // Status & Feedback
  isLoading: boolean;
  isProcessing: boolean;
  isCommitting: boolean;

  // Chart Data
  fukaChartData: Record<string, Array<{ machineId: string; hours: number }>>;

  // Action Handlers
  fetchData: () => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasteSubmit: () => void;
  handleCommit: () => Promise<void>;
  handleRestoreHistory: (record: HistoryRecord) => Promise<void>;
  handleManualPartSelect: (partNo: string) => void;
  handleManualSubmit: () => Promise<void>;
  handleManualReset: () => void;
  handleSaveMachineChanges: () => Promise<void>;
}
