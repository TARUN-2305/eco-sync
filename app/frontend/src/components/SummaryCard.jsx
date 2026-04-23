import React from 'react';
import { Activity, IndianRupee, TrendingUp } from 'lucide-react';

export function SummaryCard({ metrics }) {
  if (!metrics) return <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 animate-pulse h-full">Loading...</div>;

  const { summary } = metrics;
  const { static: s, agentic: a, efficiency_gain_percent, total_savings_rupees } = summary;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-full flex flex-col justify-center">
      <h3 className="text-xl font-bold mb-6 text-slate-100 flex items-center gap-2">
        <Activity className="text-blue-400" />
        Cost-Benefit Analysis
      </h3>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <div className="text-sm text-slate-400">Static (ENV)</div>
            <div className="text-2xl font-bold text-slate-200">₹{s.env.toFixed(2)}</div>
          </div>
          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <div className="text-sm text-slate-400">Agentic (ENV)</div>
            <div className="text-2xl font-bold text-emerald-400">₹{a.env.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900 p-4 rounded border border-slate-800">
          <div className="p-3 bg-blue-500/20 rounded-full">
            <TrendingUp className="text-blue-400" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Efficiency Gain</div>
            <div className="text-xl font-bold text-blue-400">{efficiency_gain_percent.toFixed(2)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
