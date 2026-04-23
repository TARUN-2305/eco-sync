import { useState, useEffect, useRef } from 'react';

function gini(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  const cumSum = sorted.reduce((acc, v, i) => acc + v * (i + 1), 0);
  return Math.max(0, Math.min(1, (2 * cumSum) / (n * sum) - (n + 1) / n));
}

export function useSimulation() {
  const [staticMetrics, setStaticMetrics] = useState(null);
  const [mode, setModeState] = useState('agentic');
  const [simulationState, setSimulationState] = useState({
    step: 0,
    buses: [],
    loads: [],
    stopQueues: [],
    busActions: {},
    equityGini: 0,
    metrics: { revenue: 0, wait_cost: 0, fuel_cost: 0 },
    history: [],
    logs: []
  });

  const busActionsRef = useRef({});

  // P2-A fix: empty deps array — WebSocket opens ONCE and stays open
  useEffect(() => {
    fetch('http://localhost:8000/api/results')
      .then(res => res.json())
      .then(data => { if (!data.error) setStaticMetrics(data); })
      .catch(err => console.error('CBA fetch error:', err));

    const ws = new WebSocket('ws://localhost:8000/ws/simulation');

    ws.onerror = () => console.error('WebSocket error');
    ws.onclose = () => console.warn('WebSocket closed');

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.error) return;

      if (payload.mode) setModeState(payload.mode);

      if (payload.action_log) {
        busActionsRef.current = {
          ...busActionsRef.current,
          [payload.action_log.bus_id]: payload.action_log.action
        };
      }

      // P4-D: Gini from stop queues
      const queues = (payload.stop_queues || []).map(s => s.queue);
      const equityGini = gini(queues);

      setSimulationState(prev => {
        const newHistory = [...prev.history, {
          step:      payload.step,
          revenue:   payload.metrics.revenue,
          wait_cost: payload.metrics.wait_cost,
          fuel_cost: payload.metrics.fuel_cost,
          // P4-B: bunching in history
          bunching:  payload.action_log?.bunching ?? 0,
        }].slice(-60);

        const newLogs = payload.action_log
          ? [...prev.logs, { step: payload.step, ...payload.action_log }].slice(-50)
          : prev.logs;

        return {
          step:       payload.step,
          buses:      payload.buses,
          loads:      payload.loads,
          stopQueues: payload.stop_queues || [],
          busActions: { ...busActionsRef.current },
          equityGini,
          metrics:    payload.metrics,
          history:    newHistory,
          logs:       newLogs
        };
      });
    };

    return () => ws.close();
  }, []); // ← empty: open once, stay open

  const setModeAndReset = async (newMode) => {
    try {
      await fetch('http://localhost:8000/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
      setModeState(newMode);
      busActionsRef.current = {};
      setSimulationState(prev => ({
        ...prev, history: [], logs: [], busActions: {}, stopQueues: [], equityGini: 0
      }));
    } catch (e) {
      console.error('Failed to reset', e);
    }
  };

  return {
    staticMetrics,
    simulationState,
    mode,
    setMode: setModeAndReset,
    resetSimulation: setModeAndReset
  };
}
