# from django.shortcuts import render
# from math import radians, cos, sin, asin, sqrt
# from rest_framework.views import APIView
# from rest_framework.permissions import AllowAny
# from django.core.cache import cache
# from django.utils import timezone
# from datetime import datetime, time, timedelta
# from rest_framework import generics, filters
# from rest_framework.response import Response
# from rest_framework.decorators import api_view
# from rest_framework.pagination import PageNumberPagination
# from .models import ODPassengerFlow, Stops, BusStop, Route, Shape, Trip, StopTime,PassengerFlow
# from .serializers import (
#     StopSerializer, BusStopSerializer, RouteSerializer,
#     ShapeSerializer, StopTimeSerializer
# )
# from django.db.models import Q

# from django.db.models import Sum, Count
# from .utils.line_mapper import LINE_NAME_MAP,LINE_COLOR_MAP
# from django.db.models.functions import ExtractDay
# from django.db import connection
# today_day = timezone.localdate().day



# @api_view(["GET"])
# def od_flow_months(request):
#     months = (
#         ODPassengerFlow.objects
#         .values_list("month", flat=True)
#         .distinct()
#         .order_by("month")
#     )

#     def format_month_label(month_str):
#         # Jan21 -> Jan 2021
#         try:
#             return f"{month_str[:3]} 20{month_str[3:]}"
#         except Exception:
#             return month_str

#     return Response([
#         {
#             "value": m,                  # Jan21
#             "label": format_month_label(m)  # Jan 2021
#         }
#         for m in months
#     ])


# @api_view(["GET"])
# def od_flow_api(request):
#     month = request.GET.get("month", "").strip()
#     if not month:
#         return Response({"error": "month is required"}, status=400)
#     qs = ODPassengerFlow.objects.filter(month__iexact=month)

#     if not qs.exists():
#         return Response({"arcs": [], "maxPassengers": 0})
#     stops_map = {
#         s.station_code.strip(): s
#         for s in Stops.objects.only(
#             "station_code",
#             "stop_name",
#             "stop_lat",
#             "stop_lon",
#             "line",
#             "line_color",
#         )
#     }

#     arcs = []
#     max_passengers = 0
#     for row in qs:
#         origin_code = row.origin_station.strip()
#         dest_code = row.destination_station.strip()

#         o = stops_map.get(origin_code)
#         d = stops_map.get(dest_code)
#         if not o or not d:
#             continue

#         max_passengers = max(max_passengers, row.passengers)

#         arcs.append({
#             "origin": {
#                 "code": origin_code,
#                 "name": o.stop_name, 
#                 "lat": o.stop_lat,
#                 "lng": o.stop_lon,
#                 "line": o.line,
#                 "line_color": o.line_color,
#             },
#             "destination": {
#                 "code": dest_code,
#                 "name": d.stop_name, 
#                 "lat": d.stop_lat, 
#                 "lng": d.stop_lon,
#                 "line": d.line,
#                 "line_color": d.line_color,
#             },
#             "value": row.passengers,
#         })

#     return Response({
#         "arcs": arcs,
#         "maxPassengers": max_passengers,
#     })




# @api_view(["GET"])
# def passenger_flow_api(request):
#     month = request.GET.get("month", "").strip()
#     if not month:
#         return Response({"error": "month is required"}, status=400)

#     qs = (
#         PassengerFlow.objects
#         .annotate(day=ExtractDay("businessday"))
#         .filter(month__iexact=month, day=today_day)
#     )

#     if not qs.exists():
#         return Response({"stations": [], "hourlyData": {}, "maxFlow": 0})

#     station_names = qs.values_list("station_name", flat=True).distinct()

#     stops_qs = Stops.objects.filter(
#         stop_name__in=station_names
#     ).only(
#         "stop_name", "stop_lat", "stop_lon", "line", "line_color"
#     )

#     stations = []

#     for idx, stop in enumerate(stops_qs):
#         stations.append({
#             "id": str(idx + 1),
#             "name": stop.stop_name,
#             "lat": stop.stop_lat,
#             "lon": stop.stop_lon,
#             "line": stop.line,
#             "line_color": stop.line_color,
#         })

#     hourly_data = {}
#     max_flow = 0

#     for hour in range(24):
#         hour_qs = (
#             qs.filter(hour=hour)
#             .values("station_name")
#             .annotate(
#                 entry=Sum("entry"),
#                 exit=Sum("exit")
#             )
#         )

#         key = f"{month}-{hour}"
#         hourly_data[key] = []

#         for row in hour_qs:
#             total = (row["entry"] or 0) + (row["exit"] or 0)
#             max_flow = max(max_flow, total)

#             hourly_data[key].append({
#                 "station": row["station_name"],
#                 "entry": row["entry"] or 0,
#                 "exit": row["exit"] or 0,
#             })

#     return Response({
#         "stations": stations,
#         "hourlyData": hourly_data,
#         "maxFlow": max_flow,
#     })




# @api_view(["GET"])
# def line_heatmap(request):
#     month = request.GET.get("month", "").strip()
#     if not month:
#         return Response({"error": "month is required"}, status=400)

#     qs = (
#         PassengerFlow.objects
#         .annotate(day=ExtractDay("businessday"))
#         .filter(month__iexact=month, day=today_day)
#     )

#     if not qs.exists():
#         return Response([])

#     stops_line_color_map = {
#         str(s.line).strip(): s.line_color
#         for s in Stops.objects.exclude(line_color__isnull=True)
#         .only("line", "line_color")
#         .distinct("line")
#     }
#     heatmap_qs = (
#         qs.values("linename", "hour")
#         .annotate(
#             entry=Sum("entry"),
#             exit=Sum("exit")
#         )
#         .order_by("linename", "hour")
#     )

#     response = []

#     for row in heatmap_qs:
#         line_code = row["linename"]         
#         numeric_line = line_code.replace("LINE", "").lstrip("0") 

#         response.append({
#             "line": line_code,
#             "line_color": stops_line_color_map.get(numeric_line, "#9ca3af"),
#             "hour": row["hour"],
#             "entry": row["entry"] or 0,
#             "exit": row["exit"] or 0,
#         })

#     return Response(response)



# @api_view(["GET"])
# def top_busiest_stations(request):
#     month = request.GET.get("month", "").strip()
#     line_code = request.GET.get("line_code", "").strip()

#     if not month or not line_code:
#         return Response(
#             {"error": "month and line_code are required"},
#             status=400
#         )
#     base_qs = (
#         PassengerFlow.objects
#         .annotate(day=ExtractDay("businessday"))
#         .filter(
#             month__iexact=month,
#             linename__iexact=line_code,
#             day=today_day
#         )
#     )

#     if not base_qs.exists():
#         return Response([])
#     station_totals = (
#         base_qs.values("station_name")
#         .annotate(
#             total_entry=Sum("entry"),
#             total_exit=Sum("exit"),
#             total_passengers=Sum("entry") + Sum("exit"),
#         )
#         .order_by("-total_passengers")[:10]
#     )
#     result = []

#     for row in station_totals:
#         peak = (
#             base_qs.filter(station_name=row["station_name"])
#             .values("hour")
#             .annotate(total=Sum("entry") + Sum("exit"))
#             .order_by("-total")
#             .first()
#         )

#         result.append({
#             "station": row["station_name"],
#             "total_entry": row["total_entry"] or 0,
#             "total_exit": row["total_exit"] or 0,
#             "total_passengers": row["total_passengers"] or 0,
#             "peak_hour": peak["hour"] if peak else 0,
#         })

#     return Response(result)


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
#     qs = PassengerFlow.objects.annotate(
#         day=ExtractDay("businessday")
#     ).filter(
#         month__iexact=month,
#         linename__iexact=line_code,
#         station_name__iexact=station,
#         day=today_day
#     )

#     hourly_data = (
#         qs.values("hour")
#         .annotate(entry=Sum("entry"), exit=Sum("exit"))
#         .order_by("hour")
#     )

#     hour_map = {row["hour"]: row for row in hourly_data}

#     final_data = [
#         {
#             "hour": f"{str(h).zfill(2)}:00",
#             "entry": hour_map.get(h, {}).get("entry", 0),
#             "exit": hour_map.get(h, {}).get("exit", 0),
#         }
#         for h in range(24)
#     ]

#     return Response({
#         "station": station,
#         "day": today_day,
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

#     qs = PassengerFlow.objects.annotate(
#         day=ExtractDay("businessday")
#     ).filter(
#         month__iexact=month,
#         linename__iexact=line_code,
#         station_name__iexact=station,
#         day=today_day
#     )

#     if not qs.exists():
#         return Response({
#             "station": station,
#             "day": today_day,
#             "total_entry": 0,
#             "total_exit": 0,
#             "peak_hour": "00",
#             "avg_hourly_flow": 0
#         })

#     totals = qs.aggregate(
#         total_entry=Sum("entry"),
#         total_exit=Sum("exit"),
#     )

#     hourly = (
#         qs.values("hour")
#         .annotate(total=Sum("entry") + Sum("exit"))
#         .order_by("-total")
#     )

#     peak_hour = hourly[0]["hour"] if hourly else 0

#     active_hours = qs.values("hour").distinct().count()

#     return Response({
#         "station": station,
#         "day": today_day,
#         "total_entry": totals["total_entry"] or 0,
#         "total_exit": totals["total_exit"] or 0,
#         "peak_hour": peak_hour,
#         "avg_hourly_flow": (
#             (totals["total_entry"] + totals["total_exit"]) // active_hours
#             if active_hours else 0
#         ),
#     })


# @api_view(["GET"])
# def dashboard_summary(request):
#     month = request.GET.get("month")
#     line_code = request.GET.get("line_code")

#     if not month or not line_code:
#         return Response(
#             {"error": "month and line_code are required"},
#             status=400
#         )

#     today_day = timezone.localdate().day

#     qs = PassengerFlow.objects.annotate(
#         day=ExtractDay("businessday")
#     ).filter(
#         month__iexact=month,
#         linename__iexact=line_code,
#         day=today_day
#     )

#     data = qs.aggregate(
#         total_entry=Sum("entry"),
#         total_exit=Sum("exit"),
#         total_stations=Count("station_name", distinct=True),
#     )

#     return Response({
#         "day": today_day,
#         "month": month,
#         "line_code": line_code,
#         "total_entry": data["total_entry"] or 0,
#         "total_exit": data["total_exit"] or 0,
#         "total_stations": data["total_stations"] or 0,
#         "total_passengers": (data["total_entry"] or 0) + (data["total_exit"] or 0),
#     })






# @api_view(["GET"])
# def month_line_station_list(request):

#     qs = PassengerFlow.objects.values(
#         "month", "linename", "station_name"
#     ).distinct()

#     months = set()
#     line_codes = set()
#     line_names = {}
#     stations_by_line = {}

#     for row in qs:
#         month = row["month"]
#         line_code = row["linename"]
#         station = row["station_name"]

#         months.add(month)
#         line_codes.add(line_code)

#         # Line name map
#         line_names[line_code] = LINE_NAME_MAP.get(line_code, line_code)

#         # Build station mapping
#         stations_by_line.setdefault(line_code, set()).add(station)

#     return Response({
#         "month": sorted(months),
#         "lines": [
#             {"line_code": code, "line_name": line_names[code]}
#             for code in sorted(line_codes)
#         ],
#         "stations_by_line": {
#             k: sorted(list(v)) for k, v in stations_by_line.items()
#         }
#     })


# # Helper: Convert time string "HH:MM:SS" to seconds
# def time_to_seconds(t):
#     if not t or ':' not in t:
#         return 0
#     h, m, s = map(int, t.split(":"))
#     return h * 3600 + m * 60 + s


# # Pagination for large lists
# class StandardResultsSetPagination(PageNumberPagination):
#     page_size = 100
#     page_size_query_param = 'page_size'
#     max_page_size = 1000


# @api_view(["GET"])
# def live_metro_positions(request):
#     now = timezone.localtime().time()
#     now_sec = now.hour * 3600 + now.minute * 60 + now.second

#     today = timezone.localdate()
#     start_time = datetime.combine(today, time(0, 0)) - timedelta(hours=4)
#     end_time = datetime.combine(today, time(23, 59, 59)) + timedelta(hours=2)

#     trips = Trip.objects.select_related('route', 'shape_id').prefetch_related(
#         'stoptime_set__stops'
#     ).filter(
#         stoptime__departure_time__isnull=False
#     ).distinct()

#     running_trains = []

#     for trip in trips:
#         stop_times = [st for st in trip.stoptime_set.all() if st.departure_time]
#         if len(stop_times) < 2:
#             continue

#         stop_times.sort(key=lambda x: x.stop_sequence)

#         times_sec = [time_to_seconds(st.departure_time) for st in stop_times]

#         found = False
#         for i in range(len(stop_times) - 1):
#             t1_sec = times_sec[i]
#             t2_sec = time_to_seconds(stop_times[i + 1].arrival_time or stop_times[i + 1].departure_time)

#             if t1_sec <= now_sec <= t2_sec + 300:  # +5 min buffer for delays
#                 progress = (now_sec - t1_sec) / (t2_sec - t1_sec) if (t2_sec > t1_sec) else 0.0

#                 s1 = stop_times[i]
#                 s2 = stop_times[i + 1]

#                 lat = s1.stops.stop_lat + (s2.stops.stop_lat - s1.stops.stop_lat) * progress
#                 lon = s1.stops.stop_lon + (s2.stops.stop_lon - s1.stops.stop_lon) * progress

#                 running_trains.append({
#                     "trip_id": trip.trip_id,
#                     "route_id": trip.route.route_id,
#                     "progress": round(progress * 100, 2),
#                     "current_lat": round(lat, 6),
#                     "current_lon": round(lon, 6),
#                     "from_stop": s1.stops.stop_name,
#                     "to_stop": s2.stops.stop_name,
#                     "next_stop": s2.stops.stop_name,
#                     "start_time": s1.departure_time,
#                     "end_time": s2.arrival_time or s2.departure_time,
#                 })
#                 found = True
#                 break

#         if len(running_trains) > 200:
#             break

#     return Response(running_trains)


# @api_view(["GET"])
# def metro_routes(request):
#     cache_key = "metro_routes_full_data_v3"  
#     cached_data = cache.get(cache_key)

#     if cached_data is not None:
#         return Response(cached_data)

#     routes = Route.objects.prefetch_related(
#         'trip_set__stoptime_set__stops' 
#     ).all()

#     all_shapes = Shape.objects.all()
#     shapes_dict = {}
#     for pt in all_shapes:
#         sid = pt.shape_id
#         if sid not in shapes_dict:
#             shapes_dict[sid] = []
#         shapes_dict[sid].append(pt)


#     for sid in shapes_dict:
#         shapes_dict[sid].sort(key=lambda x: x.shape_pt_sequence)

#     COLOR_MAP = {
#         "YELLOW": "#FFD500", "BLUE": "#1E90FF", "RED": "#FF0000", "GREEN": "#4CAF50",
#         "VIOLET": "#7F3FBF", "MAGENTA": "#AA00FF", "PINK": "#E91E63", "GREY": "#A0A0A0",
#         "RAPID": "#A0A0A0", "ORANGE": "#FF9800", "AQUA": "#00FFFF",
#     }

#     output = []

#     for route in routes:
#         trip = route.trip_set.first()
#         if not trip or not trip.shape_id:
#             continue

#         shape_id = trip.shape_id.shape_id  

#         shape_points = shapes_dict.get(shape_id, [])
#         if not shape_points:
#             continue

#         path = [[float(pt.shape_pt_lat), float(pt.shape_pt_lon)] for pt in shape_points]

#         stop_times = trip.stoptime_set.order_by("stop_sequence")
#         stations = [
#             {
#                 "stop_id": st.stops.stop_id,
#                 "name": st.stops.stop_name,
#                 "lat": float(st.stops.stop_lat),
#                 "lon": float(st.stops.stop_lon),
#             }
#             for st in stop_times if st.stops
#         ]

#         if not stations:
#             continue

#         clean_name = route.route_long_name
#         color_key = "GREY"
#         if route.route_long_name and "_" in route.route_long_name:
#             parts = route.route_long_name.split("_", 1)
#             color_key = parts[0].strip().upper()
#             clean_name = parts[1].strip()

#         line_color = COLOR_MAP.get(color_key, "#000000")

#         output.append({
#             "route_id": route.route_id,
#             "name": clean_name,
#             "color": line_color,
#             "path": path,
#             "stations": stations,
#         })

#     cache.set(cache_key, output, timeout=3600)
#     return Response(output)


# # Paginated List Views
# class MetroStopList(generics.ListAPIView):
#     queryset = Stops.objects.all().order_by('stop_id')
#     serializer_class = StopSerializer
#     pagination_class = StandardResultsSetPagination
#     filter_backends = [filters.SearchFilter]
#     search_fields = ["stop_name"]

# def haversine(lat1, lon1, lat2, lon2):
#     R = 6371000  # meters
#     dlat = radians(lat2 - lat1)
#     dlon = radians(lon2 - lon1)

#     a = (
#         sin(dlat / 2) ** 2
#         + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
#     )
#     return 2 * R * asin(sqrt(a))


# def find_interchanges(from_line, to_line):
#     return Stops.objects.filter(
#         interchange=True
#     ).filter(
#         Q(interchange_between__icontains=from_line) &
#         Q(interchange_between__icontains=to_line)
#     )


# def find_direct_trips(from_stop_id, to_stop_id, limit=5):
#     table = StopTime._meta.db_table

#     sql = f"""
#     SELECT st1.trip_id,
#            st1.departure_time,
#            st2.arrival_time
#     FROM {table} st1
#     JOIN {table} st2 ON st1.trip_id = st2.trip_id
#     WHERE st1.stops_id = %s
#       AND st2.stops_id = %s
#       AND st2.stop_sequence > st1.stop_sequence
#       AND st1.departure_time IS NOT NULL
#       AND st2.arrival_time IS NOT NULL
#     ORDER BY st1.departure_time
#     LIMIT {limit};
#     """

#     with connection.cursor() as cursor:
#         cursor.execute(sql, [from_stop_id, to_stop_id])
#         return cursor.fetchall()




# def get_shape_points(shape_obj):
#     if not shape_obj:
#         return []

#     shapes = (
#         Shape.objects
#         .filter(shape_id=shape_obj.shape_id)
#         .order_by("shape_pt_sequence")
#         .only("shape_pt_lat", "shape_pt_lon")
#     )

#     return [
#         [float(pt.shape_pt_lat), float(pt.shape_pt_lon)]
#         for pt in shapes
#     ]


# class PlanTripView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         from_location = request.data.get("from_location", "").strip()
#         to_location = request.data.get("to_location", "").strip()

#         if not from_location or not to_location:
#             return Response({"error": "from_location and to_location are required"}, status=400)

#         from_stop = Stops.objects.filter(stop_name__icontains=from_location).first()
#         to_stop = Stops.objects.filter(stop_name__icontains=to_location).first()

#         if not from_stop or not to_stop:
#             return Response({"error": "Stop not found"}, status=404)

#         results = []

#         direct_rows = find_direct_trips(from_stop.id, to_stop.id)

#         if direct_rows:
#             for trip_id, start_time, end_time in direct_rows:
#                 trip = Trip.objects.select_related("route", "shape_id").get(trip_id=trip_id)

#                 duration = max(
#                     1,
#                     int(
#                         (datetime.strptime(end_time, "%H:%M:%S")
#                          - datetime.strptime(start_time, "%H:%M:%S")).total_seconds() / 60
#                     )
#                 )

#                 color_key, clean_name = (
#                     trip.route.route_long_name.split("_", 1)
#                     if "_" in (trip.route.route_long_name or "")
#                     else ("GRAY", trip.route.route_long_name or "")
#                 )

#                 results.append({
#                     "trip_id": trip_id,
#                     "duration": duration,
#                     "start_time": start_time,
#                     "end_time": end_time,
#                     "segments": [
#                         {
#                             "mode": "metro",
#                             "route_color": color_key,
#                             "route_name": clean_name,
#                             "on_stop": from_stop.stop_name,
#                             "off_stop": to_stop.stop_name,
#                             "shape": get_shape_points(trip.shape_id),
#                         }
#                     ],
#                 })

#             return Response({"trips": results})

#         interchanges = find_interchanges(from_stop.line, to_stop.line)

#         for interchange in interchanges:
#             first_leg = find_direct_trips(from_stop.id, interchange.id, limit=1)
#             second_leg = find_direct_trips(interchange.id, to_stop.id, limit=1)

#             if not first_leg or not second_leg:
#                 continue

#             (t1, s1, e1) = first_leg[0]
#             (t2, s2, e2) = second_leg[0]

#             trip1 = Trip.objects.select_related("route", "shape_id").get(trip_id=t1)
#             trip2 = Trip.objects.select_related("route", "shape_id").get(trip_id=t2)

#             total_duration = (
#                 (datetime.strptime(e1, "%H:%M:%S") - datetime.strptime(s1, "%H:%M:%S")) +
#                 (datetime.strptime(e2, "%H:%M:%S") - datetime.strptime(s2, "%H:%M:%S"))
#             ).seconds // 60

#             results.append({
#                 "trip_id": f"{t1}+{t2}",
#                 "duration": total_duration,
#                 "start_time": s1,
#                 "end_time": e2,
#                 "segments": [
#                     {
#                         "mode": "metro",
#                         "route_color": trip1.route.route_long_name.split("_")[0],
#                         "route_name": trip1.route.route_long_name.split("_")[-1],
#                         "on_stop": from_stop.stop_name,
#                         "off_stop": interchange.stop_name,
#                         "shape": get_shape_points(trip1.shape_id),
#                     },
#                     {
#                         "mode": "metro",
#                         "route_color": trip2.route.route_long_name.split("_")[0],
#                         "route_name": trip2.route.route_long_name.split("_")[-1],
#                         "on_stop": interchange.stop_name,
#                         "off_stop": to_stop.stop_name,
#                         "shape": get_shape_points(trip2.shape_id),
#                     },
#                 ],
#             })

#             break  # return best interchange only

#         return Response({"trips": results})


# class NearestStopView(APIView):
#     permission_classes = [AllowAny]

#     def get(self, request):
#         try:
#             lat = float(request.GET["lat"])
#             lon = float(request.GET["lon"])
#         except (KeyError, ValueError):
#             return Response({"error": "Invalid coordinates"}, status=400)

#         radius = 0.02  # ~2km
#         candidates = Stops.objects.filter(
#             stop_lat__range=(lat - radius, lat + radius),
#             stop_lon__range=(lon - radius, lon + radius),
#         )

#         nearest = None
#         min_dist = float("inf")

#         for s in candidates:
#             d = haversine(lat, lon, s.stop_lat, s.stop_lon)
#             if d < min_dist:
#                 min_dist = d
#                 nearest = s

#         if not nearest:
#             return Response({"error": "No nearby stops found"}, status=404)

#         return Response({
#             "stop_id": nearest.stop_id,
#             "name": nearest.stop_name,   # 🔥 frontend FIX
#             "lat": nearest.stop_lat,
#             "lon": nearest.stop_lon,
#             "distance_m": round(min_dist, 1),
#         })




#     def get(self, request):
#         try:
#             lat = float(request.GET["lat"])
#             lon = float(request.GET["lon"])
#         except (KeyError, ValueError):
#             return Response({"error": "Invalid coordinates"}, status=400)

#         # Bounding-box optimization
#         radius = 0.02  # ~2km
#         candidates = Stops.objects.filter(
#             stop_lat__range=(lat - radius, lat + radius),
#             stop_lon__range=(lon - radius, lon + radius)
#         )

#         nearest = None
#         min_dist = float("inf")

#         for s in candidates:
#             d = haversine(lat, lon, s.stop_lat, s.stop_lon)
#             if d < min_dist:
#                 min_dist = d
#                 nearest = s

#         if not nearest:
#             return Response({"error": "No nearby stops found"}, status=404)

#         return Response({
#             "stop_id": nearest.stop_id,
#             "stop_name": nearest.stop_name,
#             "lat": nearest.stop_lat,
#             "lon": nearest.stop_lon,
#             "distance_m": round(min_dist, 1)
#         })




# class BusStopList(generics.ListAPIView):
#     queryset = BusStop.objects.all().order_by('bus_stop_id')
#     serializer_class = BusStopSerializer
#     pagination_class = StandardResultsSetPagination


# class RouteList(generics.ListAPIView):
#     queryset = Route.objects.all().order_by('route_id')
#     serializer_class = RouteSerializer
#     pagination_class = StandardResultsSetPagination


# @api_view(["GET"])
# def get_route_shape(request, route_id):
#     cache_key = f"route_shape_{route_id}"
#     cached = cache.get(cache_key)
#     if cached:
#         return Response(cached)

#     trip = Trip.objects.filter(route_id=route_id).first()
#     if not trip or not trip.shape_id:
#         return Response({"route_id": route_id, "shape_path": []})

#     shapes = Shape.objects.filter(shape_id=trip.shape_id.shape_id).order_by("shape_pt_sequence")
#     serializer = ShapeSerializer(shapes, many=True)

#     data = {
#         "route_id": route_id,
#         "shape_id": trip.shape_id.shape_id,
#         "shape_path": serializer.data
#     }
#     cache.set(cache_key, data, timeout=86400)  # 24 hours
#     return Response(data)


# @api_view(["GET"])
# def get_route_stops(request, route_id):
#     cache_key = f"route_stops_{route_id}"
#     cached = cache.get(cache_key)
#     if cached:
#         return Response(cached)

#     trip = Trip.objects.filter(route_id=route_id).first()
#     if not trip:
#         return Response({"route_id": route_id, "stops": []})

#     stops = StopTime.objects.filter(trip=trip).order_by("stop_sequence").select_related("stop")
#     serializer = StopTimeSerializer(stops, many=True)

#     data = {
#         "route_id": route_id,
#         "stops": serializer.data
#     }
#     cache.set(cache_key, data, timeout=86400)
#     return Response(data)



