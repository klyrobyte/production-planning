import type { MappedMachineStatus } from '../../production/context/ProductionTypes';
import type { MachineStatus, BoardFactoryRowType, SelectedMachineType } from './BoardTypes';

export class BoardService {
  resolveStatus(mc: MappedMachineStatus): MachineStatus {
    if (mc.isAbnormalLong) return 'abnormal-critical';
    if (mc.isAbnormal) return 'abnormal';
    if (mc.isNgActive) return 'ng';
    if (mc.isDandori) return 'dandori';
    if (mc.isRunning) return 'running';
    return 'idle';
  }

  mapFactoryRows(dynamicResinData: any[]): BoardFactoryRowType[] {
    if (!dynamicResinData) return [];
    return dynamicResinData.flatMap(plant =>
      plant.factories.map((fact: any) => ({
        plant: plant.plant,
        name: fact.name,
        machines: fact.machines
      }))
    );
  }

  calculateMaxCols(factoryRows: BoardFactoryRowType[]): number {
    return Math.max(...factoryRows.map(f => f.machines.length), 1);
  }

  calculateNextMachine(
    currentMachine: SelectedMachineType, 
    direction: 'next' | 'prev', 
    allMachinesList: { id: string; code: string; tonnage: string; factory: string }[]
  ): SelectedMachineType | null {
    const currentIndex = allMachinesList.findIndex(
      m => m.id === currentMachine.machine && m.factory === currentMachine.factory
    );
    
    if (currentIndex === -1) return null;
    
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % allMachinesList.length
      : (currentIndex - 1 + allMachinesList.length) % allMachinesList.length;
      
    const target = allMachinesList[newIndex];
    
    return {
      machine: target.id,
      tonnage: target.tonnage,
      factory: target.factory
    };
  }
}

export const boardService = new BoardService();
