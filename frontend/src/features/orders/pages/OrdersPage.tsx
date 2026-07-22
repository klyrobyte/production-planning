import { Calendar, CalendarClock } from 'lucide-react';
import { OrdersProvider, useOrdersContext } from '../context/OrdersContext';
import OrdersHeader from '../components/OrdersHeader';
import MonthlyForecastTab from '../components/MonthlyForecastTab';

function OrdersPageContent() {
  const { activeTab } = useOrdersContext();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner & Navigation Tabs */}
      <OrdersHeader />

      {/* Tab Contents */}
      {activeTab === 'annual' && (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-16 text-center shadow-inner animate-in fade-in duration-300">
          <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto mb-4 animate-bounce" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 uppercase tracking-widest">
            Annual Production Plan
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Modul pengunggahan dan pemrosesan Annual Forecasting. Sesi penyesuaian target tahunan berjangka panjang
            sedang dalam pengembangan.
          </p>
        </div>
      )}

      {activeTab === 'monthly' && <MonthlyForecastTab />}

      {activeTab === 'daily' && (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-16 text-center shadow-inner animate-in fade-in duration-300">
          <CalendarClock className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto mb-4 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 uppercase tracking-widest">
            Daily Orders Intake
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Modul penerimaan pesanan harian (PO harian) untuk Toyota/Daihatsu dan kalkulasi schedule harian. Fitur
            ini akan dirilis pada fase berikutnya.
          </p>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <OrdersProvider>
      <OrdersPageContent />
    </OrdersProvider>
  );
}
