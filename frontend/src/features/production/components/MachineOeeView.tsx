import React, { useState } from 'react';
import { Award, Clock, Activity, Zap, CheckCircle2, RefreshCw, Printer, ShieldAlert, Cpu } from 'lucide-react';
import { useProduction, getUniqueMachineKey } from '../context/ProductionContext';

interface MachineOeeViewProps {
  machine: string;
  factory: string;
  machineKey?: string;
  selectedDate?: string;
}

// Renders the OEE breakdown dials and printer hardware status telemetry
export function MachineOeeView({ machine, factory, machineKey: propsMachineKey, selectedDate }: MachineOeeViewProps) {
  const machineKey = propsMachineKey || getUniqueMachineKey(factory, machine);
  const activeDate = selectedDate || new Date().toISOString().slice(0, 10);
  const planKey = `${activeDate}_${machineKey}`;

  const {
    machineJobs,
    logs
  } = useProduction();

  const jobs = machineJobs[planKey] || [];
  const logList = logs[planKey] || [];

  const [printerConnected, setPrinterConnected] = useState(true);
  const [paperLevel] = useState(85);
  const [batteryLevel] = useState(90);
  const [isJamSimulated, setIsJamSimulated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [printQueue, setPrintQueue] = useState<{ id: string; time: string; label: string; status: 'printed' | 'pending-retry' | 'failed' }[]>([
    { id: '1', time: '14:22', label: 'Box #021 - Part 62511-0K560-C0', status: 'printed' },
    { id: '2', time: '15:05', label: 'Box #022 - Part 62511-0K560-C0', status: 'printed' }
  ]);

  const metrics = React.useMemo(() => {
    let totalPlannedMins = jobs.reduce((sum, j) => sum + (j.time || 0) + (j.dandori || 0), 0);
    if (totalPlannedMins === 0) totalPlannedMins = 480;
    const totalDowntimeMins = jobs.reduce((sum, j) => sum + (j.downtimeMinutes || 0), 0);
    const operatingMins = Math.max(0, totalPlannedMins - totalDowntimeMins);
    const availability = totalPlannedMins > 0 ? (operatingMins / totalPlannedMins) * 100 : 100;
    const totalTargetQty = jobs.reduce((sum, j) => sum + (j.qtyLot || 0), 0);
    const totalActualQty = jobs.reduce((sum, j) => sum + (j.actualQty || 0), 0);
    const performance = totalTargetQty > 0 ? Math.min(100, (totalActualQty / totalTargetQty) * 100) : 100;
    let totalOk = 0;
    let totalNg = 0;
    jobs.forEach(job => {
      if (job.status === 'completed') {
        const completionLog = logList.find(
          log => log.message.includes('OK:') && log.message.includes('NG:')
        );
        if (completionLog) {
          const okMatch = completionLog.message.match(/OK:\s*(\d+)/);
          const ngMatch = completionLog.message.match(/NG:\s*(\d+)/);
          if (okMatch && ngMatch) {
            totalOk += parseInt(okMatch[1], 10);
            totalNg += parseInt(ngMatch[1], 10);
            return;
          }
        }
        totalOk += job.actualQty || 0;
      } else {
        totalOk += job.actualQty || 0;
      }
    });
    const totalProduced = totalOk + totalNg;
    const quality = totalProduced > 0 ? (totalOk / totalProduced) * 100 : 100;
    const oee = (availability * performance * quality) / 10000;
    return {
      plannedTime: totalPlannedMins,
      downtime: totalDowntimeMins,
      targetQty: totalTargetQty,
      actualQty: totalActualQty,
      okQty: totalOk,
      ngQty: totalNg,
      availability,
      performance,
      quality,
      oee
    };
  }, [jobs, logList, machine]);

  const oeeHistory = React.useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates.map(date => {
      const key = `${date}_${machineKey}`;
      const dayJobs = machineJobs[key] || [];
      const dayLogs = logs[key] || [];
      let totalPlannedMins = dayJobs.reduce((sum, j) => sum + (j.time || 0) + (j.dandori || 0), 0);
      const totalDowntimeMins = dayJobs.reduce((sum, j) => sum + (j.downtimeMinutes || 0), 0);
      let availability = 100;
      if (totalPlannedMins > 0) {
        const operatingMins = Math.max(0, totalPlannedMins - totalDowntimeMins);
        availability = (operatingMins / totalPlannedMins) * 100;
      }
      const totalTargetQty = dayJobs.reduce((sum, j) => sum + (j.qtyLot || 0), 0);
      const totalActualQty = dayJobs.reduce((sum, j) => sum + (j.actualQty || 0), 0);
      let performance = 100;
      if (totalTargetQty > 0) {
        performance = Math.min(100, (totalActualQty / totalTargetQty) * 100);
      }
      let totalOk = 0;
      let totalNg = 0;
      dayJobs.forEach(job => {
        if (job.status === 'completed') {
          const completionLog = dayLogs.find(
            log => log.message.includes('OK:') && log.message.includes('NG:')
          );
          if (completionLog) {
            const okMatch = completionLog.message.match(/OK:\s*(\d+)/);
            const ngMatch = completionLog.message.match(/NG:\s*(\d+)/);
            if (okMatch && ngMatch) {
              totalOk += parseInt(okMatch[1], 10);
              totalNg += parseInt(ngMatch[1], 10);
              return;
            }
          }
          totalOk += job.actualQty || 0;
        } else {
          totalOk += job.actualQty || 0;
        }
      });
      const totalProduced = totalOk + totalNg;
      const quality = totalProduced > 0 ? (totalOk / totalProduced) * 100 : 100;
      const oee = (availability * performance * quality) / 10000;
      return {
        date: date.substring(5),
        oee: dayJobs.length > 0 ? oee : 100
      };
    });
  }, [machineJobs, logs, machineKey]);

  const chartPoints = React.useMemo(() => {
    return oeeHistory.map((item, idx) => {
      const x = 50 + idx * 75;
      const clampedY = Math.max(20, Math.min(120, 130 - (item.oee / 100) * 100));
      return { x, y: clampedY, label: item.date, val: item.oee };
    });
  }, [oeeHistory]);

  const linePath = React.useMemo(() => {
    return chartPoints.reduce((path, p, idx) => {
      return path + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }, '');
  }, [chartPoints]);

  const areaPath = React.useMemo(() => {
    return chartPoints.length > 0
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 130 L ${chartPoints[0].x} 130 Z`
      : '';
  }, [chartPoints, linePath]);

  // Simulates connecting printer communication line
  const handleReconnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setPrinterConnected(true);
      setIsConnecting(false);
      setIsJamSimulated(false);
    }, 1500);
  };

  // Triggers paper jam malfunction state
  const handleSimulateJam = () => {
    setIsJamSimulated(true);
    setPrinterConnected(false);
    setPrintQueue(prev => [
      { id: Date.now().toString(), time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), label: 'Box #023 - Part 62511-0K560-C0', status: 'pending-retry' },
      ...prev
    ]);
  };

  // Wipes failed label items from local buffer queue
  const handleClearQueue = () => {
    setPrintQueue(prev => prev.filter(q => q.status === 'printed'));
  };

  // Triggers basic verification check print alert popup
  const handleTestPrint = () => {
    if (!printerConnected || isJamSimulated) {
      alert('Cannot print: Printer is offline or paper is jammed.');
      return;
    }
    alert(`DIAGNOSTIC TEST PRINT\n-------------------------\nMachine: ${machine}\nFactory: ${factory}\nOEE Level: ${metrics.oee.toFixed(1)}%\nPaper: ${paperLevel}%\nBattery: ${batteryLevel}%\n-------------------------`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-950/20 rounded-full blur-3xl opacity-60 -mr-10 -mt-10" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-1.5 self-start">
            <Award className="w-4 h-4 text-[#E76114]" /> Overall OEE Rating
          </h3>
          <div className="relative flex items-center justify-center my-2">
            <svg className="w-36 h-36">
              <circle className="text-slate-105 dark:text-slate-800" strokeWidth="12" stroke="currentColor" fill="transparent" r="58" cx="72" cy="72"/>
              <circle
                className={`${metrics.oee >= 85 ? 'text-emerald-500' : metrics.oee >= 70 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out`}
                strokeWidth="12"
                strokeDasharray={364}
                strokeDashoffset={364 - (364 * Math.max(5, metrics.oee)) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="58"
                cx="72"
                cy="72"
                transform="rotate(-90 72 72)"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{metrics.oee.toFixed(1)}%</span>
              <span className="block text-[8px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                {metrics.oee >= 85 ? 'World Class 🟢' : metrics.oee >= 70 ? 'Target OK 🟡' : 'Below Target 🔴'}
              </span>
            </div>
          </div>
          <div className="w-full grid grid-cols-2 gap-2 mt-6 text-[10px] font-bold text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div>Target OEE: <span className="text-slate-800 dark:text-white font-extrabold">85.0%</span></div>
            <div className="text-right">Scanned Output: <span className="text-slate-800 dark:text-white font-extrabold">{metrics.actualQty} / {metrics.targetQty}</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500" /> OEE Pillars Breakdown
          </h3>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" /> Availability (Ketersediaan Mesin)
                </span>
                <span className="font-black text-slate-800 dark:text-white font-mono">{metrics.availability.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden flex">
                <div className="bg-blue-500 rounded-full" style={{ width: `${metrics.availability}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>Downtime: {metrics.downtime} min</span>
                <span>Operating Time: {metrics.plannedTime - metrics.downtime} / {metrics.plannedTime} min</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Performance (Kecepatan Lini)
                </span>
                <span className="font-black text-slate-800 dark:text-white font-mono">{metrics.performance.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden flex">
                <div className="bg-amber-500 rounded-full" style={{ width: `${metrics.performance}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>Actual Rate: {metrics.actualQty} pcs</span>
                <span>Planned Capacity: {metrics.targetQty} pcs</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Quality (Jaminan Mutu Part)
                </span>
                <span className="font-black text-slate-800 dark:text-white font-mono">{metrics.quality.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 rounded-full" style={{ width: `${metrics.quality}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>NG Defect Qty: {metrics.ngQty} pcs</span>
                <span>Good Part Yield: {metrics.okQty} pcs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-500" /> OEE Weekly Historical Trend (7 Days)
          </h3>
          <div className="flex items-center gap-4 text-[9px] font-extrabold uppercase text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500 block" /> Actual OEE</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-amber-500 border-t border-dashed block" /> Target (85%)</span>
          </div>
        </div>
        <div className="w-full overflow-x-auto select-none pt-2">
          <div className="min-w-[550px] h-[160px] relative">
            <svg className="w-full h-full" viewBox="0 0 550 160">
              <defs>
                <linearGradient id="oeeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="oeeLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#E76114" />
                </linearGradient>
              </defs>
              <line x1="40" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeWidth="1" className="dark:opacity-10" />
              <line x1="40" y1="50" x2="520" y2="50" stroke="#f1f5f9" strokeWidth="1" className="dark:opacity-10" />
              <line x1="40" y1="80" x2="520" y2="80" stroke="#f1f5f9" strokeWidth="1" className="dark:opacity-10" />
              <line x1="40" y1="110" x2="520" y2="110" stroke="#f1f5f9" strokeWidth="1" className="dark:opacity-10" />
              <line x1="40" y1="130" x2="520" y2="130" stroke="#cbd5e1" strokeWidth="1" className="dark:opacity-10" />
              <line x1="40" y1="35" x2="520" y2="35" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="525" y="38" fill="#f59e0b" className="text-[8px] font-black uppercase">85% Target</text>
              <text x="15" y="24" fill="#94a3b8" className="text-[8px] font-bold font-mono">100%</text>
              <text x="15" y="75" fill="#94a3b8" className="text-[8px] font-bold font-mono">50%</text>
              <text x="15" y="133" fill="#94a3b8" className="text-[8px] font-bold font-mono">0%</text>
              {areaPath && <path d={areaPath} fill="url(#oeeFill)" />}
              {linePath && <path d={linePath} fill="none" stroke="url(#oeeLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
              {chartPoints.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    className="fill-white stroke-indigo-600 cursor-pointer transition-all hover:r-7"
                    strokeWidth="3.5"
                  />
                  <rect
                    x={p.x - 18}
                    y={p.y - 18}
                    width="36"
                    height="11"
                    rx="3"
                    className="fill-slate-900/90 shadow-sm"
                  />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fill="#ffffff"
                    className="text-[7.5px] font-black font-mono"
                  >
                    {p.val.toFixed(0)}%
                  </text>
                  <text
                    x={p.x}
                    y="148"
                    textAnchor="middle"
                    fill="#64748b"
                    className="text-[8px] font-black uppercase"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-purple-500" /> Printer Telemetry & Status
          </h3>
          <div className="space-y-3 pt-2">
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
              isJamSimulated
                ? 'bg-rose-50 border-rose-100 text-rose-800'
                : printerConnected
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 shrink-0" />
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider">
                    {isJamSimulated ? 'Paper Jammed ⚠️' : printerConnected ? 'Printer Ready 🟢' : 'Printer Offline 🔴'}
                  </span>
                  <span className="block text-[9px] opacity-75 mt-0.5">58mm Thermal Receipt Printer</span>
                </div>
              </div>
              {!printerConnected && (
                <button
                  onClick={handleReconnect}
                  disabled={isConnecting}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isConnecting ? 'animate-spin' : ''}`} /> {isConnecting ? 'Reconnecting...' : 'Reconnect'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="block text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Paper Level</span>
                <span className="block text-base font-black text-slate-700 dark:text-white font-mono mt-0.5">{paperLevel}%</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="block text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Battery Capacity</span>
                <span className="block text-base font-black text-slate-700 dark:text-white font-mono mt-0.5">{batteryLevel}%</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleTestPrint}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                Print Test Label
              </button>
              <button
                onClick={isJamSimulated ? handleReconnect : handleSimulateJam}
                className={`flex-1 py-2 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors border cursor-pointer ${
                  isJamSimulated
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-455'
                }`}
              >
                {isJamSimulated ? 'Fix Paper Jam' : 'Simulate Jam'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-500" /> Active Print Queue
            </h3>
            {printQueue.some(q => q.status === 'pending-retry') && (
              <button
                onClick={handleClearQueue}
                className="text-[9px] text-slate-400 hover:text-slate-600 font-extrabold uppercase tracking-wider cursor-pointer"
              >
                Clear Queue
              </button>
            )}
          </div>
          <div className="flex-1 min-h-[160px] overflow-y-auto space-y-2 pr-1">
            {printQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-slate-300" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Queue is Empty</span>
              </div>
            ) : (
              printQueue.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <span className="block font-bold text-slate-700 dark:text-slate-350 truncate">{item.label}</span>
                    <span className="block text-[8px] text-slate-400 font-mono mt-0.5">{item.time}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    item.status === 'printed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                  }`}>
                    {item.status === 'printed' ? 'Printed' : 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Troubleshooter
          </h3>
          <div className="space-y-3 text-[11px] leading-relaxed pt-2 text-slate-650 dark:text-slate-400">
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 font-black shrink-0">1</span>
              <div>
                <span className="block font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">No Bluetooth Signal?</span>
                <span className="block">Check printer power. Ensure device Bluetooth is turned on, and click "Reconnect" to pair again.</span>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 font-black shrink-0">2</span>
              <div>
                <span className="block font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Red Light Flashing?</span>
                <span className="block">Open printer cover, ensure paper is aligned correctly, or replace thermal receipt roll.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
