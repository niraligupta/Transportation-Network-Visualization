# app/management/commands/simulate_vehicles.py

import asyncio
import random
from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from app.models import Shape, Stop
from django.utils import timezone


class Command(BaseCommand):
    help = "Simulate vehicle telemetry and broadcast to channels"

    def handle(self, *args, **options):
        asyncio.run(self.run_sim())

    async def load_initial_data(self):
        shapes = await sync_to_async(
            lambda: list(Shape.objects.values_list("shape_id", flat=True)[:10])
        )()

        stops = await sync_to_async(
            lambda: list(Stop.objects.values_list("stop_id", "stop_lat", "stop_lon")[:100])
        )()

        return shapes, stops

    async def run_sim(self):
        channel_layer = get_channel_layer()

        shapes, stops = await self.load_initial_data()

        vehicles = []
        for i in range(8):
            sid, lat, lon = random.choice(stops)
            vehicles.append({
                "vehicle_id": f"sim_{i}",
                "route": random.choice(["RED", "GREEN", "BLUE", "MAGENTA", "615"]),
                "lat": float(lat),
                "lon": float(lon),
                "bearing": random.randint(0, 359),
                "speed_kmph": random.uniform(15, 40),
            })

        while True:
            now = timezone.now().isoformat()

            for v in vehicles:
                v["lat"] += (random.random() - 0.5) * 0.0005
                v["lon"] += (random.random() - 0.5) * 0.0005
                v["bearing"] = (v["bearing"] + random.randint(-15, 15)) % 360

                payload = {
                    "vehicle_id": v["vehicle_id"],
                    "route": v["route"],
                    "lat": v["lat"],
                    "lon": v["lon"],
                    "bearing": v["bearing"],
                    "speed_kmph": round(v["speed_kmph"], 1),
                    "timestamp": now,
                }

                # Broadcast to global group
                await channel_layer.group_send(
                    "vehicles_all",
                    {"type": "vehicle.update", "payload": payload},
                )

                # Broadcast to route-specific group
                await channel_layer.group_send(
                    f"vehicles_route_{v['route']}",
                    {"type": "vehicle.update", "payload": payload},
                )

            await asyncio.sleep(1.5)
