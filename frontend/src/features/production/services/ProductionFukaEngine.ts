import type {
  Job,
  ActiveAbnormality,
  ActiveNg,
  ResinPlantGroup,
  PaintingPlantGroup,
} from '../context/ProductionTypes';

export const resinPlantLayout = [
  {
    plant: 'SC1 (Cibitung)',
    factories: [
      { name: 'FACT 2', code: 'F2' },
      { name: 'FACT 3', code: 'F3' },
      { name: 'FACT 4', code: 'F4' },
    ],
  },
  {
    plant: 'SC2 (Karawang)',
    factories: [{ name: 'SC2 Resin', code: 'SC2' }],
  },
];

export const paintingData: PaintingPlantGroup[] = [
  {
    plant: 'SC1 (Cibitung)',
    lines: [
      { name: 'MBF4 (Main Booth)', fuka: 20.1, maxFuka: 21, status: 'Over', note: 'Strengthen BCP (Stock & Backup)' },
      { name: 'SBF3 (Small Booth)', fuka: 17.2, maxFuka: 21, status: 'Normal', note: "T/T Keep: Booth #1 4.0'" },
    ],
  },
  {
    plant: 'SC2 (Karawang)',
    lines: [
      { name: 'Line 1', fuka: 16.7, maxFuka: 21, status: 'Normal', note: "T/T Keep: 1.6'" },
      { name: 'Line 2', fuka: 13.6, maxFuka: 21, status: 'Normal', note: 'Backup for SC1 MBF4' },
    ],
  },
];

export class ProductionFukaEngine {
  /**
   * Status color mapping for progress bars
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Over':
        return 'bg-rose-500';
      case 'Warning':
        return 'bg-amber-500';
      case 'Normal':
        return 'bg-emerald-500';
      default:
        return 'bg-emerald-500';
    }
  }

  /**
   * Status text badge styling classes
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'Over':
        return 'text-rose-700 bg-rose-100 dark:text-rose-350 dark:bg-rose-950/40';
      case 'Warning':
        return 'text-amber-700 bg-amber-100 dark:text-amber-350 dark:bg-amber-950/40';
      case 'Normal':
        return 'text-emerald-700 bg-emerald-100 dark:text-emerald-350 dark:bg-emerald-950/40';
      default:
        return 'text-emerald-700 bg-emerald-100 dark:text-emerald-350 dark:bg-emerald-950/40';
    }
  }

  /**
   * Normalizes machine codes for identification matching
   */
  normalizeLineName(line: string): string {
    if (!line) return '';
    return line
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/#/g, '')
      .replace(/MC/g, '')
      .replace(/-?\d+T$/g, '');
  }

  /**
   * Parses machine identifier details to separate factory and code
   */
  parseMachineIdentifier(str: string) {
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

    const remaining = upper
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
  }

  /**
   * Compares two machine codes to determine if they match the same machine
   */
  machinesMatch(nameA: string, nameB: string): boolean {
    const pA = this.parseMachineIdentifier(nameA);
    const pB = this.parseMachineIdentifier(nameB);
    if (pA.factory === 'UNKNOWN' || pB.factory === 'UNKNOWN') {
      const normA = this.normalizeLineName(nameA);
      const normB = this.normalizeLineName(nameB);
      return normA.includes(normB) || normB.includes(normA);
    }
    return pA.factory === pB.factory && pA.machine === pB.machine;
  }

  /**
   * Resolves unique machine key based on factory and machine code
   */
  getUniqueMachineKey(factory: string, machine: string): string {
    const cleanFact = factory.trim().toUpperCase();
    const cleanMc = machine.trim();

    if (cleanFact.includes('SC2')) return `SC2 ${cleanMc}`;
    if (cleanFact.includes('2') || cleanFact.includes('F2')) return `F2 ${cleanMc}`;
    if (cleanFact.includes('3') || cleanFact.includes('F3')) return `F3 ${cleanMc}`;
    if (cleanFact.includes('4') || cleanFact.includes('F4')) return `F4 ${cleanMc}`;

    return `${factory} ${cleanMc}`;
  }

  /**
   * Calculates plant-level and machine-level FUKA dynamically based on active telemetry & jobs
   */
  calculateDynamicResinData(
    machinesData: any[],
    partsData: any[],
    machineJobs: Record<string, Job[]>,
    selectedDate: string,
    activeAbnormalities: Record<string, ActiveAbnormality>,
    activeNgs: Record<string, ActiveNg>,
    getHeijunkaJobsFn: (mc: string, dt: string, pts: any[]) => Job[]
  ): ResinPlantGroup[] {
    return resinPlantLayout.map((plantGroup) => {
      const updatedFactories = plantGroup.factories.map((fact) => {
        let totalLoadMins = 0;

        const factoryMachines = (machinesData || [])
          .filter((m) => {
            const code = m.factory_code;
            const mType = (m.type || 'injection').toLowerCase();
            const matchesFactory =
              (fact.code === 'F2' && code === 'F2') ||
              (fact.code === 'F3' && code === 'F3') ||
              (fact.code === 'F4' && code === 'F4') ||
              (fact.code === 'SC2' && code === 'SC2');
            const matchesType = mType === 'injection' || mType === 'resin';
            return matchesFactory && matchesType;
          })
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        const machineCount = factoryMachines.length;

        const mappedMachines = factoryMachines.map((mc) => {
          const machineKey = mc.code;
          const planKey = `${selectedDate}_${machineKey}`;

          const jobs = machineJobs[planKey] || getHeijunkaJobsFn(machineKey, selectedDate, partsData);
          const machineMins = jobs.reduce((sum, job) => sum + (job.time || 0) + (job.dandori || 0), 0);
          totalLoadMins += machineMins;

          const currentHour = new Date().getHours();
          const currentMinute = new Date().getMinutes();
          const currentMins = currentHour * 60 + currentMinute;
          const isNightShiftTime = currentMins < 435 || currentMins >= 1260;
          const currentShift = isNightShiftTime ? 'night' : 'day';

          const shiftJobs = jobs.filter((j) => j.shift === currentShift || (currentShift === 'night' && j.shift === 'overflow'));
          const hasShiftJobs = shiftJobs.length > 0;

          const activeJob = (() => {
            if (!hasShiftJobs) return undefined;
            const running = shiftJobs.find((j) => j.status === 'running');
            if (running) return running;
            const dandori = shiftJobs.find((j) => j.status === 'dandori');
            if (dandori) return dandori;
            return shiftJobs.find((j) => j.status !== 'completed');
          })();

          const activeAbnormal = activeAbnormalities[planKey];
          const isAbnormal = activeAbnormal ? activeAbnormal.isAbnormal : false;

          const activeNgState = activeNgs[planKey];
          const isNgActive = !isAbnormal && (activeNgState ? activeNgState.isNg : false);

          const isDandori = !isAbnormal && !isNgActive && (activeJob ? activeJob.status === 'dandori' : false);
          const isRunning = !isAbnormal && !isNgActive && !isDandori && activeJob !== undefined;
          const isIdle = !isAbnormal && !isNgActive && !isDandori && activeJob === undefined;

          const isAbnormalLong =
            isAbnormal &&
            (() => {
              if (!activeAbnormal || !activeAbnormal.start) return false;
              try {
                const now = new Date();
                const [h, m] = activeAbnormal.start.split(':').map(Number);
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
                if (start.getTime() > now.getTime()) {
                  start.setDate(start.getDate() - 1);
                }
                const diffHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
                return diffHours > 1;
              } catch (e) {
                return false;
              }
            })();

          return {
            id: mc.name,
            code: mc.code,
            tonnage: mc.tonnage || '2500',
            isAbnormal,
            isAbnormalLong,
            isNgActive,
            isDandori,
            isRunning,
            isIdle,
            activeJob,
          };
        });

        const fukaLoadHours = machineCount > 0 ? totalLoadMins / 60 / machineCount : 0;

        let status: 'Normal' | 'Warning' | 'Over' = 'Normal';
        if (fukaLoadHours >= 20.0) {
          status = 'Over';
        } else if (fukaLoadHours >= 18.0) {
          status = 'Warning';
        }

        return {
          name: fact.name,
          machines: mappedMachines,
          fuka: fukaLoadHours,
          maxFuka: 21,
          status,
        };
      });

      return {
        plant: plantGroup.plant,
        factories: updatedFactories,
      };
    });
  }

  /**
   * Flattens all machine items to enable sequential navigation
   */
  flattenMachinesList(dynamicResinData: ResinPlantGroup[]) {
    const list: Array<{ id: string; code: string; tonnage: string; factory: string }> = [];
    dynamicResinData.forEach((plant) => {
      plant.factories.forEach((fact) => {
        fact.machines.forEach((mc) => {
          list.push({ id: mc.id, code: mc.code, tonnage: mc.tonnage, factory: fact.name });
        });
      });
    });
    return list;
  }
}

export const productionFukaEngine = new ProductionFukaEngine();
