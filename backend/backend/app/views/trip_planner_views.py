from django.shortcuts import render
from math import radians, cos, sin, asin, sqrt
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.utils import timezone
from datetime import datetime
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from ..models import  Stops, Shape, Trip, StopTime
from ..serializers import (
    StopSerializer
)
from typing import Dict, List, Optional, Tuple
from django.db.models import Q
from collections import deque
from django.db import connection
from heapq import heappush, heappop
from collections import defaultdict
from datetime import datetime, timedelta
today_day = timezone.localdate().day

def time_to_seconds(t):
    if not t:
        return 0
    try:
        h, m, s = map(int, t.split(":"))
        return h * 3600 + m * 60 + s
    except:
        return 0

def now_seconds():
    n = datetime.now().time()
    return n.hour * 3600 + n.minute * 60 + n.second

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000
class MetroStops(generics.ListAPIView):
    queryset = Stops.objects.all().order_by('stop_id')
    serializer_class = StopSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["stop_name"]


def find_interchanges(from_line, to_line):
    return Stops.objects.filter(
        interchange=True
    ).filter(
        Q(interchange_between__icontains=from_line) &
        Q(interchange_between__icontains=to_line)
    )


def find_direct_trips(from_stop_id, to_stop_id, limit=5):
    table = StopTime._meta.db_table

    sql = f"""
    SELECT st1.trip_id,
           st1.departure_time,
           st2.arrival_time
    FROM {table} st1
    JOIN {table} st2 ON st1.trip_id = st2.trip_id
    WHERE st1.stops_id = %s
      AND st2.stops_id = %s
      AND st2.stop_sequence > st1.stop_sequence
      AND st1.departure_time IS NOT NULL
      AND st2.arrival_time IS NOT NULL
    ORDER BY st1.departure_time
    LIMIT {limit};
    """

    with connection.cursor() as cursor:
        cursor.execute(sql, [from_stop_id, to_stop_id])
        return cursor.fetchall()

def find_next_metro(from_stop, to_stop, after_sec):
    qs = StopTime.objects.filter(
        stops=from_stop,
        departure_time__isnull=False
    ).select_related("trip").order_by("departure_time")

    for st in qs:
        dep_sec = time_to_seconds(st.departure_time)
        if dep_sec < after_sec:
            continue

        dest_st = StopTime.objects.filter(
            trip=st.trip,
            stops=to_stop,
            stop_sequence__gt=st.stop_sequence
        ).first()

        if dest_st:
            return st, dest_st

    return None, None


def find_arrive_by_metro(from_stop, to_stop, arrive_before_sec):
    qs = StopTime.objects.filter(
        stops=to_stop,
        arrival_time__isnull=False
    ).select_related("trip").order_by("-arrival_time")

    for st in qs:
        arr_sec = time_to_seconds(st.arrival_time)
        if arr_sec > arrive_before_sec:
            continue

        src_st = StopTime.objects.filter(
            trip=st.trip,
            stops=from_stop,
            stop_sequence__lt=st.stop_sequence
        ).last()

        if src_st:
            return src_st, st

    return None, None


def get_shape_points(shape_obj):
    if not shape_obj:
        return []

    shapes = (
        Shape.objects
        .filter(shape_id=shape_obj.shape_id)
        .order_by("shape_pt_sequence")
        .only("shape_pt_lat", "shape_pt_lon")
    )

    return [
        [float(pt.shape_pt_lat), float(pt.shape_pt_lon)]
        for pt in shapes
    ]


def get_reachable_stations(stop):
    return Stops.objects.filter(
        stoptime__trip__stoptime__stops=stop
    ).distinct()





def seconds_to_time(sec: int) -> str:
    sec = int(sec) % 86400
    h = sec // 3600
    m = (sec % 3600) // 60
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


class PlanTripView(APIView):
    permission_classes = [AllowAny]

    # Tuning constants
    TRANSFER_PENALTY_SEC = 600          # 10 min — used in time-based optimization
    MIN_INTERCHANGE_PENALTY = 100_000   # very large → strongly prefers fewer transfers
    MAX_DIJKSTRA_ITERATIONS = 10_000    # safety net

    def post(self, request):
        data = request.data
        from_name = str(data.get("from_location", "")).strip()
        to_name   = str(data.get("to_location", "")).strip()
        when      = data.get("when", "leave_now")
        depart_at = data.get("depart_at")
        preference = data.get("preference", "shortest")  # "shortest" | "min_interchange"
       
        if not from_name or not to_name:
            return Response({"error": "from_location and to_location are required"}, status=400)

        from_stop = self._find_stop(from_name)
        to_stop   = self._find_stop(to_name)

        if not from_stop or not to_stop:
            return Response({"error": "One or both stops not found"}, status=404)

        # ── Determine reference time ─────────────────────────────────────
        if when == "leave_now":
            ref_time = datetime.now(timezone.get_current_timezone())
        elif when in ("depart_at", "arrive_by"):
            if not depart_at:
                return Response({"error": "depart_at required for scheduled trips"}, status=400)
            try:
                ref_time = datetime.fromisoformat(depart_at.replace("Z", "+00:00"))
                if ref_time.tzinfo is None:
                    ref_time = ref_time.replace(tzinfo=timezone.get_current_timezone())
            except ValueError:
                return Response({"error": "Invalid depart_at format (ISO expected)"}, status=400)
        else:
            ref_time = datetime.now(timezone.get_current_timezone())

        ref_seconds = time_to_seconds(ref_time.strftime("%H:%M:%S"))
        print(f"Planning {from_stop.stop_name} → {to_stop.stop_name} | preference={preference} | time={ref_seconds//3600:02d}:{(ref_seconds%3600)//60:02d}")
        # ── Dijkstra ─────────────────────────────────────────────────────
        trips = self._find_best_paths(
            from_stop=from_stop,
            to_stop=to_stop,
            ref_seconds=ref_seconds,
            when=when,
            preference=preference,
        )

        if not trips:
            return Response({"trips": []})

        return Response({"trips": trips})

    def _find_stop(self, name: str) -> Optional[Stops]:
        return (
            Stops.objects.filter(stop_name__iexact=name).first()
            or Stops.objects.filter(stop_name__icontains=name).first()
        )

    def _find_best_paths(
        self,
        from_stop: Stops,
        to_stop: Stops,
        ref_seconds: int,
        when: str,
        preference: str,
    ) -> List[dict]:

        pq: List[Tuple[float, int]] = []                        # (cost, stop_id)
        distances: Dict[int, float] = {}
        came_from: Dict[int, Tuple[int, dict]] = {}
        transfers: Dict[int, int] = {}

        start_cost = 0 if preference == "min_interchange" else ref_seconds
        heappush(pq, (start_cost, from_stop.id))
        distances[from_stop.id] = start_cost
        transfers[from_stop.id] = 0

        visited = set()

        iteration = 0

        while pq and iteration < self.MAX_DIJKSTRA_ITERATIONS:
            iteration += 1
            cost, current_id = heappop(pq)

            if current_id in visited:
                continue
            visited.add(current_id)

            if cost > distances.get(current_id, float("inf")):
                continue

            if current_id == to_stop.id:
                break

            current_stop = Stops.objects.select_related().get(id=current_id)

            # 1. Metro departures from current stop
            departures = StopTime.objects.filter(
                stops_id=current_id,
                departure_time__isnull=False,
            ).select_related("trip", "trip__route").order_by("departure_time")

            for dep_st in departures:
                print(f"  Departure {dep_st.departure_time} on trip {dep_st.trip.trip_id}")
                dep_sec = time_to_seconds(dep_st.departure_time)

                # Skip past departures unless min_interchange mode
                if dep_sec < ref_seconds and preference != "min_interchange":
                    continue

                wait_seconds = max(0, dep_sec - ref_seconds) if current_id == from_stop.id else 0

                # Try to reach destination directly on this trip
                direct_to_dest = StopTime.objects.filter(
                    trip=dep_st.trip,
                    stops=to_stop,
                    stop_sequence__gt=dep_st.stop_sequence,
                ).order_by("stop_sequence").first()

                if direct_to_dest:
                    print("    → Direct ride found!")
                    print(f"      {dep_st.trip.trip_id} {dep_st.departure_time} {dep_st.stop_sequence} -> {direct_to_dest.stop_sequence}")
                    arr_sec = time_to_seconds(direct_to_dest.arrival_time)
                    travel_sec = arr_sec - dep_sec
                    total_cost = self._calculate_cost(
                        preference=preference,
                        arrival=arr_sec,
                        wait=wait_seconds,
                        transfers_count=transfers[current_id],
                    )

                    segment = self._build_metro_segment(
                        dep_st=dep_st,
                        alight_st=direct_to_dest,
                        wait_sec=wait_seconds,
                    )

                    if total_cost < distances.get(to_stop.id, float("inf")):
                        distances[to_stop.id] = total_cost
                        transfers[to_stop.id] = transfers[current_id]
                        came_from[to_stop.id] = (current_id, segment)
                        heappush(pq, (total_cost, to_stop.id))
                    continue  # no need to look for interchanges on direct path

                # No direct ride → find next interchange opportunity
                next_xfer = StopTime.objects.filter(
                    trip=dep_st.trip,
                    stop_sequence__gt=dep_st.stop_sequence,
                    stops__interchange=True,
                ).select_related("stops").order_by("stop_sequence").first()

                if next_xfer:
                    print(f"    → Next interchange at {next_xfer.stops.stop_name}")
                    arr_sec = time_to_seconds(next_xfer.arrival_time)
                    total_cost = self._calculate_cost(
                        preference=preference,
                        arrival=arr_sec,
                        wait=wait_seconds,
                        transfers_count=transfers[current_id],
                    )

                    segment = self._build_metro_segment(
                        dep_st=dep_st,
                        alight_st=next_xfer,
                        wait_sec=wait_seconds,
                    )

                    dest_id = next_xfer.stops.id
                    if total_cost < distances.get(dest_id, float("inf")):
                        distances[dest_id] = total_cost
                        transfers[dest_id] = transfers[current_id]  # transfer happens after alighting
                        came_from[dest_id] = (current_id, segment)
                        heappush(pq, (total_cost, dest_id))

            # 2. Walk/transfer to other lines at interchange stations
            if current_stop.interchange:
                other_platforms = Stops.objects.filter(
                    interchange=True,
                    stop_name=current_stop.stop_name,
                ).exclude(id=current_id)

                for platform in other_platforms:
                    new_transfer_count = transfers[current_id] + 1

                    cost = self._calculate_cost(
                        preference=preference,
                        arrival=distances[current_id],  # keep previous arrival time
                        wait=0,
                        transfers_count=new_transfer_count,
                    )

                    segment = {
                        "mode": "transfer",
                        "on_stop": current_stop.stop_name,
                        "off_stop": platform.stop_name,
                        "duration_minutes": self.TRANSFER_PENALTY_SEC // 60,
                        "route_color": "#aaaaaa",
                    }

                    if cost < distances.get(platform.id, float("inf")):
                        distances[platform.id] = cost
                        transfers[platform.id] = new_transfer_count
                        came_from[platform.id] = (current_id, segment)
                        heappush(pq, (cost, platform.id))

        if to_stop.id not in came_from:
            return []

        # Reconstruct best path
        segments = []
        current = to_stop.id
        while current != from_stop.id:
            prev, segment = came_from.get(current, (None, None))
            if not segment:
                break
            segments.append(segment)
            current = prev

        segments.reverse()

        if not segments:
            return []

        # Final trip summary
        first_seg = segments[0]
        last_seg = segments[-1]

        wait_min = first_seg.get("wait_time_minutes", 0)
        start_sec = ref_seconds + wait_min * 60
        end_sec = time_to_seconds(last_seg.get("end_time", "00:00:00"))

        duration_min = round((end_sec - ref_seconds) / 60)

        trip = {
            "trip_id": f"planned-{int(datetime.now().timestamp())}",
            "duration": max(1, duration_min),  # avoid 0
            "start_time": seconds_to_time(start_sec),
            "end_time": seconds_to_time(end_sec),
            "wait_time": wait_min,
            "mode": when,
            "segments": segments,
            "interchanges": transfers.get(to_stop.id, 0),
        }
        print(f"    → Total cost: {total_cost}")
        print(f"Final path found with {len(segments)} segments")
        print(f"    → Duration: {duration_min} minutes")
        print(f"    → Wait time: {wait_min} minutes")
        print(f"    → Start time: {seconds_to_time(start_sec)}")
        print(f"    → End time: {seconds_to_time(end_sec)}")
        print(f"    → Interchanges: {transfers.get(to_stop.id, 0)}")
        print(f"    → Segments: {segments}")
        return [trip]

    def _calculate_cost(
        self,
        preference: str,
        arrival: float,
        wait: int,
        transfers_count: int,
    ) -> float:
        if preference == "min_interchange":
            return transfers_count * self.MIN_INTERCHANGE_PENALTY
        # time-based optimization (shortest total travel + wait)
        return arrival + wait + (transfers_count * self.TRANSFER_PENALTY_SEC)

    def _build_metro_segment(
        self,
        dep_st: StopTime,
        alight_st: StopTime,
        wait_sec: int,
    ) -> dict:
        route = dep_st.trip.route  # type: Route

        return {
            "mode": "metro",
            "route_color": getattr(route, "route_color", "#777777") or dep_st.stops.line_color or "#777777",
            "route_name": route.route_long_name or f"Line {dep_st.stops.line or '?'}",
            "on_stop": dep_st.stops.stop_name,
            "off_stop": alight_st.stops.stop_name,
            "start_time": dep_st.departure_time,
            "end_time": alight_st.arrival_time or "??:??:??",
            "wait_time_minutes": round(wait_sec / 60) if wait_sec > 0 else 0,
        }