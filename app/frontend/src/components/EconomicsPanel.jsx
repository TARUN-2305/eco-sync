import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export function EconomicsPanel({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 11 }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            color: '#f1f5f9',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue ₹" />
        <Line type="monotone" dataKey="wait_cost" stroke="#ef4444" strokeWidth={2} dot={false} name="Wait Cost ₹" />
        <Line type="monotone" dataKey="fuel_cost" stroke="#f59e0b" strokeWidth={2} dot={false} name="Fuel Cost ₹" />
      </LineChart>
    </ResponsiveContainer>
  );
}
