import api from '../../../shared/lib/axios';
import type { Job, AbnormalityLog, ActiveAbnormality, ActiveNg } from '../context/ProductionTypes';

export class ProductionApiClient {
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

export const productionApiClient = new ProductionApiClient();
