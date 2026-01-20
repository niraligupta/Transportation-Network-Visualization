from django.utils import timezone
from rest_framework.response import Response
from rest_framework.decorators import api_view
from ..models import  Stops, PassengerFlow
from django.db.models import Sum
from django.db.models.functions import ExtractDay
today_day = timezone.localdate().day


@api_view(["GET"])
def passenger_flow_api(request):
    month = request.GET.get("month", "").strip()
    if not month:
        return Response({"error": "month is required"}, status=400)

    qs = (
        PassengerFlow.objects
        .annotate(day=ExtractDay("businessday"))
        .filter(month__iexact=month, day=today_day)
    )

    if not qs.exists():
        return Response({"stations": [], "hourlyData": {}, "maxFlow": 0})

    station_names = qs.values_list("station_name", flat=True).distinct()

    stops_qs = Stops.objects.filter(
        stop_name__in=station_names
    ).only(
        "stop_name", "stop_lat", "stop_lon", "line", "line_color"
    )

    stations = []

    for idx, stop in enumerate(stops_qs):
        stations.append({
            "id": str(idx + 1),
            "name": stop.stop_name,
            "lat": stop.stop_lat,
            "lon": stop.stop_lon,
            "line": stop.line,
            "line_color": stop.line_color,
        })

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

