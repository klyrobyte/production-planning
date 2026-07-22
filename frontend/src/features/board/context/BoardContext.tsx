import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useProduction, getTodayDateString } from '../../production/context/ProductionContext';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { boardService } from './BoardService';
import type { SelectedMachineType, BoardFactoryRowType } from './BoardTypes';

interface BoardContextType {
  // Global Computed Data
  factoryRows: BoardFactoryRowType[];
  maxCols: number;
  
  // Time State
  timeStr: string;
  dateStr: string;
  todayStr: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Machine Selection State
  selectedMachine: SelectedMachineType | null;
  setSelectedMachine: (m: SelectedMachineType | null) => void;
  
  // Action Helpers
  handleNavigateMachine: (direction: 'next' | 'prev') => void;
  activePortal: string;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const { dynamicResinData, allMachinesList, selectedDate, setSelectedDate } = useProduction();
  const activePortal = useAuthStore(state => state.activePortal);

  // State
  const [selectedMachine, setSelectedMachine] = useState<SelectedMachineType | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // Clock interval
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Computed Values
  const todayStr = getTodayDateString();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Use Service for business logic computations
  const factoryRows = useMemo(() => boardService.mapFactoryRows(dynamicResinData), [dynamicResinData]);
  const maxCols = useMemo(() => boardService.calculateMaxCols(factoryRows), [factoryRows]);

  const handleNavigateMachine = (direction: 'next' | 'prev') => {
    if (!selectedMachine) return;
    const nextMachine = boardService.calculateNextMachine(selectedMachine, direction, allMachinesList);
    if (nextMachine) {
      setSelectedMachine(nextMachine);
    }
  };

  return (
    <BoardContext.Provider
      value={{
        factoryRows,
        maxCols,
        timeStr,
        dateStr,
        todayStr,
        selectedDate,
        setSelectedDate,
        selectedMachine,
        setSelectedMachine,
        handleNavigateMachine,
        activePortal
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
}
