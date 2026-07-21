import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useProduction, getUniqueMachineKey, getTodayDateString } from '../../context/ProductionContext';
import { MachineModalHeader } from './MachineModalHeader';
import { MachineExecutionView } from '../execution/MachineExecutionView';
import { MachinePatternView } from '../pattern/MachinePatternView';
import { MachinePartListView } from '../part-list/MachinePartListView';
import { MachineOeeView } from '../oee/MachineOeeView';
import api from '../../../../shared/lib/axios';
import { useAuthStore } from '../../../../shared/store/useAuthStore';

interface MachineDetailModalProps {
  machine: string;
  tonnage: string;
  factory: string;
  onClose: () => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  initialDate?: string;
}

export function MachineDetailModal({
  machine,
  tonnage,
  factory,
  onClose,
  onNavigate,
  initialDate,
}: MachineDetailModalProps) {
  const { machine: urlMachine, tab: urlTab } = useParams<{ machine: string; tab: string }>();

  const activeTab =
    urlTab === 'execution' || urlTab === 'pattern' || urlTab === 'partlist' || urlTab === 'oee'
      ? urlTab
      : 'pattern';

  const { memberName, activePortal } = useAuthStore();

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

  // Sync selectedDate when initialDate prop changes
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

  // Current time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Disable scroll when modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 w-full h-full flex flex-col overflow-hidden relative">
        {/* Header Navigation Bar */}
        <MachineModalHeader
          machine={machine}
          tonnage={tonnage}
          factory={factory}
          machineKey={machineKey}
          activeTab={activeTab}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onClose={onClose}
          onNavigate={onNavigate}
          currentTime={currentTime}
        />

        {/* Content Area - conditionally render Pattern, Execution, Part List, or OEE */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activePortal === 'member' && (
            <div className="flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 shrink-0 text-[11px] sm:text-xs font-black uppercase z-10 shadow-sm backdrop-blur-sm">
              <span className="h-7 sm:h-8 flex items-center px-2.5 sm:px-3 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 font-black tracking-wider shadow-sm shrink-0">
                {factory.replace(/Factory\s*/i, 'F')}
              </span>
              <span className="h-7 sm:h-8 flex items-center px-2.5 sm:px-3 rounded-lg text-[#008d51] bg-[#e8f5e9] dark:bg-emerald-950/20 dark:text-emerald-450 border border-[#a5d6a7]/50 dark:border-emerald-900/30 font-black tracking-wider shadow-sm shrink-0">
                MC {machine.replace(/MC\s*/i, '')}
              </span>
              <span className="h-7 sm:h-8 flex items-center px-2.5 sm:px-3 rounded-lg text-blue-700 bg-blue-50 border border-blue-200/80 font-black tracking-wider shadow-sm shrink-0">
                {memberName || 'GUEST'}
              </span>
            </div>
          )}
          {activeTab === 'execution' && (
            <MachineExecutionView
              machine={machine}
              factory={factory}
              machineKey={machineKey}
              selectedDate={selectedDate}
            />
          )}
          {activeTab === 'pattern' && (
            <MachinePatternView
              machine={machine}
              factory={factory}
              machineKey={machineKey}
              selectedDate={selectedDate}
            />
          )}
          {activeTab === 'partlist' && (
            <MachinePartListView
              machine={machine}
              factory={factory}
              machineKey={machineKey}
              selectedDate={selectedDate}
            />
          )}
          {activeTab === 'oee' && (
            <MachineOeeView
              machine={machine}
              factory={factory}
              machineKey={machineKey}
              selectedDate={selectedDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
