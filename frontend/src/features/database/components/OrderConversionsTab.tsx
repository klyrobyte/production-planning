import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Upload, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  FileSpreadsheet, 
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Cpu,
  Layers,
  Edit2,
  X,
  Trash2
} from 'lucide-react';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useToastStore } from '../../../shared/store/useToastStore';
import type { OrderConversionItem, OrderConversionsTabProps } from '../context/DatabaseTypes';
import { databaseService } from '../context/DatabaseService';

export default function OrderConversionsTab({ refreshTrigger }: OrderConversionsTabProps) {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  // Order Conversions states
  const [conversions, setConversions] = useState<OrderConversionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTermConversions, setSearchTermConversions] = useState('');
  const [categoryFilterConversions, setCategoryFilterConversions] = useState('ALL');
  const [currentPageConversions, setCurrentPageConversions] = useState(1);
  const itemsPerPageConversions = 10;
  
  const [activeTabConversions, setActiveTabConversions] = useState<'csv' | 'manual'>('csv');
  const [isDragOverConversions, setIsDragOverConversions] = useState(false);
  const [isUploadingConversions, setIsUploadingConversions] = useState(false);
  const [parsedPreviewConversions, setParsedPreviewConversions] = useState<any[]>([]);
  const [parsedCountConversions, setParsedCountConversions] = useState(0);
  const [csvErrorConversions, setCsvErrorConversions] = useState<string | null>(null);
  const fileInputRefConversions = useRef<HTMLInputElement>(null);

  const [selectedConversionForEdit, setSelectedConversionForEdit] = useState<any | null>(null);
  const [editFormConversions, setEditFormConversions] = useState({
    cust_part_number: '',
    cust_sebango: '',
    prod_sebango: '',
    part_category: 'big'
  });

  const [manualFormConversions, setManualFormConversions] = useState({
    cust_part_number: '',
    cust_sebango: '',
    prod_sebango: '',
    part_category: 'big'
  });

  const fetchConversions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await databaseService.fetchConversions();
      setConversions(data);
    } catch (e) {
      useToastStore.getState().showToast('Gagal memuat mapping order conversions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversions();
  }, [fetchConversions, refreshTrigger]);

  const parseConversionsCSVContent = (content: string): any[] => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const separator = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().toUpperCase());

    const custPartIdx = headers.findIndex(h => h.includes('CUST_PART') || h.includes('CUSTOMER_PART') || h.includes('PART_NUMBER') || h.includes('CUST_PN') || h.includes('PART NUMBER') || h === 'PART_NUMBER' || h === 'CUST_PART_NUMBER');
    const custSebIdx = headers.findIndex(h => h.includes('CUST_SEB') || h.includes('CUSTOMER_SEBANGO') || h === 'CUST_SEBANGO');
    const prodSebIdx = headers.findIndex(h => h.includes('PROD_SEB') || h.includes('PRODUCTION_SEBANGO') || h.includes('SEBANGO') || h === 'PROD_SEBANGO');
    const categoryIdx = headers.findIndex(h => h.includes('CATEGORY') || h.includes('PART_CATEGORY') || h === 'PART_CATEGORY');

    const results: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(separator).map(c => c.trim());
      if (cols.length === 0) continue;

      const cust_part_number = custPartIdx !== -1 ? cols[custPartIdx] : cols[0];
      const cust_sebango = custSebIdx !== -1 ? cols[custSebIdx] : 'CUST-SEB';
      const prod_sebango = prodSebIdx !== -1 ? cols[prodSebIdx] : cols[1];
      const part_category = categoryIdx !== -1 ? cols[categoryIdx].toLowerCase() : 'big';

      if (!cust_part_number || !prod_sebango) continue;

      results.push({
        cust_part_number,
        cust_sebango: cust_sebango || 'CUST-SEB',
        prod_sebango,
        part_category: part_category === 'small' ? 'small' : 'big'
      });
    }
    return results;
  };

  const handleCSVUploadConversions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCSVFileConversions(file);
  };

  const processCSVFileConversions = (file: File) => {
    setCsvErrorConversions(null);
    setIsUploadingConversions(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { parsedPreview, count } = databaseService.parseOrderConversionsCSV(text);
        if (count === 0) {
          setCsvErrorConversions('Format CSV tidak valid atau data kosong.');
          setParsedPreviewConversions([]);
          setParsedCountConversions(0);
        } else {
          setParsedPreviewConversions(parsedPreview);
          setParsedCountConversions(count);
        }
      } catch (err) {
        console.error(err);
        setCsvErrorConversions('Gagal mem-parse berkas CSV.');
      } finally {
        setIsUploadingConversions(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOverConversions = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverConversions(true);
  };

  const handleDragLeaveConversions = () => {
    setIsDragOverConversions(false);
  };

  const handleDropConversions = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverConversions(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      processCSVFileConversions(file);
    } else {
      setCsvErrorConversions('Hanya menerima berkas .csv.');
    }
  };

  const triggerFileDialogConversions = () => {
    fileInputRefConversions.current?.click();
  };

  const handleSaveImportConversions = async () => {
    if (parsedPreviewConversions.length === 0) return;
    setIsLoading(true);
    try {
      await databaseService.importConversionsBulk(parsedPreviewConversions);
      useToastStore.getState().showToast(`${parsedCountConversions} mapping order conversions berhasil di-import.`, 'success');
      setParsedPreviewConversions([]);
      setParsedCountConversions(0);
      fetchConversions();
    } catch (err: any) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Gagal menyimpan data import mapping.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualFormConversionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { cust_part_number, cust_sebango, prod_sebango, part_category } = manualFormConversions;
    const validationErr = databaseService.validateConversionForm(cust_part_number, prod_sebango);
    if (validationErr) {
      useToastStore.getState().showToast(validationErr, 'warning');
      return;
    }
    setIsLoading(true);
    try {
      await databaseService.createConversion({
        cust_part_number: cust_part_number.trim(),
        cust_sebango: cust_sebango.trim() || 'CUST-SEB',
        prod_sebango: prod_sebango.trim(),
        part_category
      });
      useToastStore.getState().showToast(`Mapping untuk ${cust_part_number} berhasil disimpan.`, 'success');
      setManualFormConversions({
        cust_part_number: '',
        cust_sebango: '',
        prod_sebango: '',
        part_category: 'big'
      });
      fetchConversions();
    } catch (err: any) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Gagal menyimpan mapping.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModalConversions = (conv: any) => {
    setSelectedConversionForEdit(conv);
    setEditFormConversions({
      cust_part_number: conv.cust_part_number || '',
      cust_sebango: conv.cust_sebango || '',
      prod_sebango: conv.prod_sebango || '',
      part_category: conv.part_category || 'big'
    });
  };

  const handleSaveEditConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversionForEdit || !selectedConversionForEdit.id) return;
    setIsLoading(true);
    try {
      await databaseService.updateConversion(selectedConversionForEdit.id, {
        cust_part_number: editFormConversions.cust_part_number.trim(),
        cust_sebango: editFormConversions.cust_sebango.trim() || 'CUST-SEB',
        prod_sebango: editFormConversions.prod_sebango.trim(),
        part_category: editFormConversions.part_category
      });
      useToastStore.getState().showToast('Mapping berhasil diperbarui.', 'success');
      setSelectedConversionForEdit(null);
      fetchConversions();
    } catch (err: any) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Gagal memperbarui mapping.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversion = async (id: string | number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mapping ini?')) return;
    setIsLoading(true);
    try {
      await databaseService.deleteConversion(id);
      useToastStore.getState().showToast('Mapping berhasil dihapus.', 'success');
      fetchConversions();
    } catch (err: any) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Gagal menghapus mapping.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Conversions Stats calculation
  const statsConversions = useMemo(() => {
    const total = conversions.length;
    const big = conversions.filter(c => c.part_category === 'big').length;
    const small = conversions.filter(c => c.part_category === 'small').length;
    return { total, big, small };
  }, [conversions]);

  // Conversions Filtering + Searching logic (Delegated to databaseService)
  const filteredConversions = useMemo(() => {
    return databaseService.filterOrderConversions(conversions, searchTermConversions, categoryFilterConversions);
  }, [conversions, searchTermConversions, categoryFilterConversions]);

  // Conversions Pagination logic (Delegated to databaseService)
  const { paginatedItems: paginatedConversions, totalPages: totalPagesConversions } = useMemo(() => {
    return databaseService.paginateItems(filteredConversions, currentPageConversions, itemsPerPageConversions);
  }, [filteredConversions, currentPageConversions, itemsPerPageConversions]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 dark:opacity-5 group-hover:opacity-20 transition-opacity">
            <Cpu className="w-14 h-14 text-[#E76114]" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-extrabold uppercase tracking-wider">Total Conversions</div>
          <div className="text-3xl font-black text-[#E76114] mt-2 tracking-tight">
            {statsConversions.total}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-bold mt-1">Total mapping customer ke internal</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 dark:opacity-5 group-hover:opacity-20 transition-opacity">
            <Layers className="w-14 h-14 text-emerald-650" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-extrabold uppercase tracking-wider">Big Category Parts</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-450 mt-2 tracking-tight">
            {statsConversions.big}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-bold mt-1">Mapping dengan tipe Label Big</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 dark:opacity-5 group-hover:opacity-20 transition-opacity">
            <FileSpreadsheet className="w-14 h-14 text-blue-500" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-extrabold uppercase tracking-wider">Small Category Parts</div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-450 mt-2 tracking-tight">
            {statsConversions.small}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-bold mt-1">Mapping dengan tipe Label Small</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Import / Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Form Tabs */}
            <div className="flex bg-slate-50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800/80 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setActiveTabConversions('csv')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTabConversions === 'csv'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/50'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                CSV Import
              </button>
              <button
                type="button"
                onClick={() => setActiveTabConversions('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTabConversions === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/50'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Manual Form
              </button>
            </div>

            <div className="p-6">
              {/* CSV Upload Section */}
              {activeTabConversions === 'csv' && (
                <div className="space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-white">Format Header Mappings CSV</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Kolom berkas CSV harus sesuai atau mendekati nama kolom berikut:
                      </p>
                      <div className="bg-slate-200 dark:bg-slate-900 p-2 rounded text-[8.5px] font-mono text-slate-700 dark:text-slate-300 mt-2 leading-relaxed break-all">
                        CUST_PART_NUMBER, CUST_SEBANGO, PROD_SEBANGO, PART_CATEGORY
                      </div>
                    </div>
                  </div>

                  {/* Dropzone Area */}
                  <input
                    type="file"
                    ref={fileInputRefConversions}
                    onChange={handleCSVUploadConversions}
                    accept=".csv"
                    className="hidden"
                  />

                  <div
                    onDragOver={handleDragOverConversions}
                    onDragLeave={handleDragLeaveConversions}
                    onDrop={handleDropConversions}
                    onClick={triggerFileDialogConversions}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
                      isDragOverConversions
                        ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 bg-slate-50/50 dark:bg-slate-955/20'
                    }`}
                  >
                    {isUploadingConversions ? (
                      <div className="text-center space-y-2">
                        <RefreshCw className="w-8 h-8 text-[#E76114] animate-spin mx-auto" />
                        <p className="text-xs font-bold text-slate-755 dark:text-white">Memproses berkas...</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-white dark:bg-slate-955 rounded-full shadow-sm">
                          <Upload className="w-5 h-5 text-[#E76114]" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-750 dark:text-white">Tarik & lepas berkas CSV di sini</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">atau klik untuk menelusuri folder Anda</p>
                        </div>
                      </>
                    )}
                  </div>

                  {csvErrorConversions && (
                    <div className="rounded-xl border border-rose-100 dark:border-rose-955/30 bg-rose-50 dark:bg-rose-950/20 p-4 text-xs font-bold text-rose-700 dark:text-rose-455 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>{csvErrorConversions}</span>
                    </div>
                  )}

                  {parsedCountConversions > 0 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3.5 rounded-xl">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-450 text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Terbaca {parsedCountConversions} Mappings
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveImportConversions}
                          disabled={isLoading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          Simpan Data
                        </button>
                      </div>

                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 text-[9px] font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-slate-450">
                          Pratinjau Data (Maks. 5 Data Pertama)
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[9px]">
                          {parsedPreviewConversions.slice(0, 5).map((row, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex justify-between gap-4 text-left">
                              <div className="truncate">
                                <div className="font-extrabold text-slate-700 dark:text-slate-300">{row.cust_part_number}</div>
                                <div className="text-[8px] text-slate-400 mt-0.5">Cust Sebango: {row.cust_sebango}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-extrabold text-[#E76114]">{row.prod_sebango}</div>
                                <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase mt-1 ${
                                  row.part_category === 'small' 
                                    ? 'bg-blue-50 text-blue-605 dark:bg-blue-950/40 dark:text-blue-400' 
                                    : 'bg-emerald-50 text-emerald-605 dark:bg-emerald-950/40 dark:text-emerald-400'
                                }`}>
                                  {row.part_category}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Form Section */}
              {activeTabConversions === 'manual' && (
                <form onSubmit={handleManualFormConversionsSubmit} className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">
                      Customer Part Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualFormConversions.cust_part_number}
                      onChange={(e) => setManualFormConversions(prev => ({ ...prev, cust_part_number: e.target.value }))}
                      placeholder="e.g. 52119-0K920"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-xs font-semibold text-slate-705 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">
                      Customer Sebango
                    </label>
                    <input
                      type="text"
                      value={manualFormConversions.cust_sebango}
                      onChange={(e) => setManualFormConversions(prev => ({ ...prev, cust_sebango: e.target.value }))}
                      placeholder="e.g. F41-2"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-xs font-semibold text-slate-705 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">
                      Production Sebango *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualFormConversions.prod_sebango}
                      onChange={(e) => setManualFormConversions(prev => ({ ...prev, prod_sebango: e.target.value }))}
                      placeholder="e.g. E43-1"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-xs font-semibold text-slate-705 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">
                      Part Category / Label Size *
                    </label>
                    <select
                      value={manualFormConversions.part_category}
                      onChange={(e) => setManualFormConversions(prev => ({ ...prev, part_category: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                    >
                      <option value="big">Big (Label Besar)</option>
                      <option value="small">Small (Label Kecil)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{ backgroundColor: colorPrimary }}
                    className="w-full py-3 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-md hover:opacity-95 active:scale-[0.99] cursor-pointer text-center"
                  >
                    Simpan Mapping Baru
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Table & Filters */}
        <div className="lg:col-span-7 space-y-6">
          {/* Filters */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTermConversions}
                onChange={(e) => setSearchTermConversions(e.target.value)}
                placeholder="Cari part number, sebango..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-705 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={categoryFilterConversions}
                onChange={(e) => setCategoryFilterConversions(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary cursor-pointer"
              >
                <option value="ALL">Semua Ukuran</option>
                <option value="big">Big (Label Besar)</option>
                <option value="small">Small (Label Kecil)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                    <th className="px-6 py-4">Cust Part Info</th>
                    <th className="px-6 py-4">Cust Sebango</th>
                    <th className="px-6 py-4">Prod Sebango</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-705 dark:text-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-[#E76114]" />
                          <span>Memproses data order conversions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredConversions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Tidak ada mapping ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedConversions.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-left font-bold font-mono text-slate-800 dark:text-white">
                          {row.cust_part_number}
                        </td>
                        <td className="px-6 py-4 text-left font-mono">
                          {row.cust_sebango || '-'}
                        </td>
                        <td className="px-6 py-4 text-left font-mono font-extrabold text-[#E76114]">
                          {row.prod_sebango}
                        </td>
                        <td className="px-6 py-4 text-left">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                            row.part_category === 'small'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450'
                          }`}>
                            {row.part_category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModalConversions(row)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-705 dark:hover:text-white transition-colors cursor-pointer"
                              title="Edit Mapping"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => row.id && handleDeleteConversion(row.id)}
                              className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                              title="Hapus Mapping"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPagesConversions > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">
                  Menampilkan {Math.min(filteredConversions.length, (currentPageConversions - 1) * itemsPerPageConversions + 1)} - {Math.min(filteredConversions.length, currentPageConversions * itemsPerPageConversions)} dari {filteredConversions.length} data
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPageConversions === 1}
                    onClick={() => setCurrentPageConversions(prev => Math.max(1, prev - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPageConversions === totalPagesConversions}
                    onClick={() => setCurrentPageConversions(prev => Math.min(totalPagesConversions, prev + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Conversion Modal Dialog */}
      {selectedConversionForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-[#E76114] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5" />
                <div className="text-left">
                  <h3 className="font-bold text-sm tracking-wide">Edit Mapping Order Conversion</h3>
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-0.5 font-mono">{selectedConversionForEdit.cust_part_number}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedConversionForEdit(null)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditConversion} className="p-6 space-y-5 overflow-y-auto text-left">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Customer Part Number *</label>
                  <input
                    type="text"
                    required
                    value={editFormConversions.cust_part_number}
                    onChange={(e) => setEditFormConversions(prev => ({ ...prev, cust_part_number: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Customer Sebango</label>
                  <input
                    type="text"
                    value={editFormConversions.cust_sebango}
                    onChange={(e) => setEditFormConversions(prev => ({ ...prev, cust_sebango: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 py-2.5 px-3 text-xs font-semibold text-slate-705 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Production Sebango *</label>
                  <input
                    type="text"
                    required
                    value={editFormConversions.prod_sebango}
                    onChange={(e) => setEditFormConversions(prev => ({ ...prev, prod_sebango: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Part Category / Label Size *</label>
                  <select
                    value={editFormConversions.part_category}
                    onChange={(e) => setEditFormConversions(prev => ({ ...prev, part_category: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                  >
                    <option value="big">Big (Label Besar)</option>
                    <option value="small">Small (Label Kecil)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedConversionForEdit(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-605 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer dark:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: colorPrimary }}
                  className="px-5 py-2.5 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
