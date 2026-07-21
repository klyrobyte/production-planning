import api from '../../../shared/lib/axios';
import type {
  Job,
  AbnormalityLog,
  ActiveAbnormality,
  ActiveNg,
  ResinPlantGroup,
  PaintingPlantGroup,
} from './ProductionTypes';

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

export class ProductionService {
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
   * Calculates working hours blocks based on Sugity shift patterns
   */
  getWorkingBlocks(): [number, number][] {
    const blocks: [number, number][] = [];
    blocks.push([435, 570]);
    blocks.push([580, 715]);
    blocks.push([755, 965]);
    blocks.push([980, 1140]);
    blocks.push([1260, 1440]);
    blocks.push([0, 60]);
    blocks.push([100, 280]);
    blocks.push([295, 435]);
    blocks.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const block of blocks) {
      if (merged.length === 0) {
        merged.push([...block]);
      } else {
        const last = merged[merged.length - 1];
        if (block[0] <= last[1]) {
          last[1] = Math.max(last[1], block[1]);
        } else {
          merged.push([...block]);
        }
      }
    }
    return merged;
  }

  /**
   * Adds working minutes to a Date object while skipping off hours and breaks
   */
  addWorkingMinutes(current: Date, minutesToAdd: number): Date {
    const result = new Date(current);
    let remaining = minutesToAdd;
    let iterations = 0;
    while (remaining > 0 && iterations < 100) {
      iterations++;
      const blocks = this.getWorkingBlocks();
      const timeInMins = result.getHours() * 60 + result.getMinutes() + result.getSeconds() / 60;
      let foundBlock = false;
      for (const block of blocks) {
        if (timeInMins >= block[0] && timeInMins < block[1]) {
          const available = block[1] - timeInMins;
          if (remaining <= available) {
            result.setMinutes(result.getMinutes() + remaining);
            remaining = 0;
            foundBlock = true;
            break;
          } else {
            remaining -= available;
            result.setHours(Math.floor(block[1] / 60), block[1] % 60, 0, 0);
            foundBlock = true;
            break;
          }
        } else if (timeInMins < block[0]) {
          result.setHours(Math.floor(block[0] / 60), block[0] % 60, 0, 0);
          foundBlock = true;
          break;
        }
      }
      if (!foundBlock) {
        result.setDate(result.getDate() + 1);
        result.setHours(0, 0, 0, 0);
      }
    }
    return result;
  }

  /**
   * Recalculates the timing fields of the scheduled jobs timeline
   */
  recalculateTimeline(items: Job[]): Job[] {
    const firstDayIdx = items.findIndex((item) => item.shift === 'day');
    const firstNightIdx = items.findIndex((item) => item.shift === 'night');
    const dayStart = new Date();
    dayStart.setHours(7, 15, 0, 0);
    const nightPrepStart = new Date(dayStart);
    nightPrepStart.setHours(21, 0, 0, 0);
    let lastDayEndTime = new Date(dayStart);
    lastDayEndTime.setMinutes(lastDayEndTime.getMinutes() + 15);
    let lastNightEndTime = new Date(nightPrepStart);
    lastNightEndTime.setMinutes(lastNightEndTime.getMinutes() + 10);
    let isFirstNight = true;

    return items.map((item, index) => {
      const jobShift = item.shift || 'day';
      let jobStartClock = new Date();
      if (jobShift === 'day') {
        jobStartClock = new Date(lastDayEndTime);
      } else if (jobShift === 'night') {
        if (isFirstNight) {
          let nightStart = new Date(nightPrepStart);
          if (lastDayEndTime.getTime() > nightStart.getTime()) {
            nightStart = new Date(lastDayEndTime);
          }
          jobStartClock = new Date(nightStart);
          jobStartClock.setMinutes(jobStartClock.getMinutes() + 10);
          isFirstNight = false;
        } else {
          jobStartClock = new Date(lastNightEndTime);
        }
      } else {
        jobStartClock = new Date(lastNightEndTime);
      }

      const startStr = jobStartClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const startTimeStamp = jobStartClock.getTime();
      const endJobClock = this.addWorkingMinutes(jobStartClock, item.time);
      const endStr = endJobClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const endTimeStamp = endJobClock.getTime();
      const actualDandori = item.dandori !== undefined ? item.dandori : 15;
      let dandoriRangeStr = '';
      let runningClock = new Date(endJobClock);

      if (actualDandori > 0 && jobShift !== 'overflow') {
        const dandoriStartClock = new Date(endJobClock);
        const dandoriEndClock = this.addWorkingMinutes(dandoriStartClock, actualDandori);
        const dandoriEndStr = dandoriEndClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        dandoriRangeStr = `${endStr} - ${dandoriEndStr}`;
        runningClock = dandoriEndClock;
      }

      if (jobShift === 'day') {
        lastDayEndTime = new Date(runningClock);
      } else {
        lastNightEndTime = new Date(runningClock);
      }

      const elapsedMins = Math.round((endTimeStamp - startTimeStamp) / 60000);
      const spansOffHours = elapsedMins > item.time;
      let status = item.status;

      if (status !== 'completed' && status !== 'running') {
        const dayJobs = items.filter((j) => j.shift === 'day');
        const isDayShiftClosedOrDone =
          dayJobs.length === 0 ||
          dayJobs.every((j) => j.status === 'completed' && (!j.needsFinalDandori || j.finalDandoriCompleted));

        if (index === firstDayIdx) {
          status = 'dandori';
        } else if (index === firstNightIdx) {
          status = isDayShiftClosedOrDone ? 'dandori' : 'queued';
        } else if (index > 0 && items[index - 1].status === 'completed') {
          const prevJob = items[index - 1];
          if (prevJob.shift === item.shift) {
            status = 'dandori';
          } else {
            status = isDayShiftClosedOrDone ? 'dandori' : 'queued';
          }
        } else {
          status = 'queued';
        }
      }

      let actualDandoriStart = item.actualDandoriStart;
      let actualDandoriEnd = item.actualDandoriEnd;
      let actualProductionStart = item.actualProductionStart;
      let actualProductionEnd = item.actualProductionEnd;

      if (status === 'queued') {
        actualDandoriStart = undefined;
        actualDandoriEnd = undefined;
        actualProductionStart = undefined;
        actualProductionEnd = undefined;
      } else if (status === 'dandori' && !actualDandoriStart) {
        actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
      }

      if (status === 'running') {
        if (!actualDandoriStart) {
          actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
        }
        if (!actualDandoriEnd) {
          actualDandoriEnd = actualProductionStart || (jobShift === 'night' ? '21:10' : '07:30');
        }
        if (!actualProductionStart) {
          actualProductionStart = actualDandoriEnd;
        }
      }

      if (status === 'completed') {
        const isSkipped =
          (item.actualQty === undefined || item.actualQty === 0) &&
          !item.actualProductionStart &&
          !item.actualDandoriStart;
        if (!isSkipped) {
          if (!actualDandoriStart) {
            actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
          }
          if (!actualDandoriEnd) {
            actualDandoriEnd = jobShift === 'night' ? '21:10' : '07:30';
          }
          if (!actualProductionStart) {
            actualProductionStart = actualDandoriEnd;
          }
          if (!actualProductionEnd) {
            const [shStr, smStr] = actualProductionStart.split(':');
            const sh = parseInt(shStr, 10);
            const sm = parseInt(smStr, 10);
            const startClock = new Date();
            startClock.setHours(sh, sm, 0, 0);
            const endClock = new Date(startClock.getTime() + item.time * 60000);
            actualProductionEnd = endClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          }
        } else {
          actualDandoriStart = undefined;
          actualDandoriEnd = undefined;
          actualProductionStart = undefined;
          actualProductionEnd = undefined;
        }
      }

      return {
        ...item,
        seq: index + 1,
        timeRange: `${startStr} - ${endStr}`,
        dandoriTimeRange: dandoriRangeStr,
        shift: jobShift,
        dandori: actualDandori,
        status,
        spansOffHours,
        actualDandoriStart,
        actualDandoriEnd,
        actualProductionStart,
        actualProductionEnd,
      };
    });
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
   * Obtains calendar month boundaries for forecast mappings
   */
  getForecastMonthKeys() {
    const now = new Date();
    const currentMonthIdx = now.getMonth();
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
  }

  /**
   * Builds Leveled Heijunka jobs for a machine based on daily requirement and Shikake counts
   */
  getHeijunkaJobsForMachine(machineId: string, dateStr: string, parts: any[]): Job[] {
    if (!parts || !Array.isArray(parts) || parts.length === 0) return [];
    const machineParts = parts.filter((p) => p.home_line && this.machinesMatch(p.home_line, machineId));
    if (machineParts.length === 0) return [];

    const targetMonthKey = dateStr.substring(0, 7);
    const monthKeys = this.getForecastMonthKeys();
    const activeJobs: Job[] = [];

    const partRuns: Job[][] = machineParts
      .map((part, pIdx) => {
        const dbForecasts = part.monthly_forecasts || {};
        const monthForecast = dbForecasts[targetMonthKey];
        let qtyDay = 0;
        if (monthForecast && monthForecast.daily !== undefined) {
          qtyDay = Number(monthForecast.daily);
        } else {
          if (targetMonthKey === monthKeys.monthN) {
            qtyDay = part.daily_requirement_n !== undefined ? Number(part.daily_requirement_n) : 0;
          } else if (targetMonthKey === monthKeys.monthN1) {
            qtyDay = part.daily_requirement_n1 !== undefined ? Number(part.daily_requirement_n1) : 0;
          } else if (targetMonthKey === monthKeys.monthN2) {
            qtyDay = part.daily_requirement_n2 !== undefined ? Number(part.daily_requirement_n2) : 0;
          } else if (targetMonthKey === monthKeys.monthN3) {
            qtyDay = part.daily_requirement_n3 !== undefined ? Number(part.daily_requirement_n3) : 0;
          } else {
            qtyDay = part.daily_requirement_n !== undefined ? Number(part.daily_requirement_n) : 0;
          }
        }
        if (qtyDay <= 0) return [];

        const runs = part.shikake || 2;
        const kanban = part.spec && Number(part.spec) > 0 ? Number(part.spec) : 0;
        const rawQtyLot = qtyDay / runs;
        const qtyLot = kanban > 0 ? Math.ceil(rawQtyLot / kanban) * kanban : Math.round(rawQtyLot) || 200;
        const cavity = part.cavity || 1;
        const ct = part.cycle_time || 60;
        const runtimeMins = Math.round(((qtyLot / cavity) * ct) / 60);
        const jobsList: Job[] = [];

        for (let r = 0; r < runs; r++) {
          jobsList.push({
            id: `job-init-${machineId}-${part.part_number || part.sebango || pIdx}-${r}-${dateStr}`,
            seq: 0,
            customer: part.customer || 'Unknown',
            model: part.part_number || part.sebango || '',
            partName: part.part_name || 'No Name',
            qtyDay,
            qtyLot,
            actualQty: 0,
            mold: part.mold || 'MOLD-01',
            material: part.material || 'PP RESIN',
            kav: cavity,
            ct,
            spec: kanban > 0 ? kanban : undefined,
            dandori: 15,
            time: runtimeMins,
            status: 'queued',
            timeRange: '',
            shift: r === 0 ? 'day' : 'night',
          });
        }
        return jobsList;
      })
      .filter((runs) => runs.length > 0);

    let hasMore = true;
    let iteration = 0;
    while (hasMore) {
      hasMore = false;
      for (let pIdx = 0; pIdx < partRuns.length; pIdx++) {
        if (iteration < partRuns[pIdx].length) {
          activeJobs.push(partRuns[pIdx][iteration]);
          hasMore = true;
        }
      }
      iteration++;
    }

    const sortedJobs: Job[] = [
      ...activeJobs.filter((j) => j.shift === 'day'),
      ...activeJobs.filter((j) => j.shift === 'night'),
      ...activeJobs.filter((j) => j.shift === 'overflow'),
    ];

    if (sortedJobs.length > 0) {
      sortedJobs.forEach((job, idx) => {
        job.seq = idx + 1;
        job.dandori = job.dandori !== undefined ? job.dandori : 15;
      });
    }

    return this.recalculateTimeline(sortedJobs);
  }

  /**
   * Resolves current production date according to 07:15 shift boundary
   */
  getTodayDateString(): string {
    const d = new Date();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const currentMins = hours * 60 + minutes;
    if (currentMins < 435) {
      d.setDate(d.getDate() - 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
    activeNgs: Record<string, ActiveNg>
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

          const jobs = machineJobs[planKey] || this.getHeijunkaJobsForMachine(machineKey, selectedDate, partsData);
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

  /**
   * Saves production plan record to database via API
   */
  async savePlanToDatabase(
    id: string,
    planType: 'daily' | 'avg',
    machineId: string,
    dateKey: string,
    jobs: Job[],
    dayOT = 'teiji',
    nightOT = 'teiji',
    logsArray: AbnormalityLog[] = [],
    isAbnormal?: boolean,
    abnormalType?: string,
    abnormalStart?: string,
    isNg?: boolean,
    ngType?: string,
    ngStart?: string,
    activeAbnormalities: Record<string, ActiveAbnormality> = {},
    activeNgs: Record<string, ActiveNg> = {}
  ): Promise<void> {
    try {
      const currentAbnormal = activeAbnormalities[id] || { isAbnormal: false, type: '', start: '' };
      const currentNg = activeNgs[id] || { isNg: false, type: '', start: '' };
      const payload = {
        id,
        plan_type: planType,
        machine_id: machineId,
        date_key: dateKey,
        jobs,
        day_ot: dayOT,
        night_ot: nightOT,
        logs: logsArray,
        is_abnormal: isAbnormal !== undefined ? isAbnormal : currentAbnormal.isAbnormal,
        abnormal_type: abnormalType !== undefined ? abnormalType : currentAbnormal.type,
        abnormal_start: abnormalStart !== undefined ? abnormalStart : currentAbnormal.start,
        is_ng: isNg !== undefined ? isNg : currentNg.isNg,
        ng_type: ngType !== undefined ? ngType : currentNg.type,
        ng_start: ngStart !== undefined ? ngStart : currentNg.start,
      };
      await api.post('/production-plans', payload);
    } catch (e) {
      console.error(`Error saving plan ${id} to database:`, e);
    }
  }

  /**
   * Fetches all production plans from API
   */
  async fetchPlansFromApi(): Promise<any[]> {
    const response = await api.get('/production-plans');
    if (response.data?.status === 'ok') {
      return response.data.data || [];
    }
    return [];
  }
}

export const productionService = new ProductionService();
