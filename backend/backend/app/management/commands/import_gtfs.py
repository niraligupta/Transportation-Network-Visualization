# python manage.py import_gtfs --dir "C:\Users\Transportation Guest\Downloads\DMRC_GTFS"

import csv
import os

from django.core.management.base import BaseCommand
from app.models import Route, Trip, Stops, StopTime, Shape

CHUNK = 2000
class Command(BaseCommand):
    help = "Import GTFS dataset into PostgreSQL."
    def add_arguments(self, parser):
        parser.add_argument(
            "--dir",
            required=True,
            help="Path to GTFS folder"
        )

    def handle(self, *args, **opts):
        gtfs_dir = opts["dir"]

        if not os.path.isdir(gtfs_dir):
            self.stderr.write(
                self.style.ERROR(f"Directory not found: {gtfs_dir}")
            )
            return

        # 1. DELETE OLD GTFS DATA
        self.stdout.write(self.style.WARNING("Deleting old GTFS data..."))
        StopTime.objects.all().delete()
        Trip.objects.all().delete()
        Shape.objects.all().delete()
        Route.objects.all().delete()

        # 2. IMPORT ROUTES
        self.stdout.write("Importing routes...")
        routes_file = os.path.join(gtfs_dir, "routes.txt")

        routes = []
        with open(routes_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                routes.append(
                    Route(
                        route_id=row["route_id"],
                        route_short_name=row.get("route_short_name", ""),
                        route_long_name=row.get("route_long_name", ""),
                    )
                )

        if routes:
            Route.objects.bulk_create(routes)

      
        # 3. IMPORT SHAPES
        self.stdout.write("Importing shapes...")
        shapes_file = os.path.join(gtfs_dir, "shapes.txt")

        batch = []
        with open(shapes_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                batch.append(
                    Shape(
                        shape_id=row["shape_id"],
                        shape_pt_lat=float(row["shape_pt_lat"]),
                        shape_pt_lon=float(row["shape_pt_lon"]),
                        shape_pt_sequence=int(row["shape_pt_sequence"]),
                    )
                )

                if len(batch) >= CHUNK:
                    Shape.objects.bulk_create(batch)
                    batch = []

        if batch:
            Shape.objects.bulk_create(batch)

        # 4. IMPORT TRIPS
        self.stdout.write("Importing trips...")
        trips_file = os.path.join(gtfs_dir, "trips.txt")

        route_map = {r.route_id: r for r in Route.objects.all()}
        shape_map = {}
        for s in Shape.objects.all():
            shape_map.setdefault(s.shape_id, s)

        trips = []
        with open(trips_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                route = route_map.get(row["route_id"])
                shape = shape_map.get(row.get("shape_id"))

                if not route:
                    continue

                trips.append(
                    Trip(
                        trip_id=row["trip_id"],
                        route=route,
                        service_id=row.get("service_id", ""),
                        shape_id=shape,
                    )
                )

        if trips:
            Trip.objects.bulk_create(trips)

        # 5. IMPORT STOP TIMES 
        self.stdout.write("Importing stop_times...")
        st_file = os.path.join(gtfs_dir, "stop_times.txt")

        trips_map = {t.trip_id: t for t in Trip.objects.all()}

        # pick ONE stop per stop_id (duplicates allowed)
        stops_map = {}
        for s in Stops.objects.all():
            stops_map.setdefault(s.stop_id, s)

        batch = []
        skipped = 0

        with open(st_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                trip_obj = trips_map.get(row["trip_id"])
                stop_obj = stops_map.get(row["stop_id"])

                # 🔥 CRITICAL SAFETY CHECK
                if not trip_obj or not stop_obj:
                    skipped += 1
                    continue

                batch.append(
                    StopTime(
                        trip=trip_obj,
                        stops=stop_obj,
                        stop_sequence=int(row["stop_sequence"]),
                        arrival_time=row.get("arrival_time", ""),
                        departure_time=row.get("departure_time", ""),
                    )
                )

                if len(batch) >= CHUNK:
                    StopTime.objects.bulk_create(batch)
                    batch = []

        if batch:
            StopTime.objects.bulk_create(batch)

        self.stdout.write(
            self.style.WARNING(
                f"Skipped {skipped} stop_time rows (missing stop/trip)"
            )
        )

        self.stdout.write(
            self.style.SUCCESS("✔ GTFS Import Completed Successfully!")
        )
