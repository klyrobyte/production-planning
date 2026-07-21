import { useRef } from 'react';
import { Upload, CalendarDays } from 'lucide-react';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useOrdersContext } from '../context/OrdersContext';
import { ordersService } from '../context/OrdersService';

export default function MonthlyForecastImport() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    importMode,
    setImportMode,
    isProcessing,
    handleFileUpload,
    pasteData,
    setPasteData,
    handlePasteSubmit,
    selectedManualPartNo,
    handleManualPartSelect,
    manualMonthN,
    setManualMonthN,
    manualMonthN1,
    setManualMonthN1,
    manualMonthN2,
    setManualMonthN2,
    manualMonthN3,
    setManualMonthN3,
    handleManualSubmit,
    handleManualReset,
    monthNames,
    parts,
    isCommitting,
  } = useOrdersContext();

  return (
    <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden transition-all duration-300">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
        <div className="flex-1 space-y-1 text-left">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-500 animate-pulse" />
            Upload Forecast Bulanan ({monthNames.monthN} - {monthNames.monthN3})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Upload nilai rata-rata requirement harian (Volume Average/Day) per part berdasarkan kode{' '}
            <strong>Sebango</strong> internal. Volume bulanan otomatis dihitung dengan basis 20 hari kerja.
          </p>
        </div>

        <div className="bg-slate-200/60 dark:bg-slate-850 p-1 rounded-2xl flex gap-1 select-none shrink-0 self-center lg:self-start border border-slate-300/30 dark:border-slate-800/30">
          <button
            onClick={() => setImportMode('csv')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              importMode === 'csv'
                ? 'text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
            }`}
            style={importMode === 'csv' ? { backgroundColor: colorPrimary } : {}}
          >
            CSV/Excel File
          </button>
          <button
            onClick={() => setImportMode('paste')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              importMode === 'paste'
                ? 'text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
            }`}
            style={importMode === 'paste' ? { backgroundColor: colorPrimary } : {}}
          >
            Excel Paste
          </button>
          <button
            onClick={() => setImportMode('manual')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              importMode === 'manual'
                ? 'text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
            }`}
            style={importMode === 'manual' ? { backgroundColor: colorPrimary } : {}}
          >
            Manual Input
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200/40 dark:border-slate-800/40 pt-5">
        {importMode === 'csv' && (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-900 rounded-2xl transition-colors relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
            <Upload className="w-8 h-8 mb-2.5 text-slate-400 dark:text-slate-600" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-5 py-2 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: colorPrimary }}
            >
              {isProcessing ? 'Processing File...' : 'Pilih File CSV'}
            </button>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Format kolom: Sebango, {monthNames.monthN} (Avg/Day), {monthNames.monthN1} (Avg/Day),{' '}
              {monthNames.monthN2} (Avg/Day), {monthNames.monthN3} (Avg/Day)
            </span>
          </div>
        )}

        {importMode === 'paste' && (
          <div className="space-y-3 text-left">
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder={`Paste kolom tabel Excel di sini... (Contoh: Sebango [Tab] ${monthNames.monthN} [Tab] ${monthNames.monthN1} [Tab] ${monthNames.monthN2} [Tab] ${monthNames.monthN3})`}
              className="w-full h-32 p-3 text-xs font-mono border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-xl bg-white dark:bg-slate-900 dark:text-white shadow-inner resize-y leading-relaxed"
              disabled={isProcessing}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPasteData('')}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={isProcessing || !pasteData.trim()}
                className="px-5 py-2 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: colorPrimary }}
              >
                {isProcessing ? 'Processing...' : 'Submit Paste Data'}
              </button>
            </div>
          </div>
        )}

        {importMode === 'manual' && (
          <div className="space-y-4 max-w-4xl text-left">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
                Pilih Part (Sebango / No Part / Model)
              </label>
              <input
                type="text"
                list="master-parts-list"
                placeholder="Cari Sebango / No Part / Model..."
                value={selectedManualPartNo}
                onChange={(e) => handleManualPartSelect(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 outline-none focus:border-emerald-600 shadow-sm"
              />
              <datalist id="master-parts-list">
                {parts.map((p) => (
                  <option key={p.part_number} value={p.part_number}>
                    {p.sebango ? `[${p.sebango}] ` : ''}
                    {p.part_number} - {p.part_name || ''}
                  </option>
                ))}
              </datalist>
            </div>

            {selectedManualPartNo && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/30 p-3 rounded-2xl">
                    <label className="block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5">
                      {ordersService.getShortMonthName(monthNames.monthN)}
                    </label>
                    <input
                      type="number"
                      value={manualMonthN}
                      onChange={(e) => setManualMonthN(e.target.value)}
                      placeholder="Volume"
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">
                      Daily Avg: {Math.ceil((parseFloat(manualMonthN) || 0) / 20).toLocaleString()} / hari
                    </span>
                  </div>

                  <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/30 p-3 rounded-2xl">
                    <label className="block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5">
                      {ordersService.getShortMonthName(monthNames.monthN1)}
                    </label>
                    <input
                      type="number"
                      value={manualMonthN1}
                      onChange={(e) => setManualMonthN1(e.target.value)}
                      placeholder="Volume"
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">
                      Daily Avg: {Math.ceil((parseFloat(manualMonthN1) || 0) / 20).toLocaleString()} / hari
                    </span>
                  </div>

                  <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/30 p-3 rounded-2xl">
                    <label className="block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5">
                      {ordersService.getShortMonthName(monthNames.monthN2)}
                    </label>
                    <input
                      type="number"
                      value={manualMonthN2}
                      onChange={(e) => setManualMonthN2(e.target.value)}
                      placeholder="Volume"
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">
                      Daily Avg: {Math.ceil((parseFloat(manualMonthN2) || 0) / 20).toLocaleString()} / hari
                    </span>
                  </div>

                  <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/30 p-3 rounded-2xl">
                    <label className="block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-500 mb-1.5">
                      {ordersService.getShortMonthName(monthNames.monthN3)}
                    </label>
                    <input
                      type="number"
                      value={manualMonthN3}
                      onChange={(e) => setManualMonthN3(e.target.value)}
                      placeholder="Volume"
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 outline-none rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5">
                      Daily Avg: {Math.ceil((parseFloat(manualMonthN3) || 0) / 20).toLocaleString()} / hari
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleManualReset}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold uppercase rounded-xl cursor-pointer transition-all"
                  >
                    Reset Form
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    disabled={isCommitting}
                    className="px-5 py-2 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow cursor-pointer transition-all disabled:opacity-50"
                    style={{ backgroundColor: colorPrimary }}
                  >
                    {isCommitting ? 'Saving...' : 'Simpan Penyesuaian Manual'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
