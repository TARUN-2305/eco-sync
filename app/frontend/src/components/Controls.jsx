import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';

export function Controls({ mode, setMode, resetSimulation }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col h-full shadow-lg">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Settings className="text-slate-400 w-5 h-5" />
        <h3 className="font-semibold text-slate-200 text-sm">Simulation Controls</h3>
      </div>
      
      <div className="space-y-6 flex-1">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block font-medium">Dispatch Mode</label>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setMode('static')}
              className={`w-full py-2.5 px-3 text-sm rounded-lg border transition-all text-left flex items-center justify-between ${mode === 'static' ? 'bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
            >
              <span>Static Timetable</span>
              {mode === 'static' && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
            </button>
            <button 
              onClick={() => setMode('agentic')}
              className={`w-full py-2.5 px-3 text-sm rounded-lg border transition-all text-left flex items-center justify-between ${mode === 'agentic' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
            >
              <span>Agentic AI</span>
              {mode === 'agentic' && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
            </button>
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-700">
             <div className="text-xs text-slate-500 mb-2">Metrics tracking will reset on mode change or manual reset.</div>
        </div>
      </div>

      <button 
        onClick={() => resetSimulation(mode)}
        className="w-full mt-auto py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600 shadow-sm"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="text-sm font-medium">Reset Environment</span>
      </button>
      <button 
        onClick={() => window.print()}
        className="w-full mt-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600 no-print"
      >
        <span className="text-sm font-medium">Export CBA Report (PDF)</span>
      </button>
    </div>
  );
}
