import type { Job } from '../context/ProductionTypes';
import { productionTimelineCalculator } from './ProductionTimelineCalculator';

export class ProductionHeijunkaGenerator {
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
   * Builds Leveled Heijunka jobs for a machine based on daily requirement and Shikake counts
   */
  getHeijunkaJobsForMachine(
    machineId: string,
    dateStr: string,
    parts: any[],
    machinesMatchFn: (a: string, b: string) => boolean
  ): Job[] {
    if (!parts || !Array.isArray(parts) || parts.length === 0) return [];
    const machineParts = parts.filter((p) => p.home_line && machinesMatchFn(p.home_line, machineId));
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

    return productionTimelineCalculator.recalculateTimeline(sortedJobs);
  }
}

export const productionHeijunkaGenerator = new ProductionHeijunkaGenerator();
