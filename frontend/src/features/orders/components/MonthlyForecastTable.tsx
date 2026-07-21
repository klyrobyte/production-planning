import { Box, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useOrdersContext } from '../context/OrdersContext';
import { ordersService } from '../context/OrdersService';

export default function MonthlyForecastTable() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  const {
    viewState,
    subTab,
    setSubTab,
    isLoading,
    searchQuery,
    setSearchQuery,
    columnFilters,
    setColumnFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedList,
    processedDisplayList,
    machines,
    pendingMachineChanges,
    setPendingMachineChanges,
    handleMachineChange,
    handleSaveMachineChanges,
    isCommitting,
    monthNames,
  } = useOrdersContext();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortHeader = (field: string, label: string, alignRight = false) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`w-full px-3 py-3 flex items-center font-bold tracking-wider text-[10px] text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none cursor-pointer transition-colors ${
          alignRight ? 'justify-end text-right' : 'justify-between text-left'
        }`}
      >
        <span>{label}</span>
        <span className="ml-1 shrink-0 text-slate-350 dark:text-slate-650 font-mono text-[9px]">
          {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    );
  };

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900/80 border shadow-sm overflow-hidden flex flex-col h-[720px] transition-all duration-300 ${
        Object.keys(pendingMachineChanges).length > 0
          ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/20 shadow-lg'
          : 'border-slate-200/50 dark:border-slate-800/50'
      }`}
    >
      {/* Header controls inside Table */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-900/40">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            {viewState === 'preview' ? 'Preview Data Forecast' : 'Data Forecast Aktif'}
          </h3>

          {viewState === 'active' && (
            <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl flex gap-1 border border-slate-300/10 dark:border-slate-800/10">
              <button
                onClick={() => setSubTab('active')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  subTab === 'active' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/30'
                }`}
                style={subTab === 'active' ? { backgroundColor: colorPrimary } : {}}
              >
                Active Plan
              </button>
              <button
                onClick={() => setSubTab('history')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  subTab === 'history' ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/30'
                }`}
                style={subTab === 'history' ? { backgroundColor: colorPrimary } : {}}
              >
                Riwayat Upload
              </button>
            </div>
          )}
        </div>

        {/* Filtering Controls */}
        {(viewState === 'preview' || (viewState === 'active' && subTab === 'active')) && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari Sebango, Part No, Model..."
                className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white shadow-sm"
              />
            </div>
            <button
              onClick={() => {
                setColumnFilters({
                  sebango: '',
                  partNumber: '',
                  modelCode: '',
                  machineId: '',
                  monthN: '',
                  monthN1: '',
                  monthN2: '',
                  monthN3: '',
                });
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-100 rounded-lg border border-rose-250/20 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Clear Filter
            </button>

            {Object.keys(pendingMachineChanges).length > 0 && (
              <>
                <button
                  onClick={() => setPendingMachineChanges({})}
                  disabled={isCommitting}
                  className="px-2.5 py-1.5 text-[9px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 rounded-lg border border-slate-200/50 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveMachineChanges}
                  disabled={isCommitting}
                  className="px-3 py-1.5 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg shadow cursor-pointer transition-colors flex items-center gap-1"
                  style={{ backgroundColor: colorPrimary }}
                >
                  {isCommitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    `Simpan (${Object.keys(pendingMachineChanges).length}) M/C`
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Scrollable grid area */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-bold">Memuat Data Forecast...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px] relative">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-0" style={{ width: '10%' }}>
                  {renderSortHeader('sebango', 'Sebango')}
                </th>
                <th className="p-0" style={{ width: '22%' }}>
                  {renderSortHeader('partNumber', 'Part No / Nama')}
                </th>
                <th className="p-0" style={{ width: '11%' }}>
                  {renderSortHeader('modelCode', 'Model')}
                </th>
                <th className="p-0" style={{ width: '13%' }}>
                  {renderSortHeader('machineId', 'M/C')}
                </th>
                <th
                  className="p-0 text-right bg-emerald-50/10 dark:bg-emerald-950/5"
                  style={{ width: '11%' }}
                >
                  {renderSortHeader('monthN', ordersService.getShortMonthName(monthNames.monthN), true)}
                </th>
                <th
                  className="p-0 text-right bg-emerald-50/10 dark:bg-emerald-950/5"
                  style={{ width: '11%' }}
                >
                  {renderSortHeader('monthN1', ordersService.getShortMonthName(monthNames.monthN1), true)}
                </th>
                <th
                  className="p-0 text-right bg-emerald-50/10 dark:bg-emerald-950/5"
                  style={{ width: '11%' }}
                >
                  {renderSortHeader('monthN2', ordersService.getShortMonthName(monthNames.monthN2), true)}
                </th>
                <th
                  className="p-0 text-right bg-emerald-50/10 dark:bg-emerald-950/5"
                  style={{ width: '11%' }}
                >
                  {renderSortHeader('monthN3', ordersService.getShortMonthName(monthNames.monthN3), true)}
                </th>
              </tr>
              {/* Inline Filter Inputs */}
              <tr className="bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/80">
                <th className="p-1">
                  <input
                    type="text"
                    value={columnFilters.sebango}
                    onChange={(e) => {
                      setColumnFilters((prev) => ({ ...prev, sebango: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="Filter Seb..."
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white"
                  />
                </th>
                <th className="p-1">
                  <input
                    type="text"
                    value={columnFilters.partNumber}
                    onChange={(e) => {
                      setColumnFilters((prev) => ({ ...prev, partNumber: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="Filter Part..."
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white"
                  />
                </th>
                <th className="p-1">
                  <input
                    type="text"
                    value={columnFilters.modelCode}
                    onChange={(e) => {
                      setColumnFilters((prev) => ({ ...prev, modelCode: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="Filter Model..."
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white"
                  />
                </th>
                <th className="p-1">
                  <select
                    value={columnFilters.machineId}
                    onChange={(e) => {
                      setColumnFilters((prev) => ({ ...prev, machineId: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">Filter MC</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.code}>
                        {m.code}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="p-1 bg-emerald-50/5 dark:bg-emerald-950/2 text-right">
                  <input
                    type="text"
                    value={columnFilters.monthN}
                    onChange={(e) => {
                      setColumnFilters((prev) => ({ ...prev, monthN: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="Min..."
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white text-right font-mono"
                  />
                </th>
                <th className="p-1 bg-emerald-50/5 dark:bg-emerald-950/2 text-right">
                  <input
                    type="text"
                    value={columnFilters.monthN1}
                    onChange={(e) => {
                      setColumnFilters((prev) => ({ ...prev, monthN1: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="Min..."
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white text-right font-mono"
                  />
                </th>
                <th className="p-1 bg-emerald-50/5 dark:bg-emerald-950/2 text-right">
                  <input
                    type="text"
                    value={columnFilters.monthN2}
                    onChange={(e) => {
                      setColumnFilters((prev) => ({ ...prev, monthN2: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="Min..."
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white text-right font-mono"
                  />
                </th>
                <th className="p-1 bg-emerald-50/5 dark:bg-emerald-950/2 text-right">
                  <input
                    type="text"
                    value={columnFilters.monthN3}
                    onChange={(e) => {
                      setColumnFilters((prev) => ({ ...prev, monthN3: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="Min..."
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-medium outline-none focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white text-right font-mono"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px] dark:text-slate-300">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-slate-650 font-bold">
                    Tidak ada data forecast part yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors">
                    <td className="px-3 py-3 font-mono font-extrabold text-slate-700 dark:text-slate-400">
                      {item.sebango || '-'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200">{item.partNumber}</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[200px]">
                        {item.partName || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-500 dark:text-slate-450">
                      {item.modelCode || '-'}
                    </td>

                    {/* Machine selection selector cell */}
                    <td className="px-3 py-3">
                      {viewState === 'preview' ? (
                        <span className="font-bold font-mono text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {item.machineId || 'UNASSIGNED'}
                        </span>
                      ) : (
                        <select
                          value={item.machineId}
                          onChange={(e) => handleMachineChange(item.partNumber, e.target.value)}
                          disabled={isCommitting}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded px-1.5 py-1 font-mono font-bold text-xs cursor-pointer focus:border-emerald-600 dark:text-slate-300"
                        >
                          <option value="">UNASSIGNED</option>
                          {machines.map((m) => (
                            <option key={m.id} value={m.code}>
                              {m.code}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-3 py-3 text-right font-mono bg-emerald-50/5 dark:bg-emerald-950/2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.monthN.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400 dark:text-emerald-500 font-bold">
                        {item.dailyRequirementN.toLocaleString()} / hari
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono bg-emerald-50/5 dark:bg-emerald-950/2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.monthN1.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400 dark:text-emerald-500 font-bold">
                        {item.dailyRequirementN1.toLocaleString()} / hari
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono bg-emerald-50/5 dark:bg-emerald-950/2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.monthN2.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400 dark:text-emerald-500 font-bold">
                        {item.dailyRequirementN2.toLocaleString()} / hari
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono bg-emerald-50/5 dark:bg-emerald-950/2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.monthN3.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400 dark:text-emerald-500 font-bold">
                        {item.dailyRequirementN3.toLocaleString()} / hari
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination footer */}
      {(viewState === 'preview' || (viewState === 'active' && subTab === 'active')) && totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30 select-none">
          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">
            Halaman {currentPage} dari {totalPages} ({processedDisplayList.length} items)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-55 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 dark:text-slate-400" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-55 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
