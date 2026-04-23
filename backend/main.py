import asyncio
import importlib.util
import json
import os
from pathlib import Path
from time import strftime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
DATA_PATH = BASE_DIR / "data" / "route_378_map.json"


def _load_module(module_name: str, file_name: str):
    module_path = BACKEND_DIR / file_name
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load module from {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


simulator_module = _load_module("simulator_module", "02_simulator.py")
agent_module = _load_module("agent_debate_module", "03_agent_debate.py")
RouteSimulator = simulator_module.RouteSimulator
trigger_v2x_debate = agent_module.trigger_v2x_debate

app = FastAPI(title="ECO-SYNC V2X API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulator = RouteSimulator()
map_payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
debate_history = []
last_debate_key = None
stop_route_indices = {}
major_stops = ["Kengeri TTMC", "Uttarahalli", "Konanakunte Cross", "Gottigere", "Electronic City"]


def _nearest_route_index(lat: float, lng: float) -> int:
    return min(
        range(len(simulator.route_path)),
        key=lambda idx: (simulator.route_path[idx][0] - lat) ** 2 + (simulator.route_path[idx][1] - lng) ** 2,
    )


def _initialize_stop_indices():
    for stop_name, stop_data in map_payload["stops"].items():
        stop_route_indices[stop_name] = _nearest_route_index(stop_data["lat"], stop_data["lng"])


def _find_following_bus(primary_bus):
    candidates = [
        bus
        for bus in simulator.buses
        if bus["id"] != primary_bus["id"] and bus["path_index"] <= primary_bus["path_index"]
    ]
    if not candidates:
        fallback_candidates = [bus for bus in simulator.buses if bus["id"] != primary_bus["id"]]
        if not fallback_candidates:
            return None
        return min(fallback_candidates, key=lambda bus: abs(bus["path_index"] - primary_bus["path_index"]))
    return max(candidates, key=lambda bus: bus["path_index"])


def _maybe_trigger_debate(state):
    global last_debate_key

    for bus in state["buses"]:
        for stop_name in major_stops:
            stop_index = stop_route_indices[stop_name]
            distance = abs(stop_index - bus["path_index"])
            if distance <= 6:
                following_bus = _find_following_bus(bus)
                if following_bus is None:
                    continue

                debate_key = f"{bus['id']}:{following_bus['id']}:{stop_name}:{bus['path_index']}"
                if debate_key == last_debate_key:
                    continue

                stop_state = {"name": stop_name, **state["stops"][stop_name]}
                traffic_state = state["traffic"] or [{"location": stop_name, "severity": "Moderate"}]

                try:
                    raw_result = trigger_v2x_debate(bus, following_bus, stop_state, traffic_state)
                    decision = json.loads(raw_result)
                except Exception as exc:
                    decision = {
                        "bus_1_action": "PROCEED",
                        "bus_2_action": "PROCEED",
                        "reasoning_for_signboard": f"Debate unavailable: {exc}",
                    }

                event = {
                    "stop": stop_name,
                    "bus_1_id": bus["id"],
                    "bus_2_id": following_bus["id"],
                    "decision": decision,
                }
                debate_history.append(event)
                debate_history[:] = debate_history[-20:]
                last_debate_key = debate_key
                return event
    return None


@app.get("/api/map")
async def get_map():
    return map_payload


@app.websocket("/ws/live")
async def live_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            state = simulator.tick()
            latest_debate = _maybe_trigger_debate(state)
            bus_snapshot = ", ".join(
                f"{bus['id']}@{bus['path_index']}" for bus in state["buses"]
            )
            debate_flag = latest_debate["stop"] if latest_debate else "none"
            print(
                f"[{strftime('%H:%M:%S')}] WS /ws/live tick buses={bus_snapshot} "
                f"traffic={len(state['traffic'])} latest_debate={debate_flag}",
                flush=True,
            )
            payload = {
                "stops": state["stops"],
                "buses": state["buses"],
                "traffic": state["traffic"],
                "latest_debate": latest_debate,
                "debate_history": debate_history,
            }
            await websocket.send_json(payload)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return


@app.on_event("startup")
async def startup_event():
    _initialize_stop_indices()
