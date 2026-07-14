import { useState } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  CalendarClock, 
  LayoutGrid
} from 'lucide-react';
import MonthlyForecastTab from '../components/MonthlyForecastTab';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'annual' | 'monthly' | 'daily'>('monthly');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight text-white">Order Management Workbench</h2>
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Convert customer daily orders and monthly forecast to shopfloor schedules
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl w-full max-w-lg border border-slate-200/50 dark:border-slate-800/40 shadow-inner select-none">
        {[
          { id: 'annual', label: 'Annual Plan', icon: Calendar },
          { id: 'monthly', label: 'Monthly Forecast', icon: CalendarDays },
          { id: 'daily', label: 'Daily Orders', icon: CalendarClock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-md border border-slate-200/20 dark:border-slate-700/35'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/25'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'annual' && (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-16 text-center shadow-inner animate-in fade-in duration-300">
          <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto mb-4 animate-bounce" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 uppercase tracking-widest">Annual Production Plan</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Modul pengunggahan dan pemrosesan Annual Forecasting. Sesi penyesuaian target tahunan berjangka panjang sedang dalam pengembangan.
          </p>
        </div>
      )}

      {activeTab === 'monthly' && <MonthlyForecastTab />}

      {activeTab === 'daily' && (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-16 text-center shadow-inner animate-in fade-in duration-300">
          <CalendarClock className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto mb-4 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 uppercase tracking-widest">Daily Orders Intake</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Modul penerimaan pesanan harian (PO harian) untuk Toyota/Daihatsu dan kalkulasi schedule harian. Fitur ini akan dirilis pada fase berikutnya.
          </p>
        </div>
      )}

    </div>
  );
}
