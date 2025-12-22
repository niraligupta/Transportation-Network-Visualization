import os
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
from app.models import PassengerFlow


# ===============================
# CONFIG
# ===============================

EXCEL_FILE = r"C:/Users/Transportation Guest/Downloads/stationwise_hourly_entry_exit_february_2024.xlsx"

MONTHS = [
    "september_2024",
    "october_2024",
    "november_2024",
    "december_2024",
    "january_2025",
    "february_2025",
]

# HR0 intentionally ignored
HOUR_MAP = {
    "HR4": 4, "HR5": 5, "HR6": 6, "HR7": 7, "HR8": 8,
    "HR9": 9, "HR10": 10, "HR11": 11, "HR12": 12,
    "HR13": 13, "HR14": 14, "HR15": 15, "HR16": 16,
    "HR17": 17, "HR18": 18, "HR19": 19, "HR20": 20,
    "HR21": 21, "HR22": 22, "HR23": 23,
}


# ===============================
# HELPERS
# ===============================

def normalize_columns(df):
    """
    Converts:
    'station name' -> 'station_name'
    'HR4' -> 'hr4'
    """
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )
    return df


# ===============================
# COMMAND
# ===============================

class Command(BaseCommand):
    help = "Import passenger flow data from Excel (month-wise, hour-wise)"

    def handle(self, *args, **kwargs):
        if not os.path.exists(EXCEL_FILE):
            self.stderr.write(self.style.ERROR(f"Excel file not found: {EXCEL_FILE}"))
            return

        self.stdout.write("🧹 Deleting old passenger flow data...")
        PassengerFlow.objects.all().delete()

        bulk = []
        total_rows = 0

        for month in MONTHS:
            entry_sheet = f"{month}_entry"
            exit_sheet = f"{month}_exit"

            try:
                entry_df = pd.read_excel(EXCEL_FILE, sheet_name=entry_sheet)
                exit_df = pd.read_excel(EXCEL_FILE, sheet_name=exit_sheet)
            except Exception as e:
                self.stderr.write(
                    self.style.WARNING(f"⚠️ Skipping {month}: sheet not found")
                )
                continue

            entry_df = normalize_columns(entry_df)
            exit_df = normalize_columns(exit_df)

            # Required columns validation
            required_cols = {"station_name", "businessday"}
            if not required_cols.issubset(entry_df.columns):
                self.stderr.write(
                    self.style.ERROR(f"❌ Required columns missing in {entry_sheet}")
                )
                continue

            for _, row in entry_df.iterrows():
                station = row["station_name"]

                exit_match = exit_df[exit_df["station_name"] == station]
                if exit_match.empty:
                    continue

                exit_row = exit_match.iloc[0]

                for hr_col, hour in HOUR_MAP.items():
                    hr_col = hr_col.lower()

                    bulk.append(PassengerFlow(
                        month=month,
                        businessday=row["businessday"],
                        linename=row.get("linename", ""),
                        sitename=row.get("sitename", ""),
                        station_name=station,
                        station_code=row.get("station_code", ""),
                        hour=hour,
                        entry=int(row.get(hr_col, 0) or 0),
                        exit=int(exit_row.get(hr_col, 0) or 0),
                    ))
                    total_rows += 1

            self.stdout.write(self.style.SUCCESS(f"✔ Imported {month}"))

        PassengerFlow.objects.bulk_create(bulk, batch_size=5000)

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Passenger flow import completed\n"
                f"📊 Total records inserted: {total_rows}"
            )
        )
