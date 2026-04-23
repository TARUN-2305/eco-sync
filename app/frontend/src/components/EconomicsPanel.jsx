import React from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: 12,
};

export function EconomicsPanel({ data, staticMetrics }) {
  // P4-C: build static reference series from pre-computed CBA time series
  const staticSeries = staticMetrics?.time_series?.static ?? [];

  // Merge live agentic history with static baseline by time_step index
  const merged = data.map((d, i) => ({
    ...d,
    static_wait: staticSeries[i]?.wait_cost ?? null,
  }));

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* P4-C: Cost chart — agentic live + static baseline overlay */}
      <div className="flex-1 min-h-0">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Economic Cost (₹ / step) — Agentic vs Static baseline
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="revenue"   stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue ₹" />
            <Line type="monotone" dataKey="wait_cost" stroke="#ef4444" strokeWidth={2} dot={false} name="Wait Cost ₹" />
            <Line type="monotone" dataKey="fuel_cost" stroke="#f59e0b" strokeWidth={2} dot={false} name="Fuel Cost ₹" />
            {/* P4-C: Static baseline reference */}
            <Line
              type="monotone" dataKey="static_wait"
              stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2"
              dot={false} name="Static wait ₹ (ref)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* P4-B: Bunching event bar chart */}
      <div className="h-36 shrink-0">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Bunching Events per Step
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 11 }} allowDecimals={false} domain={[0, 1]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="bunching" fill="#ef4444" name="Bunching event" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
