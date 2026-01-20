from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, time, timedelta
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from ..models import  Stops, BusStop, Route, Shape, Trip, StopTime
from ..serializers import (
    StopSerializer, BusStopSerializer, RouteSerializer,
    ShapeSerializer, StopTimeSerializer
)




def time_to_seconds(t):
    if not t or ':' not in t:
        return 0
    h, m, s = map(int, t.split(":"))
    return h * 3600 + m * 60 + s

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

    trips = Trip.objects.select_related('route', 'shape_id').prefetch_related(
        'stoptime_set__stops'
    ).filter(
        stoptime__departure_time__isnull=False
    ).distinct()

    running_trains = []

    for trip in trips:
        stop_times = [st for st in trip.stoptime_set.all() if st.departure_time]
        if len(stop_times) < 2:
            continue

        stop_times.sort(key=lambda x: x.stop_sequence)

        times_sec = [time_to_seconds(st.departure_time) for st in stop_times]

        found = False
        for i in range(len(stop_times) - 1):
            t1_sec = times_sec[i]
            t2_sec = time_to_seconds(stop_times[i + 1].arrival_time or stop_times[i + 1].departure_time)

            if t1_sec <= now_sec <= t2_sec + 300:  # +5 min buffer for delays
                progress = (now_sec - t1_sec) / (t2_sec - t1_sec) if (t2_sec > t1_sec) else 0.0

                s1 = stop_times[i]
                s2 = stop_times[i + 1]

                lat = s1.stops.stop_lat + (s2.stops.stop_lat - s1.stops.stop_lat) * progress
                lon = s1.stops.stop_lon + (s2.stops.stop_lon - s1.stops.stop_lon) * progress

                running_trains.append({
                    "trip_id": trip.trip_id,
                    "route_id": trip.route.route_id,
                    "progress": round(progress * 100, 2),
                    "current_lat": round(lat, 6),
                    "current_lon": round(lon, 6),
                    "from_stop": s1.stops.stop_name,
                    "to_stop": s2.stops.stop_name,
                    "next_stop": s2.stops.stop_name,
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
    cache_key = "metro_routes_full_data_v3"  
    cached_data = cache.get(cache_key)

    if cached_data is not None:
        return Response(cached_data)

    routes = Route.objects.prefetch_related(
        'trip_set__stoptime_set__stops' 
    ).all()

    all_shapes = Shape.objects.all()
    shapes_dict = {}
    for pt in all_shapes:
        sid = pt.shape_id
        if sid not in shapes_dict:
            shapes_dict[sid] = []
        shapes_dict[sid].append(pt)


    for sid in shapes_dict:
        shapes_dict[sid].sort(key=lambda x: x.shape_pt_sequence)

    COLOR_MAP = {
        "YELLOW": "#FFD500", "BLUE": "#1E90FF", "RED": "#FF0000", "GREEN": "#4CAF50",
        "VIOLET": "#7F3FBF", "MAGENTA": "#AA00FF", "PINK": "#E91E63", "GREY": "#A0A0A0",
        "RAPID": "#A0A0A0", "ORANGE": "#FF9800", "AQUA": "#00FFFF",
    }

    output = []

    for route in routes:
        trip = route.trip_set.first()
        if not trip or not trip.shape_id:
            continue

        shape_id = trip.shape_id.shape_id  

        shape_points = shapes_dict.get(shape_id, [])
        if not shape_points:
            continue

        path = [[float(pt.shape_pt_lat), float(pt.shape_pt_lon)] for pt in shape_points]

        stop_times = trip.stoptime_set.order_by("stop_sequence")
        stations = [
            {
                "stop_id": st.stops.stop_id,
                "name": st.stops.stop_name,
                "lat": float(st.stops.stop_lat),
                "lon": float(st.stops.stop_lon),
            }
            for st in stop_times if st.stops
        ]

        if not stations:
            continue

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
    queryset = Stops.objects.all().order_by('stop_id')
    serializer_class = StopSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["stop_name"]




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

