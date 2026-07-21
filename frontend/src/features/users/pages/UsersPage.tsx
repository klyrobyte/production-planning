import { UserProvider, useUserContext } from '../context/UserContext';
import UserHeader from '../components/UserHeader';
import UserSearchBar from '../components/UserSearchBar';
import UserTable from '../components/UserTable';
import UserAddModal from '../components/UserAddModal';
import UserEditModal from '../components/UserEditModal';
import UserDeleteModal from '../components/UserDeleteModal';

function UsersPageContent() {
  const { successMsg } = useUserContext();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <UserHeader />

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-750 dark:text-emerald-450 text-left animate-in fade-in slide-in-from-top-1 duration-200">
          {successMsg}
        </div>
      )}

      {/* Search Input Filter */}
      <UserSearchBar />

      {/* Table List */}
      <UserTable />

      {/* Modals */}
      <UserAddModal />
      <UserEditModal />
      <UserDeleteModal />
    </div>
  );
}

export default function UsersPage() {
  return (
    <UserProvider>
      <UsersPageContent />
    </UserProvider>
  );
}
