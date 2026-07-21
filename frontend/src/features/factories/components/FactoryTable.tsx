import { Edit, Trash2 } from 'lucide-react';
import { useFactoryContext } from '../context/FactoryContext';

export default function FactoryTable() {
  const {
    isSuperAdmin,
    filteredFactories,
    isLoading,
    openEditModal,
    triggerDelete,
  } = useFactoryContext();

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
              <th className="px-6 py-4">Kode Pabrik</th>
              <th className="px-6 py-4">Nama Pabrik</th>
              <th className="px-6 py-4">Lokasi Plant</th>
              {isSuperAdmin && <th className="px-6 py-4 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-white">
            {isLoading ? (
              <tr>
                <td colSpan={isSuperAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-brand-primary"></div>
                    <span>Memuat data pabrik...</span>
                  </div>
                </td>
              </tr>
            ) : filteredFactories.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada data pabrik yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredFactories.map((factory) => (
                <tr key={factory.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-extrabold text-brand-primary">
                    {factory.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 dark:text-white">
                    {factory.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-450 dark:text-white font-semibold">
                    {factory.location || '-'}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(factory)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 cursor-pointer"
                          title="Edit Pabrik"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete(factory.id, factory.name)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-950/30 text-rose-600 dark:text-rose-455 transition hover:bg-rose-50 dark:hover:bg-rose-950/10 active:scale-90 cursor-pointer"
                          title="Hapus Pabrik"
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
