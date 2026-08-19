import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSiteConfigContext } from '../context/SiteConfigContext';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import api from '../../../shared/lib/axios';

interface TestResult {
  targetUrl: string;
  targetLabel: string;
  ok: boolean;
  status: number;
  statusText: string;
  latencyMs: number;
  contentType?: string;
  data?: any;
  error?: string;
}

export default function SiteConfigQrWebhookForm() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const {
    qrDomainInput,
    setQrDomainInput,
    qrListEpInput,
    setQrListEpInput,
    mcListEpInput,
    setMcListEpInput,
    iotEpInput,
    setIotEpInput,
    isSavingWebhook,
    handleSaveWebhook,
  } = useSiteConfigContext();

  // Test Endpoint States
  const [testingEndpointLabel, setTestingEndpointLabel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // POLRI / IoT QR & MC List State for Site Config Preview & Dropdown
  const [polriQrList, setPolriQrList] = useState<any[]>([]);
  const [polriMcList, setPolriMcList] = useState<any>(null);
  const [selectedQrCode, setSelectedQrCode] = useState<string>('');
  const [isFetchingIot, setIsFetchingIot] = useState(false);

  const fetchIotList = useCallback(async () => {
    setIsFetchingIot(true);
    try {
      const [qrRes, mcRes] = await Promise.allSettled([
        api.get(`/polri/qr-list?t=${Date.now()}`),
        api.get(`/polri/mc-list?t=${Date.now()}`)
      ]);

      if (qrRes.status === 'fulfilled') {
        const rawData = qrRes.value.data;
        const items = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
        if (Array.isArray(items)) setPolriQrList(items);
      }

      if (mcRes.status === 'fulfilled') {
        setPolriMcList(mcRes.value.data);
      }
    } catch (err) {
      console.error('Failed to fetch Site Config IoT list:', err);
    } finally {
      setIsFetchingIot(false);
    }
  }, []);

  useEffect(() => {
    fetchIotList();
  }, [fetchIotList]);

  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');

  // Compute all available QR options by extracting mc-list FIRST, then matching part_name from qr-list
  const qrOptions = useMemo(() => {
    // 1. Build lookup map from qr-list for part_name (uppercase qr -> part_name)
    const qrToPartNameMap = new Map<string, string>();
    const rawQrList: any[] = Array.isArray(polriQrList)
      ? polriQrList
      : (polriQrList && Array.isArray((polriQrList as any).data) ? (polriQrList as any).data : []);

    rawQrList.forEach((item: any) => {
      if (!item || !item.qr) return;
      const qrCode = String(item.qr).trim();
      const partName = item.part_name || item.name || item.partName || '';
      if (qrCode && partName) {
        qrToPartNameMap.set(qrCode.toUpperCase(), partName);
      }
    });

    // 2. Step 1: Extract machines & QRs from mc-list FIRST
    const machinesList: Array<{ mc: string; factory: string; machine_name: string; qr_origin?: any }> = [];

    if (polriMcList) {
      if (Array.isArray(polriMcList)) {
        machinesList.push(...polriMcList);
      } else if (Array.isArray(polriMcList?.data)) {
        machinesList.push(...polriMcList.data);
      } else if (typeof polriMcList === 'object') {
        const factoriesObj = polriMcList.factories || (polriMcList.data ? polriMcList.data.factories : null);
        if (factoriesObj && typeof factoriesObj === 'object') {
          Object.entries(factoriesObj).forEach(([factName, mcArray]: [string, any]) => {
            if (Array.isArray(mcArray)) {
              mcArray.forEach((m: any) => {
                machinesList.push({
                  mc: m.mc || m.machine_code || 'MC#1',
                  factory: m.factory || factName || 'Factory 2',
                  machine_name: m.machine_name || m.name || 'Machine',
                  qr_origin: m.qr_origin
                });
              });
            }
          });
        }
      }
    }

    const map = new Map<string, { qr: string; mc: string; factory: string; partName: string; label: string }>();

    machinesList.forEach((mcItem) => {
      if (!mcItem || !mcItem.qr_origin) return;

      let qrCodes: string[] = [];
      if (Array.isArray(mcItem.qr_origin)) {
        qrCodes = mcItem.qr_origin.map((s: any) => String(s).trim());
      } else if (typeof mcItem.qr_origin === 'string') {
        qrCodes = mcItem.qr_origin.split(',').map((s) => s.trim());
      }

      qrCodes.forEach((qrCode) => {
        if (!qrCode) return;
        const upperQr = qrCode.toUpperCase();

        // Step 2: Lookup part_name from qr-list
        const partName = qrToPartNameMap.get(upperQr) || mcItem.machine_name || 'Part IoT';
        const label = `${partName} | ${qrCode}`;

        map.set(upperQr, {
          qr: qrCode,
          mc: mcItem.mc,
          factory: mcItem.factory,
          partName,
          label,
        });
      });
    });

    // Fallback: Also include orphan QRs in qr-list not in mc-list
    rawQrList.forEach((item: any) => {
      if (!item || !item.qr) return;
      const qrCode = String(item.qr).trim();
      const upperQr = qrCode.toUpperCase();

      if (!map.has(upperQr)) {
        const mc = item.machine_origin || item.mc || 'MC#1';
        const factory = item.factory || 'Factory 2';
        const partName = item.part_name || item.name || 'Part IoT';
        const label = `${partName} | ${qrCode}`;

        map.set(upperQr, {
          qr: qrCode,
          mc,
          factory,
          partName,
          label,
        });
      }
    });

    const list = Array.from(map.values());
    return list.sort((a, b) => a.qr.localeCompare(b.qr, undefined, { numeric: true }));
  }, [polriQrList, polriMcList]);

  // Unique Machines List for Machine Filter Dropdown
  const uniqueMachines = useMemo(() => {
    const set = new Set<string>();
    qrOptions.forEach((o) => {
      if (o.mc) set.add(o.mc);
    });
    return Array.from(set).sort();
  }, [qrOptions]);

  // Filtered QR Options based on selected Machine Filter
  const filteredQrOptions = useMemo(() => {
    if (selectedMachineFilter === 'ALL') return qrOptions;
    return qrOptions.filter((o) => o.mc === selectedMachineFilter);
  }, [qrOptions, selectedMachineFilter]);

  // Find selected QR item
  const activeQrItem = useMemo(() => {
    if (selectedQrCode) {
      const found = qrOptions.find((o) => o.qr === selectedQrCode);
      if (found) return found;
    }
    if (filteredQrOptions.length > 0) return filteredQrOptions[0];
    return qrOptions[0] || null;
  }, [selectedQrCode, qrOptions, filteredQrOptions]);

  // Construct dynamic live preview URL based on active form inputs and selected QR item
  const cleanDomain = (qrDomainInput || 'https://api.polri.web.id').trim().replace(/\/+$/, '');
  const pattern = (iotEpInput || '/iot/{mc}/{factory}/{qr}').trim();
  const sampleMc = activeQrItem ? activeQrItem.mc : 'MC#6';
  const sampleFactory = activeQrItem ? activeQrItem.factory : 'Factory 2';
  const sampleQr = activeQrItem ? activeQrItem.qr : 'QR-1004';

  const samplePath = pattern
    .replace('{mc}', encodeURIComponent(sampleMc))
    .replace('{factory}', encodeURIComponent(sampleFactory))
    .replace('{qr}', encodeURIComponent(sampleQr));
  const livePreviewUrl = `${cleanDomain}${samplePath.startsWith('/') ? '' : '/'}${samplePath}`;

  const qrListUrl = `${cleanDomain}${qrListEpInput.startsWith('/') ? '' : '/'}${qrListEpInput.trim()}`;
  const mcListUrl = `${cleanDomain}${mcListEpInput.startsWith('/') ? '' : '/'}${mcListEpInput.trim()}`;

  // Execute endpoint connectivity test via backend proxy
  const handleTestConnection = async (targetUrl: string, label: string) => {
    setTestingEndpointLabel(label);
    setTestResult(null);
    try {
      const response = await api.post('/site-config/test-endpoint', { url: targetUrl });
      const resData = response.data;
      setTestResult({
        targetUrl,
        targetLabel: label,
        ok: resData.ok ?? false,
        status: resData.status ?? 0,
        statusText: resData.statusText || (resData.ok ? 'OK' : 'Error'),
        latencyMs: resData.latencyMs ?? 0,
        contentType: resData.contentType,
        data: resData.data,
        error: resData.error,
      });
    } catch (err: any) {
      setTestResult({
        targetUrl,
        targetLabel: label,
        ok: false,
        status: err.response?.status || 0,
        statusText: err.response?.statusText || 'Request Error',
        latencyMs: 0,
        error: err.response?.data?.error || err.message || 'Gagal menghubungi server tes.',
      });
    } finally {
      setTestingEndpointLabel(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden transition-colors">
      {/* Header Banner */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: colorPrimary }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Konfigurasi Server Webhook & IoT QR
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Atur domain API dan pattern endpoint tempat sistem melakukan polling status scan QR mesin secara real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-6 space-y-5">
        {/* Domain Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Domain API Server IoT
          </label>
          <input
            type="url"
            value={qrDomainInput}
            onChange={(e) => setQrDomainInput(e.target.value)}
            placeholder="https://api.polri.web.id"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Domain utama backend IoT API (contoh: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">https://api.polri.web.id</code> atau domain internal pabrik).
          </p>
        </div>

        {/* Endpoints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Endpoint QR List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Endpoint QR List
              </label>
              <button
                type="button"
                onClick={() => handleTestConnection(qrListUrl, 'QR List')}
                disabled={testingEndpointLabel !== null}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              >
                {testingEndpointLabel === 'QR List' ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Mengecek...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Tes Endpoint</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={qrListEpInput}
              onChange={(e) => setQrListEpInput(e.target.value)}
              placeholder="/api/v1/qr-list"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Endpoint daftar master QR (default: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">/api/v1/qr-list</code>).
            </p>
          </div>

          {/* Endpoint MC List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Endpoint MC List
              </label>
              <button
                type="button"
                onClick={() => handleTestConnection(mcListUrl, 'MC List')}
                disabled={testingEndpointLabel !== null}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              >
                {testingEndpointLabel === 'MC List' ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Mengecek...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Tes Endpoint</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={mcListEpInput}
              onChange={(e) => setMcListEpInput(e.target.value)}
              placeholder="/api/v1/mc-list"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Endpoint daftar mesin & factory (default: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">/api/v1/mc-list</code>).
            </p>
          </div>
        </div>

        {/* Pattern IoT Endpoint */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Pattern Endpoint IoT QR Status
          </label>
          <input
            type="text"
            value={iotEpInput}
            onChange={(e) => setIotEpInput(e.target.value)}
            placeholder="/iot/{mc}/{factory}/{qr}"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-mono"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Gunakan placeholder <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded font-bold">{'{mc}'}</code>,{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded font-bold">{'{factory}'}</code>, dan{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded font-bold">{'{qr}'}</code> untuk variabel URL IoT.
          </p>
        </div>
        {/* IoT QR & MC List Selector Dropdown Section */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span>🎯 Selector Pemilihan Mesin & QR (MC-List & QR-List)</span>
              {qrOptions.length > 0 && (
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  {qrOptions.length} QR Terdeteksi ({uniqueMachines.length} Mesin)
                </span>
              )}
            </label>
            <button
              type="button"
              onClick={fetchIotList}
              disabled={isFetchingIot}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isFetchingIot ? '🔄 Fetching Data...' : '🔄 Refresh QR & MC List'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Filter by Machine */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Filter Mesin / Line:
              </label>
              <select
                value={selectedMachineFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMachineFilter(val);
                  const firstOfMc = qrOptions.find((o) => val === 'ALL' || o.mc === val);
                  if (firstOfMc) setSelectedQrCode(firstOfMc.qr);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer shadow-sm"
              >
                <option value="ALL">-- Semua Mesin ({uniqueMachines.length} Mesin) --</option>
                {uniqueMachines.map((mcCode) => (
                  <option key={mcCode} value={mcCode}>
                    Mesin {mcCode}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by QR Code */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Pilih QR Code ({filteredQrOptions.length} Opsi):
              </label>
              <select
                value={activeQrItem?.qr || ''}
                onChange={(e) => setSelectedQrCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer shadow-sm"
              >
                {filteredQrOptions.map((opt) => (
                  <option key={opt.qr} value={opt.qr}>
                    {opt.partName} | {opt.qr} (Mesin {opt.mc} - {opt.factory})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeQrItem && (
            <div className="text-[11px] bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 text-xs">
                  {activeQrItem.qr}
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-bold">
                  Mesin: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{activeQrItem.mc}</strong> ({activeQrItem.factory})
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                Part / Deskripsi IoT: <strong className="text-slate-800 dark:text-slate-100 font-bold">{activeQrItem.partName}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Live URL Preview Card & Test Button */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Preview Target Polling URL
            </span>
            <button
              type="button"
              onClick={() => handleTestConnection(livePreviewUrl, 'Sample IoT URL')}
              disabled={testingEndpointLabel !== null}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {testingEndpointLabel === 'Sample IoT URL' ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Mengecek Sample URL...</span>
                </>
              ) : (
                <>
                  <span>⚡ Tes Respon Sample URL</span>
                </>
              )}
            </button>
          </div>
          <p className="font-mono text-xs text-slate-100 break-all select-all pt-1">
            {livePreviewUrl}
          </p>
        </div>

        {/* Test Connection Response Result Viewer Card */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border transition-all space-y-3 ${
              testResult.ok
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-100'
            }`}
          >
            {/* Result Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <span
                  className={`px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wide ${
                    testResult.ok
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-rose-600 text-white shadow-sm'
                  }`}
                >
                  {testResult.ok ? `HTTP ${testResult.status} ${testResult.statusText}` : `FAIL ${testResult.status > 0 ? testResult.status : ''}`}
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  Respon Endpoint ({testResult.targetLabel})
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                {testResult.latencyMs > 0 && (
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded">
                    ⚡ {testResult.latencyMs} ms
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setTestResult(null)}
                  className="text-slate-400 hover:text-white transition font-bold"
                  title="Tutup Respon"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Target URL Info */}
            <p className="text-[11px] font-mono text-slate-400 break-all">
              Target: <span className="text-slate-200">{testResult.targetUrl}</span>
            </p>

            {/* Error Message if connection failed */}
            {testResult.error && (
              <div className="p-2.5 rounded-lg bg-rose-900/40 border border-rose-500/30 text-rose-200 text-xs font-medium">
                ⚠️ {testResult.error}
              </div>
            )}

            {/* JSON / Text Response Body Viewer */}
            {testResult.data !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium">Data Respon Body:</span>
                  {testResult.contentType && (
                    <span className="font-mono text-[10px] text-slate-500">{testResult.contentType}</span>
                  )}
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950/90 text-slate-200 font-mono text-xs overflow-x-auto max-h-64 border border-slate-800 leading-relaxed shadow-inner">
                  {typeof testResult.data === 'object'
                    ? JSON.stringify(testResult.data, null, 2)
                    : String(testResult.data)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveWebhook}
            disabled={isSavingWebhook}
            style={{ backgroundColor: colorPrimary }}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50 transition flex items-center space-x-2 cursor-pointer"
          >
            {isSavingWebhook ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Simpan Konfigurasi Webhook</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
