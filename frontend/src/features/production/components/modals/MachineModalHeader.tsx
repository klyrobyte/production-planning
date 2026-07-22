import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  LogOut,
  Kanban,
  List,
  Database,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart2,
} from 'lucide-react';
import { useThemeStore } from '../../../../shared/store/useThemeStore';
import { useAuthStore } from '../../../../shared/store/useAuthStore';

interface MachineModalHeaderProps {
  machine: string;
  tonnage: string;
  factory: string;
  machineKey: string;
  activeTab: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onClose: () => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  currentTime: Date;
}

export const MachineModalHeader: React.FC<MachineModalHeaderProps> = ({
  machine,
  tonnage,
  factory,
  machineKey,
  activeTab,
  selectedDate,
  setSelectedDate,
  onClose,
  onNavigate,
  currentTime,
}) => {
  const navigate = useNavigate();
  const { memberName, logoutOperator, activePortal } = useAuthStore();
  const systemLogo = useThemeStore((state) => state.systemLogo);

  const formattedMachineName = `Machine ${machine}`;

  const handleExitMember = () => {
    logoutOperator();
    onClose();
  };

  const handleSwitchMachine = () => {
    onClose();
  };

  if (activePortal === 'member') {
    return (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 h-auto lg:h-20 z-10 w-full select-none gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0 pr-2">
            <img src={systemLogo || '/logo.png'} alt="Logo" className="h-8 object-contain" />
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-sm font-black text-slate-800 dark:text-white tracking-wider uppercase leading-tight truncate">
                Member Dashboard
              </h2>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1.5 hidden lg:block shrink-0"></div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black uppercase">
            <span className="h-7.5 sm:h-9 flex items-center px-2.5 sm:px-3 rounded-lg bg-slate-800 text-white font-mono font-black tracking-widest shadow-sm shrink-0 w-[80px] justify-center">
              {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div
              className="h-7.5 sm:h-9 flex items-center gap-1 sm:gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg px-2 sm:px-3 bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold text-[11px] sm:text-xs shadow-inner shrink-0 opacity-80 cursor-not-allowed"
              title="Tanggal produksi member tidak dapat diubah"
            >
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
              className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${
                activeTab === 'partlist'
                  ? 'bg-[#008d51] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'
              }`}
            >
              <Database className="w-3 h-3 shrink-0" /> Part List
            </button>
            <button
              onClick={() => navigate(`/production/${machineKey}/execution`)}
              className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${
                activeTab === 'execution'
                  ? 'bg-[#008d51] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'
              }`}
            >
              <Kanban className="w-3 h-3 shrink-0" /> Execute
            </button>
            <button
              onClick={() => navigate(`/production/${machineKey}/pattern`)}
              className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${
                activeTab === 'pattern'
                  ? 'bg-[#008d51] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'
              }`}
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
    );
  }

  return (
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
          <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-wider uppercase leading-tight truncate">
            Resin Injection Control
          </h2>
          <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest leading-none mt-0.5 truncate">
            Sugity Creatives Telemetry Hub
          </span>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1.5 hidden lg:block shrink-0"></div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black uppercase">
          <span className="h-7.5 sm:h-9 flex items-center px-2.5 sm:px-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 font-black tracking-wider shadow-sm shrink-0">
            {factory}
          </span>
          <span className="h-7.5 sm:h-9 flex items-center px-2.5 sm:px-3 rounded-lg text-[#008d51] bg-[#e8f5e9] dark:bg-emerald-950/20 dark:text-emerald-450 border border-[#a5d6a7]/50 dark:border-emerald-900/30 font-black tracking-wider shadow-sm shrink-0">
            {formattedMachineName}
          </span>
          <span className="h-7.5 sm:h-9 flex items-center px-2.5 sm:px-3 rounded-lg text-slate-500 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 font-mono font-bold tracking-wider shadow-sm shrink-0">
            {tonnage}T
          </span>
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
            className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${
              activeTab === 'partlist'
                ? 'bg-[#008d51] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'
            }`}
          >
            <Database className="w-3 h-3 shrink-0" /> Part List
          </button>
          <button
            onClick={() => navigate(`/production/${machineKey}/execution`)}
            className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${
              activeTab === 'execution'
                ? 'bg-[#008d51] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'
            }`}
          >
            <Kanban className="w-3 h-3 shrink-0" /> Execute
          </button>
          <button
            onClick={() => navigate(`/production/${machineKey}/pattern`)}
            className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${
              activeTab === 'pattern'
                ? 'bg-[#008d51] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'
            }`}
          >
            <List className="w-3 h-3 shrink-0" /> Pattern View
          </button>
          <button
            onClick={() => navigate(`/production/${machineKey}/oee`)}
            className={`h-7.5 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-150 whitespace-nowrap ${
              activeTab === 'oee'
                ? 'bg-[#008d51] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40'
            }`}
          >
            <BarChart2 className="w-3 h-3 shrink-0" /> OEE & Diag
          </button>
        </div>
      </div>
    </div>
  );
};
