import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Printer, Check, Tag } from 'lucide-react';
import { useAuthStore } from '../../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../../shared/store/useThemeStore';
import api from '../../../../shared/lib/axios';
import QRCode from 'qrcode';

interface PrintLabelModalProps {
  partNumber: string;
  partName: string;
  customer: string;
  targetTotal: number;
  labelQty: number;
  onSuccess: (qty: number) => void;
  onClose: () => void;
  btDevice: any;
  btCharacteristic: any;
  connectionStatus: string;
  isPrintLocked?: boolean;
  lockMessage?: string;
  actualQty?: number;
}

function getInitials(name: string) {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
}

export function PrintLabelModal({
  partNumber,
  partName,
  customer: _customer,
  targetTotal,
  labelQty,
  onSuccess,
  onClose,
  btDevice: _btDevice,
  btCharacteristic,
  connectionStatus,
  isPrintLocked = false,
  lockMessage = '',
  actualQty = 0,
}: PrintLabelModalProps) {
  const { systemLogo } = useThemeStore();
  const activePortal = useAuthStore((state) => state.activePortal);
  const memberName = useAuthStore((state) => state.memberName);
  const [parts, setParts] = useState<any[]>([]);
  const [kelipatan] = useState<number>(labelQty);
  const [isPrinting, setIsPrinting] = useState(false);
  const [success, setSuccess] = useState(false);
  const initialPrintedCount = Math.floor(actualQty / (labelQty || 1));
  const [printedCount, setPrintedCount] = useState<number>(initialPrintedCount);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const successTimeoutRef = useRef<any>(null);

  const loadParts = async () => {
    try {
      const res = await api.get('/parts');
      setParts(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCounter = async () => {
    const dateKey = new Date().toISOString().slice(0, 10);
    const localCounterKey = `sugity_label_seq_${dateKey}`;
    try {
      const response = await api.get(`/label-counters/${dateKey}`);
      const nextSeq = response.data?.seq ? response.data.seq + 1 : 1;
      localStorage.setItem(localCounterKey, String(nextSeq - 1));
    } catch (e) {
      const seq = parseInt(localStorage.getItem(localCounterKey) || '0') + 1;
      localStorage.setItem(localCounterKey, String(seq));
    }
  };

  const sendBluetoothData = async (data: Uint8Array) => {
    if (!btCharacteristic) return;
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await btCharacteristic.writeValue(chunk);
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  };

  const generateEscPosData = () => {
    const encoder = new TextEncoder();
    const partsArray: Uint8Array[] = [];
    const addBytes = (bytes: number[]) => {
      partsArray.push(new Uint8Array(bytes));
    };
    const addText = (text: string) => {
      partsArray.push(encoder.encode(text));
    };
    const col = (s: string, w: number) => s.substring(0, w).padEnd(w);
    const SEP = '-'.repeat(42) + '\n';
    addBytes([0x1b, 0x40]);
    addBytes([0x1b, 0x20, 0x00]);
    addBytes([0x1b, 0x61, 0x01]);
    addBytes([0x1b, 0x45, 0x00]);
    addBytes([0x1d, 0x21, 0x00]);
    addText('Customer Unique\n');
    addBytes([0x1b, 0x45, 0x01]);
    addBytes([0x1d, 0x21, 0x11]);
    const uniqueDisplay = customerUniqueItems.join(' / ');
    addText(`${uniqueDisplay}\n`);
    addBytes([0x1d, 0x21, 0x00]);
    addBytes([0x1b, 0x45, 0x00]);
    addBytes([0x1b, 0x61, 0x00]);
    addText(SEP);
    addBytes([0x1b, 0x45, 0x01]);
    addText('PART NO. :');
    addBytes([0x1b, 0x45, 0x00]);
    addText(` ${partNumber}\n`);
    addBytes([0x1b, 0x45, 0x01]);
    addText('PART NAME:');
    addBytes([0x1b, 0x45, 0x00]);
    addText(` ${partName.toUpperCase()}\n`);
    addBytes([0x1b, 0x45, 0x01]);
    addText('MODEL    :');
    addBytes([0x1b, 0x45, 0x00]);
    addText(` ${(partDetails.model || '').toUpperCase()}\n`);
    addText(SEP);
    addBytes([0x1b, 0x45, 0x01]);
    addText(`${col('SEBANGO', 14)}${col('PROD. DATE', 16)}PCS/KBN\n`);
    addBytes([0x1b, 0x45, 0x00]);
    const prodDateTime = getProdDateTime();
    const dtParts = prodDateTime.split(' ');
    const dateVal = dtParts[0] || '';
    const timeVal = dtParts.slice(1).join(' ');
    const sebVal = col(partDetails.sebango || '', 14);
    const seqDisp = `${String(printedCount + 1).padStart(2, '0')}/${String(totalLabels).padStart(2, '0')}`;
    addText(`${sebVal}${col(dateVal, 16)}${kelipatan}\n`);
    if (timeVal) {
      addText(`${' '.repeat(14)}${timeVal}\n`);
    }
    addBytes([0x1b, 0x61, 0x02]);
    addBytes([0x1b, 0x45, 0x01]);
    addText(`Label: ${seqDisp}\n`);
    addBytes([0x1b, 0x45, 0x00]);
    addBytes([0x1b, 0x61, 0x00]);
    addText(SEP);
    addBytes([0x1b, 0x61, 0x01]);
    const qrContent = partNumber || 'SGT';
    const qrBytes = encoder.encode(qrContent);
    const dataLen = qrBytes.length + 3;
    const pL = dataLen & 0xff;
    const pH = (dataLen >> 8) & 0xff;
    addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x0c]);
    addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]);
    addBytes([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]);
    partsArray.push(qrBytes);
    addBytes([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]);
    addText('\n\n\n');
    addBytes([0x1d, 0x56, 0x41, 0x03]);
    const totalLength = partsArray.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    partsArray.forEach((p) => {
      result.set(p, offset);
      offset += p.length;
    });
    return result;
  };

  const handleBrowserPrint = async () => {
    const seqDisp = `${String(printedCount + 1).padStart(2, '0')}/${String(totalLabels).padStart(2, '0')}`;
    const qrContent = partNumber || 'SGT';
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrContent, { width: 240, margin: 1 });
    } catch (_) {}
    const printWindow = window.open('', '_blank', 'width=680,height=740');
    if (!printWindow) {
      alert('Tolong aktifkan popups untuk mencetak label.');
      return;
    }
    const prodDateTime = getProdDateTime();
    const uniqueDisplay = customerUniqueItems.join(' / ');
    const uniqueFontSize = customerUniqueItems.length > 1 ? 13 : 24;
    const sebango = partDetails.sebango;
    const model = partDetails.model;
    const logoSrc = systemLogo || `${window.location.origin}/sugity-logo.png`;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Label Print</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 80mm;
      max-width: 80mm;
      font-family: Arial, Helvetica, sans-serif;
      background: white;
      color: black;
    }
    .lbl {
      width: 78mm;
      margin: 1mm;
      border: 1.5pt solid black;
    }
    .row {
      display: flex;
      width: 100%;
      border-bottom: 1pt solid black;
    }
    .row:last-child { border-bottom: none; }
    .sep { border-right: 1pt solid black; }
    .pad { padding: 2pt 3pt; }
    .logo-area {
      width: 27%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3pt;
    }
    .logo-text {
      font-size: 5.5pt;
      font-weight: 700;
      letter-spacing: 1pt;
      text-align: center;
      margin-top: 2pt;
      text-transform: uppercase;
    }
    .unique-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3pt 4pt;
      text-align: center;
    }
    .unique-lbl { font-size: 5.5pt; color: #444; display: block; }
    .unique-val {
      font-size: ${uniqueFontSize}pt;
      font-weight: 900;
      line-height: 1.05;
      display: block;
      word-break: break-all;
    }
    .fl { font-size: 5pt; font-weight: 700; text-transform: uppercase; color: #333; display: block; }
    .fv { font-size: 7pt; font-weight: 700; display: block; margin-top: 1pt; }
    .fv-sm { font-size: 6.5pt; display: block; margin-top: 1pt; }
    .fv-date { font-size: 6pt; font-style: italic; display: block; margin-top: 1pt; line-height: 1.4; }
    .qty-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2pt 3pt;
      text-align: center;
    }
    .qty-val { font-size: 16pt; font-weight: 900; line-height: 1; margin-top: 2pt; }
    .seq-badge { font-size: 7pt; font-weight: 900; color: #222; display: block; margin-top: 3pt; letter-spacing: 0.5pt; }
    .qr-area {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 4pt;
    }
  </style>
</head>
<body>
<div class="lbl">
  <div class="row">
    <div class="logo-area sep">
      <img src="${logoSrc}" width="42" height="31" style="object-fit:contain;" />
      <span class="logo-text">SEBANGO</span>
    </div>
    <div class="unique-area">
      <span class="unique-lbl">Customer Unique</span>
      <span class="unique-val">${uniqueDisplay}</span>
    </div>
  </div>
  <div class="row">
    <div class="pad sep" style="width:33%">
      <span class="fl">Part No.</span>
      <span class="fv">${partNumber}</span>
    </div>
    <div class="pad sep" style="width:34%">
      <span class="fl">Part Name</span>
      <span class="fv" style="text-transform:uppercase">${partName.toUpperCase()}</span>
    </div>
    <div class="pad" style="width:33%">
      <span class="fl">Model</span>
      <span class="fv">${model}</span>
    </div>
  </div>
  <div class="row">
    <div class="pad sep" style="width:33%">
      <span class="fl">Sebango</span>
      <span class="fv-sm">${sebango}</span>
    </div>
    <div class="pad sep" style="width:34%">
      <span class="fl">Prod. Date</span>
      <span class="fv-date">${prodDateTime}</span>
    </div>
    <div class="qty-area" style="width:33%">
      <span class="fl">Pcs / Kanban</span>
      <span class="qty-val">${kelipatan}</span>
      <span class="seq-badge">${seqDisp}</span>
    </div>
  </div>
  <div class="qr-area">
    ${qrDataUrl ? `<img src="${qrDataUrl}" width="180" height="180" />` : `<p style="font-size:8pt;text-align:center;padding:6pt;font-weight:bold;">${sebango}</p>`}
  </div>
</div>
<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    }, 300);
  };
</script>
</body>
</html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const isBypassMode =
        typeof window !== 'undefined' &&
        localStorage.getItem('sugity_dev_bypass_bt') === 'true';

      if (connectionStatus === 'connected' && btCharacteristic) {
        const data = generateEscPosData();
        await sendBluetoothData(data);
      } else if (isBypassMode) {
        // Dev Bypass Mode: Suppress browser print / Save-as-PDF prompt completely
        console.log('[DEV BYPASS MODE] Suppressing browser print / Save-as-PDF prompt.');
      } else {
        await handleBrowserPrint();
      }
      const dateKey = new Date().toISOString().slice(0, 10);
      const localCounterKey = `sugity_label_seq_${dateKey}`;
      try {
        const response = await api.get(`/label-counters/${dateKey}`);
        let newSeq = 1;
        if (response.data?.seq !== undefined) {
          newSeq = response.data.seq + 1;
        }
        await api.post('/label-counters', { date_key: dateKey, seq: newSeq });
        localStorage.setItem(localCounterKey, String(newSeq));
      } catch (e) {
        const current = parseInt(localStorage.getItem(localCounterKey) || '0');
        localStorage.setItem(localCounterKey, String(current + 1));
      }
      const newPrintedCount = printedCount + 1;
      setPrintedCount(newPrintedCount);
      setSuccess(true);
      onSuccess(kelipatan);
      fetchCounter();
      successTimeoutRef.current = setTimeout(() => {
        setSuccess(false);
        setIsPrinting(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Printing failed. Please verify printer connection.');
      setIsPrinting(false);
    }
  };

  const getProdDateTime = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const initials = memberName
      ? getInitials(memberName)
      : activePortal === 'member'
      ? 'MB'
      : activePortal.substring(0, 2).toUpperCase();
    const suffix = initials ? ` (${initials})` : '';
    return `${dateStr} - ${timeStr}${suffix}`;
  };

  useEffect(() => {
    loadParts();
    fetchCounter();
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const totalLabels = isNaN(targetTotal) || isNaN(kelipatan) ? 0 : Math.ceil(targetTotal / (kelipatan || 1));

  const partDetails = useMemo(() => {
    const matched = parts.find((p) => p.part_number === partNumber || p.sebango === partNumber);
    if (matched) {
      return {
        sebango: matched.sebango || 'U0-****',
        customerSebango: matched.customer_sebango || '',
        model: matched.model || '--',
      };
    }
    return { sebango: partNumber, customerSebango: '', model: '--' };
  }, [parts, partNumber]);

  const customerUniqueItems = useMemo(() => {
    const raw = (partDetails.customerSebango || '').trim();
    if (!raw || raw === 'GT-****') return ['-'];
    return raw
      .split(/[\/,;\+]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [partDetails.customerSebango]);

  useEffect(() => {
    const qrContent = partNumber || 'SGT';
    QRCode.toDataURL(qrContent, { width: 160, margin: 1 })
      .then((url) => setQrPreviewUrl(url))
      .catch(() => setQrPreviewUrl(''));
  }, [partDetails.sebango, partNumber]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[95vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#E76114]" />
            Print Production Label
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row min-h-[380px] overflow-y-auto">
          <div className="p-6 border-r border-slate-150 dark:border-slate-800 w-full md:w-80 shrink-0 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
            <div className="space-y-5 flex-1">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">
                  Total Production (Target)
                </label>
                <div className="text-xl font-black text-slate-800 dark:text-white">
                  {targetTotal} <span className="text-xs text-slate-400 font-medium">pcs</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">
                  Label Qty Box Standard
                </label>
                <div className="text-2xl font-black text-slate-800 dark:text-white bg-white dark:bg-slate-900 px-3 py-2.5 rounded text-center border border-slate-200 dark:border-slate-800 shadow-sm font-mono font-bold">
                  {kelipatan} <span className="text-xs text-slate-500 font-bold">Qty / Box</span>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 text-[#E76114] p-3 rounded border border-orange-100 dark:border-orange-950/30">
                <div className="text-[10px] uppercase font-bold text-[#E76114]/70 mb-1">Total Labels to Print</div>
                <div className="text-2xl font-black">
                  {totalLabels} <span className="text-xs font-bold text-[#E76114]/70">Labels</span>
                </div>
              </div>
              {((isPrintLocked && lockMessage) || (targetTotal > 0 && actualQty >= targetTotal)) && (
                <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-250 text-amber-800 dark:text-amber-455 p-3 rounded text-[10px] font-bold leading-snug flex items-start gap-1.5 shadow-sm mt-3">
                  <span>⚠️</span>
                  <div>
                    {targetTotal > 0 && actualQty >= targetTotal
                      ? `Target Lot Selesai: Produksi telah mencapai target (${actualQty}/${targetTotal} pcs). Pencetakan label Kanban dikunci.`
                      : lockMessage}
                    {activePortal !== 'member' && !(targetTotal > 0 && actualQty >= targetTotal) && (
                      <div className="mt-1.5 text-blue-700 font-extrabold uppercase text-[8px] tracking-wider bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block">
                        Leader Bypass Active
                      </div>
                    )}
                  </div>
                </div>
              )}
              {typeof window !== 'undefined' && localStorage.getItem('sugity_dev_bypass_bt') === 'true' && (
                <div className="mt-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm">
                  ⚡ Dev Bypass Mode: Prompt Cetak Di-Bypass (Pcs Langsung Bertambah)
                </div>
              )}
            </div>
            <div className="pt-6">
              <button
                onClick={handlePrint}
                disabled={
                  isPrinting ||
                  success ||
                  (targetTotal > 0 && actualQty >= targetTotal) ||
                  (isPrintLocked && activePortal === 'member')
                }
                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  success
                    ? 'bg-emerald-500 text-white scale-95'
                    : isPrinting
                    ? 'bg-orange-400 text-white cursor-wait scale-95'
                    : (targetTotal > 0 && actualQty >= targetTotal) || (isPrintLocked && activePortal === 'member')
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-[#E76114] text-white hover:opacity-95 hover:-translate-y-0.5'
                }`}
              >
                {success ? (
                  <>
                    <Check className="w-5 h-5 animate-bounce" /> Label Printed!
                  </>
                ) : isPrinting ? (
                  <>Printing Label...</>
                ) : (
                  <>
                    <Printer className="w-5 h-5" /> PRINT LABEL{' '}
                    {totalLabels > 0
                      ? `${String(printedCount + 1).padStart(2, '0')}/${String(totalLabels).padStart(2, '0')}`
                      : ''}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center overflow-auto min-h-[380px]">
            <div className="text-[10px] text-slate-400 font-black mb-2 uppercase flex items-center gap-1 select-none">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Label Preview
            </div>
            <div className="bg-white w-full max-w-[460px] border-[2px] border-black shadow-md text-black relative select-none">
              {isPrinting && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center text-[#E76114] font-black tracking-widest uppercase text-xs">
                  Transmitting...
                </div>
              )}
              <div className="flex border-b-[2px] border-black" style={{ minHeight: '68px' }}>
                <div
                  className="flex flex-col items-center justify-center p-2 border-r-[2px] border-black"
                  style={{ width: '28%' }}
                >
                  <img
                    src={systemLogo || '/sugity-logo.png'}
                    alt="Logo"
                    className="object-contain"
                    style={{ width: '52px', height: '39px' }}
                  />
                  <span style={{ fontSize: '7px', fontWeight: 600, letterSpacing: '2px', marginTop: '3px' }}>
                    SEBANGO
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-3 py-2 text-center">
                  <span style={{ fontSize: '9px', color: '#555' }}>Customer Unique</span>
                  <span
                    style={{
                      fontSize: customerUniqueItems.length > 1 ? '22px' : '38px',
                      fontWeight: 900,
                      lineHeight: 1.05,
                      marginTop: '2px',
                    }}
                  >
                    {customerUniqueItems.join(' / ')}
                  </span>
                </div>
              </div>
              <div className="flex border-b-[2px] border-black">
                <div className="flex flex-col p-1.5 border-r-[2px] border-black" style={{ width: '33%' }}>
                  <span style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#444' }}>
                    Part No.
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{partNumber}</span>
                </div>
                <div className="flex flex-col p-1.5 border-r-[2px] border-black" style={{ width: '34%' }}>
                  <span style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#444' }}>
                    Part Name
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.2 }}>
                    {partName}
                  </span>
                </div>
                <div className="flex flex-col p-1.5" style={{ width: '33%' }}>
                  <span style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#444' }}>
                    Model
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{partDetails.model}</span>
                </div>
              </div>
              <div className="flex border-b-[2px] border-black">
                <div className="flex flex-col p-1.5 border-r-[2px] border-black" style={{ width: '33%' }}>
                  <span style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#444' }}>
                    Sebango
                  </span>
                  <span style={{ fontSize: '10px' }}>{partDetails.sebango}</span>
                </div>
                <div className="flex flex-col p-1.5 border-r-[2px] border-black" style={{ width: '34%' }}>
                  <span style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#444' }}>
                    Prod. Date
                  </span>
                  <span style={{ fontSize: '9px', fontStyle: 'italic', color: '#555', lineHeight: 1.4 }}>
                    {getProdDateTime()}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 w-[33%]">
                  <span className="text-[7px] font-bold uppercase text-slate-700 text-center">
                    Pcs / Kanban
                  </span>
                  <span className="text-[26px] font-black leading-none">{kelipatan}</span>
                </div>
              </div>
              <div className="flex items-center justify-center p-3">
                {qrPreviewUrl ? (
                  <img src={qrPreviewUrl} alt="QR" className="w-[155px] h-[155px] object-contain" />
                ) : (
                  <div className="w-[155px] h-[155px] flex items-center justify-center bg-slate-100 rounded">
                    <span className="text-[10px] text-slate-400">Generating QR...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
