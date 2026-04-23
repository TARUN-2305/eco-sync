import asyncio
import json
import sys

import websockets


async def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "ws://127.0.0.1:8001/ws/live"
    attempts = int(sys.argv[2]) if len(sys.argv) > 2 else 20

    async with websockets.connect(url) as websocket:
        for tick in range(1, attempts + 1):
            payload = json.loads(await websocket.recv())
            latest = payload.get("latest_debate")
            print(
                json.dumps(
                    {
                        "tick": tick,
                        "buses": [
                            {
                                "id": bus["id"],
                                "path_index": bus["path_index"],
                                "lat": bus["lat"],
                                "lng": bus["lng"],
                            }
                            for bus in payload["buses"]
                        ],
                        "traffic": payload["traffic"],
                        "latest_debate": latest,
                    }
                )
            )
            if latest:
                return


if __name__ == "__main__":
    asyncio.run(main())
