import api from '../../../shared/lib/axios';
import type { BtPrinter } from './SiteConfigTypes';

export class SiteConfigService {
  /**
   * Fetch registered Bluetooth printers from backend
   */
  async fetchPrinters(): Promise<BtPrinter[]> {
    try {
      const res = await api.get('/bt-printers');
      return res.data.data || [];
    } catch (err) {
      console.error('Failed to fetch bluetooth printers:', err);
      throw err;
    }
  }

  /**
   * Register a new Bluetooth printer
   */
  async registerPrinter(payload: { name: string; service_uuid: string; notes?: string }): Promise<void> {
    try {
      await api.post('/bt-printers/register', payload);
    } catch (err) {
      console.error('Failed to register bluetooth printer:', err);
      throw err;
    }
  }

  /**
   * Update an existing Bluetooth printer by ID
   */
  async updatePrinter(id: number, payload: { name: string; service_uuid: string; notes?: string | null }): Promise<void> {
    try {
      await api.put(`/bt-printers/${id}`, payload);
    } catch (err) {
      console.error('Failed to update bluetooth printer:', err);
      throw err;
    }
  }

  /**
   * Delete a Bluetooth printer from registry by ID
   */
  async deletePrinter(id: number): Promise<void> {
    try {
      await api.delete(`/bt-printers/${id}`);
    } catch (err) {
      console.error('Failed to delete bluetooth printer:', err);
      throw err;
    }
  }

  /**
   * Pair a new Bluetooth BLE printer using browser Web Bluetooth API
   */
  async pairBluetoothDevice(savedUuids: string[]): Promise<{ name: string; serviceUuid: string }> {
    const isBtSupported = typeof window !== 'undefined' && 'bluetooth' in navigator;
    if (!isBtSupported) {
      throw new Error('Web Bluetooth tidak tersedia di browser ini. Gunakan Chrome/Edge di desktop atau Android.');
    }

    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: savedUuids.length > 0 ? savedUuids : undefined,
    });

    const server = await device.gatt.connect();

    // Discover services to find write characteristic
    let writeChar: any = null;
    let serviceUuid = '';

    try {
      const allServices = await server.getPrimaryServices();
      for (const service of allServices) {
        try {
          const chars = await service.getCharacteristics();
          writeChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
          if (writeChar) {
            serviceUuid = service.uuid;
            break;
          }
        } catch {
          // skip
        }
      }
    } catch {
      // getPrimaryServices not available
    }

    if (!writeChar || !serviceUuid) {
      server.disconnect?.();
      throw new Error('Tidak ditemukan characteristic yang bisa di-write. Pastikan ini adalah printer BLE yang aktif.');
    }

    server.disconnect?.();

    const deviceName = device.name || 'Printer Baru';
    const pairedInfo = { name: deviceName, serviceUuid, deviceId: device.id };
    localStorage.setItem('sugity_paired_printer', JSON.stringify(pairedInfo));

    return { name: deviceName, serviceUuid };
  }

  /**
   * Process uploaded logo file to data URL with max size check (500KB)
   */
  processLogoFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > 500 * 1024) {
        reject(new Error('Ukuran file logo maksimal adalah 500KB.'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Gagal membaca file gambar logo.'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate printer edit inputs
   */
  validatePrinterEdit(name?: string, serviceUuid?: string): string | null {
    if (!name?.trim() || !serviceUuid?.trim()) {
      return 'Nama dan Service UUID wajib diisi.';
    }
    return null;
  }
}

export const siteConfigService = new SiteConfigService();
