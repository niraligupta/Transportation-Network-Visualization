import csv
from django.core.management.base import BaseCommand
from app.models import BusStop

class Command(BaseCommand):
    help = "Import BUS stops from stops_bus_bus.txt"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Path to stops_bus_bus.txt"
        )

    def handle(self, *args, **options):
        file_path = options["file"]

        self.stdout.write(f"Importing Bus Stops from: {file_path}")

        with open(file_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                BusStop.objects.update_or_create(
                    bus_stop_id=row["stop_id"],
                    defaults={
                        "stop_name": row["stop_name"],
                        "stop_lat": float(row["stop_lat"]),
                        "stop_lon": float(row["stop_lon"]),
                    }
                )

        self.stdout.write(self.style.SUCCESS("Bus stops imported successfully!"))
