import type { MappedMachineStatus } from '../../production/context/ProductionTypes';

export type MachineStatus = 'running' | 'dandori' | 'ng' | 'abnormal' | 'abnormal-critical' | 'idle';

export interface SelectedMachineType {
  machine: string;
  tonnage: string;
  factory: string;
}

export interface BoardFactoryRowType {
  plant: string;
  name: string;
  machines: MappedMachineStatus[];
}

// Component Props Interfaces
export interface BoardHeaderProps {
  timeStr: string;
  dateStr: string;
  userRole?: string;
  onLogout: () => void;
  onBack: () => void;
}

export interface BoardMachineCardProps {
  machine: MappedMachineStatus;
  factoryName: string;
  status: MachineStatus;
  onMachineClick: (machineId: string, tonnage: string, factoryName: string) => void;
}

export interface BoardFactoryRowProps {
  factoryRow: BoardFactoryRowType;
  maxCols: number;
  onMachineClick: (machineId: string, tonnage: string, factoryName: string) => void;
  resolveStatus: (mc: MappedMachineStatus) => MachineStatus;
}
