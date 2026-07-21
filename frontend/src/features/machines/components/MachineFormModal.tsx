import { Cpu, X, Key } from 'lucide-react';
import { useMachineContext } from '../context/MachineContext';

export default function MachineFormModal() {
  const {
    showFormModal,
    modalType,
    factories,
    typesList,
    machineFactoryId,
    setMachineFactoryId,
    machineCode,
    setMachineCode,
    machineName,
    setMachineName,
    machineType,
    setMachineType,
    machineTonnage,
    setMachineTonnage,
    machineStatus,
    setMachineStatus,
    machinePin,
    setMachinePin,
    isSubmitting,
    errorMsg,
    colorPrimary,
    closeFormModal,
    handleFormSubmit,
  } = useMachineContext();

  if (!showFormModal) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {modalType === 'add' ? 'Registrasi Mesin Baru' : 'Update Mesin'}
            </span>
          </div>
          <button
            onClick={closeFormModal}
            className="rounded-lg p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-white dark:hover:text-white cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs font-bold text-rose-700 dark:text-rose-455 text-left">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
          {modalType === 'add' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                Pabrik / Factory *
              </label>
              <select
                value={machineFactoryId}
                onChange={(e) => setMachineFactoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
              >
                {factories.map((f) => (
                  <option key={f.id} value={f.id} className="dark:bg-slate-900">
                    {f.code} - {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
              Kode Mesin *
            </label>
            <input
              type="text"
              value={machineCode}
              onChange={(e) => setMachineCode(e.target.value)}
              placeholder="[Pabrik]-[MC]-[Nomor Mesin]"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
              Nama Mesin *
            </label>
            <input
              type="text"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              placeholder="Contoh: Machine 1"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
              Tipe Mesin *
            </label>
            <select
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
            >
              <option value="">-- Pilih Tipe Mesin --</option>
              {typesList.map((type) => (
                <option key={type} value={type} className="capitalize">
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
              Tonnage (Kapasitas)
            </label>
            <input
              type="text"
              value={machineTonnage}
              onChange={(e) => setMachineTonnage(e.target.value)}
              placeholder="Contoh: 2500T, 3500T"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {modalType === 'edit' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                  Status Keaktifan
                </label>
                <select
                  value={machineStatus}
                  onChange={(e) => setMachineStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                >
                  <option value="active" className="dark:bg-slate-900">
                    Aktif (Operasional)
                  </option>
                  <option value="inactive" className="dark:bg-slate-900">
                    Nonaktif (Off / Maintenance)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white flex items-center gap-1">
                    <Key className="h-3 w-3" /> PIN Leader Baru
                  </label>
                  <span className="text-[9px] font-bold text-slate-450 dark:text-white uppercase">
                    Kosongkan jika tidak diubah
                  </span>
                </div>
                <input
                  type="password"
                  value={machinePin}
                  onChange={(e) => setMachinePin(e.target.value)}
                  placeholder="Masukkan PIN numerik leader baru (opsional)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={closeFormModal}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-750 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: colorPrimary }}
              className="flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Simpan Mesin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
