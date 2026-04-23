import os
import pickle
import numpy as np
import pandas as pd
from scipy.stats import poisson
import osmnx as ox

print("Generating synthetic data for ECO-SYNC...")

os.makedirs("data/processed", exist_ok=True)
os.makedirs("data/raw", exist_ok=True)

try:
    # Use a small bounding box representing a segment of the Outer Ring Road (e.g., near Agara/HSR Layout)
    # to avoid pulling the entire city or country if Nominatim fails.
    print("Extracting OSM graph for Outer Ring Road, Bengaluru (Segment)...")
    graph = ox.graph_from_bbox(bbox=(77.63, 12.92, 77.65, 12.93), network_type='drive')
except Exception as e:
    print(f"ox.graph_from_bbox failed: {e}")
    graph = None

if graph:
    nodes, edges = ox.graph_to_gdfs(graph)
else:
    nodes, edges = [], []

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
        'description': "Synthetic Bengaluru ORR Data for ECO-SYNC"
    }
}

output_path = "data/processed/bengaluru_simulation_data.pkl"
with open(output_path, 'wb') as f:
    pickle.dump(bengaluru_simulation_data, f)

print(f"Data successfully generated and saved to {output_path}")
print(f"Data shape summary:")
print(f" - Graph nodes: {len(nodes)}")
print(f" - Graph edges: {len(edges)}")
print(f" - Arrival rates matrix shape: {arrival_rates.shape}")
print(f" - Delays matrix shape: {delays_matrix.shape}")
