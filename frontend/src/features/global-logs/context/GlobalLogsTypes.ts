export interface LogItem {
  id: string;
  timestamp: string;
  username: string | null;
  role: string | null;
  method: string;
  endpoint: string;
  ip_address: string;
  status_code: number | null;
  response_ms: number | null;
}

export interface LogMetaData {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface LogFilterParams {
  username?: string;
  endpoint?: string;
  method?: string;
  status_code?: string;
  page: number;
  limit: number | string;
}

export interface FetchLogsResult {
  logs: LogItem[];
  meta: LogMetaData;
}

export interface GlobalLogsContextType {
  // Data & Pagination
  logs: LogItem[];
  meta: LogMetaData;
  page: number;
  limit: number | string;
  setPage: (page: number | ((prev: number) => number)) => void;
  setLimit: (limit: number | string) => void;

  // Search & Filter States
  searchUsername: string;
  setSearchUsername: (username: string) => void;
  searchEndpoint: string;
  setSearchEndpoint: (endpoint: string) => void;
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
  searchStatusCode: string;
  setSearchStatusCode: (code: string) => void;
  handleResetFilters: () => void;

  // Highlight & Modal States
  newLogIds: Set<string>;
  showClearModal: boolean;
  setShowClearModal: (show: boolean) => void;
  isClearing: boolean;
  isLoading: boolean;

  // Actions
  fetchLogs: () => Promise<void>;
  handleClearAllLogs: () => Promise<void>;
}
