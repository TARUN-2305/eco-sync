import os
import json
import numpy as np
import gymnasium as gym
from stable_baselines3 import PPO

# Import custom environment
from test_env import BengaluruBusEnv

def run_simulation(env, model=None, num_episodes=250):
    total_wait_costs = []
    total_fuel_costs = []
    total_revenues = []
    bunching_events_count = 0
    
    step_metrics = []
    stop_wait_times = {i: [] for i in range(env.num_stops)}
    
    for episode in range(num_episodes):
        obs, info = env.reset()
        done = False
        
        ep_wait_cost = 0
        ep_fuel_cost = 0
        ep_revenue = 0
        
        step_idx = 0
        while not done:
            if model is None:
                action = 0
            else:
                action, _states = model.predict(obs, deterministic=True)
                
            obs, reward, done, truncated, info = env.step(action)
            
            w = info.get('wait_cost', 0.0)
            f = info.get('fuel_cost', 0.0)
            r = info.get('revenue', 0.0)
            gap = info.get('gap_ahead', 0.0)
            
            ep_wait_cost += w
            ep_fuel_cost += f
            ep_revenue += r
            
            if gap <= 1:
                bunching_events_count += 1
                
            bus_id = env.current_step % env.num_buses
            stop_id = env.bus_pos[bus_id]
            stop_wait_times[stop_id].append(w)
            
            if episode == 0:
                step_metrics.append({'wait': w, 'fuel': f, 'revenue': r})
            else:
                if step_idx < len(step_metrics):
                    step_metrics[step_idx]['wait'] += w
                    step_metrics[step_idx]['fuel'] += f
                    step_metrics[step_idx]['revenue'] += r
                
            step_idx += 1
            
        total_wait_costs.append(ep_wait_cost)
        total_fuel_costs.append(ep_fuel_cost)
        total_revenues.append(ep_revenue)

    avg_wait_per_stop = []
    for stop_id, waits in stop_wait_times.items():
        if waits:
            avg_wait_per_stop.append(np.mean(waits))
        else:
            avg_wait_per_stop.append(0.0)
    equity_index = float(np.std(avg_wait_per_stop))

    time_series = []
    for i, m in enumerate(step_metrics):
        time_series.append({
            'time_step': i,
            'wait_cost': float(m['wait'] / num_episodes),
            'fuel_cost': float(m['fuel'] / num_episodes),
            'revenue': float(m['revenue'] / num_episodes)
        })

    return {
        'avg_wait_cost': float(np.mean(total_wait_costs)),
        'avg_fuel_cost': float(np.mean(total_fuel_costs)),
        'avg_revenue': float(np.mean(total_revenues)),
        'bunching_events': int(bunching_events_count),
        'equity_index': float(equity_index),
        'stop_performance': [float(x) for x in avg_wait_per_stop],
        'time_series': time_series
    }

def main():
    print("Initializing environment...")
    env = BengaluruBusEnv()
    
    print("Loading Agentic PPO model...")
    model_path = "models/eco_sync_ppo"
    if os.path.exists(model_path + ".zip"):
        model = PPO.load(model_path)
    else:
        print("Model not found! Run Module 3 first.")
        return
        
    print("Running Group A (Static Baseline) - 250 episodes...")
    static_results = run_simulation(env, model=None, num_episodes=250)
    
    print("Running Group B (Agentic) - 250 episodes...")
    agentic_results = run_simulation(env, model=model, num_episodes=250)
    
    static_env_val = static_results['avg_revenue'] - (static_results['avg_wait_cost'] + static_results['avg_fuel_cost'])
    agentic_env_val = agentic_results['avg_revenue'] - (agentic_results['avg_wait_cost'] + agentic_results['avg_fuel_cost'])
    
    # P2-C fix: positive = agentic is cheaper = good
    efficiency_gain = ((static_env_val - agentic_env_val) / abs(static_env_val)) * 100 if static_env_val != 0 else 0
    
    results = {
        'summary': {
            'static': {
                'env': static_env_val,
                'wait_cost': static_results['avg_wait_cost'],
                'fuel_cost': static_results['avg_fuel_cost'],
                'revenue': static_results['avg_revenue'],
                'bunching_events': static_results['bunching_events'],
                'equity_index': static_results['equity_index']
            },
            'agentic': {
                'env': agentic_env_val,
                'wait_cost': agentic_results['avg_wait_cost'],
                'fuel_cost': agentic_results['avg_fuel_cost'],
                'revenue': agentic_results['avg_revenue'],
                'bunching_events': agentic_results['bunching_events'],
                'equity_index': agentic_results['equity_index']
            },
            'efficiency_gain_percent': efficiency_gain,
            'total_savings_rupees': (static_results['avg_wait_cost'] + static_results['avg_fuel_cost']) - (agentic_results['avg_wait_cost'] + agentic_results['avg_fuel_cost'])
        },
        'time_series': {
            'static': static_results['time_series'],
            'agentic': agentic_results['time_series']
        },
        'stop_performance': {
            'static': static_results['stop_performance'],
            'agentic': agentic_results['stop_performance']
        }
    }
    
    os.makedirs("results", exist_ok=True)
    with open("results/simulation_results.json", "w") as f:
        json.dump(results, f, indent=4)
        
    print("\n--- Simulation Complete ---")
    print(f"Static ENV:    Rs.{static_env_val:.2f}")
    print(f"Agentic ENV:   Rs.{agentic_env_val:.2f}")
    print(f"Efficiency Gain: {efficiency_gain:.2f}%")
    print("Results saved to results/simulation_results.json")

if __name__ == "__main__":
    main()
