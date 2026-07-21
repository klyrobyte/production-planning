import api from '../../../shared/lib/axios';
import type {
  PartItem,
  CreatePartPayload,
  UpdatePartPayload,
  OrderConversionItem,
  CreateConversionPayload,
  UpdateConversionPayload,
  LeaderItem,
  CreateLeaderPayload,
  UpdateLeaderPayload,
  ExcelImportResult,
} from './DatabaseTypes';

export class DatabaseService {
  // ── UTILITY / BUSINESS LOGIC HELPER METHODS ──

  filterItems<T>(items: T[], searchField: keyof T, searchTerm: string): T[] {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item) => {
      const val = item[searchField];
      return val ? String(val).toLowerCase().includes(q) : false;
    });
  }

  paginateItems<T>(
    items: T[],
    currentPage: number,
    itemsPerPage: number = 10
  ): { paginatedItems: T[]; totalPages: number; startIndex: number } {
    const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
    const safePage = Math.max(1, Math.min(currentPage, totalPages));
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);
    return { paginatedItems, totalPages, startIndex };
  }

  // ── MASTER PARTS LOGIC & API ──

  async fetchParts(): Promise<PartItem[]> {
    try {
      const res = await api.get('/parts');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to fetch parts:', err);
      throw err;
    }
  }

  async fetchMachines(): Promise<any[]> {
    try {
      const res = await api.get('/machines');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to fetch machines:', err);
      return [];
    }
  }

  async createPart(payload: CreatePartPayload): Promise<PartItem> {
    try {
      const res = await api.post('/parts', payload);
      return res.data.data;
    } catch (err) {
      console.error('Failed to create part:', err);
      throw err;
    }
  }

  async updatePart(id: string | number, payload: UpdatePartPayload): Promise<PartItem> {
    try {
      const res = await api.put(`/parts/${id}`, payload);
      return res.data.data;
    } catch (err) {
      console.error('Failed to update part:', err);
      throw err;
    }
  }

  async deletePart(id: string | number): Promise<void> {
    try {
      await api.delete(`/parts/${id}`);
    } catch (err) {
      console.error('Failed to delete part:', err);
      throw err;
    }
  }

  async deleteAllParts(): Promise<void> {
    try {
      await api.delete('/parts');
    } catch (err) {
      console.error('Failed to delete all parts:', err);
      throw err;
    }
  }

  async importPartsBulk(parts: PartItem[]): Promise<void> {
    try {
      await api.post('/parts/import', parts);
    } catch (err) {
      console.error('Failed to import parts bulk:', err);
      throw err;
    }
  }

  async importPartsExcel(formData: FormData): Promise<ExcelImportResult> {
    try {
      const res = await api.post('/parts/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      console.error('Failed to import parts excel:', err);
      throw err;
    }
  }

  parseMasterPartsCSV(text: string, machines: any[]): { parsedParts: PartItem[]; count: number } {
    const parseLine = (line: string) => {
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current.trim());
      return cols;
    };

    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) throw new Error('Berkas CSV kosong.');

    const headers = parseLine(lines[0]);
    const uniqueParts = new Map<string, PartItem>();

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length < 2) continue;

      const getVal = (fieldName: string) => {
        const normalizedField = fieldName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const idx = headers.findIndex(
          (h) => h.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedField
        );
        return idx !== -1 ? cols[idx] : undefined;
      };

      const normalizeMachineCode = (val: string) => {
        if (!val) return 'M-01';
        let raw = val.trim().toUpperCase();
        if (/^\d+$/.test(raw)) {
          const num = parseInt(raw, 10);
          return `M-${num.toString().padStart(2, '0')}`;
        }
        return raw;
      };

      const rawHomeLine = getVal('home_line') || getVal('LINE') || getVal('HOMELINE') || 'M-01';
      const home_line = normalizeMachineCode(rawHomeLine);
      const rawBackupLine = getVal('backup_line') || getVal('BACKUPLINE') || home_line;
      const backup_line = normalizeMachineCode(rawBackupLine);

      const matchedMachine = machines.find((m) => m.code === home_line);
      const area = matchedMachine?.factory_code ? String(matchedMachine.factory_code) : (getVal('area') || getVal('PLANT') || '1');
      const tonnage = matchedMachine?.tonnage ? String(matchedMachine.tonnage) : (getVal('tonnage') || getVal('TONNAGE') || '350');

      const part_number = (getVal('part_number') || getVal('PARTNO') || getVal('PARTNUMBER') || '').trim();
      const part_name = (getVal('part_name') || getVal('PARTNAME') || '').trim();

      if (!part_number || !part_name) continue;

      const model = (getVal('model') || getVal('MODEL') || '-').trim();
      const customer = (getVal('customer') || getVal('CUSTOMER') || '-').trim();
      const sebango = (getVal('sebango') || getVal('SEBANGO') || '-').trim();
      const material = (getVal('material') || getVal('MATERIAL') || '').trim();
      const weight = parseFloat(getVal('weight') || getVal('WEIGHT') || '0') || 0;
      const mold = (getVal('mold') || getVal('MOLD') || '').trim();
      const cavity = parseFloat(getVal('cavity') || getVal('CAVITY') || '1') || 1;
      const cycle_time = parseFloat(getVal('cycle_time') || getVal('CT') || getVal('CYCLETIME') || '60') || 60;
      const shikake = parseInt(getVal('shikake') || getVal('SHIKAKE') || '2', 10) || 2;
      const customer_pno = (getVal('customer_pno') || getVal('CUSTOMERPARTNO') || '').trim();
      const customer_sebango = (getVal('customer_sebango') || getVal('CUSTOMERSEBANGO') || '').trim();
      const spec = parseFloat(getVal('spec') || getVal('SPEC') || '6') || 6;

      uniqueParts.set(part_number, {
        area,
        tonnage,
        backup_line,
        home_line,
        sebango,
        customer,
        model,
        part_number,
        part_name,
        material,
        weight,
        mold,
        cavity,
        cycle_time,
        shikake,
        customer_pno,
        customer_sebango,
        spec,
      });
    }

    const parsedParts = Array.from(uniqueParts.values());
    return { parsedParts, count: parsedParts.length };
  }

  filterMasterParts(
    parts: PartItem[],
    searchTerm: string,
    areaFilter: string,
    lineFilter: string
  ): PartItem[] {
    return parts.filter((part) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        (part.part_number || '').toLowerCase().includes(q) ||
        (part.part_name || '').toLowerCase().includes(q) ||
        (part.model || '').toLowerCase().includes(q) ||
        (part.customer || '').toLowerCase().includes(q) ||
        (part.sebango || '').toLowerCase().includes(q);

      const matchesArea = areaFilter === 'ALL' || part.area === areaFilter;
      const matchesLine = lineFilter === 'ALL' || part.home_line === lineFilter;

      return matchesSearch && matchesArea && matchesLine;
    });
  }

  // ── ORDER CONVERSIONS LOGIC & API ──

  async fetchConversions(): Promise<OrderConversionItem[]> {
    try {
      const res = await api.get('/order-conversions');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to fetch order conversions:', err);
      throw err;
    }
  }

  async createConversion(payload: CreateConversionPayload): Promise<OrderConversionItem> {
    try {
      const res = await api.post('/order-conversions', payload);
      return res.data.data;
    } catch (err) {
      console.error('Failed to create conversion:', err);
      throw err;
    }
  }

  async updateConversion(
    id: string | number,
    payload: UpdateConversionPayload
  ): Promise<OrderConversionItem> {
    try {
      const res = await api.put(`/order-conversions/${id}`, payload);
      return res.data.data;
    } catch (err) {
      console.error('Failed to update conversion:', err);
      throw err;
    }
  }

  async deleteConversion(id: string | number): Promise<void> {
    try {
      await api.delete(`/order-conversions/${id}`);
    } catch (err) {
      console.error('Failed to delete conversion:', err);
      throw err;
    }
  }

  async deleteAllConversions(): Promise<void> {
    try {
      await api.delete('/order-conversions');
    } catch (err) {
      console.error('Failed to delete all conversions:', err);
      throw err;
    }
  }

  async importConversionsBulk(conversions: OrderConversionItem[]): Promise<void> {
    try {
      await api.post('/order-conversions/import', conversions);
    } catch (err) {
      console.error('Failed to import conversions bulk:', err);
      throw err;
    }
  }

  async importConversionsExcel(formData: FormData): Promise<ExcelImportResult> {
    try {
      const res = await api.post('/order-conversions/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      console.error('Failed to import conversions excel:', err);
      throw err;
    }
  }

  parseOrderConversionsCSV(content: string): { parsedPreview: OrderConversionItem[]; count: number } {
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return { parsedPreview: [], count: 0 };

    const items: OrderConversionItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 3) {
        const custPno = cols[0];
        const custSeb = cols[1];
        const prodSeb = cols[2];
        const category = cols[3]?.toLowerCase() === 'small' ? 'small' : 'big';

        if (custPno && prodSeb) {
          items.push({
            cust_part_number: custPno,
            cust_sebango: custSeb,
            prod_sebango: prodSeb,
            part_category: category,
          });
        }
      }
    }

    return { parsedPreview: items, count: items.length };
  }

  filterOrderConversions(
    conversions: OrderConversionItem[],
    searchTerm: string,
    categoryFilter: string
  ): OrderConversionItem[] {
    return conversions.filter((conv) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        (conv.cust_part_number || '').toLowerCase().includes(q) ||
        (conv.cust_sebango || '').toLowerCase().includes(q) ||
        (conv.prod_sebango || '').toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'ALL' || conv.part_category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }

  // ── LEADERS LOGIC & API ──

  async fetchLeaders(): Promise<LeaderItem[]> {
    try {
      const res = await api.get('/leaders');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to fetch leaders:', err);
      throw err;
    }
  }

  async createLeader(payload: CreateLeaderPayload): Promise<LeaderItem> {
    try {
      const res = await api.post('/leaders', payload);
      return res.data.data;
    } catch (err) {
      console.error('Failed to create leader:', err);
      throw err;
    }
  }

  async updateLeader(
    id: string | number,
    payload: UpdateLeaderPayload
  ): Promise<LeaderItem> {
    try {
      const res = await api.put(`/leaders/${id}`, payload);
      return res.data.data;
    } catch (err) {
      console.error('Failed to update leader:', err);
      throw err;
    }
  }

  async deleteLeader(id: string | number): Promise<void> {
    try {
      await api.delete(`/leaders/${id}`);
    } catch (err) {
      console.error('Failed to delete leader:', err);
      throw err;
    }
  }

  async revealLeaderPin(id: string | number): Promise<string> {
    try {
      const res = await api.get(`/leaders/${id}/reveal-pin`);
      return res.data.data?.pin || 'N/A';
    } catch (err) {
      console.error('Failed to reveal leader PIN:', err);
      throw err;
    }
  }

  // ── FORM VALIDATION METHODS ──

  validatePartForm(partNumber: string, partName: string, model?: string): string | null {
    if (!partNumber.trim()) return 'Part number wajib diisi.';
    if (!partName.trim()) return 'Part name wajib diisi.';
    return null;
  }

  validateConversionForm(custPartNumber: string, prodSebango: string): string | null {
    if (!custPartNumber.trim()) return 'Customer Part Number wajib diisi.';
    if (!prodSebango.trim()) return 'Production Sebango wajib diisi.';
    return null;
  }

  validateLeaderForm(name: string, pin: string): string | null {
    if (!name.trim()) return 'Nama Leader wajib diisi.';
    if (!pin || pin.length !== 4 || isNaN(Number(pin))) return 'PIN harus terdiri dari 4 digit angka.';
    return null;
  }
}

export const databaseService = new DatabaseService();
