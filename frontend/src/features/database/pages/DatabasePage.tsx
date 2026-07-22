import { DatabaseProvider, useDatabaseContext } from '../context/DatabaseContext';
import DatabaseHeader from '../components/DatabaseHeader';
import DatabaseTabNav from '../components/DatabaseTabNav';
import MasterPartsTab from '../components/MasterPartsTab';
import OrderConversionsTab from '../components/OrderConversionsTab';
import LeadersTab from '../components/LeadersTab';

function DatabasePageContent() {
  const {
    pageTab,
    partsRefreshTrigger,
    conversionsRefreshTrigger,
    leadersRefreshTrigger,
  } = useDatabaseContext();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 text-slate-800 dark:text-slate-100 min-h-screen">
      {/* Top Header */}
      <DatabaseHeader />

      {/* Tab Switcher Navigation */}
      <DatabaseTabNav />

      {/* Sub-Feature Tab Rendering */}
      {pageTab === 'parts' ? (
        <MasterPartsTab refreshTrigger={partsRefreshTrigger} />
      ) : pageTab === 'conversions' ? (
        <OrderConversionsTab refreshTrigger={conversionsRefreshTrigger} />
      ) : (
        <LeadersTab refreshTrigger={leadersRefreshTrigger} />
      )}
    </div>
  );
}

export default function DatabasePage() {
  return (
    <DatabaseProvider>
      <DatabasePageContent />
    </DatabaseProvider>
  );
}
