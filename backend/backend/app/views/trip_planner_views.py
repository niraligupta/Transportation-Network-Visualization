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
from django.db.models import Q

from django.db import connection
today_day = timezone.localdate().day

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

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # meters
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    return 2 * R * asin(sqrt(a))


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


class PlanTripView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from_location = request.data.get("from_location", "").strip()
        to_location = request.data.get("to_location", "").strip()

        if not from_location or not to_location:
            return Response({"error": "from_location and to_location are required"}, status=400)

        from_stop = Stops.objects.filter(stop_name__icontains=from_location).first()
        to_stop = Stops.objects.filter(stop_name__icontains=to_location).first()

        if not from_stop or not to_stop:
            return Response({"error": "Stop not found"}, status=404)

        results = []

        direct_rows = find_direct_trips(from_stop.id, to_stop.id)

        if direct_rows:
            for trip_id, start_time, end_time in direct_rows:
                trip = Trip.objects.select_related("route", "shape_id").get(trip_id=trip_id)

                duration = max(
                    1,
                    int(
                        (datetime.strptime(end_time, "%H:%M:%S")
                         - datetime.strptime(start_time, "%H:%M:%S")).total_seconds() / 60
                    )
                )

                color_key, clean_name = (
                    trip.route.route_long_name.split("_", 1)
                    if "_" in (trip.route.route_long_name or "")
                    else ("GRAY", trip.route.route_long_name or "")
                )

                results.append({
                    "trip_id": trip_id,
                    "duration": duration,
                    "start_time": start_time,
                    "end_time": end_time,
                    "segments": [
                        {
                            "mode": "metro",
                            "route_color": color_key,
                            "route_name": clean_name,
                            "on_stop": from_stop.stop_name,
                            "off_stop": to_stop.stop_name,
                            "shape": get_shape_points(trip.shape_id),
                        }
                    ],
                })

            return Response({"trips": results})

        interchanges = find_interchanges(from_stop.line, to_stop.line)

        for interchange in interchanges:
            first_leg = find_direct_trips(from_stop.id, interchange.id, limit=1)
            second_leg = find_direct_trips(interchange.id, to_stop.id, limit=1)

            if not first_leg or not second_leg:
                continue

            (t1, s1, e1) = first_leg[0]
            (t2, s2, e2) = second_leg[0]

            trip1 = Trip.objects.select_related("route", "shape_id").get(trip_id=t1)
            trip2 = Trip.objects.select_related("route", "shape_id").get(trip_id=t2)

            total_duration = (
                (datetime.strptime(e1, "%H:%M:%S") - datetime.strptime(s1, "%H:%M:%S")) +
                (datetime.strptime(e2, "%H:%M:%S") - datetime.strptime(s2, "%H:%M:%S"))
            ).seconds // 60

            results.append({
                "trip_id": f"{t1}+{t2}",
                "duration": total_duration,
                "start_time": s1,
                "end_time": e2,
                "segments": [
                    {
                        "mode": "metro",
                        "route_color": trip1.route.route_long_name.split("_")[0],
                        "route_name": trip1.route.route_long_name.split("_")[-1],
                        "on_stop": from_stop.stop_name,
                        "off_stop": interchange.stop_name,
                        "shape": get_shape_points(trip1.shape_id),
                    },
                    {
                        "mode": "metro",
                        "route_color": trip2.route.route_long_name.split("_")[0],
                        "route_name": trip2.route.route_long_name.split("_")[-1],
                        "on_stop": interchange.stop_name,
                        "off_stop": to_stop.stop_name,
                        "shape": get_shape_points(trip2.shape_id),
                    },
                ],
            })

            break 

        return Response({"trips": results})


class NearestStopView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            lat = float(request.GET["lat"])
            lon = float(request.GET["lon"])
        except (KeyError, ValueError):
            return Response({"error": "Invalid coordinates"}, status=400)

        radius = 0.02  
        candidates = Stops.objects.filter(
            stop_lat__range=(lat - radius, lat + radius),
            stop_lon__range=(lon - radius, lon + radius),
        )

        nearest = None
        min_dist = float("inf")

        for s in candidates:
            d = haversine(lat, lon, s.stop_lat, s.stop_lon)
            if d < min_dist:
                min_dist = d
                nearest = s

        if not nearest:
            return Response({"error": "No nearby stops found"}, status=404)

        return Response({
            "stop_id": nearest.stop_id,
            "name": nearest.stop_name,   
            "lat": nearest.stop_lat,
            "lon": nearest.stop_lon,
            "distance_m": round(min_dist, 1),
        })




    def get(self, request):
        try:
            lat = float(request.GET["lat"])
            lon = float(request.GET["lon"])
        except (KeyError, ValueError):
            return Response({"error": "Invalid coordinates"}, status=400)


        radius = 0.02 
        candidates = Stops.objects.filter(
            stop_lat__range=(lat - radius, lat + radius),
            stop_lon__range=(lon - radius, lon + radius)
        )

        nearest = None
        min_dist = float("inf")

        for s in candidates:
            d = haversine(lat, lon, s.stop_lat, s.stop_lon)
            if d < min_dist:
                min_dist = d
                nearest = s

        if not nearest:
            return Response({"error": "No nearby stops found"}, status=404)

        return Response({
            "stop_id": nearest.stop_id,
            "stop_name": nearest.stop_name,
            "lat": nearest.stop_lat,
            "lon": nearest.stop_lon,
            "distance_m": round(min_dist, 1)
        })



