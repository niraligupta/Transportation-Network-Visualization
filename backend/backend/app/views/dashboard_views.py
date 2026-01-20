
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.decorators import api_view
from ..models import  Stops,PassengerFlow

from django.db.models import Sum, Count
from ..utils.line_mapper import LINE_NAME_MAP
from django.db.models.functions import ExtractDay

today_day = timezone.localdate().day


@api_view(["GET"])
def line_heatmap(request):
    month = request.GET.get("month", "").strip()
    if not month:
        return Response({"error": "month is required"}, status=400)

    qs = (
        PassengerFlow.objects
        .annotate(day=ExtractDay("businessday"))
        .filter(month__iexact=month, day=today_day)
    )

    if not qs.exists():
        return Response([])

    stops_line_color_map = {
        str(s.line).strip(): s.line_color
        for s in Stops.objects.exclude(line_color__isnull=True)
        .only("line", "line_color")
        .distinct("line")
    }
    heatmap_qs = (
        qs.values("linename", "hour")
        .annotate(
            entry=Sum("entry"),
            exit=Sum("exit")
        )
        .order_by("linename", "hour")
    )

    response = []

    for row in heatmap_qs:
        line_code = row["linename"]         
        numeric_line = line_code.replace("LINE", "").lstrip("0") 

        response.append({
            "line": line_code,
            "line_color": stops_line_color_map.get(numeric_line, "#9ca3af"),
            "hour": row["hour"],
            "entry": row["entry"] or 0,
            "exit": row["exit"] or 0,
        })

    return Response(response)



@api_view(["GET"])
def top_busiest_stations(request):
    month = request.GET.get("month", "").strip()
    line_code = request.GET.get("line_code", "").strip()

    if not month or not line_code:
        return Response(
            {"error": "month and line_code are required"},
            status=400
        )
    base_qs = (
        PassengerFlow.objects
        .annotate(day=ExtractDay("businessday"))
        .filter(
            month__iexact=month,
            linename__iexact=line_code,
            day=today_day
        )
    )

    if not base_qs.exists():
        return Response([])
    station_totals = (
        base_qs.values("station_name")
        .annotate(
            total_entry=Sum("entry"),
            total_exit=Sum("exit"),
            total_passengers=Sum("entry") + Sum("exit"),
        )
        .order_by("-total_passengers")[:10]
    )
    result = []

    for row in station_totals:
        peak = (
            base_qs.filter(station_name=row["station_name"])
            .values("hour")
            .annotate(total=Sum("entry") + Sum("exit"))
            .order_by("-total")
            .first()
        )

        result.append({
            "station": row["station_name"],
            "total_entry": row["total_entry"] or 0,
            "total_exit": row["total_exit"] or 0,
            "total_passengers": row["total_passengers"] or 0,
            "peak_hour": peak["hour"] if peak else 0,
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



