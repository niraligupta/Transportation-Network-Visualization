from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.utils import timezone
from rest_framework.response import Response
from ..models import  Stops
from ..serializers import (
    StopSerializer
)
from math import radians, cos, sin, asin, sqrt
today_day = timezone.localdate().day
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # meters
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    return 2 * R * asin(sqrt(a))


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



