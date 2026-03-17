from collections import defaultdict
from fastapi import WebSocket


class RealtimeHub:
    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[user_id].append(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id not in self.connections:
            return
        self.connections[user_id] = [conn for conn in self.connections[user_id] if conn != ws]
        if not self.connections[user_id]:
            self.connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, payload: dict):
        for ws in self.connections.get(user_id, []):
            await ws.send_json(payload)


realtime_hub = RealtimeHub()
