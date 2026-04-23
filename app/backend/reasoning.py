import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

import groq

def explain_action(bus_id, action, econ_data):
    action_str = {0: "PROCEED", 1: "HOLD", 2: "SKIP"}.get(action, "UNKNOWN")
    prompt = f"Bus {bus_id} chose to {action_str}. Economic calculation: Wait cost=₹{econ_data['wait_cost']:.0f}, Fuel cost=₹{econ_data['fuel_cost']:.0f}, Revenue=₹{econ_data['revenue']:.0f}. Explain in 1 sentence why this was the economically optimal decision."
    
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

if __name__ == "__main__":
    dummy_econ_data = {
        'wait_cost': 45.0,
        'fuel_cost': 22.0,
        'revenue': 150.0
    }
    explanation = explain_action(bus_id=2, action=0, econ_data=dummy_econ_data)
    print("--- LLM Reasoning Output ---")
    print(explanation)
