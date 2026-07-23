import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useProduction } from '../context/ProductionContext';
import { ProductionHeader } from '../components/fuka/ProductionHeader';
import { MachineStatusLegend } from '../components/fuka/MachineStatusLegend';
import { ResinFukaControl } from '../components/fuka/ResinFukaControl';
import { PaintingFukaControl } from '../components/fuka/PaintingFukaControl';
import { MachineDetailModal } from '../components/modals/MachineDetailModal';

export default function ProductionPage() {
  const { machine: urlMachine, tab: urlTab } = useParams<{ machine: string; tab: string }>();
  const navigate = useNavigate();

  const activePortal = useAuthStore((state) => state.activePortal);
  const activeMachineCode = useAuthStore((state) => state.activeMachineCode);
  const isOperatorAuthenticated = useAuthStore((state) => state.isOperatorAuthenticated);
  const logoutOperator = useAuthStore((state) => state.logoutOperator);

  if (activePortal === 'member') {
    if (!isOperatorAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (!urlMachine || urlMachine !== activeMachineCode) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  const { activeTab, selectedDate, machinesData, allMachinesList } = useProduction();

  const handleNavigateMachine = (direction: 'next' | 'prev') => {
    if (!urlMachine) return;
    const currentIndex = allMachinesList.findIndex((m) => m.code === urlMachine);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allMachinesList.length;
    } else {
      newIndex = (currentIndex - 1 + allMachinesList.length) % allMachinesList.length;
    }

    const target = allMachinesList[newIndex];
    navigate(`/production/${target.code}/${urlTab || 'pattern'}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header & Tab Switcher */}
      <ProductionHeader />

      {/* Operational Machine Status Legend */}
      <MachineStatusLegend />

      {/* Main Tab Content */}
      {activeTab === 'resin' && <ResinFukaControl />}
      {activeTab === 'painting' && <PaintingFukaControl />}

      {/* Machine Execution / Pattern Detail Modal */}
      {urlMachine && (() => {
        const mcObj = (machinesData || []).find((m) => m.code === urlMachine);
        if (!mcObj) return null;
        return (
          <MachineDetailModal
            machine={mcObj.name}
            tonnage={mcObj.tonnage || '2500'}
            factory={mcObj.factory_name || mcObj.factory_code || ''}
            onClose={() => {
              if (activePortal === 'member') {
                logoutOperator();
                navigate('/login');
              } else {
                navigate('/production');
              }
            }}
            onNavigate={activePortal === 'member' ? undefined : handleNavigateMachine}
            initialDate={selectedDate}
          />
        );
      })()}
    </div>
  );
}