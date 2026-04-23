import json
with open("results/simulation_results.json", "r") as f:
    d = json.load(f)
print(f"Static ENV: Rs {d['summary']['static']['env']:.2f}")
print(f"Agentic ENV: Rs {d['summary']['agentic']['env']:.2f}")
print(f"Efficiency Gain: {d['summary']['efficiency_gain_percent']:.2f}%")
