import { useState, useEffect } from 'react';
import { Save, RotateCcw, Layout, Palette, Upload, Trash2 } from 'lucide-react';
import { useThemeStore } from '../../../shared/store/useThemeStore';

// Render the branding theme color manager with real-time mockup preview card
export default function SiteConfigPage() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const colorSecondary = useThemeStore((state) => state.colorSecondary);
  const colorNavbar = useThemeStore((state) => state.colorNavbar);
  const systemTitle = useThemeStore((state) => state.systemTitle);
  const systemLogo = useThemeStore((state) => state.systemLogo);
  const browserTitle = useThemeStore((state) => state.browserTitle);
  const machineTypes = useThemeStore((state) => state.machineTypes);
  const updateTheme = useThemeStore((state) => state.updateTheme);

  // Local state for configuration inputs
  const [primaryInput, setPrimaryInput] = useState(colorPrimary);
  const [secondaryInput, setSecondaryInput] = useState(colorSecondary);
  const [navbarInput, setNavbarInput] = useState(colorNavbar);
  const [titleInput, setTitleInput] = useState(systemTitle);
  const [logoInput, setLogoInput] = useState(systemLogo);
  const [browserTitleInput, setBrowserTitleInput] = useState(browserTitle);
  const [machineTypesInput, setMachineTypesInput] = useState(machineTypes);

  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync inputs with global state changes
  useEffect(() => {
    setPrimaryInput(colorPrimary);
    setSecondaryInput(colorSecondary);
    setNavbarInput(colorNavbar);
    setTitleInput(systemTitle);
    setLogoInput(systemLogo);
    setBrowserTitleInput(browserTitle);
    setMachineTypesInput(machineTypes);
  }, [colorPrimary, colorSecondary, colorNavbar, systemTitle, systemLogo, browserTitle, machineTypes]);

  // Shared file processor for logo image
  const processLogoFile = (file: File) => {
    setErrorMsg(null);
    if (file.size > 500 * 1024) {
      setErrorMsg('Ukuran file logo maksimal adalah 500KB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoInput(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  // Save color theme configuration to backend database
  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateTheme({
        color_primary: primaryInput,
        color_secondary: secondaryInput,
        color_navbar: navbarInput,
        system_title: titleInput,
        system_logo: logoInput,
        browser_title: browserTitleInput,
        machine_types: machineTypesInput,
      });
      setSuccessMsg('Konfigurasi berhasil disimpan dan diperbarui secara global.');
      // Auto dismiss success toast after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setErrorMsg('Gagal menyimpan konfigurasi branding.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset colors and text back to standard Sugity Creatives branding
  const handleResetToDefault = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateTheme({
        color_primary: '#008d51',
        color_secondary: '#E76114',
        color_navbar: '#037233',
        system_title: 'PT. Sugity Creatives',
        system_logo: '',
        browser_title: 'SC Prod Plan',
        machine_types: 'injection,painting',
      });
      setSuccessMsg('Branding warna dan identitas telah dikembalikan ke standar bawaan.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setErrorMsg('Gagal mengembalikan konfigurasi branding.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="text-left">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">System Preferences</p>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">Pengaturan Site Config</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Configuration Panel */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <Palette className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-350">Identitas & Tema Warna</span>
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

              {/* Jenis Mesin (Dropdown Options) */}
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
                      className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-2 px-3 text-[9px] font-black uppercase tracking-wider transition ${isDragging
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
                onClick={handleResetToDefault}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-750 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleSave}
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

        {/* Live Layout Preview Mockup */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <Layout className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-350">Preview Layout Real-time</span>
          </div>

          {/* Interactive Layout Mockup */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-950 flex aspect-video w-full select-none">
            {/* Sidebar Mock */}
            <div
              style={{
                backgroundColor: secondaryInput,
              }}
              className="w-1/4 h-full border-r border-black/5 p-3 flex flex-col justify-between text-white transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  <div className="h-5 w-5 rounded-md bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                    {logoInput ? (
                      <img src={logoInput} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="h-full w-full rounded bg-emerald-600" />
                    )}
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-wide truncate">{titleInput || 'PT. SUGITY'}</span>
                </div>

                <div className="space-y-1">
                  <div className="rounded bg-white/20 px-2 py-1 text-[6px] font-black uppercase tracking-wider">Dashboard</div>
                  <div className="rounded px-2 py-1 text-[6px] font-black uppercase tracking-wider opacity-60">Orders</div>
                  <div className="rounded px-2 py-1 text-[6px] font-black uppercase tracking-wider opacity-60">Production</div>
                </div>
              </div>

              <div className="rounded bg-black/10 p-1.5 text-[5px] font-bold text-center">
                Logout Device
              </div>
            </div>

            {/* Content Mock */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
              {/* Navbar Mock */}
              <div
                style={{ backgroundColor: navbarInput }}
                className="h-8 w-full px-3 flex items-center justify-between text-white text-[7px] font-bold transition-all duration-300 shadow-sm"
              >
                <span>3M DASHBOARD</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-white/20" />
                  <span className="scale-90 opacity-80">Planner</span>
                </div>
              </div>

              {/* Body Mock */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-sm text-left transition-colors duration-300">
                    <div className="text-[5px] font-black text-slate-400 dark:text-slate-500 uppercase">Target</div>
                    <div className="text-[10px] font-black text-slate-700 dark:text-slate-250 mt-0.5">2,540 Pcs</div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-sm text-left transition-colors duration-300">
                    <div className="text-[5px] font-black text-slate-400 dark:text-slate-500 uppercase">Aktual</div>
                    <div className="text-[10px] font-black text-slate-700 dark:text-slate-250 mt-0.5">2,410 Pcs</div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-sm text-left transition-colors duration-300">
                    <div className="text-[5px] font-black text-slate-400 dark:text-slate-500 uppercase">Efisiensi</div>
                    <div className="text-[10px] font-black text-emerald-600 mt-0.5">94.8%</div>
                  </div>
                </div>

                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-sm text-left space-y-1.5 transition-colors duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[6px] font-black text-slate-700 dark:text-slate-250 uppercase">Monitoring Real-time Mesin</span>
                    <span className="text-[5px] font-extrabold text-[#008d51] uppercase flex items-center gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" /> Normal
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors duration-300">
                    <div style={{ backgroundColor: primaryInput }} className="h-full w-4/5 rounded-full transition-all duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
