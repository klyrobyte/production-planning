import { Router, Request, Response } from 'express';
import { masterPartsRepository } from '../master-parts/master-parts.repository';
import { createProductionPlansService } from '../production-plans/production-plans.service';
import { getIo } from '../../websocket/socket.server';
import { getSiteConfig } from '../site-config/site-config.repository';

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
      const siteConfig = await getSiteConfig();
      const domain = (siteConfig.qr_webhook_domain || 'https://api.polri.web.id').replace(/\/+$/, '');
      const endpointQrList = siteConfig.qr_webhook_endpoint_qr_list || '/api/v1/qr-list';
      const endpointIotPattern = siteConfig.qr_webhook_endpoint_iot || '/iot/{mc}/{factory}/{qr}';

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

      // 2. Ambil URL dinamis dari QR List server IoT
      try {
        const polriRes = await fetch(`${domain}${endpointQrList}`);
        if (polriRes.ok) {
          const rawData: any = await polriRes.json();
          const polriItems: any[] = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);

          if (Array.isArray(polriItems)) {
            for (const item of polriItems) {
              if (!item.qr) continue;
              const rawMc = item.machine_origin || item.mc || 'MC#6';
              const rawFactory = item.factory || 'Factory 2';
              const mcMatch = rawMc.match(/(\d+)/);
              const mcNum = mcMatch ? mcMatch[1] : '6';

              // Format IoT URL menggunakan pattern dari Site Config
              const formattedPath = endpointIotPattern
                .replace('{mc}', encodeURIComponent(rawMc))
                .replace('{factory}', encodeURIComponent(rawFactory))
                .replace('{qr}', encodeURIComponent(item.qr));

              const polriUrl = `${domain}${formattedPath}`;

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

// POLRI / External IoT API Proxy Endpoints
const handleGetMcListProxy = async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  try {
    const siteConfig = await getSiteConfig();
    const domain = (siteConfig.qr_webhook_domain || 'https://api.polri.web.id').replace(/\/+$/, '');
    const endpoint = siteConfig.qr_webhook_endpoint_mc_list || '/api/v1/mc-list';

    const response = await fetch(`${domain}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.warn('[IoT Proxy] Fetch mc-list dari API IoT gagal, menggunakan mock fallback:', err.message);
    res.json({
      factories: {
        'Factory 1': [
          { id: 12, mc: 'ID', machine_code: 'ID', machine_name: 'Machine F1', factory: 'Factory 1', qr_origin: null }
        ],
        'Factory 2': [
          { id: 4, mc: 'MC#3', machine_code: 'MC#3', machine_name: 'Machine Dummy', factory: 'Factory 2', qr_origin: 'QR-1008' },
          { id: 5, mc: 'MC#4', machine_code: 'MC#4', machine_name: 'Machine Dummy', factory: 'Factory 2', qr_origin: 'QR-1009' },
          { id: 6, mc: 'MC#5', machine_code: 'MC#5', machine_name: 'Machine Dummy', factory: 'Factory 2', qr_origin: null },
          { id: 7, mc: 'MC#6', machine_code: 'MC#6', machine_name: '- 2500T', factory: 'Factory 2', qr_origin: 'QR-1004' },
          { id: 8, mc: 'MC#7', machine_code: 'MC#7', machine_name: 'Machine Dummy', factory: 'Factory 2', qr_origin: null },
          { id: 9, mc: 'MC#8', machine_code: 'MC#8', machine_name: 'Machine Dummy', factory: 'Factory 2', qr_origin: 'QR-1007' }
        ],
        'Factory 3': [
          { id: 3, mc: 'MC#2', machine_code: 'MC#2', machine_name: 'Machine Dummy', factory: 'Factory 3', qr_origin: 'QR-1002, QR-1003, QR-1006' }
        ]
      }
    });
  }
};

const handleGetQrListProxy = async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  try {
    const siteConfig = await getSiteConfig();
    const domain = (siteConfig.qr_webhook_domain || 'https://api.polri.web.id').replace(/\/+$/, '');
    const endpoint = siteConfig.qr_webhook_endpoint_qr_list || '/api/v1/qr-list';

    const response = await fetch(`${domain}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.warn('[IoT Proxy] Fetch qr-list dari API IoT gagal, menggunakan mock fallback:', err.message);
    res.json([
      { id: 82, qr: 'QR-1002', part_name: 'BOARD, RR DOOR TRIM, RH/LH', factory: 'Factory 2', machine_origin: 'MC#2' },
      { id: 84, qr: 'QR-1003', part_name: 'DATA TESTING', factory: 'Factory 2', machine_origin: 'MC#2' },
      { id: 85, qr: 'QR-1004', part_name: 'DAVEE', factory: 'Factory 2', machine_origin: 'MC#6' },
      { id: 89, qr: 'QR-1006', part_name: 'FARHAN', factory: 'Factory 2', machine_origin: 'MC#2' }
    ]);
  }
};

qrWebhookRouter.get('/api/polri/mc-list', handleGetMcListProxy);
qrWebhookRouter.get('/api/qr-webhook/mc-list', handleGetMcListProxy);

qrWebhookRouter.get('/api/polri/qr-list', handleGetQrListProxy);
qrWebhookRouter.get('/api/qr-webhook/qr-list', handleGetQrListProxy);

qrWebhookRouter.get('/api/polri/debug', async (_req: Request, res: Response) => {
  try {
    const siteConfig = await getSiteConfig();
    const domain = (siteConfig.qr_webhook_domain || 'https://api.polri.web.id').replace(/\/+$/, '');
    const response = await fetch(`${domain}/iot/ws/debug`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal fetch debug dari API IoT', message: err.message });
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
