from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination

from django.utils import timezone
from datetime import datetime

from typing import Optional, List

from ..models import Stops, StopTime
from ..serializers import StopSerializer

try:
    import osmnx as ox
    import networkx as nx
    OSMNX_AVAILABLE = True
except ImportError:
    OSMNX_AVAILABLE = False


# -----------------------------
# Helper Functions
# -----------------------------

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
    if not OSMNX_AVAILABLE or not segments:
        return segments

    all_coords = []
    for seg in segments:
        if seg.get("osm_shape"):
            all_coords.extend(seg["osm_shape"])
        elif seg.get("shape"):
            all_coords.extend(seg["shape"])
        elif seg.get("from_lat") and seg.get("from_lon") and seg.get("to_lat") and seg.get("to_lon"):
            all_coords.append([seg["from_lat"], seg["from_lon"]])
            all_coords.append([seg["to_lat"], seg["to_lon"]])

    if len(all_coords) < 2:
        return segments

    latitudes = [p[0] for p in all_coords]
    longitudes = [p[1] for p in all_coords]

    center_lat = sum(latitudes) / len(latitudes)
    center_lon = sum(longitudes) / len(longitudes)

    approx_span = max(max(latitudes) - min(latitudes), max(longitudes) - min(longitudes))
    # convert degree delta to meters roughly (1 deg ~ 111 km)
    radius_m = max(500, min(int(approx_span * 111000 * 1.5) + 500, 25000))

    try:
        G = ox.graph_from_point((center_lat, center_lon), dist=radius_m, network_type="walk", simplify=True)
    except Exception:
        return segments

    def get_path_coords(pt_list):
        if not pt_list or len(pt_list) < 2:
            return pt_list

        final_coords = []

        for i in range(len(pt_list) - 1):
            start = pt_list[i]
            end = pt_list[i + 1]

            try:
                u = ox.distance.nearest_nodes(G, start[1], start[0])
                v = ox.distance.nearest_nodes(G, end[1], end[0])
                route_nodes = nx.shortest_path(G, u, v, weight="length")

                route_coords = [[G.nodes[n]["y"], G.nodes[n]["x"]] for n in route_nodes]

                if final_coords and final_coords[-1] == route_coords[0]:
                    final_coords.extend(route_coords[1:])
                else:
                    final_coords.extend(route_coords)
            except Exception:
                if final_coords and final_coords[-1] == start:
                    final_coords.append(end)
                else:
                    if not final_coords:
                        final_coords.append(start)
                    final_coords.append(end)

        return final_coords

    for seg in segments:
        base_shape = None
        if seg.get("osm_shape"):
            base_shape = seg.get("osm_shape")
        elif seg.get("shape"):
            base_shape = seg.get("shape")
        elif seg.get("from_lat") and seg.get("from_lon") and seg.get("to_lat") and seg.get("to_lon"):
            base_shape = [[seg["from_lat"], seg["from_lon"]], [seg["to_lat"], seg["to_lon"]]]

        if not base_shape or len(base_shape) < 2:
            continue

        smoothed = get_path_coords(base_shape)
        if smoothed and len(smoothed) >= 2:
            seg["osm_shape"] = smoothed

    return segments


# -----------------------------
# Pagination
# -----------------------------

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
            ref_time = datetime.now(timezone.get_current_timezone())
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

    # -----------------------------
    # RAPTOR Algorithm
    # -----------------------------

    def raptor_search(self, from_stop, to_stop, ref_seconds):

        # earliest arrival time for each stop
        all_stop_ids = list(Stops.objects.values_list("id", flat=True))
        earliest = {s: float("inf") for s in all_stop_ids}
        earliest[from_stop.id] = ref_seconds

        parent = {}

        # Preload all stop_times once and index by stop and by trip
        stop_times = list(StopTime.objects.select_related("trip", "trip__route", "stops").order_by("trip_id", "stop_sequence"))

        stop_to_stop_times = {}
        trip_to_stop_times = {}

        for st in stop_times:
            stop_to_stop_times.setdefault(st.stops_id, []).append(st)
            trip_to_stop_times.setdefault(st.trip.trip_id, []).append(st)

        # Build quick dictionary of trips to their ordered stop segments
        for trip_id, sts in trip_to_stop_times.items():
            trip_to_stop_times[trip_id] = sorted(sts, key=lambda x: x.stop_sequence)

        # start with origin stop only
        current_stops = {from_stop.id}

        for round_no in range(self.MAX_TRANSFERS + 1):
            next_stops = set()
            updated = False

            # for each stop reachable in the last round, look for outgoing trips
            for stop_id in current_stops:
                if stop_id not in stop_to_stop_times:
                    continue

                for st in stop_to_stop_times[stop_id]:
                    dep_sec = time_to_seconds(st.departure_time)
                    if dep_sec < earliest.get(stop_id, float("inf")):
                        continue

                    trip_stops_sorted = trip_to_stop_times.get(st.trip.trip_id, [])
                    # move through remaining stops on same trip
                    for next_st in trip_stops_sorted:
                        if next_st.stop_sequence <= st.stop_sequence:
                            continue

                        arr_sec = time_to_seconds(next_st.arrival_time)
                        if arr_sec < earliest.get(next_st.stops_id, float("inf")):
                            earliest[next_st.stops_id] = arr_sec
                            parent[next_st.stops_id] = {
                                "prev_stop": stop_id,
                                "trip": st.trip,
                                "dep": st.departure_time,
                                "arr": next_st.arrival_time,
                                "prev_seq": st.stop_sequence,
                                "next_seq": next_st.stop_sequence,
                            }
                            next_stops.add(next_st.stops_id)
                            updated = True

            if not updated:
                break

            current_stops = next_stops

        if to_stop.id not in parent:
            return []

        if to_stop.id not in parent:
            return []

        segments = []
        cur = to_stop.id

        while cur != from_stop.id:

            info = parent[cur]

            prev_stop = Stops.objects.get(id=info["prev_stop"])
            cur_stop = Stops.objects.get(id=cur)

            route = info["trip"].route

            # Build a lightweight shape polyline from station coordinates on this segment
            segment_shape = []
            stop_times_in_segment = StopTime.objects.filter(
                trip=info["trip"],
                stop_sequence__gte=info.get("prev_seq", 0),
                stop_sequence__lte=info.get("next_seq", 0),
            ).select_related("stops").order_by("stop_sequence")

            for st in stop_times_in_segment:
                if st.stops and (st.stops.stop_lat is not None and st.stops.stop_lon is not None):
                    segment_shape.append([float(st.stops.stop_lat), float(st.stops.stop_lon)])

            # Fallback path: pair of stations if shape not populated yet
            if not segment_shape and prev_stop.stop_lat is not None and prev_stop.stop_lon is not None and cur_stop.stop_lat is not None and cur_stop.stop_lon is not None:
                segment_shape = [
                    [float(prev_stop.stop_lat), float(prev_stop.stop_lon)],
                    [float(cur_stop.stop_lat), float(cur_stop.stop_lon)]
                ]

            segments.append({

                "mode": "metro",

                "route_color": getattr(route, "route_color", "#777777"),

                "route_name": route.route_long_name
                if route.route_long_name
                else "Metro Line",

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