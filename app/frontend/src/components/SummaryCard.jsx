import React from 'react';
import { Activity, TrendingUp, Scale } from 'lucide-react';

export function SummaryCard({ metrics, equityGini }) {
  // P2-B: safe guard against missing CBA data
  if (!metrics?.summary?.static || !metrics?.summary?.agentic) {
    return (
      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 h-full flex items-center justify-center text-center">
        <div>
          <div className="text-3xl mb-2">📊</div>
          <div className="text-slate-400 text-sm font-medium">CBA data not available.</div>
          <div className="text-slate-500 text-xs mt-1">Run <code className="bg-slate-900 px-1 rounded">analyze_economics.py</code> first.</div>
        </div>
      </div>
    );
  }

  const { static: s, agentic: a, efficiency_gain_percent, total_savings_rupees } = metrics.summary;
  const gainIsPositive = efficiency_gain_percent >= 0;

  return (
    <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 h-full flex flex-col justify-between">
      <h3 className="text-sm font-bold mb-3 text-slate-100 flex items-center gap-2 uppercase tracking-wider">
        <Activity className="text-blue-400 w-4 h-4" /> Cost-Benefit Analysis
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Static ENV</div>
          <div className="text-xl font-bold text-slate-200">₹{s.env.toFixed(0)}</div>
        </div>
        <div className="bg-slate-900 p-3 rounded-lg border border-emerald-900/40">
          <div className="text-xs text-slate-400 mb-1">Agentic ENV</div>
          <div className="text-xl font-bold text-emerald-400">₹{a.env.toFixed(0)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 mb-3">
        <div className="p-2 bg-blue-500/20 rounded-full">
          <TrendingUp className="text-blue-400 w-4 h-4" />
        </div>
        <div>
          <div className="text-xs text-slate-400">Efficiency Gain</div>
          <div className={`text-lg font-bold ${gainIsPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {gainIsPositive ? '+' : ''}{efficiency_gain_percent.toFixed(2)}%
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-slate-400">Savings</div>
          <div className="text-sm font-semibold text-slate-200">₹{total_savings_rupees?.toFixed(0) ?? '—'}</div>
        </div>
      </div>

      {/* P4-D: Live equity Gini index from stop queue distribution */}
      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div className="p-2 bg-purple-500/20 rounded-full">
          <Scale className="text-purple-400 w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-400 mb-1">
            Stop Queue Equity (Gini) — 0=perfect, 1=unfair
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((equityGini ?? 0) * 100, 100)}%` }}
            />
          </div>
        </div>
        <div className={`text-sm font-bold ml-2 ${(equityGini ?? 0) < 0.3 ? 'text-emerald-400' : (equityGini ?? 0) < 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
          {(equityGini ?? 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
