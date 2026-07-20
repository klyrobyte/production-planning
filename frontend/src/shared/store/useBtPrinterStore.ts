import { create } from 'zustand';
import api from '../lib/axios';

const PAIRED_PRINTER_KEY = 'sugity_paired_printer';

/** Shape of pairing metadata persisted in localStorage */
export interface PairedPrinterInfo {
    name: string;
    serviceUuid: string;
    deviceId: string;
}

interface BtPrinterState {
    btDevice: any | null;
    btCharacteristic: any | null;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    connectionError: string;

    /** Call after a successful GATT connection to register state + localStorage */
    onDeviceConnected: (device: any, writeChar: any, serviceUuid: string) => void;
    /** Manually clear state (e.g. on physical disconnect or logout) */
    disconnect: () => void;
    /** Attempt silent reconnect using browser's permitted devices list */
    autoReconnect: () => Promise<void>;
    /** Try every UUID in order until a writable characteristic is found */
    findWriteCharacteristic: (server: any, uuidOrder: string[]) => Promise<{ char: any; serviceUuid: string } | null>;
}

export const useBtPrinterStore = create<BtPrinterState>((set, get) => ({
    btDevice: null,
    btCharacteristic: null,
    connectionStatus: 'disconnected',
    connectionError: '',

    onDeviceConnected: (device, writeChar, serviceUuid) => {
        const deviceName: string = device.name || 'Unknown Printer';

        set({
            btDevice: device,
            btCharacteristic: writeChar,
            connectionStatus: 'connected',
            connectionError: '',
        });

        // Persist pairing metadata to localStorage for auto-reconnect across page reloads
        const pairedInfo: PairedPrinterInfo = { name: deviceName, serviceUuid, deviceId: device.id };
        localStorage.setItem(PAIRED_PRINTER_KEY, JSON.stringify(pairedInfo));

        // Register UUID to DB (fire-and-forget) so it survives printer replacements
        if (serviceUuid) {
            api.post('/bt-printers/register', {
                name: deviceName,
                service_uuid: serviceUuid,
                notes: 'Auto-registered on connect',
            }).catch(() => { /* silent */ });
        }

        // When the printer physically disconnects, update store
        device.addEventListener('gattserverdisconnected', () => {
            console.log('[BT Store] Printer physically disconnected.');
            set({ btDevice: null, btCharacteristic: null, connectionStatus: 'disconnected' });
        });

        console.log(`[BT Store] Connected: ${deviceName} via service ${serviceUuid}`);
    },

    disconnect: () => {
        const { btDevice } = get();
        try { btDevice?.gatt?.disconnect(); } catch { /* ignore */ }
        set({ btDevice: null, btCharacteristic: null, connectionStatus: 'disconnected', connectionError: '' });
    },

    findWriteCharacteristic: async (server, uuidOrder) => {
        // 1. Try known/saved UUIDs first (fast path)
        for (const uuid of uuidOrder) {
            try {
                const service = await server.getPrimaryService(uuid);
                const chars = await service.getCharacteristics();
                const char = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
                if (char) return { char, serviceUuid: uuid };
            } catch { /* not on this device */ }
        }
        // 2. Full service discovery fallback
        try {
            const allServices = await server.getPrimaryServices();
            for (const service of allServices) {
                try {
                    const chars = await service.getCharacteristics();
                    const char = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
                    if (char) return { char, serviceUuid: service.uuid };
                } catch { /* skip service */ }
            }
        } catch { /* getPrimaryServices not supported */ }
        return null;
    },

    autoReconnect: async () => {
        const { btDevice, connectionStatus, findWriteCharacteristic, onDeviceConnected } = get();

        // Skip if already connected or currently connecting
        if (connectionStatus === 'connecting') return;
        if (btDevice && btDevice.gatt?.connected) {
            console.log('[BT Store] autoReconnect: already connected to', btDevice.name);
            return;
        }

        const isBluetoothSupported = typeof window !== 'undefined' && 'bluetooth' in navigator;
        if (!isBluetoothSupported) return;

        const saved = localStorage.getItem(PAIRED_PRINTER_KEY);
        if (!saved) {
            console.log('[BT Store] autoReconnect: no saved printer in localStorage.');
            return;
        }

        const canGetDevices = 'getDevices' in (navigator as any).bluetooth;
        if (!canGetDevices) {
            console.log('[BT Store] autoReconnect: getDevices() not available in this browser.');
            return;
        }

        try {
            const pairedInfo: PairedPrinterInfo = JSON.parse(saved);
            console.log('[BT Store] autoReconnect: attempting reconnect to', pairedInfo.name);

            // Load current UUID list from DB so we always try the most up-to-date list
            const res = await api.get('/bt-printers');
            const dbPrinters: any[] = res.data?.data || [];
            const savedUuids = dbPrinters.map((p: any) => p.service_uuid as string);

            const permittedDevices: any[] = await (navigator as any).bluetooth.getDevices();
            console.log('[BT Store] autoReconnect: permitted devices:', permittedDevices.map((d: any) => d.name));

            const target = permittedDevices.find((d: any) =>
                d.id === pairedInfo.deviceId || d.name === pairedInfo.name
            );

            if (!target) {
                console.warn('[BT Store] autoReconnect: no matching permitted device found.');
                return;
            }

            set({ connectionStatus: 'connecting' });
            const server = await target.gatt.connect();
            console.log('[BT Store] autoReconnect: GATT connected to', target.name);

            const uuidOrder = [...new Set([pairedInfo.serviceUuid, ...savedUuids].filter(Boolean))];
            const result = await findWriteCharacteristic(server, uuidOrder);

            if (result) {
                onDeviceConnected(target, result.char, result.serviceUuid);
            } else {
                console.warn('[BT Store] autoReconnect: no writable characteristic found.');
                set({ connectionStatus: 'disconnected' });
            }
        } catch (err) {
            console.error('[BT Store] autoReconnect failed:', err);
            set({ connectionStatus: 'disconnected' });
        }
    },
}));

/** Clear Bluetooth pairing on logout */
export const clearBtPairing = () => {
    localStorage.removeItem(PAIRED_PRINTER_KEY);
    useBtPrinterStore.getState().disconnect();
};
