import React from 'react';
import { Factory, Info } from 'lucide-react';
import { useProduction, productionService } from '../../context/ProductionContext';

export const PaintingFukaControl: React.FC = () => {
  const { paintingData } = useProduction();

  return (
    <section>
      <div className="flex flex-col gap-6 mt-4">
        {paintingData.map((plantGroup, i) => (
          <div
            key={i}
            className="p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Factory className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <h4 className="font-bold text-slate-700 dark:text-white text-sm">{plantGroup.plant}</h4>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {plantGroup.lines.map((line, j) => (
                <div key={j} className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-slate-800 dark:text-white">{line.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest ${productionService.getStatusText(
                            line.status
                          )}`}
                        >
                          {line.status}
                        </span>
                      </div>
                      {line.note && (
                        <div className="flex items-start gap-1.5 mt-2 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[10px] p-2 rounded border border-blue-100 dark:border-blue-900/30 font-medium">
                          <Info className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{line.note}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="flex items-baseline gap-1 justify-start sm:justify-end">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">
                          {line.fuka.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Hr/Day</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mt-1">
                        FUKA Load
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden mt-3 relative">
                    <div
                      className={`h-full ${productionService.getStatusColor(line.status)}`}
                      style={{ width: `${(line.fuka / line.maxFuka) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 left-[66%] w-0.5 bg-slate-400/50 dark:bg-slate-700"
                      title="Teiji (Default Capacity)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
