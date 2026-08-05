import { Router, Request, Response } from 'express';
import { masterPartsRepository } from '../master-parts/master-parts.repository';
import { createProductionPlansService } from '../production-plans/production-plans.service';
import { getIo } from '../../websocket/socket.server';

// State in-memory untuk mock endpoint IoT (e.g. /iot/mc6/QR-1008, /iot/mc6/QR-1009)
interface MockIotState {
  scanned: boolean;
  webhookPath: string;
  ts: string;
}

const mockIotState = new Map<string, MockIotState>();
const mockTimerMap = new Map<string, NodeJS.Timeout>();
const previousScanState = new Map<string, boolean>();

function getMockState(mc: string, key: string): MockIotState {
  const cleanMc = mc.toLowerCase();
  const stateKey = `${cleanMc}_${key.toUpperCase()}`;
  if (!mockIotState.has(stateKey)) {
    mockIotState.set(stateKey, {
      scanned: false,
      webhookPath: `/webhook/${cleanMc}/${key.toUpperCase()}`,
      ts: new Date().toISOString(),
    });
  }
  return mockIotState.get(stateKey)!;
}

export function triggerMockQrScan(mc: string, key: string): MockIotState {
  const cleanMc = mc.toLowerCase();
  const stateKey = `${cleanMc}_${key.toUpperCase()}`;
  const currentState = getMockState(cleanMc, key);
  currentState.scanned = true;
  currentState.ts = new Date().toISOString();

  if (mockTimerMap.has(stateKey)) {
    clearTimeout(mockTimerMap.get(stateKey)!);
  }

  // Auto-reset ke scanned: false setelah 5 detik
  const timer = setTimeout(() => {
    currentState.scanned = false;
    currentState.ts = new Date().toISOString();
    console.log(`[Mock IoT] Endpoint ${cleanMc}/${key} status 'scanned' telah otomatis kembali ke FALSE.`);
  }, 5000);

  mockTimerMap.set(stateKey, timer);
  console.log(`[Mock IoT] Endpoint ${cleanMc}/${key} di-TRIGGER! Status: TRUE selama 5 detik.`);
  return currentState;
}

/**
 * Service polling background untuk mengecek qr_webhook_url pada setiap master part aktif
 */
let pollingInterval: NodeJS.Timeout | null = null;

export function startQrWebhookPoller(intervalMs: number = 1000) {
  if (pollingInterval) return;

  console.log(`[QR Webhook Poller] Service dimulai. Polling interval: ${intervalMs}ms`);

  pollingInterval = setInterval(async () => {
    try {
      const urlsToPoll: { url: string; partKey: string; partNumber?: string; model?: string; homeLine?: string }[] = [];

      // 1. Ambil URL dari DB Master Parts
      const dbParts = await masterPartsRepository.findAll();
      for (const part of dbParts) {
        const url = part.qr_webhook_url?.trim();
        if (url) {
          urlsToPoll.push({
            url,
            partKey: `db_${part.id || part.part_number}`,
            partNumber: part.part_number,
            model: part.model || part.part_name,
            homeLine: part.home_line,
          });
        }
      }

      // 2. Ambil URL dinamis dari POLRI QR List (/api/v1/qr-list)
      try {
        const polriRes = await fetch('https://api.polri.web.id/api/v1/qr-list');
        if (polriRes.ok) {
          const polriItems: any = await polriRes.json();
          if (Array.isArray(polriItems)) {
            for (const item of polriItems) {
              if (!item.qr) continue;
              const mcMatch = (item.machine_origin || 'MC#6').match(/(\d+)/);
              const mcNum = mcMatch ? mcMatch[1] : '6';
              const polriUrl = `https://api.polri.web.id/iot/mc${mcNum}/${item.qr}`;

              if (!urlsToPoll.some((u) => u.url.toLowerCase() === polriUrl.toLowerCase())) {
                urlsToPoll.push({
                  url: polriUrl,
                  partKey: `polri_mc${mcNum}_${item.qr}`,
                  partNumber: item.part_name || item.qr,
                  model: item.part_name || item.qr,
                  homeLine: `F2-MC-${mcNum}`,
                });
              }
            }
          }
        }
      } catch (e) {
        // Abaikan error fetch POLRI list sementara
      }

      // 3. Polling seluruh target URL
      for (const target of urlsToPoll) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);

          const response = await fetch(target.url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) continue;
          const payload: any = await response.json();

          const isScanned = Boolean(payload?.scanned);
          const wasScanned = previousScanState.get(target.partKey) ?? false;

          // Rising Edge Detection: false -> true
          if (!wasScanned && isScanned) {
            console.log(
              `[QR Webhook Poller] 🚀 DETEKSI SCAN BARU pada (${target.partNumber || 'QR'}) dari URL: ${target.url}`
            );

            let qrCode = payload?.qrCode;
            if (!qrCode && payload?.webhookPath) {
              const pathParts = payload.webhookPath.split('/');
              qrCode = pathParts[pathParts.length - 1];
            }
            if (!qrCode && target.url) {
              const parts = target.url.split('/');
              qrCode = parts[parts.length - 1];
            }

            let homeLine = target.homeLine || 'F2-MC-6';
            let machineCode = homeLine;

            // Ekstrak kode mesin dari webhookPath atau webhookUrl dinamis (misal /webhook/mc2/QR-1006)
            let extractedMcNum = '';
            if (payload?.webhookPath) {
              const match = payload.webhookPath.match(/webhook\/([^\/]+)/i);
              if (match && match[1]) {
                extractedMcNum = match[1].replace(/[^0-9]/g, '');
              }
            }
            if (!extractedMcNum && target.url) {
              const match = target.url.match(/iot\/([^\/]+)/i);
              if (match && match[1]) {
                extractedMcNum = match[1].replace(/[^0-9]/g, '');
              }
            }

            if (extractedMcNum) {
              homeLine = `F2-MC-${extractedMcNum}`;
              machineCode = `MC ${extractedMcNum}`;
            }

            const scanData = {
              partNumber: target.partNumber || qrCode || 'QR-1008',
              model: target.model || qrCode || 'QR-1008',
              homeLine: homeLine,
              machineCode: machineCode,
              partName: target.partNumber || qrCode || 'QR-1008',
              qrCode: qrCode || 'QR-1008',
              webhookPath: payload?.webhookPath || `/webhook/${homeLine}/${qrCode}`,
              ts: payload?.ts || new Date().toISOString(),
            };

            // Broadcast ke seluruh client socket & room line/mesin
            const io = getIo();
            if (io) {
              io.emit('qr_scanned', scanData);
              if (homeLine) {
                io.to(`plan:${homeLine}`).emit('qr_scanned', scanData);
              }
            }

            // Pemrosesan mandiri di backend service
            try {
              const plansService = createProductionPlansService();
              await plansService.processScanEvent(scanData);
            } catch (err) {
              console.error('[QR Webhook Poller] Error memproses scan event di backend:', err);
            }
          }

          previousScanState.set(target.partKey, isScanned);
        } catch (err: any) {
          // Abaikan error koneksi sementara
        }
      }
    } catch (err) {
      console.error('[QR Webhook Poller] Error saat polling:', err);
    }
  }, intervalMs);
}

// Router Express untuk Webhook & Mock Endpoint
export const qrWebhookRouter = Router();

const handleGetMockEndpoint = (req: Request, res: Response) => {
  const mc = String(req.params.mcRaw);
  const qrCode = (String(req.params.qrCode)).toUpperCase();
  res.json(getMockState(mc, qrCode));
};

const handleTriggerMockEndpoint = async (req: Request, res: Response) => {
  const mcRaw = String(req.params.mc);
  const qrCode = (String(req.params.qrCode)).toUpperCase();
  const state = triggerMockQrScan(mcRaw, qrCode);

  const mcNum = mcRaw.replace(/[^0-9]/g, '');
  const machineCode = `MC ${mcNum}`;
  const homeLine = `F2-MC-${mcNum}`;

  const scanData = {
    machineCode,
    homeLine,
    qrCode,
    webhookPath: state.webhookPath,
    ts: state.ts,
  };

  const io = getIo();
  if (io) {
    io.emit('qr_scanned', scanData);
    io.to(`plan:${homeLine}`).emit('qr_scanned', scanData);
  }

  try {
    const plansService = createProductionPlansService();
    await plansService.processScanEvent(scanData);
  } catch (err) {
    console.error('[Mock IoT Trigger] Error memproses scan event di backend:', err);
  }

  res.json({
    status: 'ok',
    message: `Mock QR scan ${mcRaw}/${qrCode} triggered & diproses otomatis oleh backend!`,
    data: state,
  });
};

qrWebhookRouter.get('/iot/:mc/:qrCode', handleGetMockEndpoint);
qrWebhookRouter.get('/api/iot/:mc/:qrCode', handleGetMockEndpoint);

qrWebhookRouter.all('/iot/:mc/:qrCode/trigger', handleTriggerMockEndpoint);
qrWebhookRouter.all('/api/iot/:mc/:qrCode/trigger', handleTriggerMockEndpoint);
qrWebhookRouter.post('/iot/:mc/:qrCode', handleTriggerMockEndpoint);
qrWebhookRouter.post('/api/iot/:mc/:qrCode', handleTriggerMockEndpoint);

// POLRI API Proxy Endpoints
qrWebhookRouter.get('/api/polri/mc-list', async (_req: Request, res: Response) => {
  try {
    const response = await fetch('https://api.polri.web.id/api/v1/mc-list');
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal fetch mc-list dari POLRI API', message: err.message });
  }
});

qrWebhookRouter.get('/api/polri/qr-list', async (_req: Request, res: Response) => {
  try {
    const response = await fetch('https://api.polri.web.id/api/v1/qr-list');
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal fetch qr-list dari POLRI API', message: err.message });
  }
});

qrWebhookRouter.get('/api/polri/debug', async (_req: Request, res: Response) => {
  try {
    const response = await fetch('https://api.polri.web.id/iot/ws/debug');
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal fetch debug dari POLRI API', message: err.message });
  }
});

// 3. General Incoming Webhook Receiver (POST /api/webhook/qr-scan)
qrWebhookRouter.post('/api/webhook/qr-scan', async (req: Request, res: Response) => {
  const { machineCode, scanned, webhookPath, partNumber, model } = req.body;
  console.log(`[Incoming Webhook POST] Diterima payload:`, req.body);

  if (scanned) {
    const scanData = {
      machineCode: machineCode,
      partNumber: partNumber || '',
      model: model || '',
      qrCode: '',
      webhookPath: webhookPath,
      ts: new Date().toISOString(),
    };

    const io = getIo();
    if (io) {
      io.emit('qr_scanned', scanData);
    }

    try {
      const plansService = createProductionPlansService();
      await plansService.processScanEvent(scanData);
    } catch (err) {
      console.error('[Incoming Webhook POST] Error memproses scan event di backend:', err);
    }
  }

  res.json({ status: 'ok', received: true });
});
