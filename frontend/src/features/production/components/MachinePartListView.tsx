import React, { useMemo, useState, useEffect } from 'react';
import { PackageSearch, ArrowRight, ShieldCheck, Plus, X, Calendar, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useProduction, getUniqueMachineKey, machinesMatch } from '../context/ProductionContext';
import type { Job } from '../context/ProductionContext';
import api from '../../../shared/lib/axios';

interface MachinePartListViewProps {
  machine: string;
  factory: string;
  machineKey?: string;
  selectedDate?: string;
}

// Displays registered parts and schedules them for production queue
export function MachinePartListView({ machine, factory, machineKey: propsMachineKey, selectedDate }: MachinePartListViewProps) {
  const activePortal = useAuthStore(state => state.activePortal);
  const canEditPattern = activePortal === 'super-admin' || activePortal === 'planner' || activePortal === 'leader';
  const machineKey = propsMachineKey || getUniqueMachineKey(factory, machine);

  const {
    machineJobs,
    reorderMachineJobs
  } = useProduction();

  const activeDate = selectedDate || new Date().toISOString().slice(0, 10);
  const planKey = `${activeDate}_${machineKey}`;
  const jobs = machineJobs[planKey] || [];

  const [partListDb, setPartListDb] = useState<any[]>([]);
  const [schedulingPart, setSchedulingPart] = useState<any | null>(null);
  const [qtyLot, setQtyLot] = useState('500');
  const [dandori, setDandori] = useState('15');
  const [notification, setNotification] = useState<string | null>(null);

  // Loads parts from master catalog
  const loadParts = async () => {
    try {
      const res = await api.get('/parts');
      setPartListDb(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Triggers transient alert message
  const triggerNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Opens schedule configuration box with defaults based on machine tonnage
  const handleSchedulePartClick = (part: any) => {
    setSchedulingPart(part);
    const tonnageNum = parseInt(part.tonnage) || 0;
    if (tonnageNum >= 2500) {
      setQtyLot('200');
    } else {
      setQtyLot('500');
    }
    setDandori('15');
  };

  // Confirms part allocation parameters and appends job to the queue
  const handleAddPartToSequence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingPart) return;
    const parsedQty = parseInt(qtyLot) || 100;
    const parsedDandori = parseInt(dandori) || 0;
    const cavity = schedulingPart.cavity || 1;
    const ct = schedulingPart.cycle_time || schedulingPart.cycleTime || 60;
    const runtimeMins = Math.round(((parsedQty / cavity) * ct) / 60);
    const newJob: Job = {
      id: `job-${Date.now()}`,
      seq: jobs.length + 1,
      customer: schedulingPart.customer || 'Unknown',
      model: schedulingPart.part_number || schedulingPart.partNumber || schedulingPart.sebango,
      partName: schedulingPart.part_name || schedulingPart.partName || 'No Name',
      qtyDay: Math.round(parsedQty / 5) || 50,
      qtyLot: parsedQty,
      actualQty: 0,
      mold: schedulingPart.mold || 'MOLD-01',
      material: schedulingPart.material || 'PP RESIN',
      kav: cavity,
      ct: ct,
      spec: schedulingPart.spec,
      dandori: parsedDandori,
      time: runtimeMins,
      status: jobs.length === 0 ? 'dandori' : 'queued',
      timeRange: '',
      shift: 'day',
    };
    const newJobs = [...jobs, newJob];
    reorderMachineJobs(machineKey, newJobs, activeDate);
    setSchedulingPart(null);
    triggerNotification(`Part ${newJob.model} berhasil ditambahkan ke antrean produksi!`);
  };

  useEffect(() => {
    loadParts();
  }, []);

  const formattedFactory = useMemo(() => {
    const upper = factory.toUpperCase();
    if (upper.includes('FACT 2') || upper.includes('FACTORY 2') || upper === 'F2') return 'F2';
    if (upper.includes('FACT 3') || upper.includes('FACTORY 3') || upper === 'F3') return 'F3';
    if (upper.includes('FACT 4') || upper.includes('FACTORY 4') || upper === 'F4') return 'F4';
    if (upper.includes('SC2')) return 'SC2';
    return '';
  }, [factory]);

  const targetMachineCode = `${formattedFactory}-${machine}`;

  const homeLineParts = useMemo(() => {
    return partListDb.filter(p => {
      const hl = (p.home_line || p.homeLine || '').trim();
      return hl && machinesMatch(hl, targetMachineCode);
    });
  }, [partListDb, targetMachineCode]);

  const backupLineParts = useMemo(() => {
    return partListDb.filter(p => {
      const bl = (p.backup_line || p.backupLine || '').trim();
      const hl = (p.home_line || p.homeLine || '').trim();
      return bl && machinesMatch(bl, targetMachineCode) && (!hl || !machinesMatch(hl, targetMachineCode));
    });
  }, [partListDb, targetMachineCode]);

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 p-6 relative">
      {notification && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 text-emerald-800 dark:text-emerald-455 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4 backdrop-blur-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {schedulingPart && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-8 text-left">
            <div className="p-4 border-b border-slate-100 dark:border-slate-750 bg-[#E76114] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5" />
                <div>
                  <h3 className="font-bold text-xs tracking-wide">Schedule Production Job</h3>
                  <p className="text-[9px] text-white/80 font-bold uppercase tracking-wider mt-0.5 font-mono">{schedulingPart.part_number || schedulingPart.sebango}</p>
                </div>
              </div>
              <button
                onClick={() => setSchedulingPart(null)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPartToSequence} className="p-5 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200/50 dark:border-slate-750 text-xs space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                <div>Part Name: <b className="text-slate-900 dark:text-white">{schedulingPart.part_name || schedulingPart.partName}</b></div>
                <div>Model / Customer: <b className="text-slate-900 dark:text-white">{schedulingPart.model} / {schedulingPart.customer}</b></div>
                <div>Cavity: <b className="text-slate-900 dark:text-white">{schedulingPart.cavity}</b> | Cycle Time: <b className="text-slate-900 dark:text-white">{schedulingPart.cycle_time || schedulingPart.cycleTime}s</b></div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Target Production Qty (Lot Target) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={qtyLot}
                  onChange={(e) => setQtyLot(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-[#E76114] transition-colors bg-white dark:bg-slate-900 font-bold dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Dandori Setup Time (Minutes)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={dandori}
                  onChange={(e) => setDandori(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-[#E76114] transition-colors bg-white dark:bg-slate-900 font-bold dark:text-white"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setSchedulingPart(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E76114] hover:opacity-95 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <PackageSearch className="w-5 h-5 text-[#E76114]" />
                Registered Part List (Home Machine)
                <span className="bg-orange-100 dark:bg-orange-950/30 text-[#E76114] px-3 py-1 rounded-full text-xs uppercase tracking-wider ml-2">
                  {homeLineParts.length} Parts
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Parts naturally allocated to this machine for daily production.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left rounded-xl shadow-sm overflow-hidden transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Sebango / Part No</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Part Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Model / Customer</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">Material</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">Cycle Time</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">Dandori</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">Shikake</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">Backup Machine</th>
                    {canEditPattern && <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {homeLineParts.length > 0 ? (
                    homeLineParts.map((part, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-slate-800 dark:text-white text-[13px]">{part.sebango}</div>
                          <div className="text-[11px] text-slate-500 max-w-[160px] truncate" title={part.part_number || part.partNumber}>{part.part_number || part.partNumber || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700 dark:text-slate-300">{part.part_name || part.partName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-2">{part.model}</span>
                          <span className="text-slate-500 text-xs">{part.customer}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20" title={part.material}>
                          {part.material || '-'}
                        </td>
                        <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{(part.cycle_time || part.cycleTime)}s</div>
                        </td>
                        <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{(part.dandori || 15)}m</div>
                        </td>
                        <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{(part.shikake || 2)}x</div>
                        </td>
                        <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                          {part.backup_line || part.backupLine ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-700 bg-amber-50 dark:bg-amber-950/20 font-mono text-[11px] font-bold border border-amber-200">
                              {part.backup_line || part.backupLine}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        {canEditPattern && (
                          <td className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                            <button
                              onClick={() => handleSchedulePartClick(part)}
                              className="px-3 py-1.5 bg-[#E76114] hover:opacity-95 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer mx-auto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Schedule
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canEditPattern ? 9 : 8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/20">
                        Belum ada part home yang terdaftar untuk mesin ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              Backup Part List
              <span className="bg-amber-100 dark:bg-amber-955/20 text-amber-700 dark:text-amber-455 px-3 py-1 rounded-full text-xs uppercase tracking-wider ml-2">
                {backupLineParts.length} Parts
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Daftar part cadangan yang bisa dialihkan ke mesin ini jika mesin utama mengalami abnormalitas.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-left rounded-xl shadow-sm overflow-hidden transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Sebango / Part No</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Part Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Model / Customer</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">Cycle Time</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">Dandori</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">Shikake</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">Home Machine</th>
                    {canEditPattern && <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {backupLineParts.length > 0 ? (
                    backupLineParts.map((part, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30 dark:hover:bg-slate-900 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-slate-800 dark:text-white text-[13px]">{part.sebango}</div>
                          <div className="text-[11px] text-slate-500 max-w-[160px] truncate" title={part.part_number || part.partNumber}>{part.part_number || part.partNumber || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700 dark:text-slate-300">{part.part_name || part.partName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-2">{part.model}</span>
                          <span className="text-slate-500 text-xs">{part.customer}</span>
                        </td>
                        <td className="px-4 py-3 text-center border-l bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{(part.cycle_time || part.cycleTime)}s</div>
                        </td>
                        <td className="px-4 py-3 text-center border-l bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{(part.dandori || 15)}m</div>
                        </td>
                        <td className="px-4 py-3 text-center border-l bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800">
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{(part.shikake || 2)}x</div>
                        </td>
                        <td className="px-4 py-3 text-center border-l bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {part.home_line || part.homeLine} <ArrowRight className="w-3 h-3 text-amber-500" /> Here
                          </span>
                        </td>
                        {canEditPattern && (
                          <td className="px-4 py-3 text-center border-l bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800">
                            <button
                              onClick={() => handleSchedulePartClick(part)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer mx-auto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Schedule
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canEditPattern ? 8 : 7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/20">
                        Belum ada part cadangan yang terdaftar untuk mesin ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
