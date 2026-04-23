import json
import os

notebooks_dir = r"C:\Users\tarun\.gemini\antigravity\scratch\eco-sync\notebooks"

descriptions = {
    "01_data_pipeline.ipynb": "### Phase A: Data Engineering & Graph Extraction\n\n**Methodology:**\nThis notebook is responsible for constructing the foundational data layer. We utilize `osmnx` to query OpenStreetMap and extract the actual road network for Bengaluru's Outer Ring Road (ORR). By operating on real geospatial bounds rather than a synthetic grid, we ensure the simulation's transit graph mirrors real-world traffic topologies. A synthetic fallback is also provided to generate deterministic arrival matrices and traffic delay maps when live APIs are unavailable.",
    "02_bus_simulator.ipynb": "### Phase A: The Simulation Environment\n\n**Methodology:**\nHere, we bridge the gap between static graph data and Reinforcement Learning by wrapping the core simulator logic in a standard `gymnasium` (`gym.Env`) interface. \n\n**Economic Design:**\nThe critical innovation in `BengaluruBusEnv` is its Economic Reward Function. Rather than naively minimizing headways, the agent is penalized for Wait Costs (lost passenger utility) and Fuel Costs (operational inefficiency), while being rewarded for Revenue (passenger throughput). This forces the RL agent to discover policies that balance rider equity with transit agency profitability.",
    "03_rl_agent.ipynb": "### Phase B: Reinforcement Learning (PPO)\n\n**Methodology:**\nWith the `BengaluruBusEnv` established, we deploy Proximal Policy Optimization (PPO) using `stable-baselines3`. PPO is chosen for its sample efficiency and stability in continuous/discrete action spaces. The agent plays thousands of simulated episodes, iteratively learning when to dispatch, hold, or skip stops to maximize the long-term economic reward (thereby inherently mitigating bus bunching).",
    "04_llm_reasoning.ipynb": "### Phase B: The LLM Reasoning Engine\n\n**Methodology:**\nA pure RL policy acts as a 'black box'. For a public transit authority to trust an AI dispatch system, its decisions must be interpretable. This notebook implements an LLM layer (via Groq/Llama3) that translates the raw economic state and the PPO agent's action integer into a human-readable justification. This ensures transparent, accountable AI governance.",
    "05_economics_analysis.ipynb": "### Phase B: Cost-Benefit Analysis (CBA)\n\n**Methodology:**\nTo quantify the value of the Agentic AI approach, we run a comparative Monte Carlo simulation (500 episodes). \n\nWe benchmark the trained PPO agent against a 'Static Timetable' baseline. By capturing the aggregate Wait Costs, Fuel Costs, and total bunching events across both groups, we calculate the Net Efficiency Gain (%). The resulting `simulation_results.json` artifact powers the live presentation dashboard."
}

for nb_name, desc in descriptions.items():
    nb_path = os.path.join(notebooks_dir, nb_name)
    if os.path.exists(nb_path):
        with open(nb_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # Create new markdown cell
        new_cell = {
            "cell_type": "markdown",
            "metadata": {},
            "source": [desc]
        }
        
        # Check if already has a markdown cell at the top
        if len(data.get("cells", [])) > 0 and data["cells"][0]["cell_type"] == "markdown":
            data["cells"][0] = new_cell
        else:
            data["cells"].insert(0, new_cell)
            
        with open(nb_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=1)
        print(f"Updated {nb_name}")
    else:
        print(f"Not found: {nb_name}")
