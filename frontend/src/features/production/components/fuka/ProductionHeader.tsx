import React from 'react';
import { useProduction } from '../../context/ProductionContext';
import { InjectionMoldingIcon, PaintingRobotIcon } from '../shared/ProductionIcons';

export const ProductionHeader: React.FC = () => {
  const { activeTab, setActiveTab } = useProduction();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Machine FUKA Control</h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">
          Manage operation time and load capacity
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg overflow-x-auto max-w-full shrink-0 h-10 items-center">
          <button
            onClick={() => setActiveTab('resin')}
            className={`h-8 px-4 text-sm font-bold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'resin'
              ? 'bg-white dark:bg-slate-950 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <InjectionMoldingIcon className="w-5 h-5" /> Resin Injection
          </button>
          <button
            onClick={() => setActiveTab('painting')}
            className={`h-8 px-4 text-sm font-bold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'painting'
              ? 'bg-white dark:bg-slate-950 text-rose-700 dark:text-rose-450 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <PaintingRobotIcon className="w-5 h-5" /> Painting
          </button>
        </div>
      </div>
    </div>
  );
};
