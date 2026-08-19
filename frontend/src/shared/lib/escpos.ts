/**
 * Shared Bluetooth ESC/POS utility for auto-print via IoT webhook triggers.
 *
 * Exported:
 *  - sendBtChunked       — kirim Uint8Array ke BT characteristic dalam potongan 20-byte
 *  - buildKanbanEscPos   — build ESC/POS payload Kanban label minimal (untuk auto-print IoT)
 */

// ---------------------------------------------------------------------------
// sendBtChunked
// ---------------------------------------------------------------------------

/**
 * Kirim data ESC/POS ke BT characteristic dalam potongan 20 byte
 * (batas MTU standar BLE untuk write without response).
 */
export async function sendBtChunked(characteristic: any, data: Uint8Array): Promise<void> {
  if (!characteristic) throw new Error('No BT characteristic available');
  const CHUNK = 20;
  for (let i = 0; i < data.length; i += CHUNK) {
    const chunk = data.slice(i, i + CHUNK);
    try {
      if (typeof characteristic.writeValueWithoutResponse === 'function' && characteristic.properties?.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else if (typeof characteristic.writeValueWithResponse === 'function') {
        await characteristic.writeValueWithResponse(chunk);
      } else if (typeof characteristic.writeValue === 'function') {
        await characteristic.writeValue(chunk);
      } else {
        throw new Error('No valid write method on characteristic');
      }
    } catch (err) {
      // Fallback to writeValue or writeValueWithoutResponse if primary call failed
      if (typeof characteristic.writeValue === 'function') {
        await characteristic.writeValue(chunk);
      } else if (typeof characteristic.writeValueWithoutResponse === 'function') {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        throw err;
      }
    }
    // Delay kecil antar chunk agar printer BLE tidak drop data
    await new Promise<void>((r) => setTimeout(r, 15));
  }
}

// ---------------------------------------------------------------------------
// buildKanbanEscPos
// ---------------------------------------------------------------------------

export interface KanbanEscPosParams {
  partNumber: string;
  partName: string;
  model: string;
  sebango: string;
  customerUnique: string;  // sudah di-join, e.g. "GT-1234 / GT-5678"
  kelipatan: number;       // qty per box / label
  printedCount: number;    // label ke-berapa yang sudah dicetak (0-indexed)
  totalLabels: number;     // total label yang harus dicetak
  prodDateTime: string;    // string produksi, e.g. "19/08/2026 - 14:30:00 (FRH)"
  userInitials?: string;
}

/**
 * Build ESC/POS Uint8Array untuk label Kanban.
 * Digunakan oleh IoT auto-print agar konsisten dengan PrintLabelModal.
 */
export function buildKanbanEscPos(p: KanbanEscPosParams): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  const addBytes = (bytes: number[]) => parts.push(new Uint8Array(bytes));
  const addText  = (text: string)    => parts.push(encoder.encode(text));
  const col      = (s: string, w: number) => s.substring(0, w).padEnd(w);
  const SEP = '-'.repeat(42) + '\n';

  // Init & center
  addBytes([0x1b, 0x40]);           // ESC @ — initialize printer
  addBytes([0x1b, 0x20, 0x00]);     // character spacing
  addBytes([0x1b, 0x61, 0x01]);     // center align

  // Customer Unique header
  addBytes([0x1b, 0x45, 0x00]);
  addBytes([0x1d, 0x21, 0x00]);
  addText('Customer Unique\n');
  addBytes([0x1b, 0x45, 0x01]);
  addBytes([0x1d, 0x21, 0x11]);
  addText(`${p.customerUnique}\n`);
  addBytes([0x1d, 0x21, 0x00]);
  addBytes([0x1b, 0x45, 0x00]);

  // Left align for details
  addBytes([0x1b, 0x61, 0x00]);
  addText(SEP);

  addBytes([0x1b, 0x45, 0x01]); addText('PART NO. :'); addBytes([0x1b, 0x45, 0x00]);
  addText(` ${p.partNumber}\n`);
  addBytes([0x1b, 0x45, 0x01]); addText('PART NAME:'); addBytes([0x1b, 0x45, 0x00]);
  addText(` ${p.partName.toUpperCase()}\n`);
  addBytes([0x1b, 0x45, 0x01]); addText('MODEL    :'); addBytes([0x1b, 0x45, 0x00]);
  addText(` ${p.model.toUpperCase()}\n`);
  addText(SEP);

  // Sebango / date / qty row
  addBytes([0x1b, 0x45, 0x01]);
  addText(`${col('SEBANGO', 14)}${col('PROD. DATE', 16)}PCS/KBN\n`);
  addBytes([0x1b, 0x45, 0x00]);

  const dtParts     = p.prodDateTime.split(' ');
  const dateVal     = dtParts[0] || '';
  const timeAndUser = dtParts.slice(1).join(' ');
  const seqDisp     = `${String(p.printedCount + 1).padStart(2, '0')}/${String(p.totalLabels).padStart(2, '0')}`;

  addText(`${col(p.sebango, 14)}${col(dateVal, 16)}${p.kelipatan}\n`);
  if (timeAndUser) addText(`${' '.repeat(14)}${timeAndUser}\n`);

  // Sequence (right-align)
  addBytes([0x1b, 0x61, 0x02]);
  addBytes([0x1b, 0x45, 0x01]);
  addText(`Label: ${seqDisp}\n`);
  addBytes([0x1b, 0x45, 0x00]);
  addBytes([0x1b, 0x61, 0x00]);
  addText(SEP);

  // QR code (center)
  addBytes([0x1b, 0x61, 0x01]);
  const qrContent = encoder.encode(p.partNumber || 'SGT');
  const dataLen   = qrContent.length + 3;
  const pL = dataLen & 0xff;
  const pH = (dataLen >> 8) & 0xff;
  addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x0c]); // size
  addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]); // error correction
  addBytes([0x1d, 0x28, 0x6b, pL,   pH,   0x31, 0x50, 0x30]); // store data
  parts.push(qrContent);
  addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]); // print QR

  // Feed & cut
  addText('\n\n\n');
  addBytes([0x1d, 0x56, 0x41, 0x03]); // partial cut

  // Assemble
  const total  = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let offset   = 0;
  for (const chunk of parts) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
