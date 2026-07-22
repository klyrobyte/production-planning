import { useNavigate, useParams } from 'react-router-dom';
import { Factory } from 'lucide-react';
import { BoardMachineDetailModal } from '../components/modals/BoardMachineDetailModal';
import { BoardProvider, useBoardContext } from '../context/BoardContext';
import { boardService } from '../context/BoardService';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useProduction } from '../../production/context/ProductionContext';
import BoardHeader from '../components/BoardHeader';
import BoardFactoryRow from '../components/BoardFactoryRow';

function BoardPageContent() {
  const {
    factoryRows,
    maxCols,
    selectedMachine,
    setSelectedMachine,
    timeStr,
    dateStr,
    selectedDate,
    activePortal
  } = useBoardContext();

  const logoutDevice = useAuthStore(state => state.logoutDevice);
  const userRole = useAuthStore(state => state.user?.role);
  const navigate = useNavigate();
  const { machine: urlMachine, tab: urlTab } = useParams<{ machine?: string; tab?: string }>();
  const { allMachinesList } = useProduction();

  const handleLogout = () => {
    logoutDevice();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleMachineClick = (machineId: string, tonnage: string, factoryName: string) => {
    setSelectedMachine({ machine: machineId, tonnage, factory: factoryName });
    navigate(`/board/${machineId}/${urlTab || 'pattern'}`);
  };

  const handleModalClose = () => {
    setSelectedMachine(null);
    navigate('/board');
  };

  const handleTabChange = (newTab: string) => {
    const activeMachine = urlMachine || selectedMachine?.machine;
    if (activeMachine) {
      navigate(`/board/${activeMachine}/${newTab}`);
    }
  };

  const handleNavigateMachine = (direction: 'next' | 'prev') => {
    const activeMachine = urlMachine || selectedMachine?.machine;
    if (!activeMachine) return;

    const currentIndex = allMachinesList.findIndex(m => m.code === activeMachine || m.id === activeMachine);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allMachinesList.length;
    } else {
      newIndex = (currentIndex - 1 + allMachinesList.length) % allMachinesList.length;
    }

    const target = allMachinesList[newIndex];
    setSelectedMachine({ machine: target.code, tonnage: target.tonnage, factory: target.factory });
    navigate(`/board/${target.code}/${urlTab || 'pattern'}`);
  };

  const activeMachineId = urlMachine || selectedMachine?.machine;
  const matchedMachine = allMachinesList.find(m => m.code === activeMachineId || m.id === activeMachineId);
  const resolvedFactory = selectedMachine?.factory || matchedMachine?.factory || '';
  const resolvedTonnage = selectedMachine?.tonnage || matchedMachine?.tonnage || '';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 select-none overflow-hidden">
      <BoardHeader
        timeStr={timeStr}
        dateStr={dateStr}
        userRole={userRole}
        onLogout={handleLogout}
        onBack={handleBack}
      />

      <main className="flex-1 min-h-0 p-3 flex flex-col gap-3 overflow-y-auto">
        {factoryRows.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Factory className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-bold uppercase tracking-widest">No factories available</p>
          </div>
        )}

        {factoryRows.map(fact => (
          <BoardFactoryRow
            key={fact.name}
            factoryRow={fact}
            maxCols={maxCols}
            resolveStatus={boardService.resolveStatus}
            onMachineClick={handleMachineClick}
          />
        ))}
      </main>

      {activeMachineId && (
        <BoardMachineDetailModal
          machine={matchedMachine?.id || activeMachineId}
          machineKey={activeMachineId}
          tonnage={resolvedTonnage}
          factory={resolvedFactory}
          activeTab={urlTab || 'pattern'}
          onTabChange={handleTabChange}
          onClose={handleModalClose}
          onNavigate={activePortal === 'member' ? undefined : handleNavigateMachine}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}

export default function BoardPage() {
  return (
    <BoardProvider>
      <BoardPageContent />
    </BoardProvider>
  );
}
