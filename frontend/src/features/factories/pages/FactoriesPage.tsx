import { FactoryProvider, useFactoryContext } from '../context/FactoryContext';
import FactoryHeader from '../components/FactoryHeader';
import FactorySearchBar from '../components/FactorySearchBar';
import FactoryTable from '../components/FactoryTable';
import FactoryFormModal from '../components/FactoryFormModal';
import FactoryDeleteModal from '../components/FactoryDeleteModal';

function FactoriesPageContent() {
  const { successMsg } = useFactoryContext();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <FactoryHeader />

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 text-left animate-in fade-in slide-in-from-top-1 duration-200">
          {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <FactorySearchBar />

      {/* Table List */}
      <FactoryTable />

      {/* Form Modal (Add / Edit) */}
      <FactoryFormModal />

      {/* Confirm Delete Modal */}
      <FactoryDeleteModal />
    </div>
  );
}

export default function FactoriesPage() {
  return (
    <FactoryProvider>
      <FactoriesPageContent />
    </FactoryProvider>
  );
}
