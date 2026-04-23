import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

import groq

def explain_action(bus_id, action, econ_data):
    action_str = {0: "PROCEED", 1: "HOLD", 2: "SKIP"}.get(action, "UNKNOWN")
    api_key = os.environ.get("GROQ_API_KEY", "").strip()

    # Rule-based fallback — app works without an API key
    if not api_key:
        net = econ_data['revenue'] - econ_data['wait_cost'] - econ_data['fuel_cost']
        return (
            f"Bus {bus_id} chose {action_str}: revenue ₹{econ_data['revenue']:.0f} "
            f"vs wait ₹{econ_data['wait_cost']:.0f} + fuel ₹{econ_data['fuel_cost']:.0f} "
            f"→ net ₹{net:.0f}."
        )

    prompt = (
        f"Bus {bus_id} chose to {action_str}. "
        f"Economic calculation: Wait cost=₹{econ_data['wait_cost']:.0f}, "
        f"Fuel cost=₹{econ_data['fuel_cost']:.0f}, Revenue=₹{econ_data['revenue']:.0f}. "
        f"Explain in 1 sentence why this was the economically optimal decision."
    )
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
