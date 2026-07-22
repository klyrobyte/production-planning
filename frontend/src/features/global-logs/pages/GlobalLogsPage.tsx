import { GlobalLogsProvider } from '../context/GlobalLogsContext';
import GlobalLogsHeader from '../components/GlobalLogsHeader';
import GlobalLogsFilters from '../components/GlobalLogsFilters';
import GlobalLogsTable from '../components/GlobalLogsTable';

export default function GlobalLogsPage() {
  return (
    <GlobalLogsProvider>
      <div className="space-y-6">
        <GlobalLogsHeader />
        <GlobalLogsFilters />
        <GlobalLogsTable />
      </div>
    </GlobalLogsProvider>
  );
}
