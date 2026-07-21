import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, LogOut, Kanban, List, Database, ChevronLeft, ChevronRight, Calendar, BarChart2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useProduction, getUniqueMachineKey, getTodayDateString } from '../context/ProductionContext';
import { MachineExecutionView } from './MachineExecutionView';
import { MachinePatternView } from './MachinePatternView';
import { MachinePartListView } from './MachinePartListView';
import { MachineOeeView } from './MachineOeeView';
import api from '../../../shared/lib/axios';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useAuthStore } from '../../../shared/store/useAuthStore';
 
interface MachineDetailModalProps {
  machine: string;
  tonnage: string;
  factory: string;
  onClose: () => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  initialDate?: string;
}
 
export function MachineDetailModal({ machine, tonnage, factory, onClose, onNavigate, initialDate }: MachineDetailModalProps) {
  const { machine: urlMachine, tab: urlTab } = useParams<{ machine: string; tab: string }>();
  const navigate = useNavigate();
  
  const activeTab = (urlTab === 'execution' || urlTab === 'pattern' || urlTab === 'partlist' || urlTab === 'oee') 
    ? urlTab 
    : 'pattern';
  
  const { memberName, logoutOperator, activePortal } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (activePortal === 'member') return getTodayDateString();
    if (initialDate) return initialDate;
    return getTodayDateString();
  });

  const { initializeMachineIfEmpty } = useProduction();

  const { data: partsData = [] } = useQuery<any[]>({
    queryKey: ['parts'],
    queryFn: async () => (await api.get('/parts')).data?.data || [],
    staleTime: 60_000,
  });

  const machineKey = urlMachine || getUniqueMachineKey(factory, machine);
  const formattedMachineName = `Machine ${machine}`;

  // Sync selectedDate when initialDate prop changes (e.g. parent date changes)
  useEffect(() => {
    if (activePortal === 'member') {
      setSelectedDate(getTodayDateString());
    } else if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate, activePortal]);


  // Auto initialize machine if empty in DB
  useEffect(() => {
    if (partsData.length > 0) {
      initializeMachineIfEmpty(machineKey, selectedDate, partsData);
    }
  }, [machineKey, selectedDate, partsData, initializeMachineIfEmpty]);

  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const systemLogo = useThemeStore((state) => state.systemLogo);

  const handleExitMember = () => {
    logoutOperator();
    onClose();
  };

  const handleSwitchMachine = () => {
    onClose();
  };

  // Disable scroll when modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 w-full h-full flex flex-col overflow-hidden relative">
        {/* Header */}
        {activePortal === 'member' ? (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 h-auto lg:h-20 z-10 w-full select-none gap-3">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2 shrink-0 pr-2">
                <img src={systemLogo || '/logo.png'} alt="Logo" className="h-8 object-contain" />
                <div className="flex flex-col justify-center min-w-0">
                  <h2 className="text-sm font-black text-slate-800 dark:text-white tracking-wider uppercase leading-tight truncate">Member Dashboard</h2>
                </div>
              </div>
              
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1.5 hidden lg:block shrink-0"></div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black uppercase">
                <span className="h-7.5 sm:h-9 flex items-center px-2.5 sm:px-3 rounded-lg bg-slate-800 text-white font-mono font-black tracking-widest shadow-sm shrink-0 w-[80px] justify-center">
                  {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <div className="h-7.5 sm:h-9 flex items-center gap-1 sm:gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg px-2 sm:px-3 bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold text-[11px] sm:text-xs shadow-inner shrink-0 opacity-80 cursor-not-allowed" title="Tanggal produksi member tidak dapat diubah">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#008d51] stroke-[2.5] shrink-0" />
                  <input 
                    type="date" 
                    value={selectedDate}
                    disabled
                    readOnly
                    className="bg-transparent focus:outline-none cursor-not-allowed font-black text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-sans border-none p-0 outline-none w-[95px] sm:w-[115px]"
                  />
                </div>
              </div>

              {onNavigate && (
                <div className="h-7.5 sm:h-9 flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 gap-0.5 shrink-0 shadow-inner ml-2">
                  <button 
                    onClick={() => onNavigate('prev')}
                    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white rounded-lg transition-all cursor-pointer shadow-sm duration-150"
                    title="Previous Machine"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  </button>
                  <button 
                    onClick={() => onNavigate('next')}
                    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white rounded-lg transition-all cursor-pointer shadow-sm duration-150"
                    title="Next Machine"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end">
              <div className="h-8.5 sm:h-10 flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner gap-0.5 shrink-0 overflow-x-auto max-w-full">
                <button 
                  onClick={() => navigate(`/production/${machineKey}/partlist`)}
                  className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${activeTab === 'partlist' ? 'bg-[#008d51] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'}`}
                >
                  <Database className="w-3 h-3 shrink-0" /> Part List
                </button>
                <button 
                  onClick={() => navigate(`/production/${machineKey}/execution`)}
                  className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${activeTab === 'execution' ? 'bg-[#008d51] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'}`}
                >
                  <Kanban className="w-3 h-3 shrink-0" /> Execute
                </button>
                <button 
                  onClick={() => navigate(`/production/${machineKey}/pattern`)}
                  className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${activeTab === 'pattern' ? 'bg-[#008d51] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'}`}
                >
                  <List className="w-3 h-3 shrink-0" /> Pattern View
                </button>
              </div>
              
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-0.5 hidden lg:block shrink-0"></div>

              <button 
                onClick={handleSwitchMachine} 
                className="h-8.5 sm:h-10 flex items-center justify-center gap-1.5 px-3 sm:px-4 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-sm text-xs font-black uppercase tracking-wider shrink-0"
              >
                <Monitor className="w-4 h-4" /> <span className="hidden sm:inline">Switch M/C</span>
              </button>
              <button 
                onClick={handleExitMember} 
                className="h-8.5 sm:h-10 flex items-center justify-center gap-1.5 px-3 sm:px-4 text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-all cursor-pointer shadow-sm text-xs font-black uppercase tracking-wider shrink-0"
              >
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Exit Member</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 h-auto lg:h-20 z-10 w-full select-none gap-3">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0">
              <button 
                onClick={onClose} 
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer duration-150 border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm shrink-0"
                title="Back to Machine FUKA Control"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
              
              <div className="flex flex-col justify-center min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-wider uppercase leading-tight truncate">Resin Injection Control</h2>
                <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest leading-none mt-0.5 truncate">Sugity Creatives Telemetry Hub</span>
              </div>
              
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1.5 hidden lg:block shrink-0"></div>
              
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black uppercase">
                <span className="h-7.5 sm:h-9 flex items-center px-2.5 sm:px-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 font-black tracking-wider shadow-sm shrink-0">{factory}</span>
                <span className="h-7.5 sm:h-9 flex items-center px-2.5 sm:px-3 rounded-lg text-[#008d51] bg-[#e8f5e9] dark:bg-emerald-950/20 dark:text-emerald-450 border border-[#a5d6a7]/50 dark:border-emerald-900/30 font-black tracking-wider shadow-sm shrink-0">{formattedMachineName}</span>
                <span className="h-7.5 sm:h-9 flex items-center px-2.5 sm:px-3 rounded-lg text-slate-500 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 font-mono font-bold tracking-wider shadow-sm shrink-0">{tonnage}T</span>
                <div className="h-7.5 sm:h-9 flex items-center gap-1 sm:gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg px-2 sm:px-3 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-[11px] sm:text-xs shadow-inner shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#008d51] stroke-[2.5] shrink-0" />
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer font-black text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-sans border-none p-0 outline-none w-[95px] sm:w-[115px]"
                  />
                </div>
              </div>
              
              {onNavigate && (
                <div className="h-7.5 sm:h-9 flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 gap-0.5 shrink-0 shadow-inner">
                  <button 
                    onClick={() => onNavigate('prev')}
                    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white rounded-lg transition-all cursor-pointer shadow-sm duration-150"
                    title="Previous Machine"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  </button>
                  <button 
                    onClick={() => onNavigate('next')}
                    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white rounded-lg transition-all cursor-pointer shadow-sm duration-150"
                    title="Next Machine"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end">
              <div className="h-8.5 sm:h-10 flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner gap-0.5 shrink-0 overflow-x-auto max-w-full">
                <button 
                  onClick={() => navigate(`/production/${machineKey}/partlist`)}
                  className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${activeTab === 'partlist' ? 'bg-[#008d51] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'}`}
                >
                  <Database className="w-3 h-3 shrink-0" /> Part List
                </button>
                <button 
                  onClick={() => navigate(`/production/${machineKey}/execution`)}
                  className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${activeTab === 'execution' ? 'bg-[#008d51] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'}`}
                >
                  <Kanban className="w-3 h-3 shrink-0" /> Execute
                </button>
                <button 
                  onClick={() => navigate(`/production/${machineKey}/pattern`)}
                  className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${activeTab === 'pattern' ? 'bg-[#008d51] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'}`}
                >
                  <List className="w-3 h-3 shrink-0" /> Pattern View
                </button>
                <button 
                  onClick={() => navigate(`/production/${machineKey}/oee`)}
                  className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${activeTab === 'oee' ? 'bg-[#008d51] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'}`}
                >
                  <BarChart2 className="w-3 h-3 shrink-0" /> OEE & Diag
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area - conditionally render Pattern, Execution, or Part List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activePortal === 'member' && (
            <div className="flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 shrink-0 text-[11px] sm:text-xs font-black uppercase z-10 shadow-sm backdrop-blur-sm">
              <span className="h-7 sm:h-8 flex items-center px-2.5 sm:px-3 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 font-black tracking-wider shadow-sm shrink-0">{factory.replace(/Factory\s*/i, 'F')}</span>
              <span className="h-7 sm:h-8 flex items-center px-2.5 sm:px-3 rounded-lg text-[#008d51] bg-[#e8f5e9] dark:bg-emerald-950/20 dark:text-emerald-450 border border-[#a5d6a7]/50 dark:border-emerald-900/30 font-black tracking-wider shadow-sm shrink-0">MC {machine.replace(/MC\s*/i, '')}</span>
              <span className="h-7 sm:h-8 flex items-center px-2.5 sm:px-3 rounded-lg text-blue-700 bg-blue-50 border border-blue-200/80 font-black tracking-wider shadow-sm shrink-0">{memberName || 'GUEST'}</span>
            </div>
          )}
          {activeTab === 'execution' && <MachineExecutionView machine={machine} factory={factory} machineKey={machineKey} selectedDate={selectedDate} />}
          {activeTab === 'pattern' && <MachinePatternView machine={machine} factory={factory} machineKey={machineKey} selectedDate={selectedDate} />}
          {activeTab === 'partlist' && <MachinePartListView machine={machine} factory={factory} machineKey={machineKey} selectedDate={selectedDate} />}
          {activeTab === 'oee' && <MachineOeeView machine={machine} factory={factory} machineKey={machineKey} selectedDate={selectedDate} />}
        </div>
      </div>
    </div>
  );
}