import { MachineProvider, useMachineContext } from '../context/MachineContext';
import MachineHeader from '../components/MachineHeader';
import MachineSearchBar from '../components/MachineSearchBar';
import MachineTable from '../components/MachineTable';
import MachineFormModal from '../components/MachineFormModal';
import MachineDeleteModal from '../components/MachineDeleteModal';

function MachinesPageContent() {
  const { successMsg } = useMachineContext();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <MachineHeader />

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-750 dark:text-emerald-450 text-left animate-in fade-in slide-in-from-top-1 duration-200">
          {successMsg}
        </div>
      )}

      {/* Search & Filter Bar */}
      <MachineSearchBar />

      {/* Table List */}
      <MachineTable />

      {/* Form Modal (Add / Edit) */}
      <MachineFormModal />

      {/* Confirm Delete Modal */}
      <MachineDeleteModal />
    </div>
  );
}

export default function MachinesPage() {
  return (
    <MachineProvider>
      <MachinesPageContent />
    </MachineProvider>
  );
}
