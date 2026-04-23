import json
import os

master = {
    'cells': [], 
    'metadata': {
        'accelerator': 'GPU',
        'colab': {
            'gpuType': 'T4',
            'name': 'ECO_SYNC_Master.ipynb'
        },
        'kernelspec': {
            'display_name': 'Python 3',
            'name': 'python3'
        }
    }, 
    'nbformat': 4, 
    'nbformat_minor': 5
}

def add_md(text):
    master['cells'].append({
        'cell_type': 'markdown',
        'metadata': {},
        'source': [text]
    })

def add_code(text):
    master['cells'].append({
        'cell_type': 'code',
        'execution_count': None,
        'metadata': {},
        'outputs': [],
        'source': [text]
    })

# --- SETUP ---
add_md('# 🚌 ECO-SYNC: Master Colab Pipeline\\n\\nRun this entire notebook from top to bottom on a T4 GPU.')
add_code('!pip install gymnasium stable-baselines3 osmnx groq python-dotenv kaggle')
add_code('''# Load Secrets securely from Google Colab
import os
try:
    from google.colab import userdata
    # Groq API Key
    os.environ["GROQ_API_KEY"] = userdata.get("GROQ_API_KEY")
    print("✅ GROQ_API_KEY loaded successfully.")
    
    # Kaggle API Keys
    os.environ["KAGGLE_USERNAME"] = userdata.get("KAGGLE_USERNAME")
    os.environ["KAGGLE_KEY"] = userdata.get("KAGGLE_KEY")
    print("✅ Kaggle credentials loaded successfully.")
    
    # Example: Download a Kaggle dataset 
    # !kaggle datasets download -d <your-dataset-name> --unzip -p ./data/raw
except Exception as e:
    print(f"⚠️ Warning: Could not load secrets from Colab. Ensure they are set in the sidebar. Error: {e}")
''')

# --- PHASE 0: BUS BUNCHING VISUALIZATION ---
add_md('## Phase 0: The Bus Bunching Phenomenon (Visualization)\\n\\nBefore diving into the data, let us visualize why bus bunching occurs. This polar plot simulates 4 buses. If one gets slightly delayed, it encounters more passengers, causing further delays, while the bus behind it catches up.')
add_code('''import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from IPython.display import HTML

# --- Simulation Parameters ---
NUM_BUSES = 4
ROUTE_LENGTH = 360  # Represented as degrees in a circle
NOMINAL_SPEED = 2.0 # Base speed
DELAY_FACTOR = 0.05 # How much speed drops per unit of gap (simulating passenger boarding)

# Initial setup: perfectly spaced buses
positions = np.linspace(0, ROUTE_LENGTH, NUM_BUSES, endpoint=False)
colors = ['green', 'blue', 'orange', 'red']

# Introduce a slight initial delay to Bus 0 to trigger the bunching cascade
positions[0] -= 10 

# --- Setup the Plot ---
fig, ax = plt.subplots(figsize=(6, 6), subplot_kw={'projection': 'polar'})
ax.set_theta_zero_location("N")
ax.set_theta_direction(-1) # Clockwise
ax.set_rticks([]) # Hide radial ticks
ax.set_yticklabels([])
ax.set_title("Bus Bunching Phenomenon", va='bottom')

# Draw the route
route_circle = plt.Circle((0, 0), 1, transform=ax.transData._b, color='gray', fill=False, linewidth=2, alpha=0.5)
ax.add_patch(route_circle)

# Initialize bus markers
scat = ax.scatter(np.radians(positions), np.ones(NUM_BUSES), c=colors, s=150, zorder=3)

def update(frame):
    global positions
    
    # Calculate the gap to the bus ahead of it
    # We sort positions to easily find the next bus
    sorted_idx = np.argsort(positions)
    gaps = np.zeros(NUM_BUSES)
    
    for i in range(NUM_BUSES):
        current_bus = sorted_idx[i]
        next_bus = sorted_idx[(i + 1) % NUM_BUSES]
        
        # Calculate distance to next bus, wrapping around the circle
        gap = (positions[next_bus] - positions[current_bus]) % ROUTE_LENGTH
        gaps[current_bus] = gap

    # Update positions based on gap (Larger gap = more passengers = slower speed)
    # The ideal gap is ROUTE_LENGTH / NUM_BUSES (e.g., 90 degrees)
    ideal_gap = ROUTE_LENGTH / NUM_BUSES
    
    speeds = np.zeros(NUM_BUSES)
    for i in range(NUM_BUSES):
        # If gap is larger than ideal, speed decreases (boarding takes longer)
        # If gap is smaller, speed increases (fewer passengers to board)
        speed_modifier = 1.0 - ((gaps[i] - ideal_gap) * DELAY_FACTOR)
        
        # Ensure speed doesn't go negative and has a reasonable max
        speeds[i] = max(0.5, min(NOMINAL_SPEED * speed_modifier, NOMINAL_SPEED * 1.5))
        
        # Move the bus
        positions[i] = (positions[i] + speeds[i]) % ROUTE_LENGTH

    # Update scatter plot
    scat.set_offsets(np.c_[np.radians(positions), np.ones(NUM_BUSES)])
    return scat,

# --- Run the Animation ---
ani = animation.FuncAnimation(fig, update, frames=200, interval=50, blit=True)

# To display in Colab/Jupyter Notebook:
plt.close() # Prevent static plot from showing below the video
HTML(ani.to_html5_video())
''')

# --- PHASE A: DATA PIPELINE ---
add_md('## Phase A: Data Engineering & Graph Extraction')
add_code('''import os
import pickle
import numpy as np
import pandas as pd
from scipy.stats import poisson
import osmnx as ox

print("Extracting OSM graph for Bengaluru (Full City)...")
try:
    graph = ox.graph_from_place('Bengaluru, Karnataka, India', network_type='drive')
    nodes, edges = ox.graph_to_gdfs(graph)
    print(f"Graph extracted with {len(nodes)} nodes and {len(edges)} edges.")
except Exception as e:
    print(f"Extraction failed: {e}")
    graph, nodes, edges = None, [], []

num_stops = 30
time_steps = 120
peak_arrivals = poisson.rvs(mu=8, size=(num_stops, 60))
offpeak_arrivals = poisson.rvs(mu=2, size=(num_stops, 60))
arrival_rates = np.hstack([peak_arrivals, offpeak_arrivals])

num_segments = num_stops - 1
delays_matrix = np.abs(np.random.normal(loc=45.0, scale=15.0, size=(num_segments, time_steps)))

economic_baselines = {
    'wait_cost_per_min': 1.67,
    'fuel_cost_per_min': 0.83,
    'ticket_price': 15.0
}

bengaluru_simulation_data = {
    'graph': graph,
    'graph_nodes_gdf': nodes,
    'graph_edges_gdf': edges,
    'arrival_rates': arrival_rates,
    'delays_matrix': delays_matrix,
    'economic_baselines': economic_baselines,
    'metadata': {
        'num_stops': num_stops,
        'time_steps': time_steps,
        'description': "Bengaluru Full Data for ECO-SYNC"
    }
}

os.makedirs("./data/processed", exist_ok=True)
output_path = "./data/processed/bengaluru_simulation_data.pkl"
with open(output_path, 'wb') as f:
    pickle.dump(bengaluru_simulation_data, f)
print(f"Data successfully generated and saved to {output_path}")
''')

# --- PHASE B: SIMULATOR ---
add_md('## Phase B: Simulation Environment (Gymnasium)')
with open('test_env.py', 'r') as f:
    env_code = f.read()
    env_code = env_code.replace('../data/processed/', './data/processed/')
    env_code += '''
# Execution & Validation Cell
env = BengaluruBusEnv()
obs, info = env.reset()
print("Environment Initialized Successfully.")
print(f"Observation Space Shape: {env.observation_space.shape}")
print(f"Action Space: {env.action_space}\\n")
'''
add_code(env_code)

# --- PHASE C: RL TRAINING ---
add_md('## Phase C: Reinforcement Learning Training (PPO)')
add_code('''import gymnasium as gym
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

os.makedirs("./models", exist_ok=True)
env = BengaluruBusEnv()
vec_env = DummyVecEnv([lambda: env])

model = PPO("MlpPolicy", vec_env, verbose=1)
model.learn(total_timesteps=1000000)

model.save("./models/eco_sync_ppo")
print("Model saved successfully to ./models/eco_sync_ppo.zip")
''')

# --- PHASE D: LLM REASONING ---
add_md('## Phase D: LLM Reasoning Engine')
add_code('''import os
import groq

def explain_action(bus_id, action, econ_data):
    action_str = {0: "PROCEED", 1: "HOLD", 2: "SKIP"}.get(action, "UNKNOWN")
    prompt = f"Bus {bus_id} chose to {action_str}. Economic calculation: Wait cost=\\u20b9{econ_data['wait_cost']:.0f}, Fuel cost=\\u20b9{econ_data['fuel_cost']:.0f}, Revenue=\\u20b9{econ_data['revenue']:.0f}. Explain in 1 sentence why this was the economically optimal decision."
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing.")
    api_key = api_key.strip()
        
    client = groq.Groq(api_key=api_key)
    resp = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=80
    )
    return resp.choices[0].message.content.strip()

# Test
print("--- LLM Reasoning Test ---")
print(explain_action(2, 0, {'wait_cost': 45.0, 'fuel_cost': 22.0, 'revenue': 150.0}))
''')

# --- PHASE E: CBA ANALYSIS ---
add_md('## Phase E: Cost-Benefit Analysis')
with open('analyze_economics.py', 'r') as f:
    analysis_code = f.read()
    # Remove imports that we already have or that refer to missing modules
    analysis_code = analysis_code.replace('from test_env import BengaluruBusEnv', '')
    analysis_code = analysis_code.replace('models/eco_sync_ppo', './models/eco_sync_ppo')
add_code(analysis_code)

with open('ECO_SYNC_Master.ipynb', 'w', encoding='utf-8') as out:
    json.dump(master, out, indent=1)
