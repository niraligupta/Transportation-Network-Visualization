from rest_framework.response import Response
from rest_framework.decorators import api_view
from ..models import ODPassengerFlow, Stops


@api_view(["GET"])
def od_flow_months(request):
    months = (
        ODPassengerFlow.objects
        .values_list("month", flat=True)
        .distinct()
        .order_by("month")
    )

    def format_month_label(month_str):
        try:
            return f"{month_str[:3]} 20{month_str[3:]}"
        except Exception:
            return month_str

    return Response([
        {
            "value": m,                  
            "label": format_month_label(m)  
        }
        for m in months
    ])


@api_view(["GET"])
def od_flow_api(request):
    month = request.GET.get("month", "").strip()
    if not month:
        return Response({"error": "month is required"}, status=400)
    qs = ODPassengerFlow.objects.filter(month__iexact=month)

    if not qs.exists():
        return Response({"arcs": [], "maxPassengers": 0})
    stops_map = {
        s.station_code.strip(): s
        for s in Stops.objects.only(
            "station_code",
            "stop_name",
            "stop_lat",
            "stop_lon",
            "line",
            "line_color",
        )
    }

    arcs = []
    max_passengers = 0
    for row in qs:
        origin_code = row.origin_station.strip()
        dest_code = row.destination_station.strip()

        o = stops_map.get(origin_code)
        d = stops_map.get(dest_code)
        if not o or not d:
            continue

        max_passengers = max(max_passengers, row.passengers)

        arcs.append({
            "origin": {
                "code": origin_code,
                "name": o.stop_name, 
                "lat": o.stop_lat,
                "lng": o.stop_lon,
                "line": o.line,
                "line_color": o.line_color,
            },
            "destination": {
                "code": dest_code,
                "name": d.stop_name, 
                "lat": d.stop_lat, 
                "lng": d.stop_lon,
                "line": d.line,
                "line_color": d.line_color,
            },
            "value": row.passengers,
        })

    return Response({
        "arcs": arcs,
        "maxPassengers": max_passengers,
    })
