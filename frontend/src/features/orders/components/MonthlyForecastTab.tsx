import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Upload, 
  Loader2, 
  Box, 
  CalendarDays, 
  Check, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import api from '../../../shared/lib/axios';
import { useThemeStore } from '../../../shared/store/useThemeStore';

interface PartForecast {
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

interface MachineItem {
  id: string;
  factory_id: string;
  factory_code: string;
  factory_name: string;
  code: string;
  name: string;
  status: string;
}

const getForecastMonthNames = () => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  const getMonthAndYear = (offset: number) => {
    const targetMonthIdx = (currentMonthIdx + offset) % 12;
    const targetYear = currentYear + Math.floor((currentMonthIdx + offset) / 12);
    return `${months[targetMonthIdx]} ${targetYear}`;
  };
  
  return {
    monthN: getMonthAndYear(0),
    monthN1: getMonthAndYear(1),
    monthN2: getMonthAndYear(2),
    monthN3: getMonthAndYear(3),
  };
};

const getShortMonthName = (longMonthName: string) => {
  const parts = longMonthName.split(' ');
  if (parts.length === 2) {
    const month = parts[0];
    const year = parts[1];
    return `${month.substring(0, 3)} ${year}`;
  }
  return longMonthName;
};

const getForecastMonthKeys = () => {
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0-11
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

export const normalizeLineName = (line: string): string => {
  if (!line) return '';
  return line.trim().toUpperCase().replace(/\s+/g, '').replace(/#/g, '').replace(/MC/g, '').replace(/-?\d+T$/g, '');
};

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
  
  let remaining = upper
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

export const resolveMachineKey = (homeLine: string, activeMachines: MachineItem[]): string => {
  if (!homeLine) return 'Unassigned Machine';
  const matched = activeMachines.find(m => {
    const standardName = `${m.factory_code || ''} ${m.name}`.trim();
    return machinesMatch(homeLine, m.code) || machinesMatch(homeLine, standardName);
  });
  return matched ? matched.code : homeLine;
};

const getFactoryFromHomeLine = (homeLine: string, activeMachines: MachineItem[]): string => {
  if (!homeLine) return 'Unknown';
  const matched = activeMachines.find(m => {
    const standardName = `${m.factory_code || ''} ${m.name}`.trim();
    return machinesMatch(homeLine, m.code) || machinesMatch(homeLine, standardName);
  });
  if (matched && matched.factory_name) return matched.factory_name;
  
  const clean = homeLine.toUpperCase().trim();
  if (clean.startsWith('F2')) return 'Factory 2';
  if (clean.startsWith('F3')) return 'Factory 3';
  if (clean.startsWith('F4')) return 'Factory 4';
  if (clean.startsWith('SC2')) return 'SC2 Resin';
  return 'Unknown';
};

export default function MonthlyForecastTab() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  const [parts, setParts] = useState<any[]>([]);
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  
  const [partsForecast, setPartsForecast] = useState<PartForecast[]>([]);
  const [tempForecast, setTempForecast] = useState<PartForecast[]>([]);
  const [viewState, setViewState] = useState<'active' | 'preview'>('active');
  const [subTab, setSubTab] = useState<'active' | 'history'>('active');
  const [importMode, setImportMode] = useState<'csv' | 'paste' | 'manual'>('csv');
  const [pasteData, setPasteData] = useState('');
  
  // Manual Input states
  const [selectedManualPartNo, setSelectedManualPartNo] = useState('');
  const [manualMonthN, setManualMonthN] = useState('');
  const [manualMonthN1, setManualMonthN1] = useState('');
  const [manualMonthN2, setManualMonthN2] = useState('');
  const [manualMonthN3, setManualMonthN3] = useState('');

  // UI state variables
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [fukaFilter, setFukaFilter] = useState<'monthN' | 'monthN1' | 'monthN2' | 'monthN3'>('monthN');
  
  // Sorting & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState({
    sebango: '',
    partNumber: '',
    modelCode: '',
    machineId: '',
    monthN: '',
    monthN1: '',
    monthN2: '',
    monthN3: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const monthNames = useMemo(() => getForecastMonthNames(), []);

  // Fetch all initial data
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [partsRes, machinesRes, historyRes, conversionsRes] = await Promise.all([
        api.get('/parts'),
        api.get('/machines'),
        api.get('/history-orders'),
        api.get('/order-conversions')
      ]);

      const loadedParts = partsRes.data.data || [];
      const loadedMachines = machinesRes.data.data || [];
      const loadedHistory = historyRes.data.data || [];
      const loadedConversions = conversionsRes.data.data || [];

      setParts(loadedParts);
      setMachines(loadedMachines);
      setConversions(loadedConversions);

      // Process history records by grouping by batch_id
      const groups: Record<string, any> = {};
      loadedHistory.forEach((row: any) => {
        const bId = row.batch_id || 'unknown';
        if (!groups[bId]) {
          groups[bId] = {
            id: bId,
            created_at: row.created_at || new Date().toISOString(),
            items: []
          };
        }
        groups[bId].items.push({
          sebango: row.sebango,
          partNumber: row.part_number,
          partName: row.part_name,
          monthN: Number(row.month_n_volume || 0),
          monthN1: Number(row.month_n1_volume || 0),
          monthN2: Number(row.month_n2_volume || 0),
          monthN3: Number(row.month_n3_volume || 0),
          dailyRequirementN: Number(row.daily_requirement_n || 0),
          dailyRequirementN1: Number(row.daily_requirement_n1 || 0),
          dailyRequirementN2: Number(row.daily_requirement_n2 || 0),
          dailyRequirementN3: Number(row.daily_requirement_n3 || 0)
        });
      });

      const processedHistory = Object.values(groups).map((g: any) => ({
        ...g,
        itemCount: g.items.length
      })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setHistoryRecords(processedHistory);

      // Build active plan forecast data
      const monthKeys = getForecastMonthKeys();
      const workingDays = 20;
      const initial = loadedParts.map((p: any) => {
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

        const resolvedMc = resolveMachineKey(p.home_line, loadedMachines);
        return {
          sebango: p.sebango || '',
          partNumber: p.part_number || '',
          partName: p.part_name || '',
          modelCode: p.model || '',
          machineId: resolvedMc,
          factory: getFactoryFromHomeLine(resolvedMc, loadedMachines),
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
          dailyRequirementN3: dailyN3
        };
      });
      setPartsForecast(initial);
    } catch (err) {
      console.error('Failed to load forecast tab data:', err);
      setErrorMsg('Gagal memuat data master parts atau mesin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync state back to active view when commiting/reseting
  useEffect(() => {
    if (viewState === 'active' && parts.length > 0) {
      const monthKeys = getForecastMonthKeys();
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

        const resolvedMc = resolveMachineKey(p.home_line, machines);
        return {
          sebango: p.sebango || '',
          partNumber: p.part_number || '',
          partName: p.part_name || '',
          modelCode: p.model || '',
          machineId: resolvedMc,
          factory: getFactoryFromHomeLine(resolvedMc, machines),
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
          dailyRequirementN3: dailyN3
        };
      });
      setPartsForecast(initial);
    }
  }, [parts, viewState]);

  // Handle direct machine change in table
  const handleMachineChange = async (partNumber: string, newMachine: string) => {
    const originalPart = parts.find(pt => pt.part_number === partNumber);
    if (!originalPart) return;

    setIsCommitting(true);
    try {
      const updated = {
        ...originalPart,
        home_line: newMachine
      };
      await api.post('/parts', updated);
      
      // Update local state parts array
      setParts(prev => prev.map(p => p.part_number === partNumber ? updated : p));
      
      setCommitSuccess(true);
      setTimeout(() => setCommitSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to change machine:', err);
      setErrorMsg('Gagal mengganti mesin.');
    } finally {
      setIsCommitting(false);
    }
  };

  // CSV/Tab text parser
  const parseForecastCSVContent = (content: string, allParts: any[]): PartForecast[] => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];
    
    const separator = lines[0].includes('\t') ? '\t' : ',';
    const row1Cols = lines[0].split(separator).map(c => c.trim().toUpperCase());
    const row2Cols = lines.length > 1 ? lines[1].split(separator).map(c => c.trim().toUpperCase()) : [];
    
    // Combine row 1 and row 2 headers prioritizing row 2 (e.g. specific month abbreviation in JUN, JUL...)
    const headers = row1Cols.map((col, idx) => {
      return (row2Cols[idx] || col || '').trim();
    });
    
    // Fill up headers if row2Cols is longer
    if (row2Cols.length > row1Cols.length) {
      for (let i = row1Cols.length; i < row2Cols.length; i++) {
        headers.push(row2Cols[i] || '');
      }
    }

    const shortMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    let sebIndex = headers.findIndex(h => h.includes('SEBANGO') || h.includes('CODE') || h.includes('PART'));
    if (sebIndex === -1) sebIndex = 0;
    
    let aliasIndex = headers.findIndex(h => h.includes('ALIAS'));
    
    // Dynamic month names lookup from system date
    const now = new Date();
    const currentMonthIdx = now.getMonth(); // 0-11
    const monthsShort = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const abbrN = monthsShort[currentMonthIdx];
    const abbrN1 = monthsShort[(currentMonthIdx + 1) % 12];
    const abbrN2 = monthsShort[(currentMonthIdx + 2) % 12];
    const abbrN3 = monthsShort[(currentMonthIdx + 3) % 12];

    let nIndex = headers.findIndex(h => h === abbrN || h === 'N');
    let n1Index = headers.findIndex(h => h === abbrN1 || h === 'N+1' || h === 'N_1');
    let n2Index = headers.findIndex(h => h === abbrN2 || h === 'N+2' || h === 'N_2');
    let n3Index = headers.findIndex(h => h === abbrN3 || h === 'N+3' || h === 'N_3');

    // Fallback search sequentially if dynamic ones are not found
    const fallbackMonthIndices: number[] = [];
    headers.forEach((h, idx) => {
      if (shortMonths.includes(h) || h === 'N' || h === 'N+1' || h === 'N+2' || h === 'N+3' || h.includes('MONTH')) {
        fallbackMonthIndices.push(idx);
      }
    });

    if (nIndex === -1) nIndex = fallbackMonthIndices[0] !== undefined ? fallbackMonthIndices[0] : 1;
    if (n1Index === -1) n1Index = fallbackMonthIndices[1] !== undefined ? fallbackMonthIndices[1] : 2;
    if (n2Index === -1) n2Index = fallbackMonthIndices[2] !== undefined ? fallbackMonthIndices[2] : 3;
    if (n3Index === -1) n3Index = fallbackMonthIndices[3] !== undefined ? fallbackMonthIndices[3] : 4;
    
    // Determine data start row (skip second header row if present)
    let dataStartRow = 1;
    if (lines.length > 1) {
      const secondLineCols = lines[1].split(separator).map(c => c.trim().toUpperCase());
      const hasMonthAbbr = secondLineCols.some(c => shortMonths.includes(c));
      const firstColEmpty = secondLineCols[0] === '';
      if (hasMonthAbbr || firstColEmpty) {
        dataStartRow = 2;
      }
    }
    
    const results: PartForecast[] = [];
    const workingDays = 20;
    
    for (let i = dataStartRow; i < lines.length; i++) {
      const cols = lines[i].split(separator).map(c => c.trim());
      if (cols.length <= sebIndex) continue;
      
      const rawSebango = cols[sebIndex] || '';
      const aliasVal = aliasIndex !== -1 && cols[aliasIndex] ? cols[aliasIndex] : '';
      
      if (!rawSebango && !aliasVal) continue;
      
      const cleanSeb = rawSebango.trim().toUpperCase();
      const cleanAlias = aliasVal.trim().toUpperCase();

      // Look up in order conversions first
      let matchedConversion = null;
      if (cleanAlias) {
        matchedConversion = conversions.find(c => 
          (c.cust_sebango && c.cust_sebango.trim().toUpperCase() === cleanAlias) ||
          (c.cust_part_number && c.cust_part_number.trim().toUpperCase() === cleanAlias) ||
          (c.prod_sebango && c.prod_sebango.trim().toUpperCase() === cleanAlias)
        );
      }
      if (!matchedConversion && cleanSeb) {
        matchedConversion = conversions.find(c => 
          (c.cust_sebango && c.cust_sebango.trim().toUpperCase() === cleanSeb) ||
          (c.cust_part_number && c.cust_part_number.trim().toUpperCase() === cleanSeb) ||
          (c.prod_sebango && c.prod_sebango.trim().toUpperCase() === cleanSeb)
        );
      }

      let matchedPart = null;
      if (matchedConversion) {
        const targetProdSebango = matchedConversion.prod_sebango.trim().toUpperCase();
        matchedPart = allParts.find(p => 
          (p.sebango && p.sebango.trim().toUpperCase() === targetProdSebango) ||
          (p.part_number && p.part_number.trim().toUpperCase() === targetProdSebango)
        );
      }

      // Fallback: direct match in master parts
      if (!matchedPart) {
        if (cleanAlias) {
          matchedPart = allParts.find(p => 
            (p.sebango && p.sebango.trim().toUpperCase() === cleanAlias) ||
            (p.part_number && p.part_number.trim().toUpperCase() === cleanAlias)
          );
        }
        if (!matchedPart && cleanSeb) {
          matchedPart = allParts.find(p => 
            (p.sebango && p.sebango.trim().toUpperCase() === cleanSeb) ||
            (p.part_number && p.part_number.trim().toUpperCase() === cleanSeb)
          );
        }
      }
      
      if (!matchedPart) continue; // Skip parts not in master parts database
      
      // Clean numeric inputs
      const dailyRequirementN = Math.round(parseFloat(nIndex !== -1 && cols[nIndex] ? cols[nIndex].replace(/[^0-9.-]/g, '') : '0') || 0);
      const dailyRequirementN1 = Math.round(parseFloat(n1Index !== -1 && cols[n1Index] ? cols[n1Index].replace(/[^0-9.-]/g, '') : '0') || 0);
      const dailyRequirementN2 = Math.round(parseFloat(n2Index !== -1 && cols[n2Index] ? cols[n2Index].replace(/[^0-9.-]/g, '') : '0') || 0);
      const dailyRequirementN3 = Math.round(parseFloat(n3Index !== -1 && cols[n3Index] ? cols[n3Index].replace(/[^0-9.-]/g, '') : '0') || 0);
      
      const monthN = dailyRequirementN * workingDays;
      const monthN1 = dailyRequirementN1 * workingDays;
      const monthN2 = dailyRequirementN2 * workingDays;
      const monthN3 = dailyRequirementN3 * workingDays;
      
      const resolvedMc = resolveMachineKey(matchedPart.home_line, machines);
      
      results.push({
        sebango: matchedPart.sebango || '',
        partNumber: matchedPart.part_number,
        partName: matchedPart.part_name || '',
        modelCode: matchedPart.model || '',
        machineId: resolvedMc,
        factory: getFactoryFromHomeLine(resolvedMc, machines),
        area: matchedPart.area || '',
        cycleTime: Number(matchedPart.cycle_time || 60),
        cavity: Number(matchedPart.cavity || 1),
        monthN,
        monthN1,
        monthN2,
        monthN3,
        dailyRequirementN,
        dailyRequirementN1,
        dailyRequirementN2,
        dailyRequirementN3
      });
    }
    
    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const parsed = parseForecastCSVContent(text, parts);
        if (parsed.length === 0) {
          setErrorMsg('Kode Sebango tidak cocok atau kolom CSV tidak valid.');
          setIsProcessing(false);
          return;
        }
        setTempForecast(parsed);
        setViewState('preview');
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000);
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal mem-parse file CSV.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handlePasteSubmit = () => {
    if (!pasteData.trim()) return;
    setIsProcessing(true);
    setErrorMsg('');
    
    setTimeout(() => {
      try {
        const parsed = parseForecastCSVContent(pasteData, parts);
        if (parsed.length === 0) {
          setErrorMsg('Data paste kosong atau kode Sebango tidak terdaftar.');
          setIsProcessing(false);
          return;
        }
        setTempForecast(parsed);
        setViewState('preview');
        setUploadSuccess(true);
        setPasteData('');
        setTimeout(() => setUploadSuccess(false), 2000);
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal mem-parse data paste.');
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  };

  // Commit forecast snapshot to backend database
  const handleCommit = async () => {
    setIsCommitting(true);
    setErrorMsg('');
    try {
      const monthKeys = getForecastMonthKeys();
      const newForecastData = [...tempForecast];
      
      // Update parts schema
      const updatedPartsPayloads = parts.map(p => {
        const item = newForecastData.find(tf => tf.partNumber === p.part_number);
        const existingForecasts = p.monthly_forecasts || {};
        let updatedForecasts = { ...existingForecasts };
        
        if (item) {
          updatedForecasts = {
            ...existingForecasts,
            [monthKeys.monthN]: { volume: item.monthN, daily: item.dailyRequirementN },
            [monthKeys.monthN1]: { volume: item.monthN1, daily: item.dailyRequirementN1 },
            [monthKeys.monthN2]: { volume: item.monthN2, daily: item.dailyRequirementN2 },
            [monthKeys.monthN3]: { volume: item.monthN3, daily: item.dailyRequirementN3 }
          };
          
          return {
            ...p,
            daily_requirement_n: item.dailyRequirementN,
            daily_requirement_n1: item.dailyRequirementN1,
            daily_requirement_n2: item.dailyRequirementN2,
            daily_requirement_n3: item.dailyRequirementN3,
            month_n_forecast: item.monthN,
            month_n1_forecast: item.monthN1,
            month_n2_forecast: item.monthN2,
            month_n3_forecast: item.monthN3,
            monthly_forecasts: updatedForecasts
          };
        }
        
        return p;
      });

      // 1. Submit parts update
      await api.post('/parts/import', updatedPartsPayloads);

      // 2. Submit history snapshot record
      const historyRows = newForecastData.map(item => ({
        sebango: item.sebango,
        part_number: item.partNumber,
        part_name: item.partName,
        month_n_volume: item.monthN,
        month_n1_volume: item.monthN1,
        month_n2_volume: item.monthN2,
        month_n3_volume: item.monthN3,
        daily_requirement_n: item.dailyRequirementN,
        daily_requirement_n1: item.dailyRequirementN1,
        daily_requirement_n2: item.dailyRequirementN2,
        daily_requirement_n3: item.dailyRequirementN3
      }));

      await api.post('/history-orders', historyRows);

      // Refresh loaded parts
      const refreshedParts = await api.get('/parts');
      const refreshedHistory = await api.get('/history-orders');
      setParts(refreshedParts.data.data || []);
      
      // Grouping history record update
      const groups: Record<string, any> = {};
      (refreshedHistory.data.data || []).forEach((row: any) => {
        const bId = row.batch_id || 'unknown';
        if (!groups[bId]) {
          groups[bId] = {
            id: bId,
            created_at: row.created_at || new Date().toISOString(),
            items: []
          };
        }
        groups[bId].items.push({
          sebango: row.sebango,
          partNumber: row.part_number,
          partName: row.part_name,
          monthN: Number(row.month_n_volume || 0),
          monthN1: Number(row.month_n1_volume || 0),
          monthN2: Number(row.month_n2_volume || 0),
          monthN3: Number(row.month_n3_volume || 0),
          dailyRequirementN: Number(row.daily_requirement_n || 0),
          dailyRequirementN1: Number(row.daily_requirement_n1 || 0),
          dailyRequirementN2: Number(row.daily_requirement_n2 || 0),
          dailyRequirementN3: Number(row.daily_requirement_n3 || 0)
        });
      });
      setHistoryRecords(Object.values(groups).map((g: any) => ({
        ...g,
        itemCount: g.items.length
      })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      setViewState('active');
      setTempForecast([]);
      setCommitSuccess(true);
      setTimeout(() => setCommitSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal melakukan sinkronisasi forecast ke database.');
    } finally {
      setIsCommitting(false);
    }
  };

  // Restore previous forecast snapshot
  const handleRestoreHistory = async (record: any) => {
    if (!window.confirm(`Apakah Anda yakin ingin me-restore snapshot forecast dari tanggal ${new Date(record.created_at).toLocaleString()}? Ini akan menggantikan data forecast aktif saat ini.`)) {
      return;
    }
    
    setIsCommitting(true);
    setErrorMsg('');
    try {
      const items = record.items;
      const monthKeys = getForecastMonthKeys();
      
      const restoredParts = parts.map(p => {
        const item = items.find((it: any) => (it.partNumber || '').trim().toUpperCase() === (p.part_number || '').trim().toUpperCase() || (it.sebango || '').trim().toUpperCase() === (p.sebango || '').trim().toUpperCase());
        const existingForecasts = p.monthly_forecasts || {};
        let updatedForecasts = { ...existingForecasts };
        
        if (item) {
          updatedForecasts = {
            ...existingForecasts,
            [monthKeys.monthN]: { volume: item.monthN, daily: item.dailyRequirementN },
            [monthKeys.monthN1]: { volume: item.monthN1, daily: item.dailyRequirementN1 },
            [monthKeys.monthN2]: { volume: item.monthN2, daily: item.dailyRequirementN2 },
            [monthKeys.monthN3]: { volume: item.monthN3, daily: item.dailyRequirementN3 }
          };
          
          return {
            ...p,
            daily_requirement_n: item.dailyRequirementN,
            daily_requirement_n1: item.dailyRequirementN1,
            daily_requirement_n2: item.dailyRequirementN2,
            daily_requirement_n3: item.dailyRequirementN3,
            month_n_forecast: item.monthN,
            month_n1_forecast: item.monthN1,
            month_n2_forecast: item.monthN2,
            month_n3_forecast: item.monthN3,
            monthly_forecasts: updatedForecasts
          };
        }
        
        return p;
      });

      await api.post('/parts/import', restoredParts);

      // Refresh master parts
      const refreshedParts = await api.get('/parts');
      setParts(refreshedParts.data.data || []);
      setSubTab('active');
      setCommitSuccess(true);
      setTimeout(() => setCommitSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal me-restore snapshot forecast.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleManualPartSelect = (partNo: string) => {
    setSelectedManualPartNo(partNo);
    if (!partNo) {
      setManualMonthN('');
      setManualMonthN1('');
      setManualMonthN2('');
      setManualMonthN3('');
      return;
    }
    const currentForecast = partsForecast.find(p => p.partNumber === partNo);
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
  };

  const handleManualSubmit = async () => {
    if (!selectedManualPartNo) return;
    
    const originalPart = parts.find(pt => pt.part_number === selectedManualPartNo);
    if (!originalPart) return;
    
    setIsCommitting(true);
    setErrorMsg('');
    try {
      const monthKeys = getForecastMonthKeys();
      const workingDays = 20;
      
      const vN = Math.max(0, parseFloat(manualMonthN) || 0);
      const vN1 = Math.max(0, parseFloat(manualMonthN1) || 0);
      const vN2 = Math.max(0, parseFloat(manualMonthN2) || 0);
      const vN3 = Math.max(0, parseFloat(manualMonthN3) || 0);

      // Use Math.ceil as specified in backend domain logic
      const dN = Math.ceil(vN / workingDays);
      const dN1 = Math.ceil(vN1 / workingDays);
      const dN2 = Math.ceil(vN2 / workingDays);
      const dN3 = Math.ceil(vN3 / workingDays);

      const existingForecasts = originalPart.monthly_forecasts || {};
      const updatedForecasts = {
        ...existingForecasts,
        [monthKeys.monthN]: { volume: vN, daily: dN },
        [monthKeys.monthN1]: { volume: vN1, daily: dN1 },
        [monthKeys.monthN2]: { volume: vN2, daily: dN2 },
        [monthKeys.monthN3]: { volume: vN3, daily: dN3 }
      };

      const revisedPart = {
        ...originalPart,
        daily_requirement_n: dN,
        daily_requirement_n1: dN1,
        daily_requirement_n2: dN2,
        daily_requirement_n3: dN3,
        month_n_forecast: vN,
        month_n1_forecast: vN1,
        month_n2_forecast: vN2,
        month_n3_forecast: vN3,
        monthly_forecasts: updatedForecasts
      };

      await api.post('/parts', revisedPart);

      // Refresh data
      const refreshedParts = await api.get('/parts');
      setParts(refreshedParts.data.data || []);
      
      setCommitSuccess(true);
      setTimeout(() => setCommitSuccess(false), 2000);
      handleManualPartSelect(''); // Reset Form
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menyimpan penyesuaian manual.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleManualReset = () => {
    handleManualPartSelect('');
  };

  // Grouped machine workload chart calculations (FUKA Load hours per day)
  const fukaChartData = useMemo(() => {
    const activeList = viewState === 'preview' ? tempForecast : partsForecast;
    if (activeList.length === 0 || machines.length === 0) return {};
    
    // We pre-populate map with ACTUAL configurations from database keys dynamically:
    const map: Record<string, Record<string, { machineId: string; hours: number }>> = {};

    // Group machines by factory
    machines.forEach(m => {
      const fName = m.factory_name || m.factory_code || 'Unknown';
      if (!map[fName]) {
        map[fName] = {};
      }
      map[fName][m.code] = { machineId: m.name || m.code, hours: 0 };
    });
    
    activeList.forEach(p => {
      // Find standard resolved machine code
      const resolvedMc = resolveMachineKey(p.machineId, machines);
      const factoryKey = getFactoryFromHomeLine(resolvedMc, machines);
      
      if (factoryKey === 'Unknown' || !map[factoryKey]) return;
      if (!map[factoryKey][resolvedMc]) {
        map[factoryKey][resolvedMc] = { machineId: resolvedMc, hours: 0 };
      }
      
      let reqDaily = 0;
      if (fukaFilter === 'monthN') reqDaily = p.dailyRequirementN;
      else if (fukaFilter === 'monthN1') reqDaily = p.dailyRequirementN1;
      else if (fukaFilter === 'monthN2') reqDaily = p.dailyRequirementN2;
      else if (fukaFilter === 'monthN3') reqDaily = p.dailyRequirementN3;
      
      // Calculate workload based on preserved formula
      const cavityVal = Number(p.cavity || 1);
      const cycleTimeVal = Number(p.cycleTime || 60);
      const loadHours = cavityVal > 0 ? ((reqDaily / cavityVal) * cycleTimeVal) / 3600 : 0;
      
      map[factoryKey][resolvedMc].hours += loadHours;
    });
    
    const result: Record<string, any[]> = {};
    Object.keys(map).forEach(factory => {
      result[factory] = Object.values(map[factory])
        .map(d => ({
          machineId: d.machineId,
          hours: Number(d.hours.toFixed(1))
        }))
        .sort((a, b) => a.machineId.localeCompare(b.machineId));
    });
    
    return result;
  }, [partsForecast, tempForecast, viewState, fukaFilter, machines]);

  const activeDisplayList = viewState === 'preview' ? tempForecast : partsForecast;

  // Search & Filter List processing
  const processedDisplayList = useMemo(() => {
    let list = [...activeDisplayList];
    
    // 1. Search Query filter (global search)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const sebango = (item.sebango || '').toLowerCase();
        const partNumber = (item.partNumber || '').toLowerCase();
        const partName = (item.partName || '').toLowerCase();
        const machine = (item.machineId || '').toLowerCase();
        
        return (
          sebango.includes(q) ||
          partNumber.includes(q) ||
          partName.includes(q) ||
          machine.includes(q)
        );
      });
    }
    
    // 2. Column-specific filters
    if (columnFilters.sebango.trim()) {
      const f = columnFilters.sebango.toLowerCase().trim();
      list = list.filter(item => item.sebango.toLowerCase().includes(f));
    }
    if (columnFilters.partNumber.trim()) {
      const f = columnFilters.partNumber.toLowerCase().trim();
      list = list.filter(item => 
        item.partNumber.toLowerCase().includes(f) || 
        item.partName.toLowerCase().includes(f)
      );
    }
    if (columnFilters.modelCode.trim()) {
      const f = columnFilters.modelCode.toLowerCase().trim();
      list = list.filter(item => item.modelCode.toLowerCase().includes(f));
    }
    if (columnFilters.machineId.trim()) {
      const f = columnFilters.machineId.toLowerCase().trim();
      list = list.filter(item => item.machineId.toLowerCase().includes(f));
    }
    
    const filterVolume = (val: number, filterStr: string) => {
      const f = filterStr.trim();
      if (!f) return true;
      if (f.startsWith('>=')) {
        const num = parseFloat(f.slice(2));
        return isNaN(num) ? true : val >= num;
      }
      if (f.startsWith('>')) {
        const num = parseFloat(f.slice(1));
        return isNaN(num) ? true : val > num;
      }
      if (f.startsWith('<=')) {
        const num = parseFloat(f.slice(2));
        return isNaN(num) ? true : val <= num;
      }
      if (f.startsWith('<')) {
        const num = parseFloat(f.slice(1));
        return isNaN(num) ? true : val < num;
      }
      const num = parseFloat(f);
      return isNaN(num) ? val.toString().includes(f) : val >= num;
    };

    if (columnFilters.monthN.trim()) {
      list = list.filter(item => filterVolume(item.monthN, columnFilters.monthN));
    }
    if (columnFilters.monthN1.trim()) {
      list = list.filter(item => filterVolume(item.monthN1, columnFilters.monthN1));
    }
    if (columnFilters.monthN2.trim()) {
      list = list.filter(item => filterVolume(item.monthN2, columnFilters.monthN2));
    }
    if (columnFilters.monthN3.trim()) {
      list = list.filter(item => filterVolume(item.monthN3, columnFilters.monthN3));
    }
    
    // 3. Sort by field and direction
    if (sortField !== 'default') {
      list.sort((a, b) => {
        let valA = a[sortField as keyof PartForecast];
        let valB = b[sortField as keyof PartForecast];
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' 
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        
        return 0;
      });
    }
    
    return list;
  }, [activeDisplayList, searchQuery, columnFilters, sortField, sortDirection]);

  // Pagination calculations
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedDisplayList.slice(start, start + itemsPerPage);
  }, [processedDisplayList, currentPage]);

  const totalPages = Math.ceil(processedDisplayList.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field.startsWith('month') ? 'desc' : 'asc');
    }
  };

  const renderSortHeader = (field: string, label: string, alignRight = false) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`w-full px-3 py-3 flex items-center font-bold tracking-wider text-[10px] text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none cursor-pointer transition-colors ${
          alignRight ? 'justify-end text-right' : 'justify-between text-left'
        }`}
      >
        <span>{label}</span>
        <span className="ml-1 shrink-0 text-slate-350 dark:text-slate-650 font-mono text-[9px]">
          {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Forecast / Input Controls */}
      <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-500 animate-pulse" />
              Upload Forecast Bulanan ({monthNames.monthN} - {monthNames.monthN3})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Upload nilai rata-rata requirement harian (Volume Average/Day) per part berdasarkan kode **Sebango** internal. Volume bulanan otomatis dihitung dengan basis 20 hari kerja.
            </p>
          </div>
          
          <div className="bg-slate-200/60 dark:bg-slate-850 p-1 rounded-2xl flex gap-1 select-none shrink-0 self-center lg:self-start border border-slate-300/30 dark:border-slate-800/30">
            <button
              onClick={() => { setImportMode('csv'); setErrorMsg(''); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                importMode === 'csv' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
              }`}
              style={importMode === 'csv' ? { backgroundColor: colorPrimary } : {}}
            >
              CSV/Excel File
            </button>
            <button
              onClick={() => { setImportMode('paste'); setErrorMsg(''); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                importMode === 'paste' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
              }`}
              style={importMode === 'paste' ? { backgroundColor: colorPrimary } : {}}
            >
              Excel Paste
            </button>
            <button
              onClick={() => { setImportMode('manual'); setErrorMsg(''); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                importMode === 'manual' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
              }`}
              style={importMode === 'manual' ? { backgroundColor: colorPrimary } : {}}
            >
              Manual Input
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200/40 dark:border-slate-800/40 pt-5">
          {importMode === 'csv' && (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-900 rounded-2xl transition-colors relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.txt" 
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              <Upload className="w-8 h-8 mb-2.5 text-slate-400 dark:text-slate-600" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-5 py-2 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: colorPrimary }}
              >
                {isProcessing ? 'Processing File...' : 'Pilih File CSV'}
              </button>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Format kolom: Sebango, {monthNames.monthN} (Avg/Day), {monthNames.monthN1} (Avg/Day), {monthNames.monthN2} (Avg/Day), {monthNames.monthN3} (Avg/Day)</span>
            </div>
          )}

          {importMode === 'paste' && (
            <div className="space-y-3">
              <textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder={`Paste kolom tabel Excel di sini... (Contoh: Sebango [Tab] ${monthNames.monthN} [Tab] ${monthNames.monthN1} [Tab] ${monthNames.monthN2} [Tab] ${monthNames.monthN3})`}
                className="w-full h-32 p-3 text-xs font-mono border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-xl bg-white dark:bg-slate-900 dark:text-white shadow-inner resize-y leading-relaxed"
                disabled={isProcessing}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPasteData('')}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={isProcessing || !pasteData.trim()}
                  className="px-5 py-2 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: colorPrimary }}
                >
                  {isProcessing ? 'Processing...' : 'Submit Paste Data'}
                </button>
              </div>
            </div>
          )}

          {importMode === 'manual' && (
            <div className="space-y-4 max-w-4xl">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Pilih Part (Sebango / No Part / Model)</label>
                <select
                  value={selectedManualPartNo}
                  onChange={(e) => handleManualPartSelect(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 outline-none focus:border-emerald-600 cursor-pointer shadow-sm"
                >
                  <option value="">-- Pilih Part --</option>
                  {parts.map(p => (
                    <option key={p.part_number} value={p.part_number}>
                      {p.sebango ? `[${p.sebango}] ` : ''}{p.part_number} - {p.part_name || ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedManualPartNo && (
                <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/30 p-3 rounded-2xl">
                      <label className="block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5">{getShortMonthName(monthNames.monthN)}</label>
                      <input
                        type="number"
                        value={manualMonthN}
                        onChange={(e) => setManualMonthN(e.target.value)}
                        placeholder="Volume"
                        className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 dark:text-white"
                      />
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">
                        Daily Avg: {Math.ceil((parseFloat(manualMonthN) || 0) / 20).toLocaleString()} / hari
                      </span>
                    </div>

                    <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/30 p-3 rounded-2xl">
                      <label className="block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5">{getShortMonthName(monthNames.monthN1)}</label>
                      <input
                        type="number"
                        value={manualMonthN1}
                        onChange={(e) => setManualMonthN1(e.target.value)}
                        placeholder="Volume"
                        className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 dark:text-white"
                      />
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">
                        Daily Avg: {Math.ceil((parseFloat(manualMonthN1) || 0) / 20).toLocaleString()} / hari
                      </span>
                    </div>

                    <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/30 p-3 rounded-2xl">
                      <label className="block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5">{getShortMonthName(monthNames.monthN2)}</label>
                      <input
                        type="number"
                        value={manualMonthN2}
                        onChange={(e) => setManualMonthN2(e.target.value)}
                        placeholder="Volume"
                        className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 dark:text-white"
                      />
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">
                        Daily Avg: {Math.ceil((parseFloat(manualMonthN2) || 0) / 20).toLocaleString()} / hari
                      </span>
                    </div>

                    <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/30 p-3 rounded-2xl">
                      <label className="block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5">{getShortMonthName(monthNames.monthN3)}</label>
                      <input
                        type="number"
                        value={manualMonthN3}
                        onChange={(e) => setManualMonthN3(e.target.value)}
                        placeholder="Volume"
                        className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 dark:text-white"
                      />
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">
                        Daily Avg: {Math.ceil((parseFloat(manualMonthN3) || 0) / 20).toLocaleString()} / hari
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleManualReset}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold uppercase rounded-xl cursor-pointer transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleManualSubmit}
                      disabled={isCommitting}
                      className="px-5 py-2 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                      style={{ backgroundColor: colorPrimary }}
                    >
                      {isCommitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Simpan Penyesuaian
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-[11px] font-bold flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-500 shrink-0" />
              {errorMsg}
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-800 text-emerald-800 dark:text-emerald-450 rounded-xl text-[11px] font-bold flex items-center gap-2 shadow-sm">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
              Unggahan berhasil di-parse! Tinjau preview di bawah.
            </div>
          )}
        </div>
      </div>

      {/* Preview Header Alert Mode */}
      {viewState === 'preview' && (
        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-450 flex items-center justify-center font-black">
              !
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Mode Preview Forecast</h4>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Tinjau nilai volume draf di tabel sebelum menekan tombol Commit untuk memperbarui master data.</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => { setViewState('active'); setTempForecast([]); }}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold uppercase rounded-xl cursor-pointer"
            >
              Batalkan
            </button>
            <button
              onClick={handleCommit}
              disabled={isCommitting}
              className="w-full sm:w-auto px-5 py-2.5 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: colorPrimary }}
            >
              {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Commit Forecast
            </button>
          </div>
        </div>
      )}

      {commitSuccess && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl font-black text-center text-xs tracking-wider flex items-center justify-center gap-2 shadow animate-in fade-in duration-300">
          <Check className="w-5 h-5 animate-bounce" /> FORECAST BERHASIL DISINKRONISASI KE MASTER PARTS DATABASE!
        </div>
      )}

      {/* Main Grid View: Table on Left, Recharts Chart on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Table Column */}
        <div className="xl:col-span-2 space-y-4 min-w-0">
          <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden flex flex-col h-[720px] transition-all">
            
            {/* Header controls inside Table */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                  {viewState === 'preview' ? 'Preview Data Forecast' : 'Data Forecast Aktif'}
                </h3>
                
                {viewState === 'active' && (
                  <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl flex gap-1 border border-slate-300/10 dark:border-slate-800/10">
                    <button
                      onClick={() => setSubTab('active')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        subTab === 'active' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/30'
                      }`}
                      style={subTab === 'active' ? { backgroundColor: colorPrimary } : {}}
                    >
                      Active Plan
                    </button>
                    <button
                      onClick={() => setSubTab('history')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        subTab === 'history' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/30'
                      }`}
                      style={subTab === 'history' ? { backgroundColor: colorPrimary } : {}}
                    >
                      Riwayat Upload
                    </button>
                  </div>
                )}
              </div>

              {/* Filtering Controls */}
              {(viewState === 'preview' || (viewState === 'active' && subTab === 'active')) && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Cari Sebango, Part No, Model..."
                      className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white shadow-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setColumnFilters({
                        sebango: '',
                        partNumber: '',
                        modelCode: '',
                        machineId: '',
                        monthN: '',
                        monthN1: '',
                        monthN2: '',
                        monthN3: ''
                      });
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-100 rounded-lg border border-rose-250/20 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable grid area */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Memuat Data Forecast...</span>
                </div>
              ) : subTab === 'history' && viewState === 'active' ? (
                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-full overflow-y-auto">
                  {historyRecords.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-650 font-bold text-xs">
                      Tidak ada riwayat upload snapshot forecast terdaftar.
                    </div>
                  ) : (
                    historyRecords.map((record) => (
                      <div key={record.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-850 dark:text-slate-200 text-xs font-mono">
                              {new Date(record.created_at).toLocaleString('id-ID', {
                                year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                              })}
                            </span>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-[9px] font-black px-2 py-0.5 rounded border border-slate-200/40 uppercase tracking-wider">
                              {record.itemCount} Parts
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                            Batch ID: {record.id}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5 max-w-xl">
                            {record.items.slice(0, 5).map((it: any, idx: number) => (
                              <span key={idx} className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-450 text-[9px] px-1.5 py-0.5 rounded border border-slate-200/40 dark:border-slate-800/40 font-mono font-bold">
                                {it.sebango || it.partNumber.slice(0, 6)}: {it.monthN.toLocaleString()}
                              </span>
                            ))}
                            {record.items.length > 5 && (
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold self-center ml-1">
                                +{record.items.length - 5} lainnya
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestoreHistory(record)}
                          disabled={isCommitting}
                          className="px-4 py-2 text-white text-[10px] font-bold uppercase rounded-xl shadow tracking-wider flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          style={{ backgroundColor: colorPrimary }}
                        >
                          Restore Plan
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[900px] relative">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-0" style={{ width: '10%' }}>{renderSortHeader('sebango', 'Sebango')}</th>
                      <th className="p-0" style={{ width: '22%' }}>{renderSortHeader('partNumber', 'Part No / Nama')}</th>
                      <th className="p-0" style={{ width: '11%' }}>{renderSortHeader('modelCode', 'Model')}</th>
                      <th className="p-0" style={{ width: '13%' }}>{renderSortHeader('machineId', 'M/C')}</th>
                      <th className="p-0 text-right bg-emerald-50/10 dark:bg-emerald-950/5" style={{ width: '11%' }}>{renderSortHeader('monthN', getShortMonthName(monthNames.monthN), true)}</th>
                      <th className="p-0 text-right bg-emerald-50/10 dark:bg-emerald-950/5" style={{ width: '11%' }}>{renderSortHeader('monthN1', getShortMonthName(monthNames.monthN1), true)}</th>
                      <th className="p-0 text-right bg-emerald-50/10 dark:bg-emerald-950/5" style={{ width: '11%' }}>{renderSortHeader('monthN2', getShortMonthName(monthNames.monthN2), true)}</th>
                      <th className="p-0 text-right bg-emerald-50/10 dark:bg-emerald-950/5" style={{ width: '11%' }}>{renderSortHeader('monthN3', getShortMonthName(monthNames.monthN3), true)}</th>
                    </tr>
                    {/* Inline Filter Inputs */}
                    <tr className="bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/80">
                      <th className="p-1">
                        <input
                          type="text"
                          value={columnFilters.sebango}
                          onChange={e => { setColumnFilters(prev => ({ ...prev, sebango: e.target.value })); setCurrentPage(1); }}
                          placeholder="Filter Seb..."
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white"
                        />
                      </th>
                      <th className="p-1">
                        <input
                          type="text"
                          value={columnFilters.partNumber}
                          onChange={e => { setColumnFilters(prev => ({ ...prev, partNumber: e.target.value })); setCurrentPage(1); }}
                          placeholder="Filter Part..."
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white"
                        />
                      </th>
                      <th className="p-1">
                        <input
                          type="text"
                          value={columnFilters.modelCode}
                          onChange={e => { setColumnFilters(prev => ({ ...prev, modelCode: e.target.value })); setCurrentPage(1); }}
                          placeholder="Filter Model..."
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white"
                        />
                      </th>
                      <th className="p-1">
                        <input
                          type="text"
                          value={columnFilters.machineId}
                          onChange={e => { setColumnFilters(prev => ({ ...prev, machineId: e.target.value })); setCurrentPage(1); }}
                          placeholder="Filter M/C..."
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white"
                        />
                      </th>
                      <th className="p-1 bg-emerald-50/5 dark:bg-emerald-950/2 text-right">
                        <input
                          type="text"
                          value={columnFilters.monthN}
                          onChange={e => { setColumnFilters(prev => ({ ...prev, monthN: e.target.value })); setCurrentPage(1); }}
                          placeholder="Min..."
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white text-right font-mono"
                        />
                      </th>
                      <th className="p-1 bg-emerald-50/5 dark:bg-emerald-950/2 text-right">
                        <input
                          type="text"
                          value={columnFilters.monthN1}
                          onChange={e => { setColumnFilters(prev => ({ ...prev, monthN1: e.target.value })); setCurrentPage(1); }}
                          placeholder="Min..."
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white text-right font-mono"
                        />
                      </th>
                      <th className="p-1 bg-emerald-50/5 dark:bg-emerald-950/2 text-right">
                        <input
                          type="text"
                          value={columnFilters.monthN2}
                          onChange={e => { setColumnFilters(prev => ({ ...prev, monthN2: e.target.value })); setCurrentPage(1); }}
                          placeholder="Min..."
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white text-right font-mono"
                        />
                      </th>
                      <th className="p-1 bg-emerald-50/5 dark:bg-emerald-950/2 text-right">
                        <input
                          type="text"
                          value={columnFilters.monthN3}
                          onChange={e => { setColumnFilters(prev => ({ ...prev, monthN3: e.target.value })); setCurrentPage(1); }}
                          placeholder="Min..."
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white text-right font-mono"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px] dark:text-slate-300">
                    {paginatedList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-slate-650 font-bold">
                          Tidak ada data forecast part yang cocok.
                        </td>
                      </tr>
                    ) : (
                      paginatedList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors">
                          <td className="px-3 py-3 font-mono font-extrabold text-slate-700 dark:text-slate-400">{item.sebango || '-'}</td>
                          <td className="px-3 py-3">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200">{item.partNumber}</div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[200px]">{item.partName || '-'}</div>
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-500 dark:text-slate-450">{item.modelCode || '-'}</td>
                          
                          {/* Machine selection selector cell */}
                          <td className="px-3 py-3">
                            {viewState === 'preview' ? (
                              <span className="font-bold font-mono text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {item.machineId || 'UNASSIGNED'}
                              </span>
                            ) : (
                              <select
                                value={item.machineId}
                                onChange={(e) => handleMachineChange(item.partNumber, e.target.value)}
                                disabled={isCommitting}
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded px-1.5 py-1 font-mono font-bold text-xs cursor-pointer focus:border-emerald-600 dark:text-slate-300"
                              >
                                <option value="">UNASSIGNED</option>
                                {machines.map(m => (
                                  <option key={m.id} value={m.code}>{m.code}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          
                          <td className="px-3 py-3 text-right font-mono bg-emerald-50/5 dark:bg-emerald-950/2">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.monthN.toLocaleString()}</div>
                            <div className="text-[9px] text-slate-400 dark:text-emerald-500 font-bold">{item.dailyRequirementN.toLocaleString()} / hari</div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono bg-emerald-50/5 dark:bg-emerald-950/2">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.monthN1.toLocaleString()}</div>
                            <div className="text-[9px] text-slate-400 dark:text-emerald-500 font-bold">{item.dailyRequirementN1.toLocaleString()} / hari</div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono bg-emerald-50/5 dark:bg-emerald-950/2">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.monthN2.toLocaleString()}</div>
                            <div className="text-[9px] text-slate-400 dark:text-emerald-500 font-bold">{item.dailyRequirementN2.toLocaleString()} / hari</div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono bg-emerald-50/5 dark:bg-emerald-950/2">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.monthN3.toLocaleString()}</div>
                            <div className="text-[9px] text-slate-400 dark:text-emerald-500 font-bold">{item.dailyRequirementN3.toLocaleString()} / hari</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination footer */}
            {(viewState === 'preview' || (viewState === 'active' && subTab === 'active')) && totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30 select-none">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">
                  Halaman {currentPage} dari {totalPages} ({processedDisplayList.length} items)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-55 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-55 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FUKA Load Chart Column */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm flex flex-col h-[720px] transition-all">
            
            {/* Header controls for FUKA */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800/60 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-150 text-sm flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-500 animate-spin-slow" />
                  Beban FUKA (Daily M/C Hours)
                </h3>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Batas Target: 24 jam / hari
                </p>
              </div>

              <select
                value={fukaFilter}
                onChange={(e) => setFukaFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-1 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-350 cursor-pointer outline-none focus:border-emerald-600"
              >
                <option value="monthN">{getShortMonthName(monthNames.monthN)}</option>
                <option value="monthN1">{getShortMonthName(monthNames.monthN1)}</option>
                <option value="monthN2">{getShortMonthName(monthNames.monthN2)}</option>
                <option value="monthN3">{getShortMonthName(monthNames.monthN3)}</option>
              </select>
            </div>

            {/* Scrollable Container with Factory Charts */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-1">
              {Object.keys(fukaChartData).length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-650 font-bold text-xs">
                  Tidak ada data untuk diagram beban FUKA.
                </div>
              ) : (
                Object.keys(fukaChartData).map(factory => (
                  <div key={factory} className="space-y-2">
                    <h4 className="font-extrabold text-[10px] text-emerald-700 dark:text-emerald-550 uppercase tracking-widest bg-emerald-50/40 dark:bg-emerald-950/10 px-3 py-1.5 rounded-lg border-l-4 border-emerald-600">
                      {factory}
                    </h4>
                    
                    <div className="h-44 w-full bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl p-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={fukaChartData[factory]}
                          margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                          <XAxis 
                            dataKey="machineId" 
                            tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <YAxis 
                            domain={[0, 32]} 
                            tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              borderColor: '#334155',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                          />
                          <ReferenceLine y={24} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '24h Limit', fill: '#ef4444', fontSize: 7, position: 'top', fontWeight: 'bold' }} />
                          <Bar 
                            dataKey="hours" 
                            radius={[6, 6, 0, 0]}
                          >
                            {
                              fukaChartData[factory].map((entry: any, index: number) => {
                                const isOverload = entry.hours > 24;
                                const fillHex = isOverload ? '#ef4444' : colorPrimary;
                                return <Cell key={`cell-${index}`} fill={fillHex} />;
                              })
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
