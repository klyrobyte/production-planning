import { Palette, Upload, Trash2, RotateCcw, Save } from 'lucide-react';
import { useSiteConfigContext } from '../context/SiteConfigContext';

export default function SiteConfigThemeForm() {
  const {
    colorPrimary,
    primaryInput,
    setPrimaryInput,
    secondaryInput,
    setSecondaryInput,
    navbarInput,
    setNavbarInput,
    titleInput,
    setTitleInput,
    logoInput,
    setLogoInput,
    browserTitleInput,
    setBrowserTitleInput,
    machineTypesInput,
    setMachineTypesInput,
    abnormalityTypesInput,
    setAbnormalityTypesInput,
    isSaving,
    isDragging,
    successMsg,
    errorMsg,
    handleSaveTheme,
    handleResetTheme,
    handleLogoChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useSiteConfigContext();

  return (
    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <Palette className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-350">
            Identitas & Tema Warna
          </span>
        </div>

        <div className="space-y-5">
          {/* Judul Sistem */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-55 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Judul Sistem</h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Nama sistem yang tampil di navbar/sidebar</p>
            </div>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Contoh: SC Prod Plan"
              className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-200 outline-none focus:border-brand-primary dark:focus:bg-slate-900"
            />
          </div>

          {/* Judul Tab Browser */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-55 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Judul Tab Browser</h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Nama yang tampil di bagian atas tab browser</p>
            </div>
            <input
              type="text"
              value={browserTitleInput}
              onChange={(e) => setBrowserTitleInput(e.target.value)}
              placeholder="Contoh: SC Prod Plan"
              className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-200 outline-none focus:border-brand-primary dark:focus:bg-slate-900"
            />
          </div>

          {/* Jenis Mesin */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-55 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Opsi Tipe Mesin</h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Pilihan tipe mesin di Machine Management (pisahkan dengan koma)</p>
            </div>
            <input
              type="text"
              value={machineTypesInput}
              onChange={(e) => setMachineTypesInput(e.target.value)}
              placeholder="Contoh: injection,painting,assembly"
              className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-200 outline-none focus:border-brand-primary dark:focus:bg-slate-900 font-mono"
            />
          </div>

          {/* Opsi Jenis Abnormality */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-55 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Opsi Jenis Abnormality</h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Pilihan jenis abnormality pada form Report Abnormality di FUKA/Execution (pisahkan dengan koma)</p>
            </div>
            <input
              type="text"
              value={abnormalityTypesInput}
              onChange={(e) => setAbnormalityTypesInput(e.target.value)}
              placeholder="Contoh: Mesin Breakdown (Mekanik),Tunggu Bahan Baku,Tunggu Crane / Mold Swap,Listrik Padam"
              className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-3 text-xs font-bold text-slate-655 dark:text-slate-200 outline-none focus:border-brand-primary dark:focus:bg-slate-900 font-mono text-[11px]"
            />
          </div>

          {/* Logo Sistem */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-55 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Logo Sistem</h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Upload file logo aplikasi (Format gambar, maks. 500KB)</p>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 shrink-0 shadow-sm">
                <img
                  src={logoInput || '/logo.png'}
                  alt="Logo Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 flex gap-2">
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-2 px-3 text-[9px] font-black uppercase tracking-wider transition ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 dark:border-slate-850 text-slate-500 dark:text-slate-450 hover:bg-white dark:hover:bg-slate-950 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700'
                  } cursor-pointer`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isDragging ? 'Drop logo di sini' : 'Drag & Drop / Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                {logoInput && (
                  <button
                    onClick={() => setLogoInput('')}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-950/20 bg-rose-50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 transition cursor-pointer shrink-0"
                    title="Hapus Logo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Warna Primer */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-55 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Warna Primer</h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Warna utama sistem & tombol aksen</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-9 w-9 shrink-0">
                <input
                  type="color"
                  value={primaryInput}
                  onChange={(e) => setPrimaryInput(e.target.value)}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10"
                />
                <div
                  style={{ backgroundColor: primaryInput }}
                  className="h-full w-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:scale-105 active:scale-95"
                />
              </div>
              <input
                type="text"
                value={primaryInput}
                onChange={(e) => setPrimaryInput(e.target.value)}
                className="w-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-1.5 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Warna Sekunder */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-55 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Warna Sekunder</h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Warna latar belakang sidebar utama</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-9 w-9 shrink-0">
                <input
                  type="color"
                  value={secondaryInput}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10"
                />
                <div
                  style={{ backgroundColor: secondaryInput }}
                  className="h-full w-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:scale-105 active:scale-95"
                />
              </div>
              <input
                type="text"
                value={secondaryInput}
                onChange={(e) => setSecondaryInput(e.target.value)}
                className="w-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-1.5 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Warna Navbar */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-55 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 p-4 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Warna Navbar</h4>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Header navigasi atas aplikasi</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-9 w-9 shrink-0">
                <input
                  type="color"
                  value={navbarInput}
                  onChange={(e) => setNavbarInput(e.target.value)}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10"
                />
                <div
                  style={{ backgroundColor: navbarInput }}
                  className="h-full w-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:scale-105 active:scale-95"
                />
              </div>
              <input
                type="text"
                value={navbarInput}
                onChange={(e) => setNavbarInput(e.target.value)}
                className="w-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-1.5 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {successMsg && (
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-450 text-left">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs font-bold text-rose-700 dark:text-rose-455 text-left">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleResetTheme}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-750 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveTheme}
            disabled={isSaving}
            style={{ backgroundColor: colorPrimary }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
