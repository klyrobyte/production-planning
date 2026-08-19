import { productionPlansRepository } from './production-plans.repository';
import { AppError } from '../../common/errors/AppError';
import { getIo } from '../../websocket/socket.server';

export function getTodayProductionDateString(): string {
  const d = new Date();
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wibDate = new Date(utcMs + (7 * 3600000));
  
  const hours = wibDate.getHours();
  const minutes = wibDate.getMinutes();
  const currentMins = hours * 60 + minutes;
  if (currentMins < 435) {
    wibDate.setDate(wibDate.getDate() - 1);
  }
  const yyyy = wibDate.getFullYear();
  const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
  const dd = String(wibDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const createProductionPlansService = () => ({
  getAll: () => productionPlansRepository.findAll(),

  getById: async (id: string) => {
    const plan = await productionPlansRepository.findById(id);
    if (!plan) throw new AppError(404, 'NOT_FOUND', 'Production plan tidak ditemukan.');
    return plan;
  },

  upsert: async (data: Record<string, any>) => {
    if (!data.id || !data.plan_type || !data.machine_id || !data.date_key) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'id, plan_type, machine_id, dan date_key wajib diisi.',
      );
    }

    const plan = await productionPlansRepository.upsert(data);

    const io = getIo();
    if (io) {
      // Broadcast globally so that the Main Dashboard (/production) is always updated in real-time
      io.emit('production_plan_updated', plan);
      // Also broadcast to the machine-specific room for operator tablets
      io.to(`plan:${plan.id}`).emit('production_plan_updated', plan);
    }

    return plan;
  },

  processScanEvent: async (scanData: any) => {
    const dateKey = getTodayProductionDateString();
    const machineKey = scanData.homeLine || scanData.machineCode || 'MC 6';

    let plan = await productionPlansRepository.findByDateAndMachine(dateKey, machineKey);
    
    // Jika belum ada plan di DB untuk mesin & tanggal hari ini, buat plan otomatis
    if (!plan) {
      console.log(`[Backend Scan Process] Auto-creating plan baru di DB untuk dateKey=${dateKey}, machineKey=${machineKey}`);
      const autoJob = {
        id: `job-auto-${Date.now()}`,
        model: scanData.model || scanData.partNumber || scanData.partName || `Part-${machineKey}`,
        partNumber: scanData.partNumber || '',
        partName: scanData.partName || '',
        spec: 24,
        qtyLot: 500,
        actualQty: 0,
        status: 'running',
        shift: 'day',
      };
      plan = {
        id: `${dateKey}_${machineKey}`,
        plan_type: 'daily',
        machine_id: machineKey,
        date_key: dateKey,
        jobs: [autoJob],
        logs: [],
        day_ot: 'teiji',
        night_ot: 'teiji',
        is_abnormal: false,
        is_ng: false,
      };
    }

    let jobs: any[] = [];
    if (Array.isArray(plan.jobs)) {
      jobs = plan.jobs;
    } else if (typeof plan.jobs === 'string') {
      try { jobs = JSON.parse(plan.jobs); } catch (e) { jobs = []; }
    }

    let logs: any[] = [];
    if (Array.isArray(plan.logs)) {
      logs = plan.logs;
    } else if (typeof plan.logs === 'string') {
      try { logs = JSON.parse(plan.logs); } catch (e) { logs = []; }
    }

    // Cari job dengan status 'running'
    let runningJobIndex = jobs.findIndex((j: any) => j.status === 'running');
    if (runningJobIndex === -1) {
      if (jobs.length > 0) {
        // Jika ada job tetapi belum berstatus 'running', jadikan job pertama 'running'
        runningJobIndex = 0;
        jobs[0] = { ...jobs[0], status: 'running' };
      } else {
        // Jika jobs kosong, buat auto job berstatus 'running'
        const autoJob = {
          id: `job-auto-${Date.now()}`,
          model: scanData.model || scanData.partNumber || scanData.partName || `Part-${machineKey}`,
          partNumber: scanData.partNumber || '',
          partName: scanData.partName || '',
          spec: 24,
          qtyLot: 500,
          actualQty: 0,
          status: 'running',
          shift: 'day',
        };
        jobs.push(autoJob);
        runningJobIndex = 0;
      }
    }

    const runningJob = jobs[runningJobIndex];
    const printQty = Number(runningJob.spec) || 24;
    const currentQty = Number(runningJob.actualQty) || 0;
    const targetQty = Number(runningJob.qtyLot) || 9999;
    const newQty = Math.min(targetQty, currentQty + printQty);

    // Update progress job
    jobs[runningJobIndex] = {
      ...runningJob,
      actualQty: newQty,
    };

    // Buat activity log
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString();
    const modelName = runningJob.model || runningJob.partNumber || scanData.model || scanData.partNumber || 'Part';
    const logNote = `Print label ${modelName}: +${printQty} pcs (IoT Scan)`;

    const newRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      machineId: plan.machine_id,
      date: dateStr,
      time: timeStr,
      type: 'progress',
      message: `[PROGRESS] ${logNote}`,
    };

    const updatedLogs = [newRecord, ...logs];

    const updatedData = {
      ...plan,
      jobs,
      logs: updatedLogs,
    };

    const savedPlan = await productionPlansRepository.upsert(updatedData);

    const io = getIo();
    if (io) {
      io.emit('production_plan_updated', savedPlan);
      io.to(`plan:${savedPlan.id}`).emit('production_plan_updated', savedPlan);
      io.emit('qr_scan_processed', { scanData, planId: savedPlan.id, addedQty: printQty, newQty, machineId: plan.machine_id, jobId: runningJob.id });
      io.emit('auto_print_kanban_trigger', {
        machineId: plan.machine_id,
        jobId: runningJob.id,
        partNumber: modelName,
        addedQty: printQty,
        scanData,
      });
      if (plan.machine_id) {
        io.to(`plan:${plan.machine_id}`).emit('auto_print_kanban_trigger', {
          machineId: plan.machine_id,
          jobId: runningJob.id,
          partNumber: modelName,
          addedQty: printQty,
          scanData,
        });
      }
    }

    console.log(`[Backend Scan Process] 🚀 SUCCESS: Mesin ${savedPlan.machine_id} | Job ${modelName} | +${printQty} pcs (${newQty}/${targetQty})`);
    return savedPlan;
  },
});