import { Edit, Trash2 } from 'lucide-react';
import { useMachineContext } from '../context/MachineContext';

export default function MachineTable() {
  const {
    isSuperAdmin,
    filteredMachines,
    isLoading,
    openEditModal,
    triggerDelete,
  } = useMachineContext();

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
              <th className="px-6 py-4">Pabrik</th>
              <th className="px-6 py-4">Kode Mesin</th>
              <th className="px-6 py-4">Nama Mesin</th>
              <th className="px-6 py-4">Tipe Mesin</th>
              <th className="px-6 py-4">Tonnage</th>
              <th className="px-6 py-4">Status</th>
              {isSuperAdmin && <th className="px-6 py-4 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-white">
            {isLoading ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-brand-primary"></div>
                    <span>Memuat data mesin...</span>
                  </div>
                </td>
              </tr>
            ) : filteredMachines.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada data mesin yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredMachines.map((machine) => (
                <tr key={machine.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="rounded-lg bg-slate-100 dark:bg-slate-850 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-white border border-slate-200 dark:border-slate-800">
                      {machine.factory_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-800 dark:text-white">
                    {machine.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 dark:text-white">
                    {machine.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-450 dark:text-white font-semibold">
                    {machine.type || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-800 dark:text-white font-extrabold">
                    {machine.tonnage || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                        machine.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-450'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 text-slate-500 dark:text-slate-405'
                      }`}
                    >
                      {machine.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(machine)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 cursor-pointer"
                          title="Edit Mesin"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete(machine.id, `${machine.factory_code} - ${machine.code}`)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-950/30 text-rose-600 dark:text-rose-455 transition hover:bg-rose-50 dark:hover:bg-rose-950/10 active:scale-90 cursor-pointer"
                          title="Hapus Mesin"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
