import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Box,
  GripVertical,
  CheckCircle,
  Settings2,
  Trash2,
  Layers,
  Gauge,
  Database,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import {
  useProduction,
  getUniqueMachineKey,
  getTodayDateString,
  getHeijunkaJobsForMachine,
} from '../../context/ProductionContext';
import type { Job, AbnormalityLog } from '../../context/ProductionContext';
import { useAuthStore } from '../../../../shared/store/useAuthStore';
import api from '../../../../shared/lib/axios';

// DandoriInput component to edit dandori setup times
interface DandoriInputProps {
  initialValue: number;
  onSave: (val: number) => void;
  disabled?: boolean;
}

function DandoriInput({ initialValue, onSave, disabled }: DandoriInputProps) {
  const [val, setVal] = useState(String(initialValue));

  useEffect(() => {
    setVal(String(initialValue));
  }, [initialValue]);

  const handleBlur = () => {
    const num = parseInt(val);
    if (!isNaN(num) && num >= 0) {
      onSave(num);
    } else {
      setVal(String(initialValue));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0) {
        onSave(num);
        (e.target as HTMLInputElement).blur();
      } else {
        setVal(String(initialValue));
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  return (
    <input
      type="number"
      min={0}
      disabled={disabled}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-12 px-1 py-0.5 border border-slate-300 rounded font-mono font-bold text-[10px] text-center text-orange-600 bg-white focus:outline-none focus:border-orange-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
    />
  );
}

// Helper functions for shift operating hours and setup changes
function getWorkingBlocks(dayOT?: string, nightOT?: string) {
  const blocks: [number, number][] = [];

  // Day Shift Working Blocks (07:15 - 19:00, paused only by Sugity break hours)
  blocks.push([435, 570]); // 07:15 - 09:30
  blocks.push([580, 715]); // 09:40 - 11:55
  blocks.push([755, 965]); // 12:35 - 16:05
  blocks.push([980, 1140]); // 16:20 - 19:00

  // Night Shift Working Blocks (21:00 - 07:15 the next day, paused only by Sugity break hours)
  blocks.push([1260, 1440]); // 21:00 - 00:00 (before midnight)
  blocks.push([0, 60]); // 00:00 - 01:00 (after midnight before break)
  blocks.push([100, 280]); // 01:40 - 04:40
  blocks.push([295, 435]); // 04:55 - 07:15

  // Apply Overtime Blocks
  if (dayOT === '1.5h') {
    blocks.push([1140, 1230]); // Day OT 1.5 hours: 19:00 - 20:30
  } else if (dayOT === '3h') {
    blocks.push([1140, 1320]); // Day OT 3 hours: 19:00 - 22:00
  }

  if (nightOT === '1.5h') {
    blocks.push([435, 525]); // Night OT 1.5 hours: 07:15 - 08:45
  } else if (nightOT === '3h') {
    blocks.push([435, 615]); // Night OT 3 hours: 07:15 - 10:15
  }

  blocks.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const block of blocks) {
    if (merged.length === 0) {
      merged.push([...block]);
    } else {
      const last = merged[merged.length - 1];
      if (block[0] <= last[1]) {
        last[1] = Math.max(last[1], block[1]);
      } else {
        merged.push([...block]);
      }
    }
  }
  return merged;
}

export function addWorkingMinutes(
  current: Date,
  minutesToAdd: number,
  dayOT: string,
  nightOT: string
): Date {
  let result = new Date(current);
  let remaining = minutesToAdd;
  let iterations = 0;
  while (remaining > 0 && iterations < 100) {
    iterations++;
    const blocks = getWorkingBlocks(dayOT, nightOT);
    const timeInMins = result.getHours() * 60 + result.getMinutes() + result.getSeconds() / 60;

    let foundBlock = false;
    for (const block of blocks) {
      if (timeInMins >= block[0] && timeInMins < block[1]) {
        const available = block[1] - timeInMins;
        if (remaining <= available) {
          result.setMinutes(result.getMinutes() + remaining);
          remaining = 0;
          foundBlock = true;
          break;
        } else {
          remaining -= available;
          result.setHours(Math.floor(block[1] / 60), block[1] % 60, 0, 0);
          foundBlock = true;
          break;
        }
      } else if (timeInMins < block[0]) {
        result.setHours(Math.floor(block[0] / 60), block[0] % 60, 0, 0);
        foundBlock = true;
        break;
      }
    }
    if (!foundBlock) {
      result.setDate(result.getDate() + 1);
      result.setHours(0, 0, 0, 0);
    }
  }
  return result;
}

interface MachinePatternViewProps {
  machine: string;
  factory: string;
  machineKey?: string;
  selectedDate?: string;
}

interface ShiftTimelineProps {
  shift: 'day' | 'night';
  jobs: Job[];
  avgJobs: Job[];
  dayOT: string;
  nightOT: string;
  showDailyAndAct?: boolean;
  isAbnormalActive?: boolean;
  isNgActive?: boolean;
  logs?: AbnormalityLog[];
  activeAbnormalStart?: string;
  activeNgStart?: string;
  selectedDate?: string;
}

function ShiftTimeline({
  shift,
  jobs,
  avgJobs,
  dayOT,
  nightOT,
  showDailyAndAct = true,
  isAbnormalActive = false,
  isNgActive = false,
  logs = [],
  activeAbnormalStart = '',
  activeNgStart = '',
  selectedDate,
}: ShiftTimelineProps) {
  const todayDateStr = getTodayDateString();
  const isToday = (selectedDate || todayDateStr) === todayDateStr;

  const allShiftJobs = jobs.filter((j) => j.shift === shift);
  const allAvgShiftJobs = avgJobs.filter((j) => j.shift === shift);
  const totalMins = shift === 'day' ? 720 : 615; // Day: 12h (07:00-19:00), Night: 10.25h (21:00-07:15)
  const shiftStartHour = shift === 'day' ? 7 : 21;
  const hoursCount = shift === 'day' ? 12 : 10;

  const ticks: string[] = [];
  for (let i = 0; i <= hoursCount; i++) {
    const hr = (shiftStartHour + i) % 24;
    const formattedHr = String(hr).padStart(2, '0') + ':00';
    ticks.push(formattedHr);
  }

  const breaks =
    shift === 'day'
      ? [
          { start: '09:30', end: '09:40', label: 'Break' },
          { start: '11:55', end: '12:35', label: 'Break' },
          { start: '16:05', end: '16:20', label: 'Break' },
        ]
      : [
          { start: '01:00', end: '01:40', label: 'Break' },
          { start: '04:40', end: '04:55', label: 'Break' },
        ];

  const getMinutesOffset = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hhStr, mmStr] = timeStr.trim().split(':');
    const hh = parseInt(hhStr);
    const mm = parseInt(mmStr);
    const timeInMins = hh * 60 + mm;

    if (shift === 'day') {
      if (timeInMins < 420) {
        return totalMins;
      }
      if (timeInMins > 1140) {
        return totalMins;
      }
      return timeInMins - 420;
    } else {
      if (timeInMins > 435 && timeInMins < 1260) {
        return 0;
      }
      if (timeInMins >= 1260) {
        return timeInMins - 1260;
      }
      return timeInMins + 180;
    }
  };

  const getJobColor = (seq: number) => {
    const colors = [
      '#026396', // Ocean Blue
      '#E76114', // Sugity Orange
      '#037233', // Sugity Green
      '#8B5CF6', // Indigo
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#10B981', // Emerald
    ];
    return colors[(seq - 1) % colors.length];
  };

  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setCurrentTimeStr(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentOffset = isToday ? getMinutesOffset(currentTimeStr) : -1;
  const showCurrentTimeLine = isToday && currentOffset > 0 && currentOffset < totalMins;

  const dOT = dayOT || 'teiji';
  const nOT = nightOT || 'teiji';

  const actualTimes: Record<
    string,
    {
      dandoriStartStr: string;
      dandoriEndStr: string;
      productionStartStr: string;
      productionEndStr: string;
    }
  > = {};

  let currentActualTime = new Date();
  currentActualTime.setHours(7, 15, 0, 0);

  const dayStart = new Date(currentActualTime);
  const nightPrepStart = new Date(dayStart);
  nightPrepStart.setHours(21, 0, 0, 0);

  let lastDayEndTime = new Date(dayStart);
  lastDayEndTime.setMinutes(lastDayEndTime.getMinutes() + 15);

  let lastNightEndTime = new Date(nightPrepStart);
  lastNightEndTime.setMinutes(lastNightEndTime.getMinutes() + 10);

  let isFirstNight = true;

  jobs.forEach((job, index) => {
    const hasActualData = !!(
      job.actualDandoriStart ||
      job.actualDandoriEnd ||
      job.actualProductionStart ||
      job.actualProductionEnd
    );

    let dStartStr = '';
    let dEndStr = '';
    let pStartStr = '';
    let pEndStr = '';

    const currentClockTime = isToday
      ? currentTimeStr || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : undefined;

    const isValidShiftTime = (timeStr?: string, jobShift?: string) => {
      if (!timeStr || !timeStr.includes(':')) return false;
      const [hStr, mStr] = timeStr.split(':');
      const mins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      if (jobShift === 'day') {
        return mins >= 420 && mins <= 1140;
      } else {
        return mins < 435 || mins >= 1260;
      }
    };

    const hasValidActualStart =
      (job.actualProductionStart && isValidShiftTime(job.actualProductionStart, job.shift)) ||
      (job.actualDandoriStart && isValidShiftTime(job.actualDandoriStart, job.shift));

    const isSkipped =
      job.status === 'completed' &&
      (job.actualQty === undefined || job.actualQty === 0) &&
      !hasValidActualStart;

    if (isSkipped) {
      // Do nothing
    } else if (hasActualData || job.status === 'completed' || job.status === 'running' || job.status === 'dandori') {
      if (job.actualDandoriStart) {
        dStartStr = job.actualDandoriStart;
      } else {
        if (index === 0) {
          dStartStr = job.shift === 'night' ? '21:00' : '07:15';
        } else {
          const prevJob = jobs[index - 1];
          const prevTimes = actualTimes[prevJob.id];
          if (prevTimes) {
            dStartStr = prevTimes.productionEndStr || prevTimes.dandoriEndStr;
          } else {
            dStartStr = job.shift === 'night' ? '21:10' : '07:30';
          }
        }
      }

      if (job.actualDandoriEnd) {
        dEndStr = job.actualDandoriEnd;
      } else {
        if (job.status === 'dandori' && currentClockTime) {
          dEndStr = currentClockTime;
        } else {
          // For historical dates: use dandori start + dandori duration
          if (dStartStr && job.dandori) {
            const [hh, mm] = dStartStr.split(':').map(Number);
            const totalMins = hh * 60 + mm + (job.dandori || 0);
            const endHh = Math.floor(totalMins / 60) % 24;
            const endMm = totalMins % 60;
            dEndStr = `${String(endHh).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`;
          } else {
            dEndStr = dStartStr;
          }
        }
      }

      if (job.actualProductionStart) {
        pStartStr = job.actualProductionStart;
      } else {
        pStartStr = dEndStr || dStartStr || '07:30';
      }

      if (job.actualProductionEnd) {
        pEndStr = job.actualProductionEnd;
      } else {
        if (job.status === 'running' && currentClockTime) {
          pEndStr = currentClockTime;
        } else if (job.time) {
          // For historical dates or non-running: use production start + time duration
          const [hh, mm] = pStartStr.split(':').map(Number);
          const totalMins = hh * 60 + mm + (job.time || 0);
          const endHh = Math.floor(totalMins / 60) % 24;
          const endMm = totalMins % 60;
          pEndStr = `${String(endHh).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`;
        } else {
          pEndStr = pStartStr;
        }
      }

      if (!pEndStr || !pEndStr.includes(':')) {
        actualTimes[job.id] = { dandoriStartStr: dStartStr, dandoriEndStr: dEndStr, productionStartStr: pStartStr, productionEndStr: pStartStr };
      } else {
        const [hhStr, mmStr] = pEndStr.split(':');
        const hh = parseInt(hhStr, 10);
        const mm = parseInt(mmStr, 10);
        const newClock = new Date(dayStart);
        newClock.setHours(hh, mm, 0, 0);
        if (job.shift === 'night' && hh < 12) {
          newClock.setDate(newClock.getDate() + 1);
        }
        if (job.shift === 'night') {
          lastNightEndTime = newClock;
        } else {
          lastDayEndTime = newClock;
        }
        actualTimes[job.id] = {
          dandoriStartStr: dStartStr,
          dandoriEndStr: dEndStr,
          productionStartStr: pStartStr,
          productionEndStr: pEndStr,
        };
      }
    } else {
      let runningClock = new Date();

      if (job.shift === 'day') {
        runningClock = new Date(lastDayEndTime);
      } else if (job.shift === 'night') {
        if (isFirstNight) {
          let nightStart = new Date(nightPrepStart);
          if (lastDayEndTime.getTime() > nightStart.getTime()) {
            nightStart = new Date(lastDayEndTime);
          }
          runningClock = new Date(nightStart);
          runningClock.setMinutes(runningClock.getMinutes() + 10);
          isFirstNight = false;
        } else {
          runningClock = new Date(lastNightEndTime);
        }
      } else {
        runningClock = new Date(lastNightEndTime);
      }

      let pStart = new Date(runningClock);
      let pMins = job.time || 0;
      const pEnd = addWorkingMinutes(pStart, pMins, dOT, nOT);
      runningClock = pEnd;

      let dStart = new Date(runningClock);
      let dEnd = new Date(runningClock);
      const dMins = job.dandori || 0;
      if (dMins > 0 && job.shift !== 'overflow') {
        dEnd = addWorkingMinutes(dStart, dMins, dOT, nOT);
        runningClock = dEnd;
      }

      if (job.shift === 'day') {
        lastDayEndTime = new Date(runningClock);
      } else {
        lastNightEndTime = new Date(runningClock);
      }

      dStartStr = dStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      dEndStr = dEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      pStartStr = pStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      pEndStr = pEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    actualTimes[job.id] = {
      dandoriStartStr: dStartStr,
      dandoriEndStr: dEndStr,
      productionStartStr: pStartStr,
      productionEndStr: pEndStr,
    };
  });

  const isTimeInShift = (timeStr: string): boolean => {
    if (!timeStr) return false;
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return false;
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    if (isNaN(hh) || isNaN(mm)) return false;
    const mins = hh * 60 + mm;

    if (shift === 'day') {
      return mins >= 420 && mins <= 1140;
    } else {
      return mins >= 1260 || mins <= 435;
    }
  };

  interface LossInterval {
    startTime: string;
    endTime: string;
    kind: 'abnormal' | 'ng';
    note?: string;
  }
  const lossIntervals: LossInterval[] = [];
  const processedKeys = new Set<string>();

  logs.forEach((log, index) => {
    const msg = log.message || '';

    if (msg.includes('NG RESOLVED')) {
      const startMatch = msg.match(/Start:\s*(\d{1,2}:\d{2})/i);
      const stopMatch = msg.match(/Stop:\s*(\d{1,2}:\d{2})/i);

      let startTime = startMatch ? startMatch[1] : null;
      const endTime = stopMatch ? stopMatch[1] : log.time;

      if (!startTime) {
        const olderLogs = logs.slice(index + 1);
        const startedLog = olderLogs.find((l) => (l.message || '').includes('NG STARTED'));
        startTime = startedLog ? startedLog.time : log.time;
      }

      if (startTime && isTimeInShift(startTime)) {
        const key = `ng-${startTime}-${endTime}`;
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          lossIntervals.push({ startTime, endTime, kind: 'ng', note: msg });
        }
      }
      return;
    }

    if (msg.includes('Abnormal RESOLVED')) {
      const startMatch = msg.match(/Start:\s*(\d{1,2}:\d{2})/i);
      const stopMatch = msg.match(/Stop:\s*(\d{1,2}:\d{2})/i);

      let startTime = startMatch ? startMatch[1] : null;
      const endTime = stopMatch ? stopMatch[1] : log.time;

      if (!startTime) {
        const olderLogs = logs.slice(index + 1);
        const startedLog = olderLogs.find((l) => (l.message || '').includes('Abnormal STARTED'));
        startTime = startedLog ? startedLog.time : log.time;
      }

      if (startTime && isTimeInShift(startTime)) {
        const key = `abnormal-${startTime}-${endTime}`;
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          lossIntervals.push({ startTime, endTime, kind: 'abnormal', note: msg });
        }
      }
      return;
    }
  });

  if (isToday && isAbnormalActive && activeAbnormalStart && isTimeInShift(activeAbnormalStart)) {
    const key = `abnormal-${activeAbnormalStart}-ongoing`;
    if (!processedKeys.has(key) && !lossIntervals.some((e) => e.kind === 'abnormal' && e.startTime === activeAbnormalStart)) {
      lossIntervals.push({ startTime: activeAbnormalStart, endTime: '', kind: 'abnormal' });
    }
  }

  if (isToday && isNgActive && activeNgStart && isTimeInShift(activeNgStart)) {
    const key = `ng-${activeNgStart}-ongoing`;
    if (!processedKeys.has(key) && !lossIntervals.some((e) => e.kind === 'ng' && e.startTime === activeNgStart)) {
      lossIntervals.push({ startTime: activeNgStart, endTime: '', kind: 'ng' });
    }
  }

  return (
    <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden mb-6">
      <h4 className="text-lg font-black tracking-widest text-slate-800 uppercase text-center mb-6">
        {shift === 'day' ? 'Day Shift Workhour (07:15 - 19:00)' : 'Night Shift Workhour (21:00 - 07:00)'}
      </h4>

      <div className="overflow-x-auto w-full pb-2 scrollbar-thin">
        <div className="relative min-w-[850px] select-none" style={{ minHeight: showDailyAndAct ? '230px' : '85px' }}>
          <div
            className={`absolute top-0 ${showDailyAndAct ? 'h-[204px]' : 'h-[60px]'} left-margin-adjusted`}
            style={{
              left: '95px',
              width: shift === 'day' ? 'calc(100% - 115px)' : 'calc((100% - 115px) * 0.854167)',
            }}
          >
            {ticks.map((tick, idx) => {
              const leftPercent = ((idx * 60) / totalMins) * 100;
              return (
                <div
                  key={idx}
                  className="absolute top-0 flex flex-col items-center pointer-events-none"
                  style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
                >
                  <span className="text-[9px] font-bold text-slate-400 -translate-y-1">{tick}</span>
                  <div
                    className={`w-[1px] ${
                      showDailyAndAct ? 'h-[168px]' : 'h-[43px]'
                    } bg-slate-100/80 pointer-events-none z-0 mt-4`}
                  ></div>
                </div>
              );
            })}

            {breaks.map((brk, idx) => {
              const startOffset = getMinutesOffset(brk.start);
              const endOffset = getMinutesOffset(brk.end);
              const leftPercent = (startOffset / totalMins) * 100;
              const widthPercent = ((endOffset - startOffset) / totalMins) * 100;

              if (widthPercent <= 0) return null;

              return (
                <div
                  key={idx}
                  className={`absolute top-6 ${
                    showDailyAndAct ? 'h-[156px]' : 'h-[40px]'
                  } bg-black/20 border-x border-dashed border-black/30 pointer-events-none z-45 flex items-center justify-center`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  title={`${brk.label}: ${brk.start} - ${brk.end}`}
                >
                  <span
                    className={`text-[7px] text-white font-black uppercase tracking-wider whitespace-nowrap select-none ${
                      showDailyAndAct ? '-rotate-90' : ''
                    }`}
                  >
                    {brk.label}
                  </span>
                </div>
              );
            })}

            {(() => {
              const prepStart = shift === 'day' ? '07:15' : '21:00';
              const prepEnd = shift === 'day' ? '07:30' : '21:10';
              const prStartOffset = getMinutesOffset(prepStart);
              const prEndOffset = getMinutesOffset(prepEnd);
              const prLeftPercent = (prStartOffset / totalMins) * 100;
              const prWidthPercent = ((prEndOffset - prStartOffset) / totalMins) * 100;

              if (prWidthPercent <= 0) return null;
              return (
                <div
                  className={`absolute top-6 ${
                    showDailyAndAct ? 'h-[156px]' : 'h-[40px]'
                  } bg-slate-900/10 border-x border-slate-300/10 pointer-events-none z-10 flex items-center justify-center`}
                  style={{
                    left: `${prLeftPercent}%`,
                    width: `${prWidthPercent}%`,
                  }}
                  title="Shift Start Prepare"
                >
                  <span
                    className={`text-[6px] text-slate-400/70 font-black uppercase tracking-widest whitespace-nowrap ${
                      showDailyAndAct ? 'rotate-90' : ''
                    }`}
                  >
                    Prepare
                  </span>
                </div>
              );
            })()}

            {(() => {
              const cleanupStart = shift === 'day' ? '18:45' : '07:00';
              const cleanupEnd = shift === 'day' ? '19:00' : '07:15';
              const clStartOffset = getMinutesOffset(cleanupStart);
              const clEndOffset = getMinutesOffset(cleanupEnd);
              const clLeftPercent = (clStartOffset / totalMins) * 100;
              const clWidthPercent = ((clEndOffset - clStartOffset) / totalMins) * 100;

              if (clWidthPercent <= 0) return null;
              return (
                <div
                  className={`absolute top-6 ${
                    showDailyAndAct ? 'h-[156px]' : 'h-[40px]'
                  } bg-slate-900/10 border-x border-slate-300/10 pointer-events-none z-10 flex items-center justify-center`}
                  style={{
                    left: `${clLeftPercent}%`,
                    width: `${clWidthPercent}%`,
                  }}
                  title="Shift End Cleanup: 15 mins"
                >
                  <span
                    className={`text-[6px] text-slate-400/70 font-black uppercase tracking-widest whitespace-nowrap ${
                      showDailyAndAct ? 'rotate-90' : ''
                    }`}
                  >
                    Cleanup
                  </span>
                </div>
              );
            })()}

            {showCurrentTimeLine && (
              <div
                className={`absolute top-6 ${
                  showDailyAndAct ? 'h-[156px]' : 'h-[40px]'
                } w-[2px] bg-rose-500 border-l border-rose-400 z-50 pointer-events-none flex flex-col items-center animate-pulse`}
                style={{
                  left: `${(currentOffset / totalMins) * 100}%`,
                  boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
                }}
                title={`Live Current Time: ${currentTimeStr}`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white shadow-md -translate-y-1"></div>
              </div>
            )}

            {/* Avg. Plan Row */}
            <div className="absolute top-[30px] left-0 right-0 h-10 flex items-center">
              <span className="absolute left-[-90px] w-[80px] text-[13.5px] font-black text-slate-400 uppercase tracking-wider text-right pr-2 select-none">
                Monthly Plan
              </span>
              <div className="w-full h-10 bg-slate-50/20 border border-slate-200/50 rounded-lg overflow-hidden z-30 shadow-inner relative backdrop-blur-[0.5px]">
                {allAvgShiftJobs.map((job) => {
                  if (!job.timeRange) return null;
                  const [startStr, endStr] = job.timeRange.split(' - ');
                  const startOffset = getMinutesOffset(startStr);
                  const endOffset = getMinutesOffset(endStr);
                  const leftPercent = (startOffset / totalMins) * 100;
                  const widthPercent = ((endOffset - startOffset) / totalMins) * 100;

                  if (widthPercent <= 0) return null;

                  let dandoriElement = null;
                  if (job.dandoriTimeRange) {
                    const [dStartStr, dEndStr] = job.dandoriTimeRange.split(' - ');
                    const dStartOffset = getMinutesOffset(dStartStr);
                    const dEndOffset = getMinutesOffset(dEndStr);
                    const dLeftPercent = (dStartOffset / totalMins) * 100;
                    const dWidthPercent = ((dEndOffset - dStartOffset) / totalMins) * 100;

                    if (dWidthPercent > 0) {
                      dandoriElement = (
                        <div
                          key={`avg-dandori-${job.id}`}
                          className="absolute top-0 bottom-0 bg-slate-900 border border-slate-800 flex items-center justify-center z-25 opacity-70"
                          style={{
                            left: `${dLeftPercent}%`,
                            width: `${dWidthPercent}%`,
                          }}
                          title={`Setup Changeover (Dandori): ${job.dandori} mins`}
                        >
                          <span className="text-[7px] text-white/40 font-bold">D</span>
                        </div>
                      );
                    }
                  }

                  const barColor = getJobColor(job.seq);

                  return (
                    <React.Fragment key={`avg-group-${job.id}`}>
                      {dandoriElement}
                      <div
                        className="absolute top-0 bottom-0 text-white flex flex-col items-center justify-center px-1 font-mono text-[9px] font-black leading-none transition-all z-20 border border-black/10 shadow-sm opacity-70"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor: barColor,
                        }}
                        title={`Monthly Plan Seq ${job.seq}: ${job.model} (${job.qtyLot} pcs)`}
                      >
                        <span className="text-[8px] font-black text-white truncate w-full text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                          {job.model}
                        </span>
                        <span className="text-[6.5px] mt-0.5 text-white/95 font-extrabold drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.5)]">
                          LOT: {job.qtyLot}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {showDailyAndAct && (
              <>
                {/* Daily Plan Row */}
                <div className="absolute top-[85px] left-0 right-0 h-10 flex items-center">
                  <span className="absolute left-[-90px] w-[80px] text-[13.5px] font-black text-slate-400 uppercase tracking-wider text-right pr-2 select-none">
                    Daily Plan
                  </span>
                  <div className="w-full h-10 bg-slate-50/20 border border-slate-200/50 rounded-lg overflow-hidden z-30 shadow-inner relative backdrop-blur-[0.5px]">
                    {allShiftJobs.map((job) => {
                      if (!job.timeRange) return null;
                      const [startStr, endStr] = job.timeRange.split(' - ');
                      const startOffset = getMinutesOffset(startStr);
                      const endOffset = getMinutesOffset(endStr);
                      const leftPercent = (startOffset / totalMins) * 100;
                      const widthPercent = ((endOffset - startOffset) / totalMins) * 100;

                      if (widthPercent <= 0) return null;

                      let dandoriElement = null;
                      if (job.dandoriTimeRange) {
                        const [dStartStr, dEndStr] = job.dandoriTimeRange.split(' - ');
                        const dStartOffset = getMinutesOffset(dStartStr);
                        const dEndOffset = getMinutesOffset(dEndStr);
                        const dLeftPercent = (dStartOffset / totalMins) * 100;
                        const dWidthPercent = ((dEndOffset - dStartOffset) / totalMins) * 100;

                        if (dWidthPercent > 0) {
                          dandoriElement = (
                            <div
                              key={`plan-dandori-${job.id}`}
                              className="absolute top-0 bottom-0 bg-slate-900 border border-slate-800 flex items-center justify-center z-25"
                              style={{
                                left: `${dLeftPercent}%`,
                                width: `${dWidthPercent}%`,
                              }}
                              title={`Setup Changeover (Dandori): ${job.dandori} mins`}
                            >
                              <span className="text-[7px] text-white/50 font-bold">D</span>
                            </div>
                          );
                        }
                      }

                      const barColor = getJobColor(job.seq);

                      return (
                        <React.Fragment key={`plan-group-${job.id}`}>
                          {dandoriElement}
                          <div
                            className="absolute top-0 bottom-0 text-white flex flex-col items-center justify-center px-1 font-mono text-[9px] font-black leading-none transition-all z-20 border border-black/10 shadow-sm"
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: barColor,
                            }}
                            title={`Seq ${job.seq}: ${job.model} (${job.qtyLot} pcs)`}
                          >
                            <span className="text-[8.5px] font-black text-white truncate w-full text-center drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.85)]">
                              {job.model}
                            </span>
                            <span className="text-[7px] mt-0.5 text-white/90 font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]">
                              LOT: {job.qtyLot}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Act. Prod Row */}
                <div className="absolute top-[140px] left-0 right-0 h-10 flex items-center">
                  <span className="absolute left-[-90px] w-[80px] text-[13.5px] font-black text-slate-400 uppercase tracking-wider text-right pr-2 select-none">
                    Act. Prod
                  </span>
                  <div className="relative flex-1 h-10">
                    <div className="absolute inset-0 rounded-lg shadow-inner bg-slate-50/20 border border-slate-200/50 backdrop-blur-[0.5px] overflow-hidden">
                      {allShiftJobs.map((job) => {
                        if (!job.timeRange) return null;
                        if (job.status === 'queued') return null;

                        const isSkipped =
                          job.status === 'completed' &&
                          (job.actualQty === undefined || job.actualQty === 0) &&
                          !job.actualProductionStart &&
                          !job.actualDandoriStart;
                        if (isSkipped) return null;

                        const actTime = actualTimes[job.id];
                        if (!actTime) return null;

                        let dandoriElement = null;
                        if (job.dandori > 0 && (job.status === 'completed' || job.status === 'running' || job.status === 'dandori')) {
                          const dStartOffset = getMinutesOffset(actTime.dandoriStartStr);
                          const dEndOffset = getMinutesOffset(actTime.dandoriEndStr);
                          const dLeftPercent = (dStartOffset / totalMins) * 100;
                          const dWidthPercent = ((dEndOffset - dStartOffset) / totalMins) * 100;
                          
                          if (dWidthPercent > 0) {
                            dandoriElement = (
                              <div
                                key={`act-dandori-${job.id}`}
                                className="absolute top-0 bottom-0 bg-slate-900 border border-slate-800 flex items-center justify-center z-10"
                                style={{ left: `${dLeftPercent}%`, width: `${dWidthPercent}%` }}
                                title={`Actual Setup Changeover (Dandori): ${job.dandori} mins`}
                              >
                                <span className="text-[7px] text-white/50 font-bold">D</span>
                              </div>
                            );
                          }
                        }

                        let finalDandoriElement = null;
                        const fdStartStr =
                          job.finalDandoriStart ||
                          (job.status === 'completed' && job.needsFinalDandori
                            ? actTime.productionEndStr
                            : undefined);
                        if (fdStartStr) {
                          const currentClockTime =
                            currentTimeStr ||
                            new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                          const fdEndStr =
                            job.finalDandoriEnd ||
                            (job.needsFinalDandori && !job.finalDandoriCompleted ? currentClockTime : fdStartStr);
                          const fdStartOffset = getMinutesOffset(fdStartStr);
                          let fdEndOffset = getMinutesOffset(fdEndStr);
                          if (fdEndOffset <= fdStartOffset && job.needsFinalDandori && !job.finalDandoriCompleted) {
                            fdEndOffset = Math.max(fdStartOffset + 2, getMinutesOffset(currentClockTime));
                          }
                          const fdLeftPercent = (fdStartOffset / totalMins) * 100;
                          const fdWidthPercent = Math.max(0, ((fdEndOffset - fdStartOffset) / totalMins) * 100);

                          if (fdWidthPercent > 0) {
                            finalDandoriElement = (
                              <div
                                key={`act-final-dandori-${job.id}`}
                                className="absolute top-0 bottom-0 bg-slate-950 border border-slate-700 flex items-center justify-center z-10 shadow-sm"
                                style={{ left: `${fdLeftPercent}%`, width: `${fdWidthPercent}%` }}
                                title={`Actual Final Setup / Cleanup (Dandori Akhir Shift ${job.shift?.toUpperCase()}): ${fdStartStr} - ${fdEndStr}`}
                              >
                                <span className="text-[7px] text-amber-400 font-black">D</span>
                              </div>
                            );
                          }
                        }

                        if (job.status === 'dandori') {
                          return (
                            <React.Fragment key={`act-group-${job.id}`}>
                              {dandoriElement}
                              {finalDandoriElement}
                            </React.Fragment>
                          );
                        }

                        const startOffset = getMinutesOffset(actTime.productionStartStr);
                        let endOffset = getMinutesOffset(actTime.productionEndStr);
                        if (job.status === 'running' && endOffset <= startOffset) endOffset = startOffset + 2;

                        const leftPercent = (startOffset / totalMins) * 100;
                        const widthPercent = ((endOffset - startOffset) / totalMins) * 100;
                        if (widthPercent <= 0)
                          return (
                            <React.Fragment key={`act-group-${job.id}`}>
                              {dandoriElement}
                              {finalDandoriElement}
                            </React.Fragment>
                          );

                        const completedQty = job.actualQty || 0;
                        const progress =
                          job.status === 'completed'
                            ? 1
                            : Math.min(Math.max(completedQty / job.qtyLot, 0), 1);
                        const barColor = getJobColor(job.seq);

                        return (
                          <React.Fragment key={`act-group-${job.id}`}>
                            {dandoriElement}
                            <div
                              className="absolute top-0 bottom-0 bg-white border border-slate-200 overflow-hidden z-10"
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                              title={`Actual Seq ${job.seq}: ${completedQty} / ${job.qtyLot} pcs${
                                job.status === 'running' && isAbnormalActive
                                  ? ' [ABNORMAL]'
                                  : job.status === 'running' && isNgActive
                                  ? ' [NG ONGOING]'
                                  : ''
                              }`}
                            >
                              <div
                                className="absolute top-0 bottom-0 left-0 transition-all"
                                style={{
                                  width: `${progress * 100}%`,
                                  backgroundColor: barColor,
                                  opacity: 0.85,
                                }}
                              />
                            </div>
                            {finalDandoriElement}
                          </React.Fragment>
                        );
                      })}

                      {lossIntervals.map((interval, idx) => {
                        const startOff = getMinutesOffset(interval.startTime);
                        const endOff = interval.endTime
                          ? getMinutesOffset(interval.endTime)
                          : isToday && currentTimeStr
                          ? getMinutesOffset(currentTimeStr)
                          : startOff;
                        const duration = Math.max(1, endOff - startOff);
                        if (duration <= 0) return null;
                        const leftPct = (startOff / totalMins) * 100;
                        const widthPct = (duration / totalMins) * 100;
                        const isAbn = interval.kind === 'abnormal';
                        const still = !interval.endTime;
                        return (
                          <div
                            key={`loss-${idx}`}
                            className={`absolute top-0 bottom-0 z-20 transition-all ${
                              still ? 'animate-pulse' : ''
                            }`}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: isAbn ? 'rgba(239, 68, 68, 0.72)' : 'rgba(245, 158, 11, 0.72)',
                            }}
                            title={`${isAbn ? 'Abnormality' : 'NG Quality'}: ${interval.startTime} - ${
                              interval.endTime || 'Ongoing'
                            } (${duration} mins)\n${interval.note || ''}`}
                          />
                        );
                      })}
                    </div>

                    <div className="absolute inset-0 pointer-events-none z-30">
                      {allShiftJobs.map((job) => {
                        if (!job.timeRange) return null;
                        if (job.status === 'queued' || job.status === 'dandori') return null;

                        const isSkipped =
                          job.status === 'completed' &&
                          (job.actualQty === undefined || job.actualQty === 0) &&
                          !job.actualProductionStart &&
                          !job.actualDandoriStart;
                        if (isSkipped) return null;

                        const actTime = actualTimes[job.id];
                        if (!actTime) return null;

                        const startOffset = getMinutesOffset(actTime.productionStartStr);
                        let endOffset = getMinutesOffset(actTime.productionEndStr);
                        if (job.status === 'running' && endOffset <= startOffset) endOffset = startOffset + 2;

                        const leftPercent = (startOffset / totalMins) * 100;
                        const widthPercent = ((endOffset - startOffset) / totalMins) * 100;
                        if (widthPercent <= 0) return null;

                        const completedQty = job.actualQty || 0;

                        return (
                          <div
                            key={`act-label-${job.id}`}
                            className="absolute top-0 bottom-0 flex flex-col items-center justify-center px-1 font-mono leading-none"
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                          >
                            <span
                              className="text-[8.5px] font-black truncate w-full text-center text-white"
                              style={{ textShadow: '0 0 5px rgba(0,0,0,1), 0 1px 3px rgba(0,0,0,1)' }}
                            >
                              {job.model}
                            </span>
                            <span
                              className="text-[7px] mt-0.5 font-extrabold text-white/90"
                              style={{ textShadow: '0 0 4px rgba(0,0,0,1), 0 1px 2px rgba(0,0,0,1)' }}
                            >
                              ACT: {completedQty} / {job.qtyLot}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MachinePatternView({
  machine,
  factory,
  machineKey: propsMachineKey,
  selectedDate,
}: MachinePatternViewProps) {
  const { activePortal } = useAuthStore();
  const canEditPattern = activePortal === 'super-admin' || activePortal === 'planner' || activePortal === 'leader';
  const canOperateJobs = activePortal === 'super-admin' || activePortal === 'leader';
  const machineKey = propsMachineKey || getUniqueMachineKey(factory, machine);

  const { data: partsResponse } = useQuery({
    queryKey: ['parts'],
    queryFn: () => api.get('/parts').then((res) => res.data.data || []),
  });
  const parts = partsResponse || [];

  const activeDate = selectedDate || getTodayDateString();
  const monthStr = activeDate.substring(0, 7);
  const planKey = `${activeDate}_${machineKey}`;
  const avgKey = `${monthStr}_avg_${machineKey}`;

  const [adjustmentScope, setAdjustmentScope] = useState<'daily' | 'monthly'>('daily');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const {
    machineJobs,
    machineAvgJobs,
    logs,
    dayOTs,
    nightOTs,
    activeAbnormalities,
    activeNgs,
    reorderMachineJobs,
    reorderMachineAvgJobs,
    updateJobStatus,
    updateOTSettings,
    resetAllMachines,
  } = useProduction();

  const jobs = machineJobs[planKey] || [];
  const avgJobs = machineAvgJobs[avgKey] || [];
  const logList = logs[planKey] || [];
  const dayOT = dayOTs[planKey] || 'teiji';
  const nightOT = nightOTs[planKey] || 'teiji';
  const abnormality = activeAbnormalities[planKey] || { isAbnormal: false, start: '' };
  const ngState = activeNgs[planKey] || { isNg: false, start: '' };

  const isAbnormalActive = abnormality.isAbnormal;
  const activeAbnormalStart = abnormality.start;
  const isNgActive = ngState.isNg;
  const activeNgStart = ngState.start;

  const dayJobs = React.useMemo(() => jobs.filter((j) => j.shift === 'day'), [jobs]);
  const nightJobs = React.useMemo(() => jobs.filter((j) => j.shift === 'night'), [jobs]);
  const overflowJobs = React.useMemo(() => jobs.filter((j) => j.shift === 'overflow'), [jobs]);

  const totalPcs = React.useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.qtyLot || 0), 0);
  }, [jobs]);

  const totalShots = React.useMemo(() => {
    return jobs.reduce((sum, j) => sum + Math.ceil((j.qtyLot || 0) / (j.kav || 1)), 0);
  }, [jobs]);

  const totalHours = React.useMemo(() => {
    const totalTimeMins = jobs.reduce((sum, j) => sum + (j.time || 0) + (j.dandori || 0), 0);
    return (totalTimeMins / 60).toFixed(1);
  }, [jobs]);

  const uniquePartsCount = React.useMemo(() => {
    const runningModels = jobs.map((j) => j.model).filter(Boolean);
    if (runningModels.length > 0) {
      return new Set(runningModels).size;
    }
    const machineParts = parts.filter(
      (p: any) => p.homeLine && p.homeLine.trim().toUpperCase().includes(machine.toUpperCase())
    );
    return machineParts.length;
  }, [jobs, parts, machine]);
  const showDailyAndAct = true;

  const formattedDateStr = React.useMemo(() => {
    const parts = activeDate.split('-');
    if (parts.length < 3) return activeDate;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [activeDate]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !canEditPattern) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const day = jobs.filter((j) => j.shift === 'day');
    const night = jobs.filter((j) => j.shift === 'night');
    const overflow = jobs.filter((j) => j.shift === 'overflow');

    const lists: Record<string, Job[]> = { day, night, overflow };

    const sourceList = [...lists[source.droppableId]];
    const destList = source.droppableId === destination.droppableId ? sourceList : [...lists[destination.droppableId]];

    const [reorderedItem] = sourceList.splice(source.index, 1);

    reorderedItem.shift = destination.droppableId as 'day' | 'night' | 'overflow';

    destList.splice(destination.index, 0, reorderedItem);

    const finalJobs: Job[] = [];

    if (source.droppableId === destination.droppableId) {
      lists[source.droppableId] = sourceList;
    } else {
      lists[source.droppableId] = sourceList;
      lists[destination.droppableId] = destList;
    }

    finalJobs.push(...lists.day);
    finalJobs.push(...lists.night);
    finalJobs.push(...lists.overflow);

    if (adjustmentScope === 'monthly') {
      reorderMachineAvgJobs(machineKey, finalJobs, activeDate);
    } else {
      reorderMachineJobs(machineKey, finalJobs, activeDate);
    }
  };

  const applyOvertimeSettings = (dOT: string, nOT: string) => {
    updateOTSettings(machineKey, dOT, nOT, activeDate);
  };

  const handleAction = (jobId: string, action: 'complete-running' | 'complete-dandori') => {
    updateJobStatus(machineKey, jobId, action, activeDate, parts);
  };

  const handleDeleteJob = (jobId: string) => {
    if (adjustmentScope === 'monthly') {
      const itemsAvg = avgJobs.filter((j) => j.id !== jobId);
      reorderMachineAvgJobs(machineKey, itemsAvg, activeDate);
    } else {
      const itemsJobs = jobs.filter((j) => j.id !== jobId);
      reorderMachineJobs(machineKey, itemsJobs, activeDate);
    }
  };

  const handleResetToDefault = (type: 'template' | 'master' = 'template') => {
    if (adjustmentScope === 'monthly') {
      const initialJobs = getHeijunkaJobsForMachine(machineKey, activeDate, parts);
      reorderMachineAvgJobs(machineKey, initialJobs, activeDate);
    } else {
      if (type === 'master') {
        const initialJobs = getHeijunkaJobsForMachine(machineKey, activeDate, parts);
        reorderMachineAvgJobs(machineKey, initialJobs, activeDate);
        reorderMachineJobs(machineKey, initialJobs, activeDate);
      } else {
        reorderMachineJobs(machineKey, avgJobs, activeDate);
      }
    }
    setConfirmReset(false);
  };

  const handleResetAllMachines = () => {
    resetAllMachines(activeDate, parts);
    setConfirmResetAll(false);
  };

  const activeOrCompletedJobs = jobs.filter((j) => j.status === 'running' || j.status === 'completed');
  const hasProductionData = activeOrCompletedJobs.length > 0;

  const renderJobCard = (job: Job, index: number) => {
    const isDraggable = canEditPattern;

    return (
      <Draggable draggableId={job.id} index={index} isDragDisabled={!isDraggable}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white rounded-xl border p-5 flex flex-col md:flex-row gap-6 items-center shadow-sm relative overflow-hidden transition-all mb-4
              ${
                job.status === 'running'
                  ? 'border-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,1)]'
                  : job.status === 'dandori'
                  ? 'border-blue-400 shadow-[0_0_0_1px_rgba(96,165,250,1)]'
                  : snapshot.isDragging
                  ? 'border-blue-500 shadow-xl opacity-90 scale-[1.02]'
                  : 'border-slate-200'
              }
              ${job.status === 'completed' ? 'opacity-60' : ''}
              ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
            `}
          >
            {job.status === 'running' && <div className="absolute top-0 left-0 bottom-0 w-1 bg-orange-500"></div>}
            {job.status === 'dandori' && (
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-400 animate-pulse"></div>
            )}

            <div className="w-16 flex flex-col items-center justify-center shrink-0">
              {isDraggable ? (
                <div className="p-2 mb-1 text-slate-350 hover:text-slate-500">
                  <GripVertical className="w-5 h-5 pointer-events-none" />
                </div>
              ) : (
                <div className="text-[10px] font-black text-slate-400 mb-2">SEQ</div>
              )}
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700 font-mono shadow-inner border border-slate-200">
                {job.seq}
              </div>
            </div>

            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="md:col-span-2 flex flex-col items-start min-w-0 w-full">
                <div className="flex gap-2 items-center mb-1 w-full justify-between pr-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                      {job.customer}
                    </span>
                    {job.status === 'running' && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase tracking-widest animate-pulse flex items-center gap-1 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Running
                      </span>
                    )}
                    {job.status === 'dandori' && (
                      <span className="text-[8px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase tracking-widest animate-pulse flex items-center gap-1 shrink-0">
                        <Wrench className="w-2 h-2" /> Dandori Setup
                      </span>
                    )}
                    {job.status === 'completed' && (
                      <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase tracking-widest shrink-0">
                        Completed
                      </span>
                    )}
                    {job.status === 'queued' && (
                      <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase tracking-widest shrink-0">
                        Queued
                      </span>
                    )}
                    {job.spansOffHours && (
                      <span
                        className="text-[8px] bg-amber-50 border border-amber-200 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0"
                        title="Terpotong jeda shift / istirahat"
                      >
                        ⚠️ Terjeda Off-Time
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-2">
                    <Clock className="w-3 h-3" /> {job.timeRange}
                  </div>
                </div>
                <div
                  className="font-mono text-lg font-black tracking-tight text-slate-800 truncate w-full"
                  title={job.model}
                >
                  {job.model}
                </div>
                <div className="text-xs font-bold uppercase text-slate-500 truncate w-full" title={job.partName}>
                  {job.partName}
                </div>

                <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-500 font-medium w-full">
                  <div className="flex gap-1 items-center min-w-0">
                    <Box className="w-3 h-3 shrink-0" /> Material:{' '}
                    <b className="truncate" title={job.material}>
                      {job.material}
                    </b>
                  </div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full my-auto shrink-0"></div>
                  <div className="min-w-0 truncate">
                    Mold:{' '}
                    <b className="truncate" title={job.mold}>
                      {job.mold}
                    </b>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col items-center justify-center relative w-full h-full min-h-[76px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Lot / Target
                </div>
                <div className="text-3xl font-black text-blue-600 tracking-tighter">{job.qtyLot}</div>
                <div className="text-[9px] font-bold text-slate-400 mt-1">/ {job.qtyDay} / Day</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center gap-1.5 w-full h-full min-h-[76px]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Dandori</span>
                  {canEditPattern && (job.status === 'queued' || job.status === 'dandori') ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <DandoriInput
                        initialValue={job.dandori}
                        onSave={(val) => {
                          if (adjustmentScope === 'monthly') {
                            const updatedAvg = avgJobs.map((j) => (j.id === job.id ? { ...j, dandori: val } : j));
                            reorderMachineAvgJobs(machineKey, updatedAvg, activeDate);
                          } else {
                            const updatedJobs = jobs.map((j) => (j.id === job.id ? { ...j, dandori: val } : j));
                            reorderMachineJobs(machineKey, updatedJobs, activeDate);
                          }
                        }}
                      />
                      <span className="text-[9px] text-slate-400 font-bold">m</span>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-orange-600">{job.dandori}m</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs mt-0.5">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Est. Time</span>
                  <span className="font-mono font-bold text-blue-600">{job.time}m</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 justify-center w-full min-h-[76px]">
                {canOperateJobs && job.status === 'dandori' && (
                  <button
                    onClick={() => handleAction(job.id, 'complete-dandori')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-1 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer border-0"
                  >
                    <CheckCircle className="w-3 h-3" /> Finish Dandori
                  </button>
                )}
                {canOperateJobs && job.status === 'running' && (
                  <button
                    onClick={() => handleAction(job.id, 'complete-running')}
                    className="w-full bg-[#037233] hover:bg-[#025c28] text-white text-[10px] font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-1 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer border-0"
                  >
                    <CheckCircle className="w-3 h-3" /> Complete Job
                  </button>
                )}
                {canEditPattern && (job.status === 'queued' || job.status === 'dandori') && (
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/50 text-[10px] font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-1 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
                    title="Remove job from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}

                {job.status === 'completed' && (
                  <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-3 py-1.5 rounded uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Done
                    </span>
                  </div>
                )}
                {job.status === 'running' && !canOperateJobs && (
                  <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-[#037233] font-bold px-3 py-1.5 rounded uppercase tracking-widest animate-pulse flex items-center justify-center gap-1 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Running
                    </span>
                  </div>
                )}
                {job.status === 'dandori' && !canOperateJobs && (
                  <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm">
                      <Settings2 className="w-3.5 h-3.5 animate-spin text-blue-600" style={{ animationDuration: '6s' }} />{' '}
                      Preparing
                    </span>
                  </div>
                )}
                {job.status === 'queued' && !canEditPattern && (
                  <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-3 py-1.5 rounded uppercase tracking-wider shadow-sm">
                      Queued
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
        {/* Adjustment Scope Console */}
        <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm select-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Adjustment Console</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Configure scope of planner edits</p>
            </div>

            {canEditPattern ? (
              <div className="flex flex-wrap items-center gap-2 shrink-0">

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner gap-1 font-bold text-xs select-none">
                  <button
                    onClick={() => setAdjustmentScope('daily')}
                    className={`h-9 px-4 rounded-lg uppercase tracking-wider transition-all duration-150 cursor-pointer font-black flex items-center gap-1.5 border-0 ${
                      adjustmentScope === 'daily'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 bg-transparent'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Hanya tgl {activeDate} (Daily Override)
                  </button>
                  <button
                    onClick={() => setAdjustmentScope('monthly')}
                    className={`h-9 px-4 rounded-lg uppercase tracking-wider transition-all duration-150 cursor-pointer font-black flex items-center gap-1.5 border-0 ${
                      adjustmentScope === 'monthly'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 bg-transparent'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Seluruh Hari (Monthly Template)
                  </button>
                </div>

                <button
                  onClick={() => {
                    setConfirmReset(true);
                    setConfirmResetAll(false);
                  }}
                  title="Reset plan mesin ini ke Heijunka default dari master parts terbaru"
                  className="h-9 px-3 rounded-lg border border-rose-250 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer font-black text-xs flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Plan
                </button>

                <button
                  onClick={() => {
                    setConfirmResetAll(true);
                    setConfirmReset(false);
                  }}
                  title="Reset plan SEMUA mesin ke Heijunka default dari master parts terbaru"
                  className="h-9 px-3 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer font-black text-xs flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Reset All
                </button>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg">
                🔒 Read-Only Mode (Supervisor/Planner PIN required to edit)
              </div>
            )}
          </div>

          {confirmReset && (
            <div className="flex flex-col gap-3 bg-rose-50 border border-rose-350 dark:bg-slate-950 dark:border-rose-955/35 rounded-2xl px-5 py-4 animate-in fade-in duration-150">
              {hasProductionData && (
                <div className="flex items-start gap-2 bg-red-100 border border-red-400 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <div className="text-xs font-black text-red-800 leading-snug">
                    ⚠️ PERINGATAN: Ada <span className="underline">{activeOrCompletedJobs.length} job</span> yang sudah
                    berjalan/selesai hari ini!
                    <span className="font-bold text-red-700 block mt-0.5">
                      Reset sekarang akan menghapus data actual produksi (waktu mulai, qty, status) dan Gantt Chart
                      ACT. PROD tidak akan akurat lagi.
                    </span>
                    <span className="font-bold text-red-650 block mt-0.5">
                      Hanya reset di awal shift sebelum produksi mulai!
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-455">
                      {adjustmentScope === 'monthly'
                        ? 'Apakah Anda yakin ingin mereset template rata-rata bulanan mesin ini ke Heijunka default?'
                        : 'Bagaimana Anda ingin mereset plan harian mesin ini untuk hari ini?'}
                    </p>
                    {adjustmentScope !== 'monthly' && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Pilih "Template Bulanan" untuk menyamakan dengan rata-rata bulanan, atau "Master & Forecast"
                        untuk menghitung ulang dari database parts & forecast terbaru.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {adjustmentScope === 'monthly' ? (
                    <button
                      onClick={() => handleResetToDefault('master')}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase text-[10px] tracking-wider transition-all shadow-sm border-0 cursor-pointer"
                    >
                      Ya, Reset Template
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleResetToDefault('template')}
                        className="px-3.5 py-2 rounded-xl bg-[#E76114] hover:opacity-95 text-white border-0 font-extrabold uppercase text-[10px] tracking-wider transition-all shadow-sm cursor-pointer"
                        title="Reset menyamakan dengan template rata-rata bulanan"
                      >
                        Template Bulanan
                      </button>
                      <button
                        onClick={() => handleResetToDefault('master')}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0 font-extrabold uppercase text-[10px] tracking-wider transition-all shadow-sm cursor-pointer"
                        title="Generate ulang langsung dari master parts & forecast ter-update"
                      >
                        Master & Forecast
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-205 text-slate-655 hover:bg-slate-50 font-extrabold uppercase text-[10px] tracking-wider transition-all cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmResetAll && (
            <div className="flex flex-col gap-2 bg-red-50 border-2 border-red-400 rounded-xl px-4 py-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2 bg-red-100 border border-red-500 rounded-lg px-3 py-2">
                <AlertTriangle className="w-5 h-5 text-red-755 shrink-0 mt-0.5" />
                <div className="text-xs font-black text-red-900 leading-snug">
                  ⚠️ BAHAYA: <span className="underline">SEMUA MESIN</span> akan di-reset!
                  <span className="font-bold text-red-800 block mt-0.5">
                    Seluruh data aktual produksi hari ini di semua mesin & semua factory akan hilang permanen. Gantt ACT.
                    PROD akan menjadi tidak akurat.
                  </span>
                  <span className="font-bold text-red-700 block mt-0.5">
                    Gunakan hanya di awal hari sebelum produksi dimulai!
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-red-900 flex-1">
                  Seluruh adjustment harian & template bulanan semua mesin akan dihapus dan di-generate ulang.
                  Tindakan ini tidak bisa dibatalkan.
                </p>
                <button
                  onClick={handleResetAllMachines}
                  className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-black uppercase tracking-wider hover:bg-red-850 transition-colors cursor-pointer border-0 whitespace-nowrap"
                >
                  ⚠️ Ya, Reset Semua
                </button>
                <button
                  onClick={() => setConfirmResetAll(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-650 text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {adjustmentScope === 'monthly' && (
          <div className="bg-orange-50 border border-orange-200 text-orange-900 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse shadow-sm border-l-4 border-l-orange-500">
            <Settings2 className="w-4 h-4 text-orange-600" />
            <span>
              Perubahan akan diterapkan sebagai template default bulanan dan memengaruhi seluruh tanggal yang belum
              di-override!
            </span>
          </div>
        )}

        {/* Header Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:border-slate-300 select-none">
            <div className="w-10 h-10 bg-emerald-50 text-[#008d51] rounded-lg flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Date Plan</div>
              <div className="text-sm font-black text-slate-800 tracking-tight mt-0.5">{formattedDateStr}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:border-slate-300 select-none">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Scheduled Queue</div>
              <div className="text-sm font-black text-slate-800 tracking-tight mt-0.5">
                {jobs.length} Production Run{jobs.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:border-slate-300 select-none">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 border border-amber-100 shadow-sm">
              <Box className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Total Demand</div>
              <div className="text-sm font-black text-slate-800 tracking-tight mt-0.5">
                {totalPcs.toLocaleString()} Pcs
              </div>
              <div className="text-[9px] text-slate-500 font-extrabold leading-none mt-0.5">
                {totalShots.toLocaleString()} Shots
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:border-slate-300 select-none">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
              <Gauge className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Planned FUKA Load</div>
              <div className="text-sm font-black text-slate-800 tracking-tight mt-0.5">{totalHours} Hours</div>
              <div className="text-[9px] text-slate-500 font-extrabold leading-none mt-0.5">incl. changeovers</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:border-slate-300 select-none">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Part Items</div>
              <div className="text-sm font-black text-slate-800 tracking-tight mt-0.5">
                {uniquePartsCount} Part{uniquePartsCount !== 1 ? 's' : ''}
              </div>
              <div className="text-[9px] text-slate-500 font-extrabold leading-none mt-0.5">assigned models</div>
            </div>
          </div>
        </div>

        {/* Horizontal Timelines */}
        <div className="grid grid-cols-1 gap-6">
          <ShiftTimeline
            shift="day"
            jobs={jobs}
            avgJobs={avgJobs}
            dayOT={dayOT}
            nightOT={nightOT}
            showDailyAndAct={showDailyAndAct}
            isAbnormalActive={isAbnormalActive}
            isNgActive={isNgActive}
            logs={logList}
            activeAbnormalStart={activeAbnormalStart}
            activeNgStart={activeNgStart}
            selectedDate={activeDate}
          />
          <ShiftTimeline
            shift="night"
            jobs={jobs}
            avgJobs={avgJobs}
            dayOT={dayOT}
            nightOT={nightOT}
            showDailyAndAct={showDailyAndAct}
            isAbnormalActive={isAbnormalActive}
            isNgActive={isNgActive}
            logs={logList}
            activeAbnormalStart={activeAbnormalStart}
            activeNgStart={activeNgStart}
            selectedDate={activeDate}
          />
        </div>

        {!showDailyAndAct ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <Calendar className="w-12 h-12 text-[#008d51]/20 mb-3" />
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">No Daily Orders</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Daily orders have not been uploaded for this future date yet. Displaying standard monthly Average Heijunka
              Plan baseline.
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <section>
              <div className="flex items-center gap-4 mb-4 select-none">
                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">
                  Job Lineup
                </h3>
                <div className="h-px bg-slate-200 flex-1"></div>
                {canEditPattern && (
                  <div className="flex gap-2 items-center shrink-0">
                    <span className="text-[8px] bg-indigo-50 border border-indigo-250 text-indigo-700 px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm">
                      Supervisor Mode
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Day Shift Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 mb-2 select-none">
                    <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-wider bg-slate-100 border border-slate-200 px-4 py-1 rounded-full shadow-sm">
                      Day Shift
                    </h3>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  <Droppable droppableId="day">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-1 p-2 rounded-xl transition-all border-2 border-dashed ${
                          snapshot.isDraggingOver ? 'bg-slate-50 border-slate-400' : 'border-transparent'
                        }`}
                        style={{ minHeight: '80px' }}
                      >
                        {dayJobs.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 font-bold border border-dashed border-slate-200 rounded-lg text-[10px] uppercase select-none">
                            No jobs scheduled. Drag jobs here to move to Day Shift.
                          </div>
                        ) : (
                          dayJobs.map((job, idx) => (
                            <React.Fragment key={job.id}>{renderJobCard(job, idx)}</React.Fragment>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Night Shift Section */}
                <div className="space-y-2 mt-8">
                  <div className="flex items-center gap-4 mb-2 select-none">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-wider bg-slate-800 border border-slate-900 px-4 py-1 rounded-full shadow-md">
                      Night Shift
                    </h3>
                    <div className="h-px bg-slate-250 flex-1"></div>
                  </div>

                  <Droppable droppableId="night">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-1 p-2 rounded-xl transition-all border-2 border-dashed ${
                          snapshot.isDraggingOver ? 'bg-slate-50 border-slate-400' : 'border-transparent'
                        }`}
                        style={{ minHeight: '80px' }}
                      >
                        {nightJobs.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 font-bold border border-dashed border-slate-200 rounded-lg text-[10px] uppercase select-none">
                            No jobs scheduled. Drag jobs here to move to Night Shift.
                          </div>
                        ) : (
                          nightJobs.map((job, idx) => (
                            <React.Fragment key={job.id}>{renderJobCard(job, idx)}</React.Fragment>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Overflow Shift Section */}
                <div className="space-y-2 mt-8">
                  <div className="flex items-center gap-4 mb-2 select-none">
                    <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-wider bg-rose-50 border border-rose-200 px-4 py-1 rounded-full shadow-sm">
                      Overflow / Next Day Queue
                    </h3>
                    <div className="h-px bg-rose-200 flex-1"></div>
                  </div>

                  <Droppable droppableId="overflow">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-1 p-2 rounded-xl transition-all border-2 border-dashed ${
                          snapshot.isDraggingOver ? 'bg-slate-50 border-slate-400' : 'border-transparent'
                        }`}
                        style={{ minHeight: '80px' }}
                      >
                        {overflowJobs.length === 0 ? (
                          <div className="text-center py-6 text-slate-450 font-bold border border-dashed border-slate-200 rounded-lg text-[10px] uppercase select-none">
                            No jobs scheduled. Drag jobs here to move to Overflow.
                          </div>
                        ) : (
                          overflowJobs.map((job, idx) => (
                            <React.Fragment key={job.id}>{renderJobCard(job, idx)}</React.Fragment>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </section>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
