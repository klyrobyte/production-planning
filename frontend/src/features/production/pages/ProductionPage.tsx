import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { Factory, AlertCircle, Settings2, Info, Play, Calendar } from 'lucide-react';
import { MachineDetailModal } from '../components/MachineDetailModal';
import { useProduction, getHeijunkaJobsForMachine, getTodayDateString } from '../context/ProductionContext';
import api from '../../../shared/lib/axios';

export const InjectionMoldingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    viewBox="0 0 512 512" 
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base of machine */}
    <rect x="20" y="300" width="472" height="160" rx="12" fill="#E2E8F0" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    
    {/* Control Screen on Base */}
    <rect x="50" y="335" width="100" height="90" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="16" strokeLinejoin="round" />
    <line x1="65" y1="365" x2="135" y2="365" stroke="#3B82F6" strokeWidth="10" strokeLinecap="round" />
    <line x1="65" y1="395" x2="115" y2="395" stroke="#94A3B8" strokeWidth="10" strokeLinecap="round" />

    {/* Buttons on Base */}
    <rect x="180" y="360" width="40" height="30" rx="4" fill="#64748B" stroke="#0F172A" strokeWidth="12" strokeLinejoin="round" />
    <rect x="240" y="360" width="40" height="30" rx="4" fill="#64748B" stroke="#0F172A" strokeWidth="12" strokeLinejoin="round" />
    <rect x="300" y="360" width="40" height="30" rx="4" fill="#64748B" stroke="#0F172A" strokeWidth="12" strokeLinejoin="round" />

    {/* Bottom slits */}
    <line x1="370" y1="425" x2="370" y2="445" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
    <line x1="410" y1="425" x2="410" y2="445" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
    <line x1="450" y1="425" x2="450" y2="445" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />

    {/* Clamping unit / Mold plate (Left) */}
    <rect x="30" y="120" width="250" height="180" rx="8" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    {/* Mold window/cavity */}
    <rect x="65" y="150" width="180" height="120" rx="6" fill="#94A3B8" stroke="#0F172A" strokeWidth="18" strokeLinejoin="round" />
    <line x1="155" y1="150" x2="155" y2="270" stroke="#0F172A" strokeWidth="14" />

    {/* Injection Cylinder/Nozzle (Middle) */}
    <path d="M245 210l65-20v40z" fill="#64748B" stroke="#0F172A" strokeWidth="16" strokeLinejoin="round" />
    <rect x="310" y="185" width="40" height="50" rx="4" fill="#475569" stroke="#0F172A" strokeWidth="16" strokeLinejoin="round" />

    {/* Hopper / Barrel unit (Right) */}
    <rect x="350" y="200" width="70" height="100" rx="6" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    <rect x="365" y="100" width="40" height="100" fill="#94A3B8" stroke="#0F172A" strokeWidth="18" strokeLinejoin="round" />
    {/* Hopper funnel */}
    <path d="M325 50h120l-25 50h-70z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    {/* Right side box/cabinet */}
    <rect x="410" y="110" width="75" height="100" rx="8" fill="#94A3B8" stroke="#0F172A" strokeWidth="18" strokeLinejoin="round" />
  </svg>
);

export const PaintingRobotIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    viewBox="0 0 512 512" 
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base turntable / curved body at the bottom */}
    <path d="M230 460h80" stroke="#0F172A" strokeWidth="24" strokeLinecap="round" />
    <path d="M270 360v100" stroke="#0F172A" strokeWidth="24" strokeLinecap="round" />
    <path d="M220 370c-25 0-45-20-45-45s20-45 45-45h100c25 0 45 20 45 45s-20 45-45 45z" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />

    {/* Controller base panel on bottom right */}
    <rect x="330" y="340" width="130" height="120" rx="16" fill="#E2E8F0" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    <circle cx="370" cy="380" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="12" />
    <circle cx="370" cy="420" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="12" />
    <line x1="405" y1="380" x2="435" y2="380" stroke="#0F172A" strokeWidth="16" strokeLinecap="round" />
    <line x1="405" y1="420" x2="435" y2="420" stroke="#0F172A" strokeWidth="16" strokeLinecap="round" />

    {/* Lower arm segment */}
    <path d="M270 280L410 110" stroke="#0F172A" strokeWidth="52" strokeLinecap="round" />
    <path d="M270 280L410 110" stroke="#94A3B8" strokeWidth="32" strokeLinecap="round" />
    <line x1="300" y1="243" x2="380" y2="147" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />

    {/* Elbow Joint (Top Right) */}
    <circle cx="410" cy="110" r="40" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" />
    <circle cx="410" cy="110" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="10" />

    {/* Upper arm segment */}
    <path d="M410 110L200 60" stroke="#0F172A" strokeWidth="52" strokeLinecap="round" />
    <path d="M410 110L200 60" stroke="#94A3B8" strokeWidth="32" strokeLinecap="round" />
    <line x1="375" y1="102" x2="235" y2="68" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />

    {/* Wrist Joint (Left) */}
    <circle cx="200" cy="60" r="40" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" />
    <circle cx="200" cy="60" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="10" />

    {/* Nozzle Mount */}
    <path d="M180 80l-35 35" stroke="#0F172A" strokeWidth="24" strokeLinecap="round" />
    {/* Nozzle tip */}
    <path d="M145 115l-15 15c-6 6-16 6-22 0l-10-10c-6-6-6-16 0-22l15-15z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    <path d="M110 100l-25 25" stroke="#0F172A" strokeWidth="20" strokeLinecap="round" />

    {/* Spray paint mist/dashed lines */}
    <path d="M70 140L10 150" stroke="#0F172A" strokeWidth="20" strokeDasharray="20 20" strokeLinecap="round" />
    <path d="M75 165L20 200" stroke="#0F172A" strokeWidth="20" strokeDasharray="20 20" strokeLinecap="round" />
    <path d="M80 185L35 250" stroke="#0F172A" strokeWidth="20" strokeDasharray="20 20" strokeLinecap="round" />
    <path d="M85 200L55 295" stroke="#0F172A" strokeWidth="20" strokeDasharray="20 20" strokeLinecap="round" />
  </svg>
);

const resinPlantLayout = [
  {
    plant: 'SC1 (Cibitung)',
    factories: [
      { name: 'FACT 2', code: 'F2' },
      { name: 'FACT 3', code: 'F3' },
      { name: 'FACT 4', code: 'F4' },
    ]
  },
  {
    plant: 'SC2 (Karawang)',
    factories: [
      { name: 'SC2 Resin', code: 'SC2' }
    ]
  }
];

const paintingData = [
  {
    plant: 'SC1 (Cibitung)',
    lines: [
      { name: 'MBF4 (Main Booth)', fuka: 20.1, maxFuka: 21, status: 'Over', note: 'Strengthen BCP (Stock & Backup)' },
      { name: 'SBF3 (Small Booth)', fuka: 17.2, maxFuka: 21, status: 'Normal', note: 'T/T Keep: Booth #1 4.0\'' }
    ]
  },
  {
    plant: 'SC2 (Karawang)',
    lines: [
      { name: 'Line 1', fuka: 16.7, maxFuka: 21, status: 'Normal', note: 'T/T Keep: 1.6\'' },
      { name: 'Line 2', fuka: 13.6, maxFuka: 21, status: 'Normal', note: 'Backup for SC1 MBF4' }
    ]
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Over': return 'bg-rose-500';
    case 'Warning': return 'bg-amber-500';
    case 'Normal': return 'bg-emerald-500';
    default: return 'bg-emerald-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'Over': return 'text-rose-700 bg-rose-100 dark:text-rose-350 dark:bg-rose-950/40';
    case 'Warning': return 'text-amber-700 bg-amber-100 dark:text-amber-350 dark:bg-amber-950/40';
    case 'Normal': return 'text-emerald-700 bg-emerald-100 dark:text-emerald-350 dark:bg-emerald-950/40';
    default: return 'text-emerald-700 bg-emerald-100 dark:text-emerald-350 dark:bg-emerald-950/40';
  }
};

export default function ProductionPage() {
  const { machine: urlMachine, tab: urlTab } = useParams<{ machine: string; tab: string }>();
  const navigate = useNavigate();
  
  const activePortal = useAuthStore((state) => state.activePortal);
  const activeMachineCode = useAuthStore((state) => state.activeMachineCode);
  const logoutOperator = useAuthStore((state) => state.logoutOperator);

  if (activePortal === 'member') {
    if (!urlMachine || urlMachine !== activeMachineCode) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  const [activeTab, setActiveTab] = useState<'resin' | 'painting'>('resin');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());

  const { machineJobs, activeAbnormalities, activeNgs } = useProduction();

  const { data: machinesData } = useQuery<any[]>({
    queryKey: ['machines'],
    queryFn: async () => (await api.get('/machines')).data?.data || [],
    staleTime: 60_000,
  });

  const { data: partsData = [] } = useQuery<any[]>({
    queryKey: ['parts'],
    queryFn: async () => (await api.get('/parts')).data?.data || [],
    staleTime: 60_000,
  });

  // Calculate plant-level and machine-level FUKA dynamically based on jobs assigned to those lines
  const dynamicResinData = useMemo(() => {
    return resinPlantLayout.map(plantGroup => {
      const updatedFactories = plantGroup.factories.map(fact => {
        let totalLoadMins = 0;
        
        // Filter machines matching factory code
        const factoryMachines = (machinesData || [])
          .filter(m => {
            const code = m.factory_code;
            const mType = (m.type || 'injection').toLowerCase();
            const matchesFactory = (fact.code === 'F2' && code === 'F2') ||
                                   (fact.code === 'F3' && code === 'F3') ||
                                   (fact.code === 'F4' && code === 'F4') ||
                                   (fact.code === 'SC2' && code === 'SC2');
            const matchesType = mType === 'injection' || mType === 'resin';
            return matchesFactory && matchesType;
          })
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        const machineCount = factoryMachines.length;
        
        const mappedMachines = factoryMachines.map(mc => {
          const machineKey = mc.code;
          const planKey = `${selectedDate}_${machineKey}`;
          
          // Resolve daily plan exactly like useProduction in context
          const jobs = machineJobs[planKey] || getHeijunkaJobsForMachine(machineKey, selectedDate, partsData);
          
          const machineMins = jobs.reduce((sum, job) => sum + (job.time || 0) + (job.dandori || 0), 0);
          totalLoadMins += machineMins;

          // Determine current shift
          const currentHour = new Date().getHours();
          const currentMinute = new Date().getMinutes();
          const currentMins = currentHour * 60 + currentMinute;
          const isNightShiftTime = currentMins < 435 || currentMins >= 1260;
          const currentShift = isNightShiftTime ? 'night' : 'day';

          // Filter jobs for active shift
          const shiftJobs = jobs.filter(j => j.shift === currentShift || (currentShift === 'night' && j.shift === 'overflow'));
          const hasShiftJobs = shiftJobs.length > 0;
          
          const activeJob = (() => {
            if (!hasShiftJobs) return undefined;
            const running = shiftJobs.find(j => j.status === 'running');
            if (running) return running;
            const dandori = shiftJobs.find(j => j.status === 'dandori');
            if (dandori) return dandori;
            return shiftJobs.find(j => j.status !== 'completed');
          })();

          // Check active abnormality
          const activeAbnormal = activeAbnormalities[planKey];
          const isAbnormal = activeAbnormal ? activeAbnormal.isAbnormal : false;

          // Check active NG
          const activeNgState = activeNgs[planKey];
          const isNgActive = !isAbnormal && (activeNgState ? activeNgState.isNg : false);
          
          const isDandori = !isAbnormal && !isNgActive && (activeJob ? activeJob.status === 'dandori' : false);
          const isRunning = !isAbnormal && !isNgActive && !isDandori && activeJob !== undefined;
          const isIdle = !isAbnormal && !isNgActive && !isDandori && activeJob === undefined;
          
          // Check if abnormality has lasted for more than 1 hour
          const isAbnormalLong = isAbnormal && (() => {
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
            activeJob
          };
        });

        const fukaLoadHours = machineCount > 0 ? (totalLoadMins / 60) / machineCount : 0;
        
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
          status
        };
      });
      
      return {
        plant: plantGroup.plant,
        factories: updatedFactories
      };
    });
  }, [machinesData, machineJobs, selectedDate, partsData, activeAbnormalities, activeNgs]);

  // Flatten all machines in order to navigate easily
  const allMachinesList = useMemo(() => {
    const list: { id: string, code: string, tonnage: string, factory: string }[] = [];
    dynamicResinData.forEach(plant => {
      plant.factories.forEach(fact => {
        fact.machines.forEach(mc => {
          list.push({ id: mc.id, code: mc.code, tonnage: mc.tonnage, factory: fact.name });
        });
      });
    });
    return list;
  }, [dynamicResinData]);

  const handleNavigateMachine = (direction: 'next' | 'prev') => {
    if (!urlMachine) return;
    const currentIndex = allMachinesList.findIndex(
      m => m.code === urlMachine
    );
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allMachinesList.length;
    } else {
      newIndex = (currentIndex - 1 + allMachinesList.length) % allMachinesList.length;
    }
    
    const target = allMachinesList[newIndex];
    navigate(`/production/${target.code}/${urlTab || 'pattern'}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Machine FUKA Control</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">Manage operation time and load capacity</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg overflow-x-auto max-w-full shrink-0 h-10 items-center">
            <button
              onClick={() => setActiveTab('resin')}
              className={`h-8 px-4 text-sm font-bold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'resin' ? 'bg-white dark:bg-slate-950 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <InjectionMoldingIcon className="w-5 h-5" /> Resin Injection
            </button>
            <button
              onClick={() => setActiveTab('painting')}
              className={`h-8 px-4 text-sm font-bold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'painting' ? 'bg-white dark:bg-slate-950 text-rose-700 dark:text-rose-450 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <PaintingRobotIcon className="w-5 h-5" /> Painting
            </button>
          </div>
        </div>
      </div>

      {/* Premium Machine Status Legend */}
      <div className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <div>
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Status Indikator Mesin</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Keterangan warna & kondisi operasional mesin</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all hover:scale-105 hover:bg-emerald-100/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Running</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/70 dark:bg-blue-950/20 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold transition-all hover:scale-105 hover:bg-blue-100/50">
            <Settings2 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Dandori / Set-up</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-350/70 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-700 dark:text-amber-455 text-xs font-bold transition-all hover:scale-105 hover:bg-amber-100/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>Sedang NG (Quality)</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200/70 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-bold transition-all hover:scale-105 hover:bg-rose-100/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span>Abnormal Stop</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-655 dark:text-slate-400 text-xs font-bold transition-all hover:scale-105 hover:bg-slate-100/50">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Idle (No Plan)</span>
          </div>
        </div>
      </div>

      {activeTab === 'resin' && (
        <section>
          <div className="flex flex-col gap-6 mt-4">
          {dynamicResinData.map((plantGroup, i) => (
            <div key={i} className="p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Factory className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <h4 className="font-bold text-slate-700 dark:text-white text-sm">{plantGroup.plant}</h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {plantGroup.factories.map((fact, j) => (
                  <div key={j} className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-black text-slate-800 dark:text-white">{fact.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest ${getStatusText(fact.status)}`}>
                            {fact.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-mono flex flex-wrap gap-3 mt-3">
                          {fact.machines.map((mc, k) => {
                            const btn = (
                              <button 
                                key={k} 
                                onClick={() => navigate(`/production/${mc.code}/pattern`)}
                                className={`px-4 py-2 border rounded-md transition-all duration-300 cursor-pointer font-bold flex gap-2 items-center text-sm shadow-sm ${
                                  mc.isAbnormal 
                                    ? mc.isAbnormalLong
                                      ? 'bg-rose-200 hover:bg-rose-300 dark:bg-rose-900/60 dark:hover:bg-rose-800/60 text-rose-950 dark:text-rose-100 border-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.95)] ring-2 ring-rose-500/50'
                                      : 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-405 border-rose-300 dark:border-rose-800' 
                                    : mc.isNgActive
                                      ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-405 border-amber-400 dark:border-amber-800 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                                      : mc.isDandori
                                        ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-405 border-blue-300 dark:border-blue-800'
                                        : mc.isIdle
                                          ? 'bg-slate-105 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-250 dark:border-slate-800'
                                          : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-405 border-emerald-300 dark:border-emerald-800'
                                }`}
                                title={`${mc.tonnage}T Tonnage - ${mc.isAbnormal ? (mc.isAbnormalLong ? 'CRITICAL DOWNTIME (>1HR)' : 'ABNORMAL') : mc.isNgActive ? 'SEDANG NG' : mc.isDandori ? 'DANDORI' : mc.isIdle ? 'IDLE' : 'RUNNING'}`}
                              >
                                {mc.isAbnormal && (
                                  <AlertCircle className={`w-4 h-4 ${mc.isAbnormalLong ? 'text-rose-600 animate-bounce' : 'text-rose-500'}`} />
                                )}
                                {mc.isNgActive && <AlertCircle className="w-4 h-4 text-amber-600" />}
                                {mc.isDandori && <Settings2 className="w-4 h-4" />}
                                {mc.isIdle && <Info className="w-4 h-4 text-slate-405" />}
                                {mc.isRunning && <Play className="w-4 h-4" />}
                                <span className="text-base">{mc.id}</span>
                                <span className={`text-[11px] opacity-80 border-l pl-2 ${
                                  mc.isAbnormal 
                                    ? 'border-rose-300 dark:border-rose-800' 
                                    : mc.isNgActive
                                      ? 'border-amber-400 dark:border-amber-800'
                                      : mc.isDandori 
                                        ? 'border-blue-300 dark:border-blue-800' 
                                        : mc.isIdle 
                                          ? 'border-slate-300 dark:border-slate-800' 
                                          : 'border-emerald-300 dark:border-emerald-800'
                                }`}>{mc.tonnage}T</span>
                              </button>
                            );

                            return mc.isAbnormal ? (
                              <div
                                key={k}
                                className={`abnormal-wave-wrapper${mc.isAbnormalLong ? ' critical' : ''}`}
                              >
                                {btn}
                              </div>
                            ) : mc.isNgActive ? (
                              <div key={k} className="ng-wave-wrapper">
                                {btn}
                              </div>
                            ) : (
                              <React.Fragment key={k}>{btn}</React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="flex items-baseline gap-1 justify-start sm:justify-end">
                          <span className="text-2xl font-black text-slate-800 dark:text-white">{fact.fuka.toFixed(1)}</span>
                          <span className="text-[10px] font-bold text-slate-400">Hr/Day</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mt-1">FUKA Load</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden mt-3">
                      <div 
                        className={`h-full ${getStatusColor(fact.status)}`}
                        style={{ width: `${(fact.fuka / fact.maxFuka) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {activeTab === 'painting' && (
      <section>
        <div className="flex flex-col gap-6 mt-4">
          {paintingData.map((plantGroup, i) => (
            <div key={i} className="p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Factory className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <h4 className="font-bold text-slate-700 dark:text-white text-sm">{plantGroup.plant}</h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {plantGroup.lines.map((line, j) => (
                  <div key={j} className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-black text-slate-800 dark:text-white">{line.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest ${getStatusText(line.status)}`}>
                            {line.status}
                          </span>
                        </div>
                        {line.note && (
                          <div className="flex items-start gap-1.5 mt-2 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[10px] p-2 rounded border border-blue-100 dark:border-blue-900/30 font-medium">
                            <Info className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{line.note}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="flex items-baseline gap-1 justify-start sm:justify-end">
                          <span className="text-2xl font-black text-slate-800 dark:text-white">{line.fuka.toFixed(1)}</span>
                          <span className="text-[10px] font-bold text-slate-400">Hr/Day</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mt-1">FUKA Load</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden mt-3 relative">
                      <div 
                        className={`h-full ${getStatusColor(line.status)}`}
                        style={{ width: `${(line.fuka / line.maxFuka) * 100}%` }}
                      />
                      {/* Teiji line marker approx at 16 hrs (66%) */}
                      <div className="absolute top-0 bottom-0 left-[66%] w-0.5 bg-slate-400/50 dark:bg-slate-700" title="Teiji (Default Capacity)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Modal */}
      {urlMachine && (() => {
        const mcObj = (machinesData || []).find(m => m.code === urlMachine);
        if (!mcObj) return null;
        return (
          <MachineDetailModal 
            machine={mcObj.name} 
            tonnage={mcObj.tonnage || '2500'}
            factory={mcObj.factory_name || mcObj.factory_code || ''} 
            onClose={() => {
              if (activePortal === 'member') {
                logoutOperator();
                navigate('/login');
              } else {
                navigate('/production');
              }
            }}
            onNavigate={activePortal === 'member' ? undefined : handleNavigateMachine}
            initialDate={selectedDate}
          />
        );
      })()}
    </div>
  );
}