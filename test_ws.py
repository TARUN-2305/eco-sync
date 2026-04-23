import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/simulation"
    try:
        async with websockets.connect(uri) as websocket:
            for i in range(3):
                response = await websocket.recv()
                data = json.loads(response)
                print(f"--- Payload {i+1} ---")
                print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
