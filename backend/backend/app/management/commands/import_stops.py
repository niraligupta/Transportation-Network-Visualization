from django.core.management.base import BaseCommand
from django.db import transaction
import pandas as pd

from app.models import Stops


class Command(BaseCommand):
    help = "Truncate and import metro stops from Excel into PostgreSQL"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Full path of Excel file (station.xlsx)"
        )

    def handle(self, *args, **options):
        file_path = options["file"]

        try:
            df = pd.read_excel(file_path)

            # ✅ Required Excel columns
            required_columns = {
                "stop_id",
                "station_code",
                "stop_name",
                "line",
                "interchange",
                "interchange_between",
                "stop_lat",
                "stop_lon",
                "line_color",
            }

            missing = required_columns - set(df.columns)
            if missing:
                self.stderr.write(
                    self.style.ERROR(f"❌ Missing columns in Excel: {missing}")
                )
                return

            with transaction.atomic():

                # 🔥 TRUNCATE PREVIOUS DATA
                deleted, _ = Stops.objects.all().delete()
                self.stdout.write(
                    self.style.WARNING(f"⚠️ Previous records deleted: {deleted}")
                )

                created_count = 0

                for _, row in df.iterrows():

                    # Normalize interchange
                    interchange_value = str(row["interchange"]).strip().lower() in [
                        "1", "true", "yes", "y"
                    ]

                    Stops.objects.create(
                        stop_id=str(row["stop_id"]).strip(),
                        station_code=str(row["station_code"]).strip(),
                        stop_name=str(row["stop_name"]).strip(),
                        line=str(row["line"]).strip(),
                        interchange=interchange_value,
                        interchange_between=(
                            str(row["interchange_between"]).strip()
                            if pd.notna(row["interchange_between"])
                            else None
                        ),
                        stop_lat=float(row["stop_lat"]),
                        stop_lon=float(row["stop_lon"]),
                        line_color=(
                            str(row["line_color"]).strip()
                            if pd.notna(row["line_color"])
                            else None
                        ),
                    )
                    created_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Import completed successfully | Inserted: {created_count}"
                )
            )

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR("❌ Excel file not found"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Error: {e}"))
