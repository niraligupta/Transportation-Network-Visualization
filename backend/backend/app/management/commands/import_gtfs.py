# python manage.py import_gtfs --dir "D:\GTFS Data\Delhi Metro"

import csv
import os
from django.core.management.base import BaseCommand
from app.models import Route, Trip, Stop, StopTime, Shape

CHUNK = 2000


class Command(BaseCommand):
    help = "Import GTFS dataset into PostgreSQL."

    def add_arguments(self, parser):
        parser.add_argument("--dir", required=True, help="Path to GTFS folder")

    def handle(self, *args, **opts):
        gtfs_dir = opts["dir"]
        if not os.path.isdir(gtfs_dir):
            self.stderr.write(self.style.ERROR(f"Directory not found: {gtfs_dir}"))
            return

        self.stdout.write(self.style.WARNING("Deleting old GTFS data..."))
        StopTime.objects.all().delete()
        Trip.objects.all().delete()
        Shape.objects.all().delete()
        Route.objects.all().delete()
        Stop.objects.all().delete()

        # ───────────────────────────────────────────────
        # 1. IMPORT STOPS
        # ───────────────────────────────────────────────
        self.stdout.write("Importing stops...")
        stops_file = os.path.join(gtfs_dir, "stops.txt")
        batch = []
        with open(stops_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                batch.append(
                    Stop(
                        stop_id=row["stop_id"],
                        stop_name=row["stop_name"],
                        stop_lat=float(row["stop_lat"]),
                        stop_lon=float(row["stop_lon"])
                    )
                )
                if len(batch) >= CHUNK:
                    Stop.objects.bulk_create(batch)
                    batch = []
        if batch:
            Stop.objects.bulk_create(batch)

        # ───────────────────────────────────────────────
        # 2. IMPORT ROUTES
        # ───────────────────────────────────────────────
        self.stdout.write("Importing routes...")
        routes_file = os.path.join(gtfs_dir, "routes.txt")
        batch = []
        with open(routes_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                batch.append(
                    Route(
                        route_id=row["route_id"],
                        route_short_name=row["route_short_name"],
                        route_long_name=row["route_long_name"],
                    )
                )
        if batch:
            Route.objects.bulk_create(batch)

        # ───────────────────────────────────────────────
        # 3. IMPORT SHAPES
        # ───────────────────────────────────────────────
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
                        shape_pt_sequence=int(row["shape_pt_sequence"])
                    )
                )
                if len(batch) >= CHUNK:
                    Shape.objects.bulk_create(batch)
                    batch = []
        if batch:
            Shape.objects.bulk_create(batch)

        # ───────────────────────────────────────────────
        # 4. IMPORT TRIPS (with FK to Route + Shape)
        # ───────────────────────────────────────────────
        self.stdout.write("Importing trips...")
        trips_file = os.path.join(gtfs_dir, "trips.txt")
        batch = []
        with open(trips_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                batch.append(
                    Trip(
                        trip_id=row["trip_id"],
                        route=Route.objects.get(route_id=row["route_id"]),
                        service_id=row["service_id"],
                        shape_id=Shape.objects.filter(shape_id=row["shape_id"]).first(),
                    )
                )

        if batch:
            Trip.objects.bulk_create(batch)

        # ───────────────────────────────────────────────
        # 5. IMPORT STOP TIMES (FK trip + stop)
        # ───────────────────────────────────────────────
        self.stdout.write("Importing stop_times...")
        st_file = os.path.join(gtfs_dir, "stop_times.txt")
        batch = []
        with open(st_file, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                batch.append(
                    StopTime(
                        trip=Trip.objects.get(trip_id=row["trip_id"]),
                        stop=Stop.objects.get(stop_id=row["stop_id"]),
                        stop_sequence=int(row["stop_sequence"]),
                        arrival_time=row["arrival_time"],
                        departure_time=row["departure_time"]
                    )
                )

                if len(batch) >= CHUNK:
                    StopTime.objects.bulk_create(batch)
                    batch = []

        if batch:
            StopTime.objects.bulk_create(batch)

        self.stdout.write(self.style.SUCCESS("✔ GTFS Import Completed Successfully!"))
