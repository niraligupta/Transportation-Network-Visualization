# python manage.py import_od_excel --file "C:\Users\Transportation Guest\Downloads\DMRC_GTFS\od_flow_jan_2021_jan_2025.xlsx"

import pandas as pd
import math
from django.core.management.base import BaseCommand
from app.models import ODPassengerFlow

class Command(BaseCommand):
    help = "Import OD passenger flow from Excel (month from sheet name)"

    def add_arguments(self, parser):
        parser.add_argument("--file", required=True)

    def handle(self, *args, **opts):
        file_path = opts["file"]

        excel = pd.ExcelFile(file_path)

        total_inserted = 0

        for sheet_name in excel.sheet_names:
            # ✅ MONTH FROM SHEET NAME
            # OD_Flow_JAN'21  -> jan_2021
            month = (
                sheet_name
                .lower()
                .replace("od_flow_", "")
                .replace("'", "")
                .replace("-", "_")
                .strip()
            )

            df = excel.parse(sheet_name)

            origin_col = df.columns[0]   # 'stn.'

            bulk = []
            skipped = 0

            for _, row in df.iterrows():
                origin = str(row[origin_col]).strip()

                if not origin or origin.lower() == "nan":
                    continue

                for dest in df.columns[1:]:
                    value = row[dest]

                    # ✅ SAFETY CHECKS
                    if value is None:
                        skipped += 1
                        continue

                    if isinstance(value, float) and math.isnan(value):
                        skipped += 1
                        continue

                    if not isinstance(value, (int, float)):
                        skipped += 1
                        continue

                    if value <= 0:
                        continue

                    bulk.append(
                        ODPassengerFlow(
                            month=month,
                            origin_station=origin,
                            destination_station=str(dest).strip(),
                            passengers=int(value),
                        )
                    )

            if bulk:
                ODPassengerFlow.objects.bulk_create(bulk, batch_size=5000)
                total_inserted += len(bulk)

                self.stdout.write(
                    self.style.SUCCESS(
                        f"{sheet_name} → {month} | inserted {len(bulk)} rows"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"TOTAL OD rows inserted: {total_inserted}"
            )
        )
