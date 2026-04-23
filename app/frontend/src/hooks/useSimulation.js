import { useState, useEffect, useRef } from 'react';

export function useSimulation() {
  const [staticMetrics, setStaticMetrics] = useState(null);
  const [mode, setModeState] = useState('agentic');
  const [simulationState, setSimulationState] = useState({
    step: 0,
    buses: [],
    loads: [],
    stopQueues: [],    // { stop, queue } — waiting passengers per stop
    busActions: {},    // { busId -> action } — last action taken by each bus
    metrics: { revenue: 0, wait_cost: 0, fuel_cost: 0 },
    history: [],
    logs: []
  });

  // Use a ref to hold the latest busActions so we can merge without stale closures
  const busActionsRef = useRef({});

  useEffect(() => {
    fetch('http://localhost:8000/api/results')
      .then(res => res.json())
      .then(data => { if (!data.error) setStaticMetrics(data); })
      .catch(err => console.error(err));

    const ws = new WebSocket('ws://localhost:8000/ws/simulation');

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.error) return;

      if (payload.mode && payload.mode !== mode) {
        setModeState(payload.mode);
      }

      // Update bus action tracker
      if (payload.action_log) {
        busActionsRef.current = {
          ...busActionsRef.current,
          [payload.action_log.bus_id]: payload.action_log.action
        };
      }

      setSimulationState(prev => {
        const newHistory = [...prev.history, {
          step: payload.step,
          revenue: payload.metrics.revenue,
          wait_cost: payload.metrics.wait_cost,
          fuel_cost: payload.metrics.fuel_cost
        }].slice(-60);

        const newLogs = payload.action_log
          ? [...prev.logs, { step: payload.step, ...payload.action_log }].slice(-50)
          : prev.logs;

        return {
          step: payload.step,
          buses: payload.buses,
          loads: payload.loads,
          stopQueues: payload.stop_queues || [],
          busActions: { ...busActionsRef.current },
          metrics: payload.metrics,
          history: newHistory,
          logs: newLogs
        };
      });
    };

    return () => ws.close();
  }, [mode]);

  const setModeAndReset = async (newMode) => {
    try {
      await fetch('http://localhost:8000/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
      setModeState(newMode);
      busActionsRef.current = {};
      setSimulationState(prev => ({ ...prev, history: [], logs: [], busActions: {}, stopQueues: [] }));
    } catch (e) {
      console.error("Failed to reset", e);
    }
  };

  return { staticMetrics, simulationState, mode, setMode: setModeAndReset, resetSimulation: setModeAndReset };
}
