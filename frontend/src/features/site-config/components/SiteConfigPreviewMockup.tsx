import { Layout } from 'lucide-react';
import { useSiteConfigContext } from '../context/SiteConfigContext';

export default function SiteConfigPreviewMockup() {
  const {
    primaryInput,
    secondaryInput,
    navbarInput,
    titleInput,
    logoInput,
  } = useSiteConfigContext();

  return (
    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <Layout className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
        <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-350">
          Preview Layout Real-time
        </span>
      </div>

      {/* Interactive Layout Mockup */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-950 flex aspect-video w-full select-none">
        {/* Sidebar Mock */}
        <div
          style={{ backgroundColor: secondaryInput }}
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
              <span className="text-[7px] font-black uppercase tracking-wide truncate">
                {titleInput || 'PT. SUGITY'}
              </span>
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
  );
}
