import React, { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

export function AgentFeed({ logs }) {
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg border border-slate-700 flex flex-col overflow-hidden shadow-lg">
      <div className="p-3 border-b border-slate-800 bg-slate-800 flex items-center gap-2 shrink-0">
        <Terminal className="text-emerald-400 w-5 h-5" />
        <h3 className="font-semibold text-slate-200 text-sm">Agent Reasoning Feed</h3>
      </div>
      <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-sm text-center mt-4">Waiting for agent logs...</div>
        ) : (
          logs.map((log, i) => {
            let actionColor = "text-emerald-400";
            let actionBadge = "bg-emerald-400/10 border-emerald-400/20";
            if (log.action === 1) {
              actionColor = "text-blue-400";
              actionBadge = "bg-blue-400/10 border-blue-400/20";
            } else if (log.action === 2) {
              actionColor = "text-orange-400";
              actionBadge = "bg-orange-400/10 border-orange-400/20";
            }

            return (
              <div key={i} className="text-sm bg-slate-800 rounded-md p-3 border border-slate-700 shadow-sm transition-all duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-slate-400 text-xs">Step {log.step} | Bus {log.bus_id}</span>
                  <span className={`px-2 py-0.5 rounded border text-xs font-bold ${actionColor} ${actionBadge}`}>
                    {log.action === 0 ? "PROCEED" : log.action === 1 ? "HOLD" : "SKIP STOP"}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-3 text-xs">{log.explanation}</p>
                <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                  <span className="text-slate-500 text-xs">Net Impact:</span>
                  <span className={`font-mono text-xs font-semibold ${log.reward >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {log.reward >= 0 ? "+" : ""}₹{log.reward.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
