import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Play, CheckCircle2, AlertTriangle, AlertCircle, Clock,
    ShieldCheck, ArrowRight, Printer, X, Check, Bluetooth, RefreshCw,
    Maximize, Minimize, Sun, Moon
} from 'lucide-react';
import { useProduction } from '../context/ProductionContext';
import { getUniqueMachineKey, getTodayDateString } from '../context/ProductionContext';
import type { Job } from '../context/ProductionContext';
import { PrintLabelModal } from './PrintLabelModal';
import api from '../../../shared/lib/axios';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useScreenControls } from '../../../shared/hooks/useScreenControls';
import { useBtPrinterStore } from '../../../shared/store/useBtPrinterStore';

interface MachineExecutionViewProps {
    machine: string;
    factory: string;
    machineKey?: string;
    selectedDate: string;
}

const ABNORMAL_TYPES = [
    'Mesin Breakdown (Mekanik)',
    'Tunggu Bahan Baku',
    'Tunggu Crane / Mold Swap',
    'Listrik Padam',
    'Masalah Kualitas (Investigasi)',
    'Trial Mold / Part Baru',
    'Lainnya',
];

const NG_TYPES = [
    'Baret / Scratch',
    'Flash / Luber',
    'Kurang Material (Short Shot)',
    'Weld Line',
    'Sink Mark',
    'Warna Tidak Sesuai',
    'Dimensi NG',
    'Lainnya',
];

const SIGNOFF_CHECKLIST = [
    { id: 'quality', label: 'Kualitas Part sudah dicek & sesuai standar' },
    { id: 'fives', label: 'Area kerja sudah dibersihkan (5S)' },
];

const statusChip: Record<string, string> = {
    queued: 'bg-slate-100 text-slate-500 dark:bg-slate-800',
    dandori: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    running: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    completed: 'bg-slate-100 text-slate-400 dark:bg-slate-800/50',
};

export function MachineExecutionView({ machine, factory, machineKey: propsMachineKey, selectedDate }: MachineExecutionViewProps) {
    const activePortal = useAuthStore(state => state.activePortal);
    const memberName = useAuthStore(state => state.memberName);
    const machineKey = propsMachineKey || getUniqueMachineKey(factory, machine);
    const planKey = `${selectedDate}_${machineKey}`;

    const {
        machineJobs, activeAbnormalities, activeNgs, logs, dayOTs, nightOTs,
        updateJobStatus, setMachineAbnormal, setMachineNg,
        incrementJobProgress, closeShiftProduction,
    } = useProduction();

    const userRole = useAuthStore(state => state.user?.role);
    const todayDate = getTodayDateString();
    const isReadOnlyMode = selectedDate !== todayDate && userRole !== 'super-admin';

    // Fullscreen & Wake Lock controls (for member tablet usage)
    const { isFullscreen, isWakeLockActive, toggleFullscreen, toggleWakeLock } = useScreenControls();

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.trim().split(' ').map(n => n[0]).join('').substring(0, 3).toUpperCase();
    };

    const userInitials = memberName ? getInitials(memberName) : (activePortal === 'member' ? 'MB' : activePortal.substring(0, 2).toUpperCase());
    const mName = machine || `MC ${machineKey}`;

    const getLogNote = (baseNote: string) => {
        return userInitials ? `${baseNote} (${userInitials})` : baseNote;
    };

    // Bluetooth pairing requirement & dev mode bypass
    const [bypassBtRequirement, setBypassBtRequirement] = useState<boolean>(() => {
        return typeof window !== 'undefined' ? (localStorage.getItem('sugity_dev_bypass_bt') === 'true') : false;
    });

    const toggleBypassBtRequirement = () => {
        const newVal = !bypassBtRequirement;
        setBypassBtRequirement(newVal);
        localStorage.setItem('sugity_dev_bypass_bt', String(newVal));
    };

    const jobs = machineJobs[planKey] || [];
    const abnormality = activeAbnormalities[planKey] ?? { isAbnormal: false, type: '', start: '' };
    const ngState = activeNgs[planKey] ?? { isNg: false, type: '', start: '' };
    const logList = logs[planKey] || [];
    const dayOT = dayOTs[planKey] || 'teiji';
    const nightOT = nightOTs[planKey] || 'teiji';

    const { data: partsData = [] } = useQuery<any[]>({
        queryKey: ['parts'],
        queryFn: async () => (await api.get('/parts')).data?.data || [],
        staleTime: 60_000,
    });



    // Local UI state
    const [isReportingAbnormal, setIsReportingAbnormal] = useState(false);
    const [isReportingNg, setIsReportingNg] = useState(false);
    const [showSignOff, setShowSignOff] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [signOffJobId, setSignOffJobId] = useState<string | null>(null);
    const [signOffChecks, setSignOffChecks] = useState<Record<string, boolean>>({});
    const [signOffNgQty, setSignOffNgQty] = useState('');
    const [signOffOkQty, setSignOffOkQty] = useState('');
    const [leaderPin, setLeaderPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [selectedAbnType, setSelectedAbnType] = useState(ABNORMAL_TYPES[0]);
    const [selectedNgType, setSelectedNgType] = useState(NG_TYPES[0]);
    const [abnormalStartTime, setAbnormalStartTime] = useState('');
    const [ngStartTime, setNgStartTime] = useState('');

    // Restore "sedang diinput" panel state if user navigated away mid-reporting
    // The machine status 'Dalam Investigasi...' is persisted in context, so we
    // use it to rehydrate the local UI state on mount / planKey change.
    useEffect(() => {
        if (abnormality.isAbnormal && abnormality.type === 'Dalam Investigasi...') {
            setIsReportingAbnormal(true);
            if (abnormality.start) setAbnormalStartTime(abnormality.start);
        } else {
            setIsReportingAbnormal(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planKey]);

    useEffect(() => {
        if (ngState.isNg && ngState.type === 'Dalam Investigasi...') {
            setIsReportingNg(true);
            if (ngState.start) setNgStartTime(ngState.start);
        } else {
            setIsReportingNg(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planKey]);

    // Live ticking clock for print lock calculations (ticks every 10 seconds)
    const [currentLiveTime, setCurrentLiveTime] = useState<Date>(new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentLiveTime(new Date());
        }, 10000);
        return () => clearInterval(timer);
    }, []);

    // ── Bluetooth: consume from global store (survives page navigation) ──────
    const btDevice           = useBtPrinterStore(s => s.btDevice);
    const btCharacteristic   = useBtPrinterStore(s => s.btCharacteristic);
    const connectionStatus   = useBtPrinterStore(s => s.connectionStatus);
    const connectionError    = useBtPrinterStore(s => s.connectionError);
    const onDeviceConnected  = useBtPrinterStore(s => s.onDeviceConnected);
    const btDisconnect       = useBtPrinterStore(s => s.disconnect);
    const findWriteCharacteristic = useBtPrinterStore(s => s.findWriteCharacteristic);

    const isBtConnected = connectionStatus === 'connected';
    const isBtReadyForProduction = isBtConnected || bypassBtRequirement;
    const isBluetoothSupported = typeof window !== 'undefined' && 'bluetooth' in navigator;

    // Fetch registered printer UUIDs from database
    const { data: savedPrinters = [] } = useQuery<any[]>({
        queryKey: ['bt-printers'],
        queryFn: async () => (await api.get('/bt-printers')).data?.data || [],
        staleTime: 5 * 60_000,
    });

    const connectBluetoothPrinter = async () => {
        if (!isBluetoothSupported) {
            alert("⚠️ WEB BLUETOOTH TIDAK TERSEDIA!\n\nWeb Bluetooth API tidak didukung oleh browser Anda, atau Anda mengakses via IP Address tanpa HTTPS (insecure context).\n\nSolusi:\n1. Aktifkan 'Dev Bypass Mode' di panel kanan untuk testing.\n2. Atau gunakan HTTPS.\n3. Atau di Chrome HP, buka 'chrome://flags/#unsafely-treat-insecure-origin-as-secure', masukkan alamat IP & Port ini, ubah ke 'Enabled', lalu restart Chrome.");
            useBtPrinterStore.setState({ connectionError: 'Web Bluetooth requires HTTPS/localhost.', connectionStatus: 'error' });
            return;
        }
        useBtPrinterStore.setState({ connectionStatus: 'connecting', connectionError: '' });

        const savedUuids = savedPrinters.map((p: any) => p.service_uuid as string);

        try {
            const device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: savedUuids,
            });

            useBtPrinterStore.setState({ connectionStatus: 'connecting' });
            const server = await device.gatt.connect();
            const result = await findWriteCharacteristic(server, savedUuids);

            if (!result) {
                throw new Error('Tidak ditemukan characteristic yang bisa di-write pada printer ini. Pastikan printer dalam mode aktif.');
            }

            onDeviceConnected(device, result.char, result.serviceUuid);
        } catch (err: any) {
            console.error('Bluetooth Connection Error:', err);
            useBtPrinterStore.setState({ connectionError: err.message || 'Failed to connect. Ensure printer is paired.', connectionStatus: 'error' });
        }
    };

    const disconnectBluetoothPrinter = () => {
        btDisconnect();
    };


    const handlePrintSuccess = (printedQty: number) => {
        if (!activeJob) return;
        incrementJobProgress(machineKey, activeJob.id, printedQty, selectedDate, partsData, {
            type: 'progress', note: getLogNote(`Print label ${activeJob.model}: +${printedQty} pcs`)
        });
    };

    const activeJob = useMemo(
        () => jobs.find(j => j.status === 'running' || j.status === 'dandori') ?? null,
        [jobs]
    );

    const isFirstInShift = useMemo(() => {
        if (!jobs || jobs.length === 0 || !activeJob) return false;
        const firstDayJob = jobs.find(j => j.shift === 'day');
        const firstNightJob = jobs.find(j => j.shift === 'night');
        return (firstDayJob && activeJob.id === firstDayJob.id) || (firstNightJob && activeJob.id === firstNightJob.id);
    }, [jobs, activeJob]);

    const printLockStatus = useMemo(() => {
        if (!activeJob || activeJob.status !== 'running') {
            return { isLocked: false, message: '' };
        }

        // Guard: if target lot already reached (e.g. 10/10), lock printing
        if (activeJob.qtyLot > 0 && activeJob.actualQty >= activeJob.qtyLot) {
            return {
                isLocked: true,
                message: `Target Lot Selesai: Produksi telah mencapai target (${activeJob.actualQty}/${activeJob.qtyLot} pcs). Pencetakan label Kanban dikunci karena lot sudah memenuhi target.`
            };
        }

        // Guard: if no production start time recorded yet, don't lock
        if (!activeJob.actualProductionStart || typeof activeJob.actualProductionStart !== 'string') {
            return { isLocked: false, message: '' };
        }

        // Parse start time to date
        const parts = activeJob.actualProductionStart.split(':');
        if (parts.length < 2) return { isLocked: false, message: '' };
        const [hhStr, mmStr] = parts;
        const startDate = new Date(currentLiveTime);
        startDate.setHours(parseInt(hhStr, 10), parseInt(mmStr, 10), 0, 0);
        // Adjust if crossed midnight
        if (startDate.getTime() > currentLiveTime.getTime()) {
            startDate.setDate(startDate.getDate() - 1);
        }

        // Calculate ongoing downtime if abnormal or NG is active
        let ongoingDowntimeSecs = 0;
        if (abnormality.isAbnormal && abnormality.start) {
            const startParts = abnormality.start.split(':');
            if (startParts.length === 2) {
                const abnDate = new Date(currentLiveTime);
                abnDate.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0, 0);
                if (abnDate.getTime() > currentLiveTime.getTime()) abnDate.setDate(abnDate.getDate() - 1);
                ongoingDowntimeSecs = Math.max(0, Math.floor((currentLiveTime.getTime() - abnDate.getTime()) / 1000));
            }
        }
        if (ngState.isNg && ngState.start) {
            const startParts = ngState.start.split(':');
            if (startParts.length === 2) {
                const ngDate = new Date(currentLiveTime);
                ngDate.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0, 0);
                if (ngDate.getTime() > currentLiveTime.getTime()) ngDate.setDate(ngDate.getDate() - 1);
                const ngDowntimeSecs = Math.max(0, Math.floor((currentLiveTime.getTime() - ngDate.getTime()) / 1000));
                ongoingDowntimeSecs = Math.max(ongoingDowntimeSecs, ngDowntimeSecs); // avoid double counting if both are active
            }
        }

        const diffMs = currentLiveTime.getTime() - startDate.getTime();
        const totalElapsedSecs = Math.floor(diffMs / 1000);
        const netElapsedSecs = Math.max(0, totalElapsedSecs - (activeJob.downtimeMinutes || 0) * 60 - ongoingDowntimeSecs);

        const cavity = activeJob.kav || 1;
        const ct = activeJob.ct || 60;

        // Quantity per kanban/box is activeJob.spec
        const labelQty = activeJob.spec ?? 24;

        // Target quantity if we print this label box
        const targetTotalQty = activeJob.actualQty + labelQty;

        const currentMaxProduced = Math.floor((netElapsedSecs / ct) * cavity);
        const isLocked = currentMaxProduced < targetTotalQty;

        let message = '';
        if (isLocked) {
            if (abnormality.isAbnormal || ngState.isNg) {
                message = `Produksi terhenti sementara karena masalah Abnormal/NG. Sistem Kanban tidak akan menghitung waktu pembuatan part sampai isu ini di-resolve.`;
            } else {
                const needed = targetTotalQty - currentMaxProduced;
                const neededSecs = Math.ceil((needed / cavity) * ct);
                const remainingMins = Math.ceil(neededSecs / 60);
                message = `Print Terkunci: Mesin baru memproduksi sekitar ${currentMaxProduced}/${activeJob.qtyLot} pcs berdasarkan durasi aktif & cycle time. Butuh sekitar ${remainingMins} menit lagi untuk mencetak label box berikutnya.`;
            }
        }

        return { isLocked, message };
    }, [activeJob, currentLiveTime, abnormality, ngState]);

    const shiftStartStatus = useMemo(() => {
        if (!activeJob) return { isBeforeStart: false, startTimeStr: '' };

        const rangeParts = (activeJob.timeRange || '').split('-').map(s => s.trim());
        if (!rangeParts[0] || !rangeParts[0].includes(':')) {
            return { isBeforeStart: false, startTimeStr: '' };
        }

        const startTimeStr = rangeParts[0];
        const [startHStr, startMStr] = startTimeStr.split(':');
        const startH = parseInt(startHStr, 10);
        const startM = parseInt(startMStr, 10);

        const scheduledStart = new Date(selectedDate + 'T00:00:00');
        scheduledStart.setHours(startH, startM, 0, 0);

        const isBeforeStart = currentLiveTime.getTime() < scheduledStart.getTime();

        return { isBeforeStart, startTimeStr };
    }, [activeJob, selectedDate, currentLiveTime]);

    const finalDandoriJob = useMemo(() => {
        if (activeJob) return null;

        const dayJobs = jobs.filter(j => j.shift === 'day');
        const nightJobs = jobs.filter(j => j.shift === 'night');

        if (dayJobs.length > 0 && dayJobs.every(j => j.status === 'completed')) {
            const lastDayJob = dayJobs[dayJobs.length - 1];
            if (lastDayJob.needsFinalDandori && !lastDayJob.finalDandoriCompleted) {
                return lastDayJob;
            }
        }

        if (nightJobs.length > 0 && nightJobs.every(j => j.status === 'completed')) {
            const lastNightJob = nightJobs[nightJobs.length - 1];
            if (lastNightJob.needsFinalDandori && !lastNightJob.finalDandoriCompleted) {
                return lastNightJob;
            }
        }

        return null;
    }, [jobs, activeJob]);

    // Handlers
    const handleCompleteDandori = () => {
        if (!activeJob) return;
        if (shiftStartStatus.isBeforeStart && activePortal === 'member') {
            alert(`⚠️ BELUM MASUK WAKTU SHIFT!\n\nJadwal start shift/dandori adalah pukul ${shiftStartStatus.startTimeStr}. Persiapan/dandori tidak dapat diselesaikan sebelum masuk jam tersebut.`);
            return;
        }
        if (activePortal === 'member' && !isBtReadyForProduction) {
            alert("⚠️ SAMBUNGAN PRINTER BLUETOOTH WAJIB TERHUBUNG!\n\nPrinter Bluetooth belum ter-pair. Silakan klik 'Pair Bluetooth Printer' di panel sebelah kanan sebelum memulai produksi, atau aktifkan 'Dev Mode Bypass'.");
            return;
        }
        updateJobStatus(machineKey, activeJob.id, 'complete-dandori', selectedDate, partsData, {
            type: 'success', note: getLogNote(`Dandori selesai untuk ${activeJob.model}.`)
        });
    };

    const handleCompleteFinalDandori = (jobId: string) => {
        updateJobStatus(machineKey, jobId, 'complete-final-dandori', selectedDate, partsData, {
            type: 'success', note: getLogNote(`Dandori Akhir Shift selesai untuk mesin ${mName}.`)
        });
    };

    // Auto-finalize shift ONLY if live time reaches or exceeds actual shift end time (16:30/21:00 for Day, 05:00/07:15 for Night)
    useEffect(() => {
        if (isReadOnlyMode) return;
        const todayDate = getTodayDateString();
        if (selectedDate !== todayDate) return; // Only auto-close shift for TODAY's date!

        const dayJobs = jobs.filter(j => j.shift === 'day');
        const nightJobs = jobs.filter(j => j.shift === 'night');

        // Check Day Shift expiration (End of Day Shift: 16:30 for Teiji, 21:00 for OT)
        if (dayJobs.length > 0) {
            const dayEndStr = dayOT === 'ot' ? '21:00' : '16:30';
            const [h, m] = dayEndStr.split(':').map(n => parseInt(n, 10));
            const dayEndClock = new Date(selectedDate + 'T00:00:00');
            dayEndClock.setHours(h, m, 0, 0);

            const isDayShiftPending = dayJobs.some(j => j.status !== 'completed' || !j.finalDandoriCompleted);
            if (currentLiveTime.getTime() >= dayEndClock.getTime() && isDayShiftPending) {
                if (abnormality.isAbnormal) {
                    setMachineAbnormal(machineKey, false, undefined, undefined, selectedDate, {
                        type: 'success', note: `[AUTO-RESOLVE] Abnormality di-resolve otomatis karena shift DAY berakhir. (${userInitials})`
                    });
                }
                if (ngState.isNg) {
                    setMachineNg(machineKey, false, undefined, undefined, selectedDate, {
                        type: 'success', note: `[AUTO-RESOLVE] Issue NG Quality di-resolve otomatis karena shift DAY berakhir. (${userInitials})`
                    });
                }
                closeShiftProduction(machineKey, 'day', selectedDate, userInitials, mName, true);
            }
        }

        // Check Night Shift expiration (End of Night Shift: 05:00 for Teiji, 07:15 for OT next morning)
        if (nightJobs.length > 0) {
            const nightEndStr = nightOT === 'ot' ? '07:15' : '05:00';
            const [h, m] = nightEndStr.split(':').map(n => parseInt(n, 10));
            const nightEndClock = new Date(selectedDate + 'T00:00:00');
            // Night shift ends on the next morning
            nightEndClock.setDate(nightEndClock.getDate() + 1);
            nightEndClock.setHours(h, m, 0, 0);

            const isNightShiftPending = nightJobs.some(j => j.status !== 'completed' || !j.finalDandoriCompleted);
            if (currentLiveTime.getTime() >= nightEndClock.getTime() && isNightShiftPending) {
                if (abnormality.isAbnormal) {
                    setMachineAbnormal(machineKey, false, undefined, undefined, selectedDate, {
                        type: 'success', note: `[AUTO-RESOLVE] Abnormality di-resolve otomatis karena shift NIGHT berakhir. (${userInitials})`
                    });
                }
                if (ngState.isNg) {
                    setMachineNg(machineKey, false, undefined, undefined, selectedDate, {
                        type: 'success', note: `[AUTO-RESOLVE] Issue NG Quality di-resolve otomatis karena shift NIGHT berakhir. (${userInitials})`
                    });
                }
                closeShiftProduction(machineKey, 'night', selectedDate, userInitials, mName, true);
            }
        }
    }, [currentLiveTime, jobs, selectedDate, machineKey, mName, abnormality.isAbnormal, ngState.isNg, dayOT, nightOT, userInitials, isReadOnlyMode, closeShiftProduction, setMachineAbnormal, setMachineNg]);

    const handleOpenSignOff = (job: Job) => {
        setSignOffJobId(job.id);
        setSignOffChecks({});
        setSignOffNgQty('0');
        setSignOffOkQty(String(job.actualQty || job.qtyLot));
        setLeaderPin('');
        setPinError('');
        setShowSignOff(true);
    };

    const handleSignOffSubmit = async () => {
        const allChecked = SIGNOFF_CHECKLIST.every(c => signOffChecks[c.id]);
        if (!allChecked) { setPinError('Centang semua checklist dulu.'); return; }
        if (!leaderPin || leaderPin.length < 4) { setPinError('PIN Leader wajib diisi (min 4 digit).'); return; }
        setPinLoading(true);
        setPinError('');
        try {
            await api.post('/leaders/verify', { machine_id: machineKey, pin: leaderPin });
            const job = jobs.find(j => j.id === signOffJobId);
            if (job) {
                const closedNg = parseInt(signOffNgQty) || 0;
                const closedOk = parseInt(signOffOkQty) || 0;
                updateJobStatus(
                    machineKey, job.id, 'complete-running', selectedDate, partsData,
                    { type: 'success', note: getLogNote(`Job ${job.model} selesai. OK: ${closedOk}, NG: ${closedNg}`) },
                    closedNg, closedOk
                );
            }
            setShowSignOff(false);
        } catch {
            setPinError('PIN tidak valid atau mesin tidak ditemukan.');
        } finally {
            setPinLoading(false);
        }
    };

    const handleReportAbnormality = () => {
        if (!abnormality.isAbnormal) {
            const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            setAbnormalStartTime(now);
            setIsReportingAbnormal(true);
            setMachineAbnormal(
                machineKey, true, 'Dalam Investigasi...', now, selectedDate,
                { type: 'abnormal', note: getLogNote(`Abnormal STARTED — jenis sedang diinput`) }
            );
        }
    };

    const handleSaveAbnormalityRecord = () => {
        setMachineAbnormal(
            machineKey, true, selectedAbnType, abnormalStartTime, selectedDate,
            { type: 'abnormal', note: getLogNote(`Abnormal STARTED: ${selectedAbnType}`) }
        );
        setIsReportingAbnormal(false);
    };

    const handleCancelAbnormality = () => {
        setMachineAbnormal(
            machineKey, false, '', '', selectedDate,
            { type: 'success', note: getLogNote(`Abnormal DIBATALKAN`) }
        );
        setIsReportingAbnormal(false);
    };

    const handleResolveAbnormality = () => {
        if (abnormality.isAbnormal) {
            const now = new Date();
            const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            // Calculate downtime automatically
            let dMins = 0;
            if (abnormality.start) {
                const [hh, mm] = abnormality.start.split(':').map(Number);
                if (!isNaN(hh) && !isNaN(mm)) {
                    const startD = new Date();
                    startD.setHours(hh, mm, 0, 0);
                    if (startD.getTime() > now.getTime()) startD.setDate(startD.getDate() - 1);
                    dMins = Math.max(0, Math.round((now.getTime() - startD.getTime()) / 60000));
                }
            }

            setMachineAbnormal(
                machineKey, false, '', '', selectedDate,
                { type: 'abnormal', note: getLogNote(`Abnormal RESOLVED: ${abnormality.type}. Downtime: ${dMins} min. Start: ${abnormality.start} | Stop: ${nowStr}`), timeStr: nowStr },
                dMins, activeJob?.id
            );
        }
    };

    const handleReportNg = () => {
        if (!ngState.isNg) {
            const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            setNgStartTime(now);
            setIsReportingNg(true);
            setMachineNg(
                machineKey, true, 'Dalam Investigasi...', now, selectedDate,
                { type: 'ng', note: getLogNote(`NG STARTED — jenis sedang diinput`) }
            );
        }
    };

    const handleSaveNgRecord = () => {
        setMachineNg(
            machineKey, true, selectedNgType, ngStartTime, selectedDate,
            { type: 'ng', note: getLogNote(`NG STARTED: ${selectedNgType}`) }
        );
        setIsReportingNg(false);
    };

    const handleCancelNg = () => {
        setMachineNg(
            machineKey, false, '', '', selectedDate,
            { type: 'success', note: getLogNote(`NG DIBATALKAN`) }
        );
        setIsReportingNg(false);
    };

    const handleResolveNg = () => {
        if (ngState.isNg) {
            const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            setMachineNg(machineKey, false, '', '', selectedDate,
                { type: 'ng', note: getLogNote(`NG RESOLVED: ${ngState.type}. Start: ${ngState.start} | Stop: ${now}`), timeStr: now });
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 space-y-5">

            {/* Fullscreen & Always Awake Toolbar */}
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={toggleWakeLock}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-sm ${isWakeLockActive
                        ? 'bg-amber-500 border-amber-600 text-white shadow-amber-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-amber-400 hover:text-amber-600'
                        }`}
                    title={isWakeLockActive ? 'Screen stay-awake aktif — klik untuk nonaktifkan' : 'Aktifkan screen stay-awake agar tablet tidak mati otomatis'}
                >
                    {isWakeLockActive ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {isWakeLockActive ? 'Awake On' : 'Stay Awake'}
                </button>
                <button
                    onClick={toggleFullscreen}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-sm ${isFullscreen
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                    title={isFullscreen ? 'Keluar dari fullscreen' : 'Masuk fullscreen mode'}
                >
                    {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    {isFullscreen ? 'Exit FS' : 'Fullscreen'}
                </button>
            </div>

            {/* Read-Only Warning Banner */}
            {isReadOnlyMode && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 rounded-xl text-blue-800 dark:text-blue-300 shadow-sm animate-in fade-in">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-wider">Mode Read-Only Aktif</p>
                        <p className="text-[10px] mt-0.5 font-semibold">Anda sedang melihat jadwal untuk tanggal {selectedDate}. Eksekusi job hanya diizinkan untuk jadwal hari ini, kecuali Anda adalah Admin.</p>
                    </div>
                </div>
            )}

            {/* Active Status Banners */}
            {abnormality.isAbnormal && (
                <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-250 dark:bg-rose-950/20 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                    <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-wider">Abnormal Stop Active</p>
                        <p className="text-[10px] mt-0.5 font-bold">{abnormality.type} — since {abnormality.start}</p>
                    </div>
                    <button onClick={handleResolveAbnormality}
                        disabled={isReadOnlyMode || isReportingAbnormal}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-colors border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600">
                        Resolve
                    </button>
                </div>
            )}

            {ngState.isNg && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5 shrink-0 animate-pulse" />
                    <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-wider">NG Quality Issue Active</p>
                        <p className="text-[10px] mt-0.5 font-bold">{ngState.type} — since {ngState.start}</p>
                    </div>
                    <button onClick={handleResolveNg}
                        disabled={isReadOnlyMode || isReportingNg}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-colors border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500">
                        Resolve
                    </button>
                </div>
            )}

            {/* Two-Column Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                {/* LEFT MAIN COLUMN: Current Active Job + Up Next in Queue */}
                <div className="lg:col-span-3 space-y-6 flex flex-col">

                    {/* Current Active Job Panel */}
                    {activeJob ? (
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between relative">
                            {!isBtReadyForProduction && (
                                <div className="absolute inset-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg border border-amber-300 dark:border-amber-900 animate-in fade-in duration-200 select-none">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-3 shadow-sm animate-bounce">
                                        <Bluetooth className="w-7 h-7 stroke-[2.5]" />
                                    </div>

                                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                                        🔒 Lock Mode: Bluetooth Printer Offline
                                    </span>

                                    <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                                        Printer Bluetooth Wajib Terhubung
                                    </h3>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mb-6 animate-pulse">
                                        Koneksi printer Bluetooth terputus atau tablet baru ter-reset. Untuk menjamin cetakan Kanban & Label produksi valid, sambungkan Bluetooth Printer sebelum memproses job ini.
                                    </p>

                                    <div className="w-full max-w-sm space-y-2.5">
                                        <button
                                            type="button"
                                            onClick={connectBluetoothPrinter}
                                            disabled={!isBluetoothSupported || connectionStatus === 'connecting'}
                                            className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer border-0 ${!isBluetoothSupported
                                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {connectionStatus === 'connecting' ? (
                                                <><RefreshCw className="w-4 h-4 animate-spin" /> Connecting Printer...</>
                                            ) : (
                                                <><Bluetooth className="w-4 h-4" /> Pair Bluetooth Printer Now</>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={toggleBypassBtRequirement}
                                            className="w-full py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-amber-900 dark:text-amber-400 font-bold uppercase rounded-xl text-[10px] tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            ⚡ Aktifkan Dev Bypass Mode (Tanpa Printer)
                                        </button>
                                    </div>

                                    {connectionError && (
                                        <div className="mt-4 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-450 rounded-lg text-[10px] font-bold uppercase tracking-wider w-full max-w-sm text-center">
                                            {connectionError}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeJob.status === 'dandori' ? (
                                <div className="bg-white dark:bg-slate-950 flex flex-col h-full rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-900/50">
                                    <div className="p-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3.5 h-3.5 rounded-full bg-blue-300 animate-ping shadow-[0_0_8px_rgba(147,197,253,0.8)]"></div>
                                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                                {isFirstInShift ? "Preparation Mode (Shift Start)" : "Dandori Setup Mode (Changeover)"}
                                            </h3>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold">SETUP TIMELINE</span>
                                            <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold font-mono text-white">{activeJob.timeRange}</span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded uppercase ml-2">
                                                <ShieldCheck className="w-3 h-3" /> Member Mode
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col items-center text-center">
                                        <div className="w-full max-w-2xl mb-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden text-left">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-1">
                                                    <AlertCircle className="w-8 h-8 animate-pulse" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">
                                                        {isFirstInShift ? "Shift Start Preparation" : "Upcoming Machine Configuration"}
                                                    </h4>
                                                    <div className="text-xl font-black font-mono text-slate-800 dark:text-white tracking-tight">{activeJob.model}</div>
                                                    <div className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase mt-0.5">{activeJob.partName}</div>
                                                    <div className="text-xs text-slate-400 font-medium mt-1">Customer: <span className="font-bold text-slate-600 dark:text-slate-400">{activeJob.customer}</span></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                                                <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-sm">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Target Mold</div>
                                                    <div className="text-sm font-black font-mono text-slate-700 dark:text-slate-300 mt-1">{activeJob.mold}</div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-sm">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Target Material</div>
                                                    <div className="text-xs font-black font-mono text-slate-700 dark:text-slate-300 mt-1.5 truncate" title={activeJob.material}>{activeJob.material}</div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-sm">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Setup Time</div>
                                                    <div className="text-sm font-black font-mono text-blue-600 dark:text-blue-400 mt-1">{activeJob.dandori} mins</div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700 shadow-sm">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Production Lot</div>
                                                    <div className="text-sm font-black font-mono text-slate-700 dark:text-slate-300 mt-1">{activeJob.qtyLot} pcs</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="max-w-md mb-8">
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight mb-2">
                                                {isFirstInShift ? "Shift Start Preparation In Progress" : "Changeover In Progress"}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {isFirstInShift
                                                    ? `Perform shift start preparation for model ${activeJob.model}. Check molds, machine state, and load materials before starting production.`
                                                    : `Prepare the mold ${activeJob.mold} and load the resin material ${activeJob.material}.`}
                                            </p>
                                        </div>

                                        <div className="w-full max-w-2xl flex flex-col gap-3">
                                            {shiftStartStatus.isBeforeStart && (
                                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 text-amber-800 dark:text-amber-400 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
                                                    <div className="flex items-center gap-2.5">
                                                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
                                                        <span>
                                                            Waktu shift/dandori belum dimulai (Jadwal start: <strong className="font-black text-amber-900 dark:text-amber-300 font-mono">{shiftStartStatus.startTimeStr}</strong>). Tombol Finish Preparation dikunci hingga waktu tiba.
                                                        </span>
                                                    </div>
                                                    {activePortal !== 'member' && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded shrink-0 ml-2">
                                                            Leader Bypass
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <button onClick={handleCompleteDandori}
                                                disabled={isReadOnlyMode || (shiftStartStatus.isBeforeStart && activePortal === 'member')}
                                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-750 text-white rounded-[4px] font-black uppercase tracking-widest text-sm transition-all shadow-md flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600">
                                                <CheckCircle2 className="w-5 h-5" /> {isFirstInShift ? "Finish Shift Preparation" : "Finish Dandori Setup"}
                                            </button>

                                            <button onClick={() => closeShiftProduction(machineKey, activeJob.shift === 'night' ? 'night' : 'day', selectedDate)}
                                                disabled={isReadOnlyMode}
                                                className="w-full py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-xs rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-950">
                                                <AlertCircle className="w-4 h-4" /> Close {activeJob.shift?.toUpperCase()} Shift Production
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {/* Header banner */}
                                    <div className="bg-[#E76114] px-5 py-3.5 flex items-center justify-between text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <h3 className="font-bold text-xs uppercase tracking-wider">Current Active Job</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                                {activeJob.shift === 'night' ? 'NIGHT SHIFT' : 'DAY SHIFT'}
                                            </span>
                                            <span className="font-mono text-xs font-bold">{activeJob.timeRange}</span>
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Member Mode
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                            <div>
                                                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Part Number / Model</p>
                                                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5 font-mono">{activeJob.model}</h2>
                                                <p className="text-xs font-bold text-slate-500 uppercase mt-1">{activeJob.partName}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-2">
                                                    Mold: <span className="font-bold text-slate-600 dark:text-slate-350">{activeJob.mold || 'N/A'}</span> &nbsp;•&nbsp; Material: <span className="font-bold text-slate-600 dark:text-slate-350">{activeJob.material || 'N/A'}</span>
                                                </p>
                                            </div>
                                            <div className="sm:text-right shrink-0">
                                                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Customer</p>
                                                <span className="inline-block bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-1 text-slate-800 dark:text-white font-black text-lg border rounded mt-1">
                                                    {activeJob.customer}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Section */}
                                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-800/80">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Production Progress</span>
                                                <div className="flex items-baseline gap-1.5 font-mono">
                                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{activeJob.actualQty}</span>
                                                    <span className="text-sm font-bold text-slate-455">/ {activeJob.qtyLot} pcs</span>
                                                </div>
                                            </div>
                                            <div className="h-4 bg-slate-205 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all flex items-center justify-end pr-2 overflow-hidden"
                                                    style={{ width: `${activeJob.qtyLot > 0 ? Math.min(100, (activeJob.actualQty / activeJob.qtyLot) * 100) : 0}%` }}
                                                >
                                                    {activeJob.qtyLot > 0 && Math.round((activeJob.actualQty / activeJob.qtyLot) * 100) > 5 && (
                                                        <span className="text-[9px] font-black text-white">{Math.round((activeJob.actualQty / activeJob.qtyLot) * 100)}%</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-3 text-[10px] text-slate-400 font-bold">
                                                <span>Cycle Time: {activeJob.ct}s &nbsp;|&nbsp; Cavity: {activeJob.spec ?? 24}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons Stack matching screenshot */}
                                        <div className="space-y-4">
                                            {/* Green print label & Red report abnormality side-by-side */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setShowPrintModal(true)}
                                                    disabled={abnormality.isAbnormal || ngState.isNg || isReadOnlyMode || isReportingAbnormal || isReportingNg}
                                                    className="py-3 px-4 bg-[#037233] hover:bg-[#025c28] text-white font-extrabold uppercase tracking-wider text-xs rounded-[4px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#037233]"
                                                >
                                                    <Printer className="w-4 h-4" /> Print Custom Label (Kanban)
                                                </button>
                                                <button
                                                    onClick={abnormality.isAbnormal ? handleResolveAbnormality : handleReportAbnormality}
                                                    disabled={isReadOnlyMode || isReportingAbnormal || isReportingNg || (ngState.isNg && !abnormality.isAbnormal)}
                                                    className="py-3 px-4 bg-white hover:bg-rose-50 dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-455 font-extrabold uppercase tracking-wider text-xs rounded-[4px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-950 dark:disabled:border-slate-800"
                                                >
                                                    <AlertTriangle className="w-4 h-4" /> {abnormality.isAbnormal ? (isReportingAbnormal ? 'Under Investigation' : 'Resolve Abnormality') : 'Report Abnormality'}
                                                </button>
                                            </div>

                                            {/* Orange report NG full-width */}
                                            <button
                                                onClick={ngState.isNg ? handleResolveNg : handleReportNg}
                                                disabled={isReadOnlyMode || isReportingNg || isReportingAbnormal || (abnormality.isAbnormal && !ngState.isNg)}
                                                className="w-full py-3 bg-white hover:bg-amber-50/50 dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-900/50 text-amber-700 dark:text-amber-450 font-extrabold uppercase tracking-wider text-xs rounded-[4px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-950 dark:disabled:border-slate-800"
                                            >
                                                <AlertCircle className="w-4 h-4" /> {ngState.isNg ? (isReportingNg ? 'Under Investigation' : 'Resolve NG Issue') : 'Report NG (Quality Issue Ongoing)'}
                                            </button>

                                            {/* Blue complete production full-width */}
                                            <button
                                                onClick={() => handleOpenSignOff(activeJob)}
                                                disabled={isReadOnlyMode || abnormality.isAbnormal || ngState.isNg || isReportingAbnormal || isReportingNg}
                                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm rounded-[4px] transition-all hover:-translate-y-0.5 cursor-pointer border-0 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:-translate-y-0"
                                            >
                                                <CheckCircle2 className="w-5 h-5" /> Complete Production
                                            </button>

                                            <button
                                                onClick={() => closeShiftProduction(machineKey, activeJob.shift === 'night' ? 'night' : 'day', selectedDate)}
                                                disabled={isReadOnlyMode}
                                                className="w-full py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-xs rounded-[4px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-950"
                                            >
                                                <Play className="w-4 h-4 text-slate-500" /> Close {activeJob.shift?.toUpperCase()} Shift Production
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : finalDandoriJob ? (
                        <div className="bg-white dark:bg-slate-950 border-2 border-indigo-500/40 dark:border-indigo-500/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden animate-in fade-in">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-sm">
                                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                            </div>

                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                                🧹 Dandori Akhir Shift ({finalDandoriJob.shift?.toUpperCase()} SHIFT)
                            </span>

                            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                                Pembersihan Mesin & Dandori Akhir Shift
                            </h3>

                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6 font-medium">
                                Part terakhir (<strong className="font-mono text-slate-700 dark:text-slate-300">{finalDandoriJob.model}</strong>) di shift {finalDandoriJob.shift?.toUpperCase()} telah selesai diproduksi. Lakukan pembersihan mold, merapikan area kerja, dan selesaikan Dandori Akhir Shift sebelum menekan tombol <strong className="text-slate-700 dark:text-slate-300">Close Shift Production</strong>.
                            </p>

                            <div className="w-full max-w-md flex flex-col gap-3">
                                <button onClick={() => handleCompleteFinalDandori(finalDandoriJob.id)}
                                    disabled={isReadOnlyMode}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-[4px] font-black uppercase tracking-widest text-sm transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CheckCircle2 className="w-5 h-5" /> Selesaikan Dandori Akhir Shift
                                </button>

                                <div className="space-y-1">
                                    <button onClick={() => {
                                        closeShiftProduction(machineKey, finalDandoriJob.shift === 'night' ? 'night' : 'day', selectedDate, userInitials, mName, true);
                                    }}
                                        disabled={isReadOnlyMode}
                                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold uppercase tracking-wider text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Close {finalDandoriJob.shift?.toUpperCase()} Shift Production
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Up Next in Queue */}
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Up Next in Queue — {selectedDate}</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {jobs.length === 0 ? (
                                <p className="py-8 text-center text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tidak ada jadwal produksi</p>
                            ) : (
                                jobs.map((job, idx) => (
                                    <div key={job.id} className={`flex items-center gap-4 px-4 py-3 transition-colors ${job.status === 'running' ? 'bg-emerald-50/40 dark:bg-emerald-950/10' :
                                        job.status === 'dandori' ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''
                                        }`}>
                                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">{job.model}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${statusChip[job.status]}`}>{job.status}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{job.shift}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-550 truncate">{job.partName} &nbsp;|&nbsp; Qty: {job.actualQty}/{job.qtyLot} &nbsp;|&nbsp; {job.timeRange}</p>
                                        </div>
                                        {job.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                        {job.status === 'running' && <ArrowRight className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Printer Connection + Activity Log */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800 flex flex-col min-h-[450px]">

                        {/* Section 1: Printer Connection */}
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 select-none">
                                    <Bluetooth className="w-3.5 h-3.5 text-blue-650" /> Printer Connection
                                </h3>
                                {connectionStatus === 'connected' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450 uppercase animate-pulse">
                                        Linked
                                    </span>
                                ) : connectionStatus === 'connecting' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 uppercase animate-pulse">
                                        Linking
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 uppercase">
                                        Offline
                                    </span>
                                )}
                            </div>

                            {connectionStatus === 'connected' ? (
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-600 truncate">
                                        Device: <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{btDevice?.name || 'Printer'}</span>
                                    </div>
                                    <button
                                        onClick={disconnectBluetoothPrinter}
                                        className="w-full py-1.5 text-[9px] font-black text-rose-650 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Disconnect Printer
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        onClick={connectBluetoothPrinter}
                                        className="w-full py-2.5 bg-white hover:bg-blue-650 text-slate-700 hover:text-white border border-slate-300 dark:border-slate-800 hover:border-blue-650 font-extrabold uppercase tracking-wider text-[10px] rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                        <Bluetooth className="w-3.5 h-3.5" /> Pair Bluetooth Printer
                                    </button>
                                    {connectionStatus === 'error' && connectionError && (
                                        <p className="text-[9px] text-rose-500 font-extrabold text-center mt-1 truncate" title={connectionError}>
                                            {connectionError}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Dev Mode Bypass BT Pairing Requirement Toggle */}
                            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between mt-2.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight">Dev Bypass Mode:</span>
                                <button
                                    onClick={toggleBypassBtRequirement}
                                    className={`px-2.5 py-1 rounded text-[8px] font-black uppercase transition-colors cursor-pointer border-0 ${bypassBtRequirement
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-450'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                                        }`}
                                >
                                    {bypassBtRequirement ? '⚡ Bypass ON' : '🔒 Strict BT Req'}
                                </button>
                            </div>

                            <p className="text-[8px] text-slate-450 leading-relaxed font-semibold">
                                Web Bluetooth is not supported in this browser. Fallback will trigger a local printing window.
                            </p>
                        </div>

                        {/* Section 2: Activity Log */}
                        <div className="flex-1 flex flex-col min-h-[300px]">
                            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Activity Log</h3>
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-450 animate-pulse">
                                    ● Realtime (Live)
                                </span>
                            </div>

                            {isReportingAbnormal && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40 animate-in slide-in-from-top-2 shrink-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-rose-800 dark:text-rose-450 text-xs uppercase">Catat Jenis Abnormal ke Log</h4>
                                        <button onClick={handleCancelAbnormality} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-rose-600 dark:text-rose-500 mb-3 font-medium">
                                        ⚠️ Status mesin sudah berubah. Pilih jenis untuk dicatat di activity log.
                                    </p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-500 mb-1">Tipe Abnormal</label>
                                            <select value={selectedAbnType} onChange={e => setSelectedAbnType(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-rose-200 dark:border-rose-800 rounded text-xs font-bold bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-400 outline-none focus:border-rose-400">
                                                {ABNORMAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={handleSaveAbnormalityRecord}
                                                className="py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-sm">
                                                Simpan Jenis
                                            </button>
                                            <button onClick={handleCancelAbnormality}
                                                className="py-2 bg-white dark:bg-slate-900 hover:bg-rose-50 border border-rose-350 dark:border-rose-900 text-rose-700 dark:text-rose-455 rounded text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-sm">
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isReportingNg && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40 animate-in slide-in-from-top-2 shrink-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-amber-800 dark:text-amber-455 text-xs uppercase">Catat Jenis NG ke Log</h4>
                                        <button onClick={handleCancelNg} className="text-amber-500 hover:text-amber-700 cursor-pointer">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-amber-600 dark:text-amber-500 mb-3 font-medium">
                                        ⚠️ Status mesin sudah berubah. Pilih jenis untuk dicatat di activity log.
                                    </p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-1">Tipe NG</label>
                                            <select value={selectedNgType} onChange={e => setSelectedNgType(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-amber-200 dark:border-amber-800 rounded text-xs font-bold bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-400 outline-none focus:border-amber-400">
                                                {NG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={handleSaveNgRecord}
                                                className="py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-sm">
                                                Simpan Jenis
                                            </button>
                                            <button onClick={handleCancelNg}
                                                className="py-2 bg-white dark:bg-slate-900 hover:bg-amber-50 border border-amber-350 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-sm">
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="divide-y divide-slate-50 dark:divide-slate-900 overflow-y-auto flex-1 max-h-[450px]">
                                {logList.length === 0 ? (
                                    <p className="py-8 text-center text-[11px] text-slate-400 font-bold uppercase tracking-wider">Belum ada aktivitas</p>
                                ) : (
                                    logList.map(entry => {
                                        const isAbnormalLog = entry.type === 'abnormal' || (entry.message || '').toUpperCase().includes('[ABNORMAL');
                                        const isNgLog = entry.type === 'ng' || (entry.message || '').toUpperCase().includes('[NG');
                                        const logColor =
                                            isAbnormalLog
                                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                                : isNgLog
                                                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                                                    : 'text-emerald-600 dark:text-emerald-400 font-bold';
                                        return (
                                            <div key={entry.id} className="flex items-start gap-3 px-4 py-2.5">
                                                <span className="text-[9px] font-mono text-slate-400 shrink-0 mt-0.5">{entry.time}</span>
                                                <p className={`text-[10px] leading-relaxed ${logColor}`}>{entry.message}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ═══════════ MODALS ═══════════ */}



            {/* Leader Sign-Off Modal */}
            {showSignOff && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-[#E76114] p-4 flex justify-between items-center text-white">
                            <span className="font-black text-sm uppercase tracking-wider">Leader Sign-Off</span>
                            <button onClick={() => setShowSignOff(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {SIGNOFF_CHECKLIST.map(c => (
                                <label key={c.id} className="flex items-start gap-3 cursor-pointer select-none">
                                    <div
                                        onClick={() => setSignOffChecks(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${signOffChecks[c.id] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'
                                            }`}
                                    >
                                        {signOffChecks[c.id] && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{c.label}</span>
                                </label>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">NG Qty</label>
                                    <input type="number" min={0} value={signOffNgQty} 
                                        onChange={e => {
                                            const ngVal = e.target.value;
                                            setSignOffNgQty(ngVal);
                                            const ng = parseInt(ngVal) || 0;
                                            const currentJob = jobs.find(j => j.id === signOffJobId);
                                            const totalActual = currentJob?.actualQty !== undefined && currentJob.actualQty > 0 ? currentJob.actualQty : (currentJob?.qtyLot || 0);
                                            const ok = Math.max(0, totalActual - ng);
                                            setSignOffOkQty(String(ok));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 dark:text-white outline-none focus:border-[#E76114]" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">OK Qty</label>
                                    <input type="number" min={0} value={signOffOkQty} onChange={e => setSignOffOkQty(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 dark:text-white outline-none focus:border-[#E76114]" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Leader PIN *</label>
                                <input type="password" inputMode="numeric" maxLength={8} value={leaderPin}
                                    onChange={e => setLeaderPin(e.target.value)} placeholder="••••"
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 dark:text-white outline-none focus:border-[#E76114] text-center tracking-[0.4em]" />
                                {pinError && <p className="text-[10px] text-rose-600 font-bold">{pinError}</p>}
                            </div>
                            <button onClick={handleSignOffSubmit} disabled={pinLoading}
                                className="w-full py-2.5 bg-[#E76114] hover:opacity-95 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-2">
                                {pinLoading ? 'Verifying...' : <><ShieldCheck className="w-4 h-4" /> Konfirmasi & Selesaikan Job</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Label Modal */}
            {showPrintModal && activeJob && (
                <PrintLabelModal
                    partNumber={activeJob.model}
                    partName={activeJob.partName}
                    customer={activeJob.customer}
                    targetTotal={activeJob.qtyLot}
                    labelQty={activeJob.spec ?? 24}
                    onSuccess={handlePrintSuccess}
                    onClose={() => setShowPrintModal(false)}
                    btDevice={btDevice}
                    btCharacteristic={btCharacteristic}
                    connectionStatus={connectionStatus}
                    isPrintLocked={printLockStatus.isLocked}
                    lockMessage={printLockStatus.message}
                    actualQty={activeJob.actualQty}
                />
            )}
        </div>
    );
}