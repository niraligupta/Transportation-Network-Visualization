from django.shortcuts import render
from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, time, timedelta
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from .models import Stop, BusStop, Route, Shape, Trip, StopTime,PassengerFlow
from .serializers import (
    StopSerializer, BusStopSerializer, RouteSerializer,
    ShapeSerializer, StopTimeSerializer
)
from django.db.models import Sum, Count
from .utils.line_mapper import LINE_NAME_MAP,LINE_COLOR_MAP
from django.db.models.functions import ExtractDay
today_day = timezone.localdate().day


def latlon_to_xy(lat, lon, min_lat, max_lat, min_lon, max_lon, width=1000, height=700):
    x = ((lon - min_lon) / (max_lon - min_lon)) * width
    y = ((max_lat - lat) / (max_lat - min_lat)) * height
    return round(x, 2), round(y, 2)



@api_view(["GET"])
def passenger_flow_api(request):
    month = request.GET.get("month")
    if not month:
        return Response({"error": "month is required"}, status=400)

    qs = (
        PassengerFlow.objects
        .annotate(day=ExtractDay("businessday"))
        .filter(month__iexact=month, day=today_day)
    )

    if not qs.exists():
        return Response({"stations": [], "hourlyData": {}, "maxFlow": 0})

    # -------------------------------------------------
    # 1. Fetch station coordinates
    # -------------------------------------------------
    station_names = qs.values_list("station_name", flat=True).distinct()
    stops = Stop.objects.filter(stop_name__in=station_names)

    lats = [s.stop_lat for s in stops]
    lons = [s.stop_lon for s in stops]

    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)

    stations = []
    station_xy_map = {}

    for i, stop in enumerate(stops):
        x, y = latlon_to_xy(
            stop.stop_lat,
            stop.stop_lon,
            min_lat,
            max_lat,
            min_lon,
            max_lon
        )

        # Get line info from PassengerFlow
        pf = qs.filter(station_name=stop.stop_name).first()

        line_code = pf.linename if pf else None
        line_name = LINE_NAME_MAP.get(line_code, "Unknown")
        line_color = LINE_COLOR_MAP.get(line_name, "#9ca3af")

        stations.append({
            "id": str(i + 1),
            "name": stop.stop_name,
            "x": x,
            "y": y,
            "line": line_name,
            "line_color": line_color,
        })

        station_xy_map[stop.stop_name] = (x, y)

    # -------------------------------------------------
    # 2. Hourly passenger data
    # -------------------------------------------------
    hourly_data = {}
    max_flow = 0

    for hour in range(24):
        hour_qs = (
            qs.filter(hour=hour)
            .values("station_name")
            .annotate(
                entry=Sum("entry"),
                exit=Sum("exit")
            )
        )

        key = f"{month}-{hour}"
        hourly_data[key] = []

        for row in hour_qs:
            total = (row["entry"] or 0) + (row["exit"] or 0)
            max_flow = max(max_flow, total)

            hourly_data[key].append({
                "station": row["station_name"],
                "entry": row["entry"] or 0,
                "exit": row["exit"] or 0,
            })

    return Response({
        "stations": stations,
        "hourlyData": hourly_data,
        "maxFlow": max_flow,
    })


# @api_view(["GET"])
# def top_busiest_stations(request):
#     month = request.GET.get("month")
#     line_code = request.GET.get("line_code")

#     if not month or not line_code:
#         return Response(
#             {"error": "month and line_code are required"},
#             status=400
#         )

#     base_qs = PassengerFlow.objects.filter(
#         month__iexact=month,
#         linename__iexact=line_code
#     )

#     if not base_qs.exists():
#         return Response([])

#     # -------------------------------
#     # Step 1: Station-wise totals
#     # -------------------------------
#     stations = (
#         base_qs.values("station_name")
#         .annotate(
#             total_entry=Sum("entry"),
#             total_exit=Sum("exit"),
#         )
#     )

#     # Sort by total passengers
#     stations = sorted(
#         stations,
#         key=lambda x: (x["total_entry"] or 0) + (x["total_exit"] or 0),
#         reverse=True
#     )[:10]

#     result = []

#     # -------------------------------
#     # Step 2: Peak hour per station
#     # -------------------------------
#     for s in stations:
#         station_name = s["station_name"]

#         hourly = (
#             base_qs.filter(station_name=station_name)
#             .values("hour")
#             .annotate(total=Sum("entry") + Sum("exit"))
#             .order_by("-total")
#         )

#         peak_hour = hourly[0]["hour"] if hourly else 0

#         result.append({
#             "station": station_name,
#             "total_entry": s["total_entry"] or 0,
#             "total_exit": s["total_exit"] or 0,
#             "peak_hour": peak_hour,
#         })

#     return Response(result)


# @api_view(["GET"])
# def line_heatmap(request):
#     month = request.GET.get("month")

#     if not month:
#         return Response(
#             {"error": "month is required"},
#             status=400
#         )

#     qs = PassengerFlow.objects.filter(
#         month__iexact=month
#     )

#     if not qs.exists():
#         return Response([])

#     heatmap_qs = (
#         qs.values("linename", "hour")
#         .annotate(
#             entry=Sum("entry"),
#             exit=Sum("exit")
#         )
#         .order_by("linename", "hour")
#     )

#     data = [
#         {
#             "line_name": LINE_NAME_MAP.get(row["linename"], row["linename"]),
#             "hour": row["hour"],
#             "entry": row["entry"] or 0,
#             "exit": row["exit"] or 0,
#         }
#         for row in heatmap_qs
#     ]

#     return Response(data)



# @api_view(["GET"])
# def station_hourly_flow(request):
#     month = request.GET.get("month", "").strip()
#     line_code = request.GET.get("line_code", "").strip()
#     station = request.GET.get("station", "").strip()

#     if not month or not line_code or not station:
#         return Response(
#             {"error": "month, line_code and station are required"},
#             status=400
#         )

#     qs = PassengerFlow.objects.filter(
#         month__iexact=month,
#         linename__iexact=line_code,
#         station_name__iexact=station
#     )

#     # Aggregate hour-wise data
#     hourly_data = (
#         qs.values("hour")
#         .annotate(
#             entry=Sum("entry"),
#             exit=Sum("exit")
#         )
#         .order_by("hour")
#     )

#     # Ensure 0–23 hours always exist (important for charts)
#     hour_map = {row["hour"]: row for row in hourly_data}

#     final_data = []
#     for h in range(24):
#         final_data.append({
#             "hour": f"{str(h).zfill(2)}:00",
#             "entry": hour_map.get(h, {}).get("entry", 0) or 0,
#             "exit": hour_map.get(h, {}).get("exit", 0) or 0,
#         })

#     return Response({
#         "station": station,
#         "month": month,
#         "line_code": line_code,
#         "data": final_data
#     })




# @api_view(["GET"])
# def station_summary(request):
#     month = request.GET.get("month", "").strip()
#     line_code = request.GET.get("line_code", "").strip()
#     station = request.GET.get("station", "").strip()

#     if not month or not line_code or not station:
#         return Response(
#             {"error": "month, line_code and station are required"},
#             status=400
#         )

#     qs = PassengerFlow.objects.filter(
#         month__iexact=month,
#         linename__iexact=line_code,
#         station_name__iexact=station
#     )

#     if not qs.exists():
#         return Response({
#             "station": station,
#             "month": month,
#             "line_code": line_code,
#             "total_entry": 0,
#             "total_exit": 0,
#             "peak_hour": "00",
#             "avg_hourly_flow": 0
#         })

#     totals = qs.aggregate(
#         total_entry=Sum("entry"),
#         total_exit=Sum("exit"),
#     )

#     total_entry = totals["total_entry"] or 0
#     total_exit = totals["total_exit"] or 0

#     hourly = (
#         qs.values("hour")
#         .annotate(total=Sum("entry") + Sum("exit"))
#         .order_by("-total")
#     )

#     peak_hour = hourly[0]["hour"] if hourly else 0

#     active_hours = qs.values("hour").distinct().count()
#     avg_hourly_flow = (
#         (total_entry + total_exit) // active_hours if active_hours else 0
#     )

#     return Response({
#         "station": station,
#         "month": month,
#         "line_code": line_code,
#         "total_entry": total_entry,
#         "total_exit": total_exit,
#         "peak_hour": peak_hour,
#         "avg_hourly_flow": avg_hourly_flow,
#     })


@api_view(["GET"])
def line_heatmap(request):
    month = request.GET.get("month")

    if not month:
        return Response({"error": "month is required"}, status=400)

    today_day = timezone.localdate().day

    qs = PassengerFlow.objects.annotate(
        day=ExtractDay("businessday")
    ).filter(
        month__iexact=month,
        day=today_day
    )

    heatmap_qs = (
        qs.values("linename", "hour")
        .annotate(entry=Sum("entry"), exit=Sum("exit"))
        .order_by("linename", "hour")
    )

    return Response([
        {
            "line_name": LINE_NAME_MAP.get(row["linename"], row["linename"]),
            "hour": row["hour"],
            "entry": row["entry"] or 0,
            "exit": row["exit"] or 0,
        }
        for row in heatmap_qs
    ])




@api_view(["GET"])
def top_busiest_stations(request):
    month = request.GET.get("month")
    line_code = request.GET.get("line_code")

    if not month or not line_code:
        return Response(
            {"error": "month and line_code are required"},
            status=400
        )

    today_day = timezone.localdate().day

    base_qs = PassengerFlow.objects.annotate(
        day=ExtractDay("businessday")
    ).filter(
        month__iexact=month,
        linename__iexact=line_code,
        day=today_day
    )

    stations = (
        base_qs.values("station_name")
        .annotate(
            total_entry=Sum("entry"),
            total_exit=Sum("exit"),
        )
    )

    stations = sorted(
        stations,
        key=lambda x: (x["total_entry"] or 0) + (x["total_exit"] or 0),
        reverse=True
    )[:10]

    result = []
    for s in stations:
        hourly = (
            base_qs.filter(station_name=s["station_name"])
            .values("hour")
            .annotate(total=Sum("entry") + Sum("exit"))
            .order_by("-total")
        )

        result.append({
            "station": s["station_name"],
            "total_entry": s["total_entry"] or 0,
            "total_exit": s["total_exit"] or 0,
            "peak_hour": hourly[0]["hour"] if hourly else 0,
        })

    return Response(result)


@api_view(["GET"])
def station_hourly_flow(request):
    month = request.GET.get("month", "").strip()
    line_code = request.GET.get("line_code", "").strip()
    station = request.GET.get("station", "").strip()

    if not month or not line_code or not station:
        return Response(
            {"error": "month, line_code and station are required"},
            status=400
        )

    today_day = timezone.localdate().day

    qs = PassengerFlow.objects.annotate(
        day=ExtractDay("businessday")
    ).filter(
        month__iexact=month,
        linename__iexact=line_code,
        station_name__iexact=station,
        day=today_day
    )

    hourly_data = (
        qs.values("hour")
        .annotate(entry=Sum("entry"), exit=Sum("exit"))
        .order_by("hour")
    )

    hour_map = {row["hour"]: row for row in hourly_data}

    final_data = [
        {
            "hour": f"{str(h).zfill(2)}:00",
            "entry": hour_map.get(h, {}).get("entry", 0),
            "exit": hour_map.get(h, {}).get("exit", 0),
        }
        for h in range(24)
    ]

    return Response({
        "station": station,
        "day": today_day,
        "data": final_data
    })


@api_view(["GET"])
def station_summary(request):
    month = request.GET.get("month", "").strip()
    line_code = request.GET.get("line_code", "").strip()
    station = request.GET.get("station", "").strip()

    if not month or not line_code or not station:
        return Response(
            {"error": "month, line_code and station are required"},
            status=400
        )

    today_day = timezone.localdate().day

    qs = PassengerFlow.objects.annotate(
        day=ExtractDay("businessday")
    ).filter(
        month__iexact=month,
        linename__iexact=line_code,
        station_name__iexact=station,
        day=today_day
    )

    if not qs.exists():
        return Response({
            "station": station,
            "day": today_day,
            "total_entry": 0,
            "total_exit": 0,
            "peak_hour": "00",
            "avg_hourly_flow": 0
        })

    totals = qs.aggregate(
        total_entry=Sum("entry"),
        total_exit=Sum("exit"),
    )

    hourly = (
        qs.values("hour")
        .annotate(total=Sum("entry") + Sum("exit"))
        .order_by("-total")
    )

    peak_hour = hourly[0]["hour"] if hourly else 0

    active_hours = qs.values("hour").distinct().count()

    return Response({
        "station": station,
        "day": today_day,
        "total_entry": totals["total_entry"] or 0,
        "total_exit": totals["total_exit"] or 0,
        "peak_hour": peak_hour,
        "avg_hourly_flow": (
            (totals["total_entry"] + totals["total_exit"]) // active_hours
            if active_hours else 0
        ),
    })


@api_view(["GET"])
def dashboard_summary(request):
    month = request.GET.get("month")
    line_code = request.GET.get("line_code")

    if not month or not line_code:
        return Response(
            {"error": "month and line_code are required"},
            status=400
        )

    today_day = timezone.localdate().day

    qs = PassengerFlow.objects.annotate(
        day=ExtractDay("businessday")
    ).filter(
        month__iexact=month,
        linename__iexact=line_code,
        day=today_day
    )

    data = qs.aggregate(
        total_entry=Sum("entry"),
        total_exit=Sum("exit"),
        total_stations=Count("station_name", distinct=True),
    )

    return Response({
        "day": today_day,
        "month": month,
        "line_code": line_code,
        "total_entry": data["total_entry"] or 0,
        "total_exit": data["total_exit"] or 0,
        "total_stations": data["total_stations"] or 0,
        "total_passengers": (data["total_entry"] or 0) + (data["total_exit"] or 0),
    })


# @api_view(["GET"])
# def dashboard_summary(request):
#     month = request.GET.get("month")
#     line_code = request.GET.get("line_code")

#     if not month or not line_code:
#         return Response(
#             {"error": "month and line_code are required"},
#             status=400
#         )

#     qs = PassengerFlow.objects.filter(
#         month=month,
#         linename=line_code   # ✅ LINE03
#     )

#     data = qs.aggregate(
#         total_entry=Sum("entry"),
#         total_exit=Sum("exit"),
#         total_stations=Count("station_name", distinct=True),
#     )

#     total_entry = data["total_entry"] or 0
#     total_exit = data["total_exit"] or 0

#     return Response({
#         "month": month,
#         "line_code": line_code,
#         "total_entry": total_entry,
#         "total_exit": total_exit,
#         "total_stations": data["total_stations"] or 0,
#         "total_passengers": total_entry + total_exit,
#     })




@api_view(["GET"])
def month_line_station_list(request):

    qs = PassengerFlow.objects.values(
        "month", "linename", "station_name"
    ).distinct()

    months = set()
    line_codes = set()
    line_names = {}
    stations_by_line = {}

    for row in qs:
        month = row["month"]
        line_code = row["linename"]
        station = row["station_name"]

        months.add(month)
        line_codes.add(line_code)

        # Line name map
        line_names[line_code] = LINE_NAME_MAP.get(line_code, line_code)

        # Build station mapping
        stations_by_line.setdefault(line_code, set()).add(station)

    return Response({
        "month": sorted(months),
        "lines": [
            {"line_code": code, "line_name": line_names[code]}
            for code in sorted(line_codes)
        ],
        "stations_by_line": {
            k: sorted(list(v)) for k, v in stations_by_line.items()
        }
    })











# Helper: Convert time string "HH:MM:SS" to seconds
def time_to_seconds(t):
    if not t or ':' not in t:
        return 0
    h, m, s = map(int, t.split(":"))
    return h * 3600 + m * 60 + s


# Pagination for large lists
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000


@api_view(["GET"])
def live_metro_positions(request):
    now = timezone.localtime().time()
    now_sec = now.hour * 3600 + now.minute * 60 + now.second

    today = timezone.localdate()
    start_time = datetime.combine(today, time(0, 0)) - timedelta(hours=4)
    end_time = datetime.combine(today, time(23, 59, 59)) + timedelta(hours=2)

    # Prefetch all necessary related data in ONE query per type
    trips = Trip.objects.select_related('route', 'shape_id').prefetch_related(
        'stoptime_set__stop'
    ).filter(
        stoptime__departure_time__isnull=False
    ).distinct()

    running_trains = []

    for trip in trips:
        stop_times = [st for st in trip.stoptime_set.all() if st.departure_time]
        if len(stop_times) < 2:
            continue

        # Sort once
        stop_times.sort(key=lambda x: x.stop_sequence)

        # Convert all times to seconds once per trip
        times_sec = [time_to_seconds(st.departure_time) for st in stop_times]

        # Find the segment where now_sec falls
        found = False
        for i in range(len(stop_times) - 1):
            t1_sec = times_sec[i]
            t2_sec = time_to_seconds(stop_times[i + 1].arrival_time or stop_times[i + 1].departure_time)

            if t1_sec <= now_sec <= t2_sec + 300:  # +5 min buffer for delays
                progress = (now_sec - t1_sec) / (t2_sec - t1_sec) if (t2_sec > t1_sec) else 0.0

                s1 = stop_times[i]
                s2 = stop_times[i + 1]

                lat = s1.stop.stop_lat + (s2.stop.stop_lat - s1.stop.stop_lat) * progress
                lon = s1.stop.stop_lon + (s2.stop.stop_lon - s1.stop.stop_lon) * progress

                running_trains.append({
                    "trip_id": trip.trip_id,
                    "route_id": trip.route.route_id,
                    "progress": round(progress * 100, 2),
                    "current_lat": round(lat, 6),
                    "current_lon": round(lon, 6),
                    "from_stop": s1.stop.stop_name,
                    "to_stop": s2.stop.stop_name,
                    "next_stop": s2.stop.stop_name,
                    "start_time": s1.departure_time,
                    "end_time": s2.arrival_time or s2.departure_time,
                })
                found = True
                break

        if len(running_trains) > 200:
            break

    return Response(running_trains)


@api_view(["GET"])
def metro_routes(request):
    cache_key = "metro_routes_full_data_v3"  # Bumped version to clear old cache
    cached_data = cache.get(cache_key)

    if cached_data is not None:
        return Response(cached_data)

    # Prefetch only valid relations
    routes = Route.objects.prefetch_related(
        'trip_set__stoptime_set__stop'  # This is valid
    ).all()

    # Pre-load all shapes into a dict: {shape_id: [points]}
    all_shapes = Shape.objects.all()
    shapes_dict = {}
    for pt in all_shapes:
        sid = pt.shape_id
        if sid not in shapes_dict:
            shapes_dict[sid] = []
        shapes_dict[sid].append(pt)

    # Sort points within each shape
    for sid in shapes_dict:
        shapes_dict[sid].sort(key=lambda x: x.shape_pt_sequence)

    COLOR_MAP = {
        "YELLOW": "#FFD500", "BLUE": "#1E90FF", "RED": "#FF0000", "GREEN": "#4CAF50",
        "VIOLET": "#7F3FBF", "MAGENTA": "#AA00FF", "PINK": "#E91E63", "GREY": "#A0A0A0",
        "RAPID": "#A0A0A0", "ORANGE": "#FF9800", "AQUA": "#00FFFF",
    }

    output = []

    for route in routes:
        # trip = route.trip_set.annotate(num_stops=Count('stoptime')).order_by('-num_stops').first()

        trip = route.trip_set.first()
        if not trip or not trip.shape_id:
            continue

        shape_id = trip.shape_id.shape_id  # This is correct: shape_id is a Shape object

        # Get pre-loaded and sorted shape points
        shape_points = shapes_dict.get(shape_id, [])
        if not shape_points:
            continue

        path = [[float(pt.shape_pt_lat), float(pt.shape_pt_lon)] for pt in shape_points]

        # Stations from prefetched stop times
        stop_times = trip.stoptime_set.order_by("stop_sequence")
        stations = [
            {
                "stop_id": st.stop.stop_id,
                "name": st.stop.stop_name,
                "lat": float(st.stop.stop_lat),
                "lon": float(st.stop.stop_lon),
            }
            for st in stop_times if st.stop
        ]

        if not stations:
            continue

        # Clean name and color
        clean_name = route.route_long_name
        color_key = "GREY"
        if route.route_long_name and "_" in route.route_long_name:
            parts = route.route_long_name.split("_", 1)
            color_key = parts[0].strip().upper()
            clean_name = parts[1].strip()

        line_color = COLOR_MAP.get(color_key, "#000000")

        output.append({
            "route_id": route.route_id,
            "name": clean_name,
            "color": line_color,
            "path": path,
            "stations": stations,
        })

    cache.set(cache_key, output, timeout=3600)
    return Response(output)
# Paginated List Views
class MetroStopList(generics.ListAPIView):
    queryset = Stop.objects.all().order_by('stop_id')
    serializer_class = StopSerializer
    pagination_class = StandardResultsSetPagination


class BusStopList(generics.ListAPIView):
    queryset = BusStop.objects.all().order_by('bus_stop_id')
    serializer_class = BusStopSerializer
    pagination_class = StandardResultsSetPagination


class RouteList(generics.ListAPIView):
    queryset = Route.objects.all().order_by('route_id')
    serializer_class = RouteSerializer
    pagination_class = StandardResultsSetPagination


@api_view(["GET"])
def get_route_shape(request, route_id):
    cache_key = f"route_shape_{route_id}"
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    trip = Trip.objects.filter(route_id=route_id).first()
    if not trip or not trip.shape_id:
        return Response({"route_id": route_id, "shape_path": []})

    shapes = Shape.objects.filter(shape_id=trip.shape_id.shape_id).order_by("shape_pt_sequence")
    serializer = ShapeSerializer(shapes, many=True)

    data = {
        "route_id": route_id,
        "shape_id": trip.shape_id.shape_id,
        "shape_path": serializer.data
    }
    cache.set(cache_key, data, timeout=86400)  # 24 hours
    return Response(data)


@api_view(["GET"])
def get_route_stops(request, route_id):
    cache_key = f"route_stops_{route_id}"
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    trip = Trip.objects.filter(route_id=route_id).first()
    if not trip:
        return Response({"route_id": route_id, "stops": []})

    stops = StopTime.objects.filter(trip=trip).order_by("stop_sequence").select_related("stop")
    serializer = StopTimeSerializer(stops, many=True)

    data = {
        "route_id": route_id,
        "stops": serializer.data
    }
    cache.set(cache_key, data, timeout=86400)
    return Response(data)