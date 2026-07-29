import type { Job } from '../context/ProductionTypes';

export class ProductionTimelineCalculator {
  /**
   * Calculates working hours blocks based on Sugity shift patterns
   */
  getWorkingBlocks(): [number, number][] {
    const blocks: [number, number][] = [];
    blocks.push([435, 570]);
    blocks.push([580, 715]);
    blocks.push([755, 965]);
    blocks.push([980, 1140]);
    blocks.push([1260, 1440]);
    blocks.push([0, 60]);
    blocks.push([100, 280]);
    blocks.push([295, 420]); // 04:55 - 07:00
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

  /**
   * Adds working minutes to a Date object while skipping off hours and breaks
   */
  addWorkingMinutes(current: Date, minutesToAdd: number): Date {
    const result = new Date(current);
    let remaining = minutesToAdd;
    let iterations = 0;
    while (remaining > 0 && iterations < 100) {
      iterations++;
      const blocks = this.getWorkingBlocks();
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

  /**
   * Recalculates the timing fields of the scheduled jobs timeline
   */
  recalculateTimeline(items: Job[]): Job[] {
    const firstDayIdx = items.findIndex((item) => item.shift === 'day');
    const firstNightIdx = items.findIndex((item) => item.shift === 'night');
    const dayStart = new Date();
    dayStart.setHours(7, 15, 0, 0);
    const nightPrepStart = new Date(dayStart);
    nightPrepStart.setHours(21, 0, 0, 0);
    let lastDayEndTime = new Date(dayStart);
    lastDayEndTime.setMinutes(lastDayEndTime.getMinutes() + 15);
    let lastNightEndTime = new Date(nightPrepStart);
    lastNightEndTime.setMinutes(lastNightEndTime.getMinutes() + 10);
    let isFirstNight = true;

    return items.map((item, index) => {
      const jobShift = item.shift || 'day';
      let jobStartClock = new Date();
      if (jobShift === 'day') {
        jobStartClock = new Date(lastDayEndTime);
      } else if (jobShift === 'night') {
        if (isFirstNight) {
          let nightStart = new Date(nightPrepStart);
          if (lastDayEndTime.getTime() > nightStart.getTime()) {
            nightStart = new Date(lastDayEndTime);
          }
          jobStartClock = new Date(nightStart);
          jobStartClock.setMinutes(jobStartClock.getMinutes() + 10);
          isFirstNight = false;
        } else {
          jobStartClock = new Date(lastNightEndTime);
        }
      } else {
        jobStartClock = new Date(lastNightEndTime);
      }

      const startStr = jobStartClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const startTimeStamp = jobStartClock.getTime();
      const endJobClock = this.addWorkingMinutes(jobStartClock, item.time);
      const endStr = endJobClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const endTimeStamp = endJobClock.getTime();
      const actualDandori = item.dandori !== undefined ? item.dandori : 15;
      let dandoriRangeStr = '';
      let runningClock = new Date(endJobClock);

      if (actualDandori > 0 && jobShift !== 'overflow') {
        const dandoriStartClock = new Date(endJobClock);
        const dandoriEndClock = this.addWorkingMinutes(dandoriStartClock, actualDandori);
        const dandoriEndStr = dandoriEndClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        dandoriRangeStr = `${endStr} - ${dandoriEndStr}`;
        runningClock = dandoriEndClock;
      }

      if (jobShift === 'day') {
        lastDayEndTime = new Date(runningClock);
      } else {
        lastNightEndTime = new Date(runningClock);
      }

      const elapsedMins = Math.round((endTimeStamp - startTimeStamp) / 60000);
      const spansOffHours = elapsedMins > item.time;
      let status = item.status;

      if (status !== 'completed' && status !== 'running') {
        const dayJobs = items.filter((j) => j.shift === 'day');
        const isDayShiftClosedOrDone =
          dayJobs.length === 0 ||
          dayJobs.every((j) => j.status === 'completed' && (!j.needsFinalDandori || j.finalDandoriCompleted));

        if (index === firstDayIdx) {
          status = 'dandori';
        } else if (index === firstNightIdx) {
          status = isDayShiftClosedOrDone ? 'dandori' : 'queued';
        } else if (index > 0 && items[index - 1].status === 'completed') {
          const prevJob = items[index - 1];
          if (prevJob.shift === item.shift) {
            status = 'dandori';
          } else {
            status = isDayShiftClosedOrDone ? 'dandori' : 'queued';
          }
        } else {
          status = 'queued';
        }
      }

      let actualDandoriStart = item.actualDandoriStart;
      let actualDandoriEnd = item.actualDandoriEnd;
      let actualProductionStart = item.actualProductionStart;
      let actualProductionEnd = item.actualProductionEnd;

      if (status === 'queued') {
        actualDandoriStart = undefined;
        actualDandoriEnd = undefined;
        actualProductionStart = undefined;
        actualProductionEnd = undefined;
      } else if (status === 'dandori' && !actualDandoriStart) {
        actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
      }

      if (status === 'running') {
        if (!actualDandoriStart) {
          actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
        }
        if (!actualDandoriEnd) {
          actualDandoriEnd = actualProductionStart || (jobShift === 'night' ? '21:10' : '07:30');
        }
        if (!actualProductionStart) {
          actualProductionStart = actualDandoriEnd;
        }
      }

      if (status === 'completed') {
        const isSkipped =
          (item.actualQty === undefined || item.actualQty === 0) &&
          !item.actualProductionStart &&
          !item.actualDandoriStart;
        if (!isSkipped) {
          if (!actualDandoriStart) {
            actualDandoriStart = jobShift === 'night' ? '21:00' : '07:15';
          }
          if (!actualDandoriEnd) {
            actualDandoriEnd = jobShift === 'night' ? '21:10' : '07:30';
          }
          if (!actualProductionStart) {
            actualProductionStart = actualDandoriEnd;
          }
          if (!actualProductionEnd) {
            const [shStr, smStr] = actualProductionStart.split(':');
            const sh = parseInt(shStr, 10);
            const sm = parseInt(smStr, 10);
            const startClock = new Date();
            startClock.setHours(sh, sm, 0, 0);
            const endClock = new Date(startClock.getTime() + item.time * 60000);
            actualProductionEnd = endClock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          }
        } else {
          actualDandoriStart = undefined;
          actualDandoriEnd = undefined;
          actualProductionStart = undefined;
          actualProductionEnd = undefined;
        }
      }

      return {
        ...item,
        seq: index + 1,
        timeRange: `${startStr} - ${endStr}`,
        dandoriTimeRange: dandoriRangeStr,
        shift: jobShift,
        dandori: actualDandori,
        status,
        spansOffHours,
        actualDandoriStart,
        actualDandoriEnd,
        actualProductionStart,
        actualProductionEnd,
      };
    });
  }
}

export const productionTimelineCalculator = new ProductionTimelineCalculator();
