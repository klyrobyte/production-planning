import { Bluetooth, Pencil, Trash2, X, Check } from 'lucide-react';
import { useSiteConfigContext } from '../context/SiteConfigContext';

export default function SiteConfigPrinterRegistry() {
  const {
    printers,
    printerLoading,
    editingPrinter,
    setEditingPrinter,
    printerError,
    setPrinterError,
    isPairing,
    handlePairNewPrinter,
    handleSavePrinterEdit,
    handleDeletePrinter,
  } = useSiteConfigContext();

  return (
    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bluetooth className="h-4.5 w-4.5 text-blue-500" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-350">
            Registry Bluetooth Printer
          </span>
        </div>
        <button
          onClick={handlePairNewPrinter}
          disabled={isPairing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-all cursor-pointer"
        >
          {isPairing ? (
            <>
              <span className="animate-spin">↻</span> Scanning...
            </>
          ) : (
            <>
              <Bluetooth className="h-3 w-3" /> Pair Printer Baru
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 font-medium text-left">
        Printer yang pernah terhubung akan otomatis terdaftar di sini. UUID yang tersimpan akan diprioritaskan saat koneksi berikutnya sehingga proses pairing lebih cepat dan reliable.
      </p>

      {/* Inline form for Edit only */}
      {editingPrinter !== null && editingPrinter.id && (
        <div className="mb-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/10 p-4 space-y-3 text-left">
          <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Edit Printer
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Nama Printer
              </label>
              <input
                type="text"
                value={editingPrinter.name || ''}
                onChange={(e) => setEditingPrinter((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: Printer F2 MC1"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Service UUID
              </label>
              <input
                type="text"
                value={editingPrinter.service_uuid || ''}
                onChange={(e) =>
                  setEditingPrinter((p) => ({ ...p, service_uuid: e.target.value.toLowerCase().trim() }))
                }
                placeholder="0000ffe0-0000-1000-8000-00805f9b34fb"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-3 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={editingPrinter.notes || ''}
              onChange={(e) => setEditingPrinter((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Lokasi printer, keterangan lain..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
          {printerError && (
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{printerError}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setEditingPrinter(null);
                setPrinterError(null);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="h-3 w-3" /> Batal
            </button>
            <button
              onClick={handleSavePrinterEdit}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors"
            >
              <Check className="h-3 w-3" /> Simpan
            </button>
          </div>
        </div>
      )}

      {/* Printer List */}
      {printerLoading ? (
        <div className="text-center py-8 text-xs text-slate-400 font-bold">Memuat data printer...</div>
      ) : printers.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Bluetooth className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-xs font-bold text-slate-400 dark:text-slate-600">Belum ada printer terdaftar.</p>
          <p className="text-[10px] text-slate-300 dark:text-slate-700 mt-1">
            Printer akan otomatis terdaftar saat pertama kali terhubung dari halaman produksi.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {printers.map((printer) => (
            <div
              key={printer.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3 text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                <Bluetooth className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{printer.name}</p>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                  {printer.service_uuid}
                </p>
                {printer.notes && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{printer.notes}</p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setEditingPrinter({ ...printer });
                    setPrinterError(null);
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDeletePrinter(printer.id)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Hapus"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
