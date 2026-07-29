import { Router, Request, Response } from 'express';
import { masterPartsRepository } from '../master-parts/master-parts.repository';
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

function getMockState(key: string): MockIotState {
  if (!mockIotState.has(key)) {
    mockIotState.set(key, {
      scanned: false,
      webhookPath: `/webhook/mc6/${key}`,
      ts: new Date().toISOString(),
    });
  }
  return mockIotState.get(key)!;
}

export function triggerMockQrScan(key: string = 'QR-1008'): MockIotState {
  const currentState = getMockState(key);
  currentState.scanned = true;
  currentState.ts = new Date().toISOString();

  if (mockTimerMap.has(key)) {
    clearTimeout(mockTimerMap.get(key)!);
  }

  // Auto-reset ke scanned: false setelah 5 detik
  const timer = setTimeout(() => {
    currentState.scanned = false;
    currentState.ts = new Date().toISOString();
    console.log(`[Mock IoT] Endpoint ${key} status 'scanned' telah otomatis kembali ke FALSE.`);
  }, 5000);

  mockTimerMap.set(key, timer);
  console.log(`[Mock IoT] Endpoint ${key} di-TRIGGER! Status: TRUE selama 5 detik.`);
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
      const parts = await masterPartsRepository.findAll();
      for (const part of parts) {
        const webhookUrl = part.qr_webhook_url?.trim();
        if (!webhookUrl) continue;

        const partKey = part.id || part.part_number;

        try {
          // Fetch status dari endpoint webhook IoT asli / mock
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);

          const response = await fetch(webhookUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) continue;
          const payload: any = await response.json();

          const isScanned = Boolean(payload?.scanned);
          const wasScanned = previousScanState.get(partKey) ?? false;

          // Rising Edge Detection: false -> true
          if (!wasScanned && isScanned) {
            console.log(
              `[QR Webhook Poller] 🚀 DETEKSI SCAN BARU pada Part ${part.part_number} (${part.model || part.part_name}) dari URL: ${webhookUrl}`
            );

            let qrCode = payload?.qrCode;
            if (!qrCode && payload?.webhookPath) {
              const pathParts = payload.webhookPath.split('/');
              qrCode = pathParts[pathParts.length - 1];
            }

            const scanData = {
              partNumber: part.part_number,
              model: part.model,
              homeLine: part.home_line,
              partName: part.part_name,
              qrCode: qrCode || 'QR-1008',
              webhookPath: payload?.webhookPath || `/webhook/${part.part_number}`,
              ts: payload?.ts || new Date().toISOString(),
            };

            // Broadcast ke seluruh client socket & room line/mesin
            const io = getIo();
            if (io) {
              io.emit('qr_scanned', scanData);
              if (part.home_line) {
                io.to(`plan:${part.home_line}`).emit('qr_scanned', scanData);
              }
            }
          }

          previousScanState.set(partKey, isScanned);
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
  const qrCode = (String(req.params.qrCode || 'QR-1008')).toUpperCase();
  res.json(getMockState(qrCode));
};

const handleTriggerMockEndpoint = (req: Request, res: Response) => {
  const qrCode = (String(req.params.qrCode || 'QR-1008')).toUpperCase();
  const state = triggerMockQrScan(qrCode);
  res.json({
    status: 'ok',
    message: `Mock QR scan ${qrCode} triggered! (Active for 5 seconds)`,
    data: state,
  });
};

qrWebhookRouter.get('/iot/mc6/:qrCode', handleGetMockEndpoint);
qrWebhookRouter.get('/api/iot/mc6/:qrCode', handleGetMockEndpoint);

qrWebhookRouter.all('/iot/mc6/:qrCode/trigger', handleTriggerMockEndpoint);
qrWebhookRouter.all('/api/iot/mc6/:qrCode/trigger', handleTriggerMockEndpoint);
qrWebhookRouter.post('/iot/mc6/:qrCode', handleTriggerMockEndpoint);
qrWebhookRouter.post('/api/iot/mc6/:qrCode', handleTriggerMockEndpoint);

// 3. General Incoming Webhook Receiver (POST /api/webhook/qr-scan)
qrWebhookRouter.post('/api/webhook/qr-scan', (req: Request, res: Response) => {
  const { machineCode, scanned, webhookPath } = req.body;
  console.log(`[Incoming Webhook POST] Diterima payload:`, req.body);

  if (scanned) {
    const scanData = {
      machineCode: machineCode || 'MC 6',
      qrCode: 'QR-1008',
      webhookPath: webhookPath || '/webhook/mc6/QR-1008',
      ts: new Date().toISOString(),
    };

    const io = getIo();
    if (io) {
      io.emit('qr_scanned', scanData);
    }
  }

  res.json({ status: 'ok', received: true });
});
