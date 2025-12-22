import csv
from django.core.management.base import BaseCommand
from app.models import Stop

class Command(BaseCommand):
    help = "Import GTFS stops from custom path"

    def handle(self, *args, **kwargs):
        file_path = r"C:\Users\Transportation Guest\Downloads\DMRC_GTFS\stops.txt"

        with open(file_path, encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                Stop.objects.update_or_create(
                    stop_id=row["stop_id"],
                    defaults={
                        "stop_name": row["stop_name"],
                        "stop_lat": float(row["stop_lat"]),
                        "stop_lon": float(row["stop_lon"]),
                    }
                )
        self.stdout.write(self.style.SUCCESS("Stops imported successfully!"))
