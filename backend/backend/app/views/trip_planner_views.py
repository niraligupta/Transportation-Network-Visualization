from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination

from django.utils import timezone
from datetime import datetime

from typing import Optional, List

from ..models import Stops, StopTime, Trip
from ..serializers import StopSerializer

OSMNX_AVAILABLE = False

# Metro line color mapping
METRO_COLORS = {
    "RED": "#FF0000",
    "BLUE": "#0000FF",
    "GREEN": "#008000",
    "YELLOW": "#FFFF00",
    "ORANGE": "#FFA500",
    "PURPLE": "#800080",
    "PINK": "#FFC0CB",
    "GRAY": "#808080",
    "BLACK": "#000000",
    "WHITE": "#FFFFFF",
    "BROWN": "#A52A2A",
    "CYAN": "#00FFFF",
    "MAGENTA": "#FF00FF",
    "LIME": "#00FF00",
    "OLIVE": "#808000",
    "MAROON": "#800000",
    "NAVY": "#000080",
    "TEAL": "#008080",
    "SILVER": "#C0C0C0",
    "GOLD": "#FFD700",
}



def time_to_seconds(t):
    if not t:
        return 0
    try:
        h, m, s = map(int, t.split(":"))
        return h * 3600 + m * 60 + s
    except:
        return 0


def seconds_to_time(sec):
    sec = int(sec) % 86400
    h = sec // 3600
    m = (sec % 3600) // 60
    s = sec % 60
    return f"{h:02}:{m:02}:{s:02}"


def smooth_trip_segments(segments):
    # Skipping expensive OSMNX route smoothing to keep API response fast.
    return segments

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 1000


# -----------------------------
# Metro Stops API
# -----------------------------

class MetroStops(generics.ListAPIView):
    queryset = Stops.objects.all().order_by("stop_id")
    serializer_class = StopSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["stop_name"]


# -----------------------------
# Trip Planner API
# -----------------------------

class PlanTripView(APIView):

    permission_classes = [AllowAny]

    MAX_TRANSFERS = 3

    def post(self, request):

        data = request.data

        from_name = str(data.get("from_location", "")).strip()
        to_name = str(data.get("to_location", "")).strip()

        when = data.get("when", "leave_now")
        depart_at = data.get("depart_at")

        if not from_name or not to_name:
            return Response({"error": "from_location and to_location required"}, status=400)

        from_stop = self._find_stop(from_name)
        to_stop = self._find_stop(to_name)

        if not from_stop or not to_stop:
            return Response({"error": "Stop not found"}, status=404)

        # Determine reference time
        if when == "leave_now":
            ref_time = timezone.localtime(timezone.now())
        else:
            ref_time = datetime.fromisoformat(depart_at.replace("Z", "+00:00"))

        ref_seconds = time_to_seconds(ref_time.strftime("%H:%M:%S"))

        segments = self.raptor_search(from_stop, to_stop, ref_seconds)

        if not segments:
            return Response({"trips": []})

        start_sec = time_to_seconds(segments[0]["start_time"])
        end_sec = time_to_seconds(segments[-1]["end_time"])

        segments = smooth_trip_segments(segments)

        trip = {
            "trip_id": f"planned-{int(datetime.now().timestamp())}",
            "duration": round((end_sec - start_sec) / 60),
            "start_time": segments[0]["start_time"],
            "end_time": segments[-1]["end_time"],
            "segments": segments,
        }

        return Response({"trips": [trip]})

    # -----------------------------
    # Stop Search
    # -----------------------------

    def _find_stop(self, name: str) -> Optional[Stops]:

        return (
            Stops.objects.filter(stop_name__iexact=name).first()
            or Stops.objects.filter(stop_name__icontains=name).first()
        )

    

    def raptor_search(self, from_stop, to_stop, ref_seconds):

        all_stop_ids = list(Stops.objects.values_list("id", flat=True))
        earliest = {s: float("inf") for s in all_stop_ids}
        earliest[from_stop.id] = ref_seconds

        parent = {}

        stop_time_rows = StopTime.objects.values(
            "trip_id",
            "stops_id",
            "stop_sequence",
            "arrival_time",
            "departure_time",
        ).order_by("trip_id", "stop_sequence")

        stop_to_stop_times = {}
        trip_to_stop_times = {}

        for row in stop_time_rows:
            row["departure_sec"] = time_to_seconds(row["departure_time"])
            row["arrival_sec"] = time_to_seconds(row["arrival_time"])
            stop_to_stop_times.setdefault(row["stops_id"], []).append(row)
            trip_to_stop_times.setdefault(row["trip_id"], []).append(row)

        trip_map = {
            trip.trip_id: trip
            for trip in Trip.objects.select_related("route").filter(trip_id__in=trip_to_stop_times)
        }
        stops = Stops.objects.in_bulk(all_stop_ids)

        current_stops = {from_stop.id}

        for round_no in range(self.MAX_TRANSFERS + 1):
            next_stops = set()
            updated = False

            for stop_id in current_stops:
                if stop_id not in stop_to_stop_times:
                    continue

                for st in stop_to_stop_times[stop_id]:
                    if st["departure_sec"] < earliest.get(stop_id, float("inf")):
                        continue

                    for next_st in trip_to_stop_times.get(st["trip_id"], []):
                        if next_st["stop_sequence"] <= st["stop_sequence"]:
                            continue

                        if next_st["arrival_sec"] < earliest.get(next_st["stops_id"], float("inf")):
                            earliest[next_st["stops_id"]] = next_st["arrival_sec"]
                            parent[next_st["stops_id"]] = {
                                "prev_stop": stop_id,
                                "trip_id": st["trip_id"],
                                "dep": st["departure_time"],
                                "arr": next_st["arrival_time"],
                                "prev_seq": st["stop_sequence"],
                                "next_seq": next_st["stop_sequence"],
                            }
                            next_stops.add(next_st["stops_id"])
                            updated = True

            if not updated:
                break

            current_stops = next_stops

        if to_stop.id not in parent:
            return []

        segments = []
        cur = to_stop.id

        while cur != from_stop.id:
            info = parent[cur]

            prev_stop = stops.get(info["prev_stop"])
            cur_stop = stops.get(cur)
            trip = trip_map.get(info["trip_id"])

            if not prev_stop or not cur_stop or not trip:
                break

            route = trip.route

            
            color_key = route.route_long_name.split("_", 1)[0] if "_" in route.route_long_name else "GRAY"
            route_color = METRO_COLORS.get(color_key.upper(), "#777777")

            segment_shape = []
            for st in trip_to_stop_times.get(info["trip_id"], []):
                if info["prev_seq"] <= st["stop_sequence"] <= info["next_seq"]:
                    stop_obj = stops.get(st["stops_id"])
                    if stop_obj and stop_obj.stop_lat is not None and stop_obj.stop_lon is not None:
                        segment_shape.append([float(stop_obj.stop_lat), float(stop_obj.stop_lon)])

            if not segment_shape and prev_stop.stop_lat is not None and prev_stop.stop_lon is not None and cur_stop.stop_lat is not None and cur_stop.stop_lon is not None:
                segment_shape = [
                    [float(prev_stop.stop_lat), float(prev_stop.stop_lon)],
                    [float(cur_stop.stop_lat), float(cur_stop.stop_lon)]
                ]

            segments.append({
                "mode": "metro",
                "route_color": route_color,
                "route_name": route.route_long_name.split("_", 1)[-1] if "_" in route.route_long_name else route.route_long_name,
                "on_stop": prev_stop.stop_name,
                "off_stop": cur_stop.stop_name,
                "start_time": info["dep"],
                "end_time": info["arr"],
                "shape": segment_shape,
                "from_lat": prev_stop.stop_lat,
                "from_lon": prev_stop.stop_lon,
                "to_lat": cur_stop.stop_lat,
                "to_lon": cur_stop.stop_lon,
            })

            cur = info["prev_stop"]

        segments.reverse()
        return segments