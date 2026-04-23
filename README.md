# 🚌 ECO-SYNC Transit AI

*Agentic AI for Economic Dispatch & Anti-Bunching in Urban Transit*

**ECO-SYNC** is a Reinforcement Learning and Multi-Agent AI pipeline designed to mitigate "bus bunching" in public transit systems. Instead of naively minimizing headways, the system optimizes for a **Micro/Macro-Economic Reward Function**—penalizing wait times (lost utility) and fuel burn (inefficiency), while rewarding passenger throughput (revenue).

By wrapping the simulation in a `gymnasium` environment, a PPO agent learns to hold, dispatch, or skip stops. The reasoning is then passed through an LLM layer to provide transparent, human-readable explanations for every transit decision, culminating in a live Cost-Benefit Analysis dashboard.

---

## 🛠️ Tech Stack
- **Simulation Layer**: Python, `gymnasium`, `osmnx` (Bengaluru ORR topology).
- **AI/ML Layer**: Proximal Policy Optimization (PPO) via `stable-baselines3`.
- **Reasoning Engine**: Groq API (Llama 3) for deterministic log translation.
- **Backend API**: FastAPI (REST endpoints & WebSockets).
- **Frontend Dashboard**: React.js, Vite, Tailwind CSS, Recharts, Leaflet.

---

## 🚀 Setup & Installation

### 1. Backend & AI Environment
Requires Python 3.10+

```bash
# Clone the repository
git clone https://github.com/yourusername/eco-sync.git
cd eco-sync

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install gymnasium stable-baselines3 fastapi uvicorn websockets groq pandas numpy osmnx
```

*Note on LLM:* If you have a Groq API key, set it as `GROQ_API_KEY`. If not, the system will fall back to local deterministic rule-based reasoning.

### 2. Frontend React Dashboard
Requires Node.js 18+

```bash
cd app/frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

---

## 🏃‍♂️ Running the System

1. **Start the Backend Server:**
   From the project root:
   ```bash
   uvicorn app.backend.main:app --port 8000
   ```
   *The server streams live simulation data via WebSockets at 1Hz.*

2. **Open the Dashboard:**
   Navigate to `http://localhost:5173/` in your browser. 
   
You can interact with the **Simulation Controls** to toggle between a standard Static Timetable and the Agentic AI. The live map, economic charts, and reasoning feed will dynamically update based on the AI's real-time decisions.

---

## 📚 Repository Structure
- `/notebooks`: The academic pipeline (Graph Extraction -> Gym Env -> PPO Training -> LLM Logic -> Economics).
- `/app/backend`: FastAPI server, WebSockets, and the Groq reasoning engine.
- `/app/frontend`: Vite React application and UI components.
- `/data`: Processed geospatial graph data.
- `/models`: Trained RL PPO agents.
- `/results`: Static Cost-Benefit Analysis JSON outputs.
