import React from 'react';
import { Settings, RefreshCw, Download } from 'lucide-react';

// P2-D: real JSON export instead of window.print()
async function exportCBA() {
  try {
    const res  = await fetch('http://localhost:8000/api/results');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ecosync_cba_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export failed', e);
    alert('Export failed — is the backend running?');
  }
}

// P4-A: wire arrival rate slider to /api/config
async function updateArrivalScale(value) {
  try {
    await fetch('http://localhost:8000/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arrival_scale: parseFloat(value) })
    });
  } catch (e) {
    console.error('Config update failed', e);
  }
}

export function Controls({ mode, setMode, resetSimulation }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col h-full shadow-lg">
      <div className="flex items-center gap-2 mb-5 shrink-0">
        <Settings className="text-slate-400 w-4 h-4" />
        <h3 className="font-semibold text-slate-200 text-sm">Simulation Controls</h3>
      </div>

      {/* Dispatch Mode */}
      <div className="space-y-2 mb-5">
        <label className="text-xs text-slate-400 uppercase tracking-wider font-medium">Dispatch Mode</label>
        <button
          onClick={() => setMode('static')}
          className={`w-full py-2.5 px-3 text-sm rounded-lg border transition-all text-left flex items-center justify-between
            ${mode === 'static'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/50'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
        >
          <span>Static Timetable</span>
          {mode === 'static' && <span className="h-2 w-2 rounded-full bg-blue-500" />}
        </button>
        <button
          onClick={() => setMode('agentic')}
          className={`w-full py-2.5 px-3 text-sm rounded-lg border transition-all text-left flex items-center justify-between
            ${mode === 'agentic'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
        >
          <span>Agentic AI</span>
          {mode === 'agentic' && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
        </button>
      </div>

      {/* P4-A: Arrival Rate Slider */}
      <div className="mb-5 border-t border-slate-700 pt-4">
        <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">
          Passenger Arrival Rate
        </label>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          defaultValue="1"
          className="w-full accent-emerald-500 cursor-pointer"
          onChange={(e) => updateArrivalScale(e.target.value)}
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0.5× off-peak</span>
          <span>3× peak rush</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2">
        <button
          onClick={() => resetSimulation(mode)}
          className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">Reset Simulation</span>
        </button>
        {/* P2-D: real export */}
        <button
          onClick={exportCBA}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Export CBA (JSON)</span>
        </button>
      </div>
    </div>
  );
}
