import { useState, useEffect } from 'react';
import { getUniqueMachineKey, useProduction } from '../../../production/context/ProductionContext';
import { BoardMachineModalHeader } from './BoardMachineModalHeader';
import { MachinePatternView } from '../../../production/components/pattern/MachinePatternView';
import { MachinePartListView } from '../../../production/components/part-list/MachinePartListView';
import { MachineOeeView } from '../../../production/components/oee/MachineOeeView';
import { BoardMachineExecutionView } from '../execution/BoardMachineExecutionView';

interface BoardMachineDetailModalProps {
  machine: string;
  machineKey?: string;
  tonnage: string;
  factory: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onClose: () => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  initialDate: string;
}

export function BoardMachineDetailModal({
  machine,
  machineKey: propsMachineKey,
  tonnage,
  factory,
  activeTab: propsActiveTab,
  onTabChange: propsOnTabChange,
  onClose,
  onNavigate,
  initialDate,
}: BoardMachineDetailModalProps) {
  const [internalTab, setInternalTab] = useState(propsActiveTab || 'pattern');
  const activeTab = propsActiveTab || internalTab;
  const handleTabChange = propsOnTabChange || setInternalTab;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const machineKey = propsMachineKey || (machine.includes(' ') && machine.length > 5 ? machine : getUniqueMachineKey(factory, machine));
  
  const { partsData, initializeMachineIfEmpty } = useProduction();

  // Sync selectedDate when initialDate or machine changes
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate, machine]);

  // Initialize Heijunka jobs if not present in the DB
  useEffect(() => {
    if (partsData.length > 0 && selectedDate) {
      initializeMachineIfEmpty(machineKey, selectedDate, partsData);
    }
  }, [machineKey, selectedDate, partsData, initializeMachineIfEmpty]);

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
        <BoardMachineModalHeader
          machine={machine}
          tonnage={tonnage}
          factory={factory}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onClose={onClose}
          onNavigate={onNavigate}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'execution' && (
            <BoardMachineExecutionView
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
