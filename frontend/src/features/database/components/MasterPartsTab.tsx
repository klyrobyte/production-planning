import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Upload,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Cpu,
  Layers,
  Edit2,
  X,
  FileText,
  Trash2
} from 'lucide-react';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useToastStore } from '../../../shared/store/useToastStore';
import type { PartItem, MasterPartsTabProps } from '../context/DatabaseTypes';
import { databaseService } from '../context/DatabaseService';
import api from '../../../shared/lib/axios';

export default function MasterPartsTab({ refreshTrigger }: MasterPartsTabProps) {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  // POLRI IoT QR List state
  const [polriQrList, setPolriQrList] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://api.polri.web.id/api/v1/qr-list')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPolriQrList(data);
      })
      .catch(() => {
        api.get('/api/polri/qr-list').then((res) => {
          if (Array.isArray(res.data)) setPolriQrList(res.data);
        }).catch(() => { });
      });
  }, []);

  const getCleanMachineCode = (lineStr?: string) => {
    if (!lineStr) return '';
    const match = lineStr.match(/mc[-#\s]?(\d+)/i) || lineStr.match(/(\d+)/);
    return match ? `mc${match[1]}` : '';
  };

  const handleAutoFillPolriUrl = (isEdit: boolean, qrCodeOverride?: string) => {
    const targetForm = isEdit ? editForm : manualForm;
    const targetLine = targetForm.home_line;

    // Cari item POLRI QR yang sesuai dari daftar qr-list
    const polriItem = polriQrList.find((q) => q.qr === qrCodeOverride);

    // Ambil kode mesin dari Home Line form, atau jika kosong dari machine_origin milik POLRI QR item
    let mcCode = getCleanMachineCode(targetLine);
    if (!mcCode && polriItem?.machine_origin) {
      mcCode = getCleanMachineCode(polriItem.machine_origin);
    }

    const qr = qrCodeOverride || (polriItem ? polriItem.qr : 'QR-1008');
    const finalMc = mcCode || (polriItem?.machine_origin ? getCleanMachineCode(polriItem.machine_origin) : 'mc1');

    if (!finalMc && !qrCodeOverride) {
      useToastStore.getState().showToast('Pilih Home Line mesin atau pilih QR dari dropdown terlebih dahulu.', 'warning');
      return;
    }

    const generatedUrl = `https://api.polri.web.id/iot/${finalMc}/${qr}`;
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, qr_webhook_url: generatedUrl }));
    } else {
      setManualForm((prev) => ({ ...prev, qr_webhook_url: generatedUrl }));
    }
  };

  // Parts listing state
  const [parts, setParts] = useState<PartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lineFilter, setLineFilter] = useState('ALL');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Active form tab: CSV Upload vs Manual Form
  const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('csv');

  // CSV Drag/Drop & Import States
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<PartItem[]>([]);
  const [parsedCount, setParsedCount] = useState(0);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Revision Modal State
  const [selectedPartForEdit, setSelectedPartForEdit] = useState<PartItem | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({
    area: '',
    tonnage: '',
    backup_line: '',
    home_line: '',
    sebango: '',
    customer: '',
    model: '',
    part_number: '',
    part_name: '',
    material: '',
    weight: '',
    mold: '',
    cavity: '',
    cycle_time: '',
    shikake: '2',
    customer_pno: '',
    customer_sebango: '',
    spec: '6',
    qr_webhook_url: ''
  });

  // Manual Form State
  const [manualForm, setManualForm] = useState<Record<string, string>>({
    area: '',
    tonnage: '',
    backup_line: '',
    home_line: '',
    sebango: '',
    customer: '',
    model: '',
    part_number: '',
    part_name: '',
    material: '',
    weight: '',
    mold: '',
    cavity: '',
    cycle_time: '',
    shikake: '2',
    customer_pno: '',
    customer_sebango: '',
    spec: '6',
    qr_webhook_url: ''
  });

  // Machines state
  const [machines, setMachines] = useState<any[]>([]);

  const fetchMachines = useCallback(async () => {
    try {
      const data = await databaseService.fetchMachines();
      setMachines(data);
    } catch (e) {
      console.error('Failed to fetch machines:', e);
    }
  }, []);

  const fetchParts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await databaseService.fetchParts();
      setParts(data);
    } catch (e) {
      useToastStore.getState().showToast('Gagal memuat master parts database.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParts();
    fetchMachines();
  }, [fetchParts, fetchMachines, refreshTrigger]);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setCsvError('Hanya berkas CSV (.csv) yang didukung.');
      return;
    }

    setCsvError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { parsedParts, count } = databaseService.parseMasterPartsCSV(text, machines);

        if (count === 0) {
          setCsvError('Tidak ada part valid yang ditemukan. Pastikan kolom header sesuai format.');
          setParsedPreview([]);
          setParsedCount(0);
        } else {
          setParsedPreview(parsedParts);
          setParsedCount(count);
          useToastStore.getState().showToast(`Berhasil menganalisis ${count} part dari CSV.`, 'info');
        }
      } catch (err: any) {
        setCsvError(err.message || 'Error parsing file CSV.');
        setParsedPreview([]);
        setParsedCount(0);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setCsvError('Gagal membaca file.');
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleApplyCSV = async () => {
    if (parsedPreview.length === 0) return;
    setIsLoading(true);
    try {
      await databaseService.importPartsBulk(parsedPreview);
      useToastStore.getState().showToast(`Berhasil mengunggah ${parsedPreview.length} part baru ke database.`, 'success');
      setParsedPreview([]);
      setParsedCount(0);
      fetchParts();
    } catch (e: any) {
      console.error(e);
      useToastStore.getState().showToast(e.response?.data?.message || 'Gagal mengimpor part dari CSV.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'home_line') {
      const machine = machines.find(m => m.code === value);
      setManualForm(prev => ({
        ...prev,
        home_line: value,
        tonnage: machine ? (machine.tonnage ? String(machine.tonnage) : '') : '',
        area: machine ? (machine.factory_code ? String(machine.factory_code) : '') : ''
      }));
    } else {
      setManualForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddManualPart = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
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
      spec
    } = manualForm;

    if (!part_number || !part_name || !model || !customer || !sebango) {
      useToastStore.getState().showToast('Semua kolom identitas bertanda bintang (*) wajib diisi.', 'warning');
      return;
    }

    const payload: PartItem = {
      area: area.trim(),
      tonnage: tonnage.trim(),
      backup_line: backup_line.trim() || home_line.trim(),
      home_line: home_line.trim(),
      sebango: sebango.trim(),
      customer: customer.trim(),
      model: model.trim(),
      part_number: part_number.trim(),
      part_name: part_name.trim(),
      material: material.trim(),
      weight: parseFloat(weight) || 0,
      mold: mold.trim(),
      cavity: parseFloat(cavity) || 1,
      cycle_time: parseFloat(cycle_time) || 60,
      shikake: parseInt(shikake) || 2,
      customer_pno: customer_pno.trim(),
      customer_sebango: customer_sebango.trim(),
      spec: parseInt(spec) || 6,
      process: 'injection',
      qr_webhook_url: manualForm.qr_webhook_url?.trim() || undefined
    };

    setIsLoading(true);
    try {
      await databaseService.createPart(payload);
      useToastStore.getState().showToast(`Part ${part_number} berhasil disimpan.`, 'success');
      setManualForm({
        area: '',
        tonnage: '',
        backup_line: '',
        home_line: '',
        sebango: '',
        customer: '',
        model: '',
        part_number: '',
        part_name: '',
        material: '',
        weight: '',
        mold: '',
        cavity: '',
        cycle_time: '',
        shikake: '2',
        customer_pno: '',
        customer_sebango: '',
        spec: '6',
        qr_webhook_url: ''
      });
      fetchParts();
    } catch (err: any) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Gagal menyimpan master part.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = (part: PartItem) => {
    setSelectedPartForEdit(part);
    setEditForm({
      area: part.area || '',
      tonnage: part.tonnage || '',
      backup_line: part.backup_line || '',
      home_line: part.home_line || '',
      sebango: part.sebango || '',
      customer: part.customer || '',
      model: part.model || '',
      part_number: part.part_number || '',
      part_name: part.part_name || '',
      material: part.material || '',
      weight: part.weight?.toString() || '0',
      mold: part.mold || '',
      cavity: part.cavity?.toString() || '1',
      cycle_time: part.cycle_time?.toString() || '60',
      shikake: part.shikake?.toString() || '2',
      customer_pno: part.customer_pno || '',
      customer_sebango: part.customer_sebango || '',
      spec: part.spec?.toString() || '6',
      qr_webhook_url: part.qr_webhook_url || ''
    });
  };

  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'home_line') {
      const machine = machines.find(m => m.code === value);
      setEditForm(prev => ({
        ...prev,
        home_line: value,
        tonnage: machine ? (machine.tonnage ? String(machine.tonnage) : '') : '',
        area: machine ? (machine.factory_code ? String(machine.factory_code) : '') : ''
      }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartForEdit) return;

    const {
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
      qr_webhook_url
    } = editForm;

    if (!part_number || !part_name || !model || !customer || !sebango) {
      useToastStore.getState().showToast('Semua kolom identitas bertanda bintang (*) wajib diisi.', 'warning');
      return;
    }

    const payload: PartItem = {
      ...selectedPartForEdit,
      area: area.trim(),
      tonnage: tonnage.trim(),
      backup_line: backup_line.trim() || home_line.trim(),
      home_line: home_line.trim(),
      sebango: sebango.trim(),
      customer: customer.trim(),
      model: model.trim(),
      part_number: part_number.trim(),
      part_name: part_name.trim(),
      material: material.trim(),
      weight: parseFloat(weight) || 0,
      mold: mold.trim(),
      cavity: parseFloat(cavity) || 1,
      cycle_time: parseFloat(cycle_time) || 60,
      shikake: parseInt(shikake) || 2,
      customer_pno: customer_pno.trim(),
      customer_sebango: customer_sebango.trim(),
      spec: parseInt(spec) || 6,
      process: 'injection',
      qr_webhook_url: qr_webhook_url?.trim() || undefined
    };

    setIsLoading(true);
    try {
      await databaseService.createPart(payload);
      useToastStore.getState().showToast(`Revisi part ${part_number} berhasil disimpan.`, 'success');
      setSelectedPartForEdit(null);
      fetchParts();
    } catch (err: any) {
      useToastStore.getState().showToast(err.response?.data?.message || 'Gagal menyimpan perubahan part.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePart = async (partNumber: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus part "${partNumber}" dari database? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsLoading(true);
    try {
      await databaseService.deletePart(partNumber);
      useToastStore.getState().showToast(`Part "${partNumber}" berhasil dihapus.`, 'success');
      fetchParts();
    } catch (err: any) {
      console.error('Failed to delete part:', err);
      useToastStore.getState().showToast(err.response?.data?.message || 'Gagal menghapus part.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const linesSet = new Set(parts.map(p => p.home_line).filter(Boolean));
    const modelsSet = new Set(parts.map(p => p.model).filter(Boolean));
    return {
      totalParts: parts.length,
      totalLines: linesSet.size,
      totalModels: modelsSet.size
    };
  }, [parts]);

  // Filters setup
  const uniqueLines = useMemo(() => {
    const lines = Array.from(new Set(parts.map(p => p.home_line).filter(Boolean)));
    return lines.sort();
  }, [parts]);

  const uniqueModels = useMemo(() => {
    const models = Array.from(new Set(parts.map(p => p.model).filter(Boolean)));
    return models.sort();
  }, [parts]);

  // Filtering + Searching logic (Delegated to databaseService)
  const filteredParts = useMemo(() => {
    return databaseService.filterMasterParts(parts, searchTerm, 'ALL', lineFilter).filter(part => {
      return modelFilter === 'ALL' || part.model === modelFilter;
    });
  }, [parts, searchTerm, lineFilter, modelFilter]);

  // Pagination logic (Delegated to databaseService)
  const { paginatedItems: paginatedParts, totalPages } = useMemo(() => {
    return databaseService.paginateItems(filteredParts, currentPage, itemsPerPage);
  }, [filteredParts, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 dark:opacity-5 group-hover:opacity-20 transition-opacity">
            <Cpu className="w-14 h-14 text-[#E76114]" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-extrabold uppercase tracking-wider">Total Master Parts</div>
          <div className="text-3xl font-black text-[#E76114] mt-2 tracking-tight">
            {stats.totalParts}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-bold mt-1">Komponen injection yang terdaftar</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 dark:opacity-5 group-hover:opacity-20 transition-opacity">
            <Layers className="w-14 h-14 text-emerald-650" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-extrabold uppercase tracking-wider">Production Lines Mapped</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-450 mt-2 tracking-tight">
            {stats.totalLines}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-bold mt-1">Line produksi aktif terpetakan</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 dark:opacity-5 group-hover:opacity-20 transition-opacity">
            <FileSpreadsheet className="w-14 h-14 text-blue-500" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-extrabold uppercase tracking-wider">Car Models Mapped</div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-450 mt-2 tracking-tight">
            {stats.totalModels}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-bold mt-1">Model kendaraan unik</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Import / Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Form Tabs */}
            <div className="flex bg-slate-50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800/80 p-1.5 gap-1">
              <button
                onClick={() => setActiveTab('csv')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${activeTab === 'csv'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/50'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
              >
                <Upload className="w-3.5 h-3.5" />
                CSV Import
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${activeTab === 'manual'
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
              {activeTab === 'csv' && (
                <div className="space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-white">Format Header Spreadsheet</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Kolom berkas CSV harus sesuai dengan format header berikut:
                      </p>
                      <div className="bg-slate-200 dark:bg-slate-900 p-2 rounded text-[8.5px] font-mono text-slate-700 dark:text-slate-300 mt-2 leading-relaxed break-all">
                        AREA, TONNASE, BACKUP_LINE, HOME_LINE, SEBANGO, CUSTOMER, MODEL, PART_NUMBER, PART_NAME, MATERIAL_NAME, WEIGHT_KG, MOLD_NO, CAVITY, CYCLE_TIME_SEC
                      </div>
                    </div>
                  </div>

                  {/* Dropzone Area */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCSVUpload}
                    accept=".csv"
                    className="hidden"
                  />
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileDialog}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${isDragOver
                      ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-inner'
                      : parsedPreview.length > 0
                        ? 'border-emerald-350 bg-emerald-50/5 dark:bg-emerald-950/5'
                        : 'border-slate-300 dark:border-slate-700 hover:border-[#E76114] hover:bg-slate-50/50 dark:hover:bg-slate-955/50'
                      }`}
                  >
                    {isUploading ? (
                      <div className="space-y-3">
                        <RefreshCw className="w-10 h-10 text-slate-400 animate-spin mx-auto" />
                        <p className="text-xs font-bold text-slate-500 dark:text-white">Menganalisis konten file...</p>
                      </div>
                    ) : parsedPreview.length > 0 ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">CSV Siap Diunggah</h4>
                        <p className="text-[10px] text-slate-500 dark:text-white uppercase font-semibold">
                          {parsedCount} Part terdeteksi
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-full bg-[#E76114]/10 text-[#E76114] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-white">Tarik & lepas file CSV di sini</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">atau klik untuk membuka browser file</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {csvError && (
                    <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-250 rounded-xl p-3.5 text-rose-800 dark:text-rose-400 text-[11px] font-medium flex items-center gap-2.5">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                      <span>{csvError}</span>
                    </div>
                  )}

                  {/* CSV Preview */}
                  {parsedPreview.length > 0 && (
                    <div className="space-y-4 pt-1 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Preview (5 Part Pertama)</h5>
                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200/50 dark:border-emerald-900/50">
                          Siap Disimpan
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        {parsedPreview.slice(0, 5).map((part, index) => (
                          <div key={index} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors flex justify-between items-center text-[10px]">
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="font-extrabold text-slate-800 dark:text-white">{part.part_number}</span>
                              <span className="text-slate-500 dark:text-slate-400 font-medium max-w-[200px] truncate">{part.part_name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-200/50 dark:border-emerald-900/50 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                                {part.home_line || 'UNASSIGNED'}
                              </span>
                              <div className="text-slate-400 dark:text-slate-500 text-[8px] mt-0.5 font-bold uppercase tracking-wider font-mono">
                                Cavity: {part.cavity} | Shikake: {part.shikake}x | {part.weight}kg
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleApplyCSV}
                        style={{ backgroundColor: colorPrimary }}
                        className="w-full flex items-center justify-center gap-2 py-3 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-md hover:opacity-95 active:scale-[0.99] cursor-pointer"
                      >
                        Terapkan Master Parts ({parsedCount})
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Entry Form */}
              {activeTab === 'manual' && (
                <form onSubmit={handleAddManualPart} className="space-y-4 text-left">
                  {/* Identity Grid */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white flex items-center">
                        Part Number <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        name="part_number"
                        required
                        value={manualForm.part_number}
                        onChange={handleManualInput}
                        placeholder="e.g., 52159-BZ290"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white flex items-center">
                        Sebango / ID <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        name="sebango"
                        required
                        value={manualForm.sebango}
                        onChange={handleManualInput}
                        placeholder="e.g., W12"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white flex items-center">
                      Part Name <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      name="part_name"
                      required
                      value={manualForm.part_name}
                      onChange={handleManualInput}
                      placeholder="e.g., BUMPER REAR"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white flex items-center">
                        Vehicle Model <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        name="model"
                        required
                        value={manualForm.model}
                        onChange={handleManualInput}
                        placeholder="e.g., D80D"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white flex items-center">
                        Customer / Buyer <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        name="customer"
                        required
                        value={manualForm.customer}
                        onChange={handleManualInput}
                        placeholder="e.g., ADM"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Customer specific mappings */}
                  <div className="grid grid-cols-2 gap-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Customer Part No</label>
                      <input
                        type="text"
                        name="customer_pno"
                        value={manualForm.customer_pno}
                        onChange={handleManualInput}
                        placeholder="e.g. 52159-BZ290-00"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Customer Sebango</label>
                      <input
                        type="text"
                        name="customer_sebango"
                        value={manualForm.customer_sebango}
                        onChange={handleManualInput}
                        placeholder="e.g. W12-Cust"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Machine Routing Grid */}
                  <div className="grid grid-cols-2 gap-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white flex items-center">
                        Home Line (Mesin)
                      </label>
                      <select
                        name="home_line"
                        value={manualForm.home_line}
                        onChange={handleManualInput}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                      >
                        <option value="">-- Pilih Mesin --</option>
                        {machines.map((m) => (
                          <option key={m.id} value={m.code}>
                            {m.code} ({m.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Backup Line (Mesin)</label>
                      <select
                        name="backup_line"
                        value={manualForm.backup_line}
                        onChange={handleManualInput}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                      >
                        <option value="">-- Pilih Mesin --</option>
                        {machines.map((m) => (
                          <option key={m.id} value={m.code}>
                            {m.code} ({m.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Machine Area</label>
                      <input
                        type="text"
                        name="area"
                        value={manualForm.area}
                        readOnly
                        placeholder="Pilih Home Line"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Machine Tonnage</label>
                      <input
                        type="text"
                        name="tonnage"
                        value={manualForm.tonnage}
                        readOnly
                        placeholder="Pilih Home Line"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Mold parameters */}
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Cycle Time Sec</label>
                      <input
                        type="number"
                        name="cycle_time"
                        value={manualForm.cycle_time}
                        onChange={handleManualInput}
                        placeholder="60"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-bold font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Cavity</label>
                      <input
                        type="number"
                        name="cavity"
                        value={manualForm.cavity}
                        onChange={handleManualInput}
                        placeholder="1"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Shikake (runs)</label>
                      <input
                        type="number"
                        name="shikake"
                        value={manualForm.shikake}
                        onChange={handleManualInput}
                        placeholder="2"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Mold No</label>
                      <input
                        type="text"
                        name="mold"
                        value={manualForm.mold}
                        onChange={handleManualInput}
                        placeholder="e.g. M-101"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Weight (KG)</label>
                      <input
                        type="text"
                        name="weight"
                        value={manualForm.weight}
                        onChange={handleManualInput}
                        placeholder="e.g. 5.2"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-bold font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Qty per Kanban</label>
                      <input
                        type="number"
                        name="spec"
                        value={manualForm.spec}
                        onChange={handleManualInput}
                        placeholder="6"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Material Name</label>
                    <input
                      type="text"
                      name="material"
                      value={manualForm.material}
                      onChange={handleManualInput}
                      placeholder="e.g. PP TSOP-7"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">
                        IoT Webhook URL (QR Listener)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAutoFillPolriUrl(false)}
                        className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        ⚡ Auto-Generate POLRI URL
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="qr_webhook_url"
                        value={manualForm.qr_webhook_url || ''}
                        onChange={handleManualInput}
                        placeholder="https://api.polri.web.id/iot/mc6/QR-1008"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-mono text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary"
                      />
                      {polriQrList.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleAutoFillPolriUrl(false, e.target.value);
                          }}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-2 text-[10px] font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[130px]"
                          defaultValue=""
                        >
                          <option value="">Pilih POLRI QR...</option>
                          {polriQrList.map((item: any) => (
                            <option key={item.id || item.qr} value={item.qr}>
                              {item.qr} {item.machine_origin ? `[${item.machine_origin}]` : ''} - {item.part_name || 'POLRI'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 block">
                      e.g. https://api.polri.web.id/iot/mc6/QR-1004
                    </span>
                  </div>

                  <button
                    type="submit"
                    style={{ backgroundColor: colorPrimary }}
                    className="w-full py-3 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-md hover:opacity-95 active:scale-[0.99] cursor-pointer text-center"
                  >
                    Simpan Master Part
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Table & Filters */}
        <div className="lg:col-span-7 space-y-6">
          {/* Table Filters */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Cari part number, nama, model..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={lineFilter}
                onChange={(e) => { setLineFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary cursor-pointer"
              >
                <option value="ALL">Semua Lines</option>
                {uniqueLines.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>

              <select
                value={modelFilter}
                onChange={(e) => { setModelFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary cursor-pointer"
              >
                <option value="ALL">Semua Models</option>
                {uniqueModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                    <th className="px-6 py-4">Part Info</th>
                    <th className="px-6 py-4">Routing Line</th>
                    <th className="px-6 py-4">Spec</th>
                    <th className="px-6 py-4">IoT Webhook URL</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-[#E76114]" />
                          <span>Memproses data master parts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Tidak ada part ditemukan di database.
                      </td>
                    </tr>
                  ) : (
                    paginatedParts.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-left">
                          <div className="font-extrabold font-mono text-slate-900 dark:text-white">{part.part_number}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[280px] truncate">{part.part_name}</div>
                          <div className="flex gap-2 mt-1.5 font-bold uppercase tracking-wider text-[8.5px]">
                            <span className="text-[#E76114]">{part.customer}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-slate-500 dark:text-slate-400">{part.model}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-slate-400 dark:text-slate-500 font-mono">Sebango: {part.sebango || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="font-bold text-slate-800 dark:text-white">{part.home_line || '-'}</div>
                          {part.backup_line && part.backup_line !== part.home_line && (
                            <div className="text-[9px] text-slate-400 dark:text-slate-400 mt-0.5">Backup: {part.backup_line}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="font-bold text-slate-700 dark:text-slate-300">CT: {part.cycle_time}s</div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-400 mt-0.5 font-mono">Cavity: {part.cavity} | Shikake: {part.shikake}x</div>
                        </td>
                        <td className="px-6 py-4 text-left max-w-xs truncate font-mono text-[10px]">
                          {part.qr_webhook_url ? (
                            <span className="bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400" title={part.qr_webhook_url}>
                              {part.qr_webhook_url}
                            </span>
                          ) : (
                            <span className="italic text-slate-400 dark:text-slate-600 text-[9px]">- Belum diatur -</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(part)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                              title="Revisi Data Part"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePart(part.part_number)}
                              disabled={isLoading}
                              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                              title="Hapus Part"
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">
                  Menampilkan {Math.min(filteredParts.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredParts.length, currentPage * itemsPerPage)} dari {filteredParts.length} data
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revision Modal Dialog */}
      {selectedPartForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-[#E76114] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5" />
                <div className="text-left">
                  <h3 className="font-bold text-sm tracking-wide">Revisi Spesifikasi & Routing Part</h3>
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-0.5 font-mono">{selectedPartForEdit.part_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartForEdit(null)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRevision} className="p-6 space-y-5 overflow-y-auto text-left">
              {/* Part Identity Group */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <div className="text-[10px] font-extrabold text-[#E76114] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  Identitas Part
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Part Number *</label>
                    <input
                      type="text"
                      name="part_number"
                      required
                      value={editForm.part_number}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Sebango / Unique ID *</label>
                    <input
                      type="text"
                      name="sebango"
                      required
                      value={editForm.sebango}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Part Name *</label>
                  <input
                    type="text"
                    name="part_name"
                    required
                    value={editForm.part_name}
                    onChange={handleEditInput}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Vehicle Model *</label>
                    <input
                      type="text"
                      name="model"
                      required
                      value={editForm.model}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Customer *</label>
                    <input
                      type="text"
                      name="customer"
                      required
                      value={editForm.customer}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Customer mappings */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Customer Part Number</label>
                    <input
                      type="text"
                      name="customer_pno"
                      value={editForm.customer_pno}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Customer Sebango</label>
                    <input
                      type="text"
                      name="customer_sebango"
                      value={editForm.customer_sebango}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">
                      IoT Webhook URL (QR Listener)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoFillPolriUrl(true)}
                      className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ⚡ Auto-Generate POLRI URL
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="qr_webhook_url"
                      value={editForm.qr_webhook_url || ''}
                      onChange={handleEditInput}
                      placeholder="https://api.polri.web.id/iot/mc6/QR-1008"
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-mono text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary"
                    />
                    {polriQrList.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleAutoFillPolriUrl(true, e.target.value);
                        }}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-2 text-[10px] font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[130px]"
                        defaultValue=""
                      >
                        <option value="">Pilih POLRI QR...</option>
                        {polriQrList.map((item: any) => (
                          <option key={item.id || item.qr} value={item.qr}>
                            {item.qr} {item.machine_origin ? `[${item.machine_origin}]` : ''} - {item.part_name || 'POLRI'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 block">
                    e.g. https://api.polri.web.id/iot/mc6/QR-1004
                  </span>
                </div>
              </div>

              {/* Machine Routing Group */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <div className="text-[10px] font-extrabold text-[#E76114] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  Routing Mesin
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Home Line</label>
                    <select
                      name="home_line"
                      value={editForm.home_line}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary cursor-pointer font-bold"
                    >
                      <option value="">-- Pilih Mesin --</option>
                      {machines.map((m) => (
                        <option key={m.id} value={m.code}>
                          {m.code} ({m.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Backup Line</label>
                    <select
                      name="backup_line"
                      value={editForm.backup_line}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary cursor-pointer"
                    >
                      <option value="">-- Pilih Mesin --</option>
                      {machines.map((m) => (
                        <option key={m.id} value={m.code}>
                          {m.code} ({m.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Machine Area</label>
                    <input
                      type="text"
                      name="area"
                      value={editForm.area}
                      readOnly
                      placeholder="Pilih Home Line"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Machine Tonnage</label>
                    <input
                      type="text"
                      name="tonnage"
                      value={editForm.tonnage}
                      readOnly
                      placeholder="Pilih Home Line"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Mold Parameters Group */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <div className="text-[10px] font-extrabold text-blue-650 dark:text-blue-455 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5 mb-1">
                  <Cpu className="w-3.5 h-3.5" />
                  Cetakan & Parameter Proses
                </div>
                <div className="grid grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Cycle Time Sec</label>
                    <input
                      type="number"
                      name="cycle_time"
                      value={editForm.cycle_time}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Cavity</label>
                    <input
                      type="number"
                      name="cavity"
                      value={editForm.cavity}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Shikake (runs)</label>
                    <input
                      type="number"
                      name="shikake"
                      value={editForm.shikake}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Mold No</label>
                    <input
                      type="text"
                      name="mold"
                      value={editForm.mold}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Weight (KG)</label>
                    <input
                      type="text"
                      name="weight"
                      value={editForm.weight}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Qty per Kanban</label>
                    <input
                      type="number"
                      name="spec"
                      value={editForm.spec}
                      onChange={handleEditInput}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">Material Name</label>
                  <input
                    type="text"
                    name="material"
                    value={editForm.material}
                    onChange={handleEditInput}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedPartForEdit(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer dark:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: colorPrimary }}
                  className="px-5 py-2.5 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Simpan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
