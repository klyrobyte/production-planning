import api from '../../../shared/lib/axios';
import type {
  PartForecast,
  MachineItem,
  HistoryRecord,
  ColumnFilters,
  ForecastMonthNames,
  ForecastMonthKeys,
  FukaFilterType,
} from './OrdersTypes';

export class OrdersService {
  // ── MONTH & DATE HELPERS ──

  getForecastMonthNames(): ForecastMonthNames {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    const getMonthAndYear = (offset: number) => {
      const targetMonthIdx = (currentMonthIdx + offset) % 12;
      const targetYear = currentYear + Math.floor((currentMonthIdx + offset) / 12);
      return `${months[targetMonthIdx]} ${targetYear}`;
    };

    return {
      monthN: getMonthAndYear(0),
      monthN1: getMonthAndYear(1),
      monthN2: getMonthAndYear(2),
      monthN3: getMonthAndYear(3),
    };
  }

  getShortMonthName(longMonthName: string): string {
    const parts = longMonthName.split(' ');
    if (parts.length === 2) {
      const month = parts[0];
      const year = parts[1];
      return `${month.substring(0, 3)} ${year}`;
    }
    return longMonthName;
  }

  getForecastMonthKeys(): ForecastMonthKeys {
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

  // ── MACHINE & LINE NORMALIZATION ──

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

  parseMachineIdentifier(str: string): { factory: string; machine: string } {
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

    let remaining = upper
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

  resolveMachineKey(homeLine: string, activeMachines: MachineItem[]): string {
    if (!homeLine) return 'Unassigned Machine';
    const matched = activeMachines.find((m) => {
      const standardName = `${m.factory_code || ''} ${m.name}`.trim();
      return this.machinesMatch(homeLine, m.code) || this.machinesMatch(homeLine, standardName);
    });
    return matched ? matched.code : homeLine;
  }

  getFactoryFromHomeLine(homeLine: string, activeMachines: MachineItem[]): string {
    if (!homeLine) return 'Unknown';
    const matched = activeMachines.find((m) => {
      const standardName = `${m.factory_code || ''} ${m.name}`.trim();
      return this.machinesMatch(homeLine, m.code) || this.machinesMatch(homeLine, standardName);
    });
    if (matched && matched.factory_name) return matched.factory_name;

    const clean = homeLine.toUpperCase().trim();
    if (clean.startsWith('F2')) return 'Factory 2';
    if (clean.startsWith('F3')) return 'Factory 3';
    if (clean.startsWith('F4')) return 'Factory 4';
    if (clean.startsWith('SC2')) return 'SC2 Resin';
    return 'Unknown';
  }

  // ── CSV & PASTE PARSER ──

  parseForecastCSVContent(content: string, allParts: any[], conversions: any[], machines: MachineItem[]): PartForecast[] {
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    const separator = lines[0].includes('\t') ? '\t' : ',';
    const row1Cols = lines[0].split(separator).map((c) => c.trim().toUpperCase());
    const row2Cols = lines.length > 1 ? lines[1].split(separator).map((c) => c.trim().toUpperCase()) : [];

    const headers = row1Cols.map((col, idx) => (row2Cols[idx] || col || '').trim());
    if (row2Cols.length > row1Cols.length) {
      for (let i = row1Cols.length; i < row2Cols.length; i++) {
        headers.push(row2Cols[i] || '');
      }
    }

    const shortMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    let sebIndex = headers.findIndex((h) => h.includes('SEBANGO') || h.includes('CODE') || h.includes('PART'));
    if (sebIndex === -1) sebIndex = 0;

    let aliasIndex = headers.findIndex((h) => h.includes('ALIAS'));

    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const abbrN = monthsShort[currentMonthIdx];
    const abbrN1 = monthsShort[(currentMonthIdx + 1) % 12];
    const abbrN2 = monthsShort[(currentMonthIdx + 2) % 12];
    const abbrN3 = monthsShort[(currentMonthIdx + 3) % 12];

    let nIndex = headers.findIndex((h) => h === abbrN || h === 'N');
    let n1Index = headers.findIndex((h) => h === abbrN1 || h === 'N+1' || h === 'N_1');
    let n2Index = headers.findIndex((h) => h === abbrN2 || h === 'N+2' || h === 'N_2');
    let n3Index = headers.findIndex((h) => h === abbrN3 || h === 'N+3' || h === 'N_3');

    const fallbackMonthIndices: number[] = [];
    headers.forEach((h, idx) => {
      if (shortMonths.includes(h) || h === 'N' || h === 'N+1' || h === 'N+2' || h === 'N+3' || h.includes('MONTH')) {
        fallbackMonthIndices.push(idx);
      }
    });

    if (nIndex === -1) nIndex = fallbackMonthIndices[0] !== undefined ? fallbackMonthIndices[0] : 1;
    if (n1Index === -1) n1Index = fallbackMonthIndices[1] !== undefined ? fallbackMonthIndices[1] : 2;
    if (n2Index === -1) n2Index = fallbackMonthIndices[2] !== undefined ? fallbackMonthIndices[2] : 3;
    if (n3Index === -1) n3Index = fallbackMonthIndices[3] !== undefined ? fallbackMonthIndices[3] : 4;

    let dataStartRow = 1;
    if (lines.length > 1) {
      const secondLineCols = lines[1].split(separator).map((c) => c.trim().toUpperCase());
      const hasMonthAbbr = secondLineCols.some((c) => shortMonths.includes(c));
      const firstColEmpty = secondLineCols[0] === '';
      if (hasMonthAbbr || firstColEmpty) {
        dataStartRow = 2;
      }
    }

    const results: PartForecast[] = [];
    const workingDays = 20;

    for (let i = dataStartRow; i < lines.length; i++) {
      const cols = lines[i].split(separator).map((c) => c.trim());
      if (cols.length <= sebIndex) continue;

      const rawSebango = cols[sebIndex] || '';
      const aliasVal = aliasIndex !== -1 && cols[aliasIndex] ? cols[aliasIndex] : '';

      if (!rawSebango && !aliasVal) continue;

      const cleanSeb = rawSebango.trim().toUpperCase();
      const cleanAlias = aliasVal.trim().toUpperCase();

      let matchedConversion = null;
      if (cleanAlias) {
        matchedConversion = conversions.find(
          (c) =>
            (c.cust_sebango && c.cust_sebango.trim().toUpperCase() === cleanAlias) ||
            (c.cust_part_number && c.cust_part_number.trim().toUpperCase() === cleanAlias) ||
            (c.prod_sebango && c.prod_sebango.trim().toUpperCase() === cleanAlias)
        );
      }
      if (!matchedConversion && cleanSeb) {
        matchedConversion = conversions.find(
          (c) =>
            (c.cust_sebango && c.cust_sebango.trim().toUpperCase() === cleanSeb) ||
            (c.cust_part_number && c.cust_part_number.trim().toUpperCase() === cleanSeb) ||
            (c.prod_sebango && c.prod_sebango.trim().toUpperCase() === cleanSeb)
        );
      }

      let matchedPart = null;
      if (matchedConversion) {
        const targetProdSebango = matchedConversion.prod_sebango.trim().toUpperCase();
        matchedPart = allParts.find(
          (p) =>
            (p.sebango && p.sebango.trim().toUpperCase() === targetProdSebango) ||
            (p.part_number && p.part_number.trim().toUpperCase() === targetProdSebango)
        );
      }

      if (!matchedPart) {
        if (cleanAlias) {
          matchedPart = allParts.find(
            (p) =>
              (p.sebango && p.sebango.trim().toUpperCase() === cleanAlias) ||
              (p.part_number && p.part_number.trim().toUpperCase() === cleanAlias)
          );
        }
        if (!matchedPart && cleanSeb) {
          matchedPart = allParts.find(
            (p) =>
              (p.sebango && p.sebango.trim().toUpperCase() === cleanSeb) ||
              (p.part_number && p.part_number.trim().toUpperCase() === cleanSeb)
          );
        }
      }

      if (!matchedPart) continue;

      const dailyRequirementN = Math.round(
        parseFloat(nIndex !== -1 && cols[nIndex] ? cols[nIndex].replace(/[^0-9.-]/g, '') : '0') || 0
      );
      const dailyRequirementN1 = Math.round(
        parseFloat(n1Index !== -1 && cols[n1Index] ? cols[n1Index].replace(/[^0-9.-]/g, '') : '0') || 0
      );
      const dailyRequirementN2 = Math.round(
        parseFloat(n2Index !== -1 && cols[n2Index] ? cols[n2Index].replace(/[^0-9.-]/g, '') : '0') || 0
      );
      const dailyRequirementN3 = Math.round(
        parseFloat(n3Index !== -1 && cols[n3Index] ? cols[n3Index].replace(/[^0-9.-]/g, '') : '0') || 0
      );

      const monthN = dailyRequirementN * workingDays;
      const monthN1 = dailyRequirementN1 * workingDays;
      const monthN2 = dailyRequirementN2 * workingDays;
      const monthN3 = dailyRequirementN3 * workingDays;

      const resolvedMc = this.resolveMachineKey(matchedPart.home_line, machines);

      results.push({
        sebango: matchedPart.sebango || '',
        partNumber: matchedPart.part_number,
        partName: matchedPart.part_name || '',
        modelCode: matchedPart.model || '',
        machineId: resolvedMc,
        factory: this.getFactoryFromHomeLine(resolvedMc, machines),
        area: matchedPart.area || '',
        cycleTime: Number(matchedPart.cycle_time || 60),
        cavity: Number(matchedPart.cavity || 1),
        monthN,
        monthN1,
        monthN2,
        monthN3,
        dailyRequirementN,
        dailyRequirementN1,
        dailyRequirementN2,
        dailyRequirementN3,
      });
    }

    return results;
  }

  // ── FUKA WORKLOAD COMPUTATION ──

  calculateFukaWorkload(
    activeList: PartForecast[],
    machines: MachineItem[],
    fukaFilter: FukaFilterType
  ): Record<string, Array<{ machineId: string; hours: number }>> {
    if (activeList.length === 0 || machines.length === 0) return {};

    const map: Record<string, Record<string, { machineId: string; hours: number }>> = {};

    machines.forEach((m) => {
      const fName = m.factory_name || m.factory_code || 'Unknown';
      if (!map[fName]) {
        map[fName] = {};
      }
      map[fName][m.code] = { machineId: m.name || m.code, hours: 0 };
    });

    activeList.forEach((p) => {
      const resolvedMc = this.resolveMachineKey(p.machineId, machines);
      const factoryKey = this.getFactoryFromHomeLine(resolvedMc, machines);

      if (factoryKey === 'Unknown' || !map[factoryKey]) return;
      if (!map[factoryKey][resolvedMc]) {
        map[factoryKey][resolvedMc] = { machineId: resolvedMc, hours: 0 };
      }

      let reqDaily = 0;
      if (fukaFilter === 'monthN') reqDaily = p.dailyRequirementN;
      else if (fukaFilter === 'monthN1') reqDaily = p.dailyRequirementN1;
      else if (fukaFilter === 'monthN2') reqDaily = p.dailyRequirementN2;
      else if (fukaFilter === 'monthN3') reqDaily = p.dailyRequirementN3;

      const cavityVal = Number(p.cavity || 1);
      const cycleTimeVal = Number(p.cycleTime || 60);
      const loadHours = cavityVal > 0 ? ((reqDaily / cavityVal) * cycleTimeVal) / 3600 : 0;

      map[factoryKey][resolvedMc].hours += loadHours;
    });

    const result: Record<string, Array<{ machineId: string; hours: number }>> = {};
    Object.keys(map).forEach((factory) => {
      result[factory] = Object.values(map[factory])
        .map((d) => ({
          machineId: d.machineId,
          hours: Number(d.hours.toFixed(1)),
        }))
        .sort((a, b) => a.machineId.localeCompare(b.machineId));
    });

    return result;
  }

  // ── FILTER, SEARCH & SORT LOGIC ──

  filterAndSortForecasts(
    activeList: PartForecast[],
    searchQuery: string,
    columnFilters: ColumnFilters,
    sortField: string,
    sortDirection: 'asc' | 'desc'
  ): PartForecast[] {
    let list = [...activeList];

    // Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const sebango = (item.sebango || '').toLowerCase();
        const partNumber = (item.partNumber || '').toLowerCase();
        const partName = (item.partName || '').toLowerCase();
        const machine = (item.machineId || '').toLowerCase();
        return sebango.includes(q) || partNumber.includes(q) || partName.includes(q) || machine.includes(q);
      });
    }

    // Column Filters
    if (columnFilters.sebango.trim()) {
      const f = columnFilters.sebango.toLowerCase().trim();
      list = list.filter((item) => item.sebango.toLowerCase().includes(f));
    }
    if (columnFilters.partNumber.trim()) {
      const f = columnFilters.partNumber.toLowerCase().trim();
      list = list.filter(
        (item) => item.partNumber.toLowerCase().includes(f) || item.partName.toLowerCase().includes(f)
      );
    }
    if (columnFilters.modelCode.trim()) {
      const f = columnFilters.modelCode.toLowerCase().trim();
      list = list.filter((item) => item.modelCode.toLowerCase().includes(f));
    }
    if (columnFilters.machineId.trim()) {
      const f = columnFilters.machineId.toLowerCase().trim();
      list = list.filter((item) => item.machineId.toLowerCase().includes(f));
    }

    const filterVolume = (val: number, filterStr: string) => {
      const f = filterStr.trim();
      if (!f) return true;
      if (f.startsWith('>=')) {
        const num = parseFloat(f.slice(2));
        return isNaN(num) ? true : val >= num;
      }
      if (f.startsWith('>')) {
        const num = parseFloat(f.slice(1));
        return isNaN(num) ? true : val > num;
      }
      if (f.startsWith('<=')) {
        const num = parseFloat(f.slice(2));
        return isNaN(num) ? true : val <= num;
      }
      if (f.startsWith('<')) {
        const num = parseFloat(f.slice(1));
        return isNaN(num) ? true : val < num;
      }
      const num = parseFloat(f);
      return isNaN(num) ? val.toString().includes(f) : val >= num;
    };

    if (columnFilters.monthN.trim()) {
      list = list.filter((item) => filterVolume(item.monthN, columnFilters.monthN));
    }
    if (columnFilters.monthN1.trim()) {
      list = list.filter((item) => filterVolume(item.monthN1, columnFilters.monthN1));
    }
    if (columnFilters.monthN2.trim()) {
      list = list.filter((item) => filterVolume(item.monthN2, columnFilters.monthN2));
    }
    if (columnFilters.monthN3.trim()) {
      list = list.filter((item) => filterVolume(item.monthN3, columnFilters.monthN3));
    }

    // Sorting
    if (sortField !== 'default') {
      list.sort((a: any, b: any) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }

  // ── NETWORK API LOGIC ──

  async fetchOrdersInitialData(): Promise<{
    parts: any[];
    machines: MachineItem[];
    historyRecords: HistoryRecord[];
    conversions: any[];
  }> {
    try {
      const [partsRes, machinesRes, historyRes, conversionsRes] = await Promise.all([
        api.get('/parts'),
        api.get('/machines'),
        api.get('/history-orders'),
        api.get('/order-conversions'),
      ]);

      const parts = partsRes.data.data || [];
      const machines = machinesRes.data.data || [];
      const historyList = historyRes.data.data || [];
      const conversions = conversionsRes.data.data || [];

      // Group history by batch_id
      const groups: Record<string, any> = {};
      historyList.forEach((row: any) => {
        const bId = row.batch_id || 'unknown';
        if (!groups[bId]) {
          groups[bId] = {
            id: bId,
            created_at: row.created_at || new Date().toISOString(),
            items: [],
          };
        }
        groups[bId].items.push({
          sebango: row.sebango,
          partNumber: row.part_number,
          partName: row.part_name,
          monthN: Number(row.month_n_volume || 0),
          monthN1: Number(row.month_n1_volume || 0),
          monthN2: Number(row.month_n2_volume || 0),
          monthN3: Number(row.month_n3_volume || 0),
          dailyRequirementN: Number(row.daily_requirement_n || 0),
          dailyRequirementN1: Number(row.daily_requirement_n1 || 0),
          dailyRequirementN2: Number(row.daily_requirement_n2 || 0),
          dailyRequirementN3: Number(row.daily_requirement_n3 || 0),
        });
      });

      const historyRecords = Object.values(groups)
        .map((g: any) => ({
          ...g,
          itemCount: g.items.length,
        }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { parts, machines, historyRecords, conversions };
    } catch (err) {
      console.error('Failed to fetch orders initial data:', err);
      throw err;
    }
  }

  async commitForecastToDatabase(
    tempForecast: PartForecast[],
    parts: any[],
    monthKeys: ForecastMonthKeys
  ): Promise<{ refreshedParts: any[]; refreshedHistory: HistoryRecord[] }> {
    try {
      const updatedPartsPayloads = parts.map((p) => {
        const item = tempForecast.find((tf) => tf.partNumber === p.part_number);
        const existingForecasts = p.monthly_forecasts || {};
        let updatedForecasts = { ...existingForecasts };

        if (item) {
          updatedForecasts = {
            ...existingForecasts,
            [monthKeys.monthN]: { volume: item.monthN, daily: item.dailyRequirementN },
            [monthKeys.monthN1]: { volume: item.monthN1, daily: item.dailyRequirementN1 },
            [monthKeys.monthN2]: { volume: item.monthN2, daily: item.dailyRequirementN2 },
            [monthKeys.monthN3]: { volume: item.monthN3, daily: item.dailyRequirementN3 },
          };

          return {
            ...p,
            daily_requirement_n: item.dailyRequirementN,
            daily_requirement_n1: item.dailyRequirementN1,
            daily_requirement_n2: item.dailyRequirementN2,
            daily_requirement_n3: item.dailyRequirementN3,
            month_n_forecast: item.monthN,
            month_n1_forecast: item.monthN1,
            month_n2_forecast: item.monthN2,
            month_n3_forecast: item.monthN3,
            monthly_forecasts: updatedForecasts,
          };
        }

        return p;
      });

      await api.post('/parts/import', updatedPartsPayloads);

      const historyRows = tempForecast.map((item) => ({
        sebango: item.sebango,
        part_number: item.partNumber,
        part_name: item.partName,
        month_n_volume: item.monthN,
        month_n1_volume: item.monthN1,
        month_n2_volume: item.monthN2,
        month_n3_volume: item.monthN3,
        daily_requirement_n: item.dailyRequirementN,
        daily_requirement_n1: item.dailyRequirementN1,
        daily_requirement_n2: item.dailyRequirementN2,
        daily_requirement_n3: item.dailyRequirementN3,
      }));

      await api.post('/history-orders', historyRows);

      const refreshedPartsRes = await api.get('/parts');
      const refreshedHistoryRes = await api.get('/history-orders');
      const refreshedParts = refreshedPartsRes.data.data || [];

      const groups: Record<string, any> = {};
      (refreshedHistoryRes.data.data || []).forEach((row: any) => {
        const bId = row.batch_id || 'unknown';
        if (!groups[bId]) {
          groups[bId] = {
            id: bId,
            created_at: row.created_at || new Date().toISOString(),
            items: [],
          };
        }
        groups[bId].items.push({
          sebango: row.sebango,
          partNumber: row.part_number,
          partName: row.part_name,
          monthN: Number(row.month_n_volume || 0),
          monthN1: Number(row.month_n1_volume || 0),
          monthN2: Number(row.month_n2_volume || 0),
          monthN3: Number(row.month_n3_volume || 0),
          dailyRequirementN: Number(row.daily_requirement_n || 0),
          dailyRequirementN1: Number(row.daily_requirement_n1 || 0),
          dailyRequirementN2: Number(row.daily_requirement_n2 || 0),
          dailyRequirementN3: Number(row.daily_requirement_n3 || 0),
        });
      });

      const refreshedHistory = Object.values(groups)
        .map((g: any) => ({
          ...g,
          itemCount: g.items.length,
        }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { refreshedParts, refreshedHistory };
    } catch (err) {
      console.error('Failed to commit forecast:', err);
      throw err;
    }
  }

  async restoreHistoryRecordToDatabase(
    record: HistoryRecord,
    parts: any[],
    monthKeys: ForecastMonthKeys
  ): Promise<any[]> {
    try {
      const items = record.items;
      const restoredParts = parts.map((p) => {
        const item = items.find(
          (it: any) =>
            (it.partNumber || '').trim().toUpperCase() === (p.part_number || '').trim().toUpperCase() ||
            (it.sebango || '').trim().toUpperCase() === (p.sebango || '').trim().toUpperCase()
        );
        const existingForecasts = p.monthly_forecasts || {};
        let updatedForecasts = { ...existingForecasts };

        if (item) {
          updatedForecasts = {
            ...existingForecasts,
            [monthKeys.monthN]: { volume: item.monthN, daily: item.dailyRequirementN },
            [monthKeys.monthN1]: { volume: item.monthN1, daily: item.dailyRequirementN1 },
            [monthKeys.monthN2]: { volume: item.monthN2, daily: item.dailyRequirementN2 },
            [monthKeys.monthN3]: { volume: item.monthN3, daily: item.dailyRequirementN3 },
          };

          return {
            ...p,
            daily_requirement_n: item.dailyRequirementN,
            daily_requirement_n1: item.dailyRequirementN1,
            daily_requirement_n2: item.dailyRequirementN2,
            daily_requirement_n3: item.dailyRequirementN3,
            month_n_forecast: item.monthN,
            month_n1_forecast: item.monthN1,
            month_n2_forecast: item.monthN2,
            month_n3_forecast: item.monthN3,
            monthly_forecasts: updatedForecasts,
          };
        }

        return p;
      });

      await api.post('/parts/import', restoredParts);
      const refreshedPartsRes = await api.get('/parts');
      return refreshedPartsRes.data.data || [];
    } catch (err) {
      console.error('Failed to restore history record:', err);
      throw err;
    }
  }

  async saveManualForecastAdjustment(
    selectedPartNo: string,
    manualVolumes: { vN: number; vN1: number; vN2: number; vN3: number },
    parts: any[],
    monthKeys: ForecastMonthKeys
  ): Promise<any[]> {
    try {
      const originalPart = parts.find((pt) => pt.part_number === selectedPartNo);
      if (!originalPart) throw new Error('Part not found');

      const workingDays = 20;
      const dN = Math.ceil(manualVolumes.vN / workingDays);
      const dN1 = Math.ceil(manualVolumes.vN1 / workingDays);
      const dN2 = Math.ceil(manualVolumes.vN2 / workingDays);
      const dN3 = Math.ceil(manualVolumes.vN3 / workingDays);

      const existingForecasts = originalPart.monthly_forecasts || {};
      const updatedForecasts = {
        ...existingForecasts,
        [monthKeys.monthN]: { volume: manualVolumes.vN, daily: dN },
        [monthKeys.monthN1]: { volume: manualVolumes.vN1, daily: dN1 },
        [monthKeys.monthN2]: { volume: manualVolumes.vN2, daily: dN2 },
        [monthKeys.monthN3]: { volume: manualVolumes.vN3, daily: dN3 },
      };

      const revisedPart = {
        ...originalPart,
        daily_requirement_n: dN,
        daily_requirement_n1: dN1,
        daily_requirement_n2: dN2,
        daily_requirement_n3: dN3,
        month_n_forecast: manualVolumes.vN,
        month_n1_forecast: manualVolumes.vN1,
        month_n2_forecast: manualVolumes.vN2,
        month_n3_forecast: manualVolumes.vN3,
        monthly_forecasts: updatedForecasts,
      };

      await api.post('/parts', revisedPart);

      const refreshedPartsRes = await api.get('/parts');
      return refreshedPartsRes.data.data || [];
    } catch (err) {
      console.error('Failed to save manual forecast adjustment:', err);
      throw err;
    }
  }

  async saveMachineChangesToDatabase(
    pendingChanges: Record<string, string>,
    parts: any[]
  ): Promise<any[]> {
    try {
      const partsToUpdate = Object.keys(pendingChanges)
        .map((partNo) => {
          const p = parts.find((pt) => pt.part_number === partNo);
          return p ? { ...p, home_line: pendingChanges[partNo] } : null;
        })
        .filter(Boolean);

      if (partsToUpdate.length > 0) {
        await api.post('/parts/import', partsToUpdate);
      }

      const refreshedPartsRes = await api.get('/parts');
      return refreshedPartsRes.data.data || [];
    } catch (err) {
      console.error('Failed to save machine changes:', err);
      throw err;
    }
  }
}

export const ordersService = new OrdersService();
