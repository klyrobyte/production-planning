export interface BtPrinter {
  id: number;
  name: string;
  service_uuid: string;
  notes: string | null;
}

export interface PairedPrinterInfo {
  name: string;
  serviceUuid: string;
  deviceId: string;
}

export interface UpdateThemePayload {
  color_primary?: string;
  color_secondary?: string;
  color_navbar?: string;
  system_title?: string;
  system_logo?: string;
  browser_title?: string;
  machine_types?: string;
}
