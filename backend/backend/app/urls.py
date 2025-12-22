from django.urls import path
from .views import (
    MetroStopList, BusStopList, RouteList,
    get_route_shape, get_route_stops
)
from .views import  passenger_flow_api, top_busiest_stations, line_heatmap, station_hourly_flow,station_summary,dashboard_summary,month_line_station_list,metro_routes,live_metro_positions

urlpatterns = [
    path("metro-stops/", MetroStopList.as_view()),
    path("bus-stops/", BusStopList.as_view()),
    path("routes/", RouteList.as_view()),
    path("metro-routes/", metro_routes),
    path("live-metro/", live_metro_positions),
    path("month-line-station/", month_line_station_list),
    path("dashboard-summary/", dashboard_summary),
    path("station-summary/", station_summary),
    path("station-hourly-flow/", station_hourly_flow),
    path("line-heatmap/", line_heatmap),
    path("top-busiest-stations/", top_busiest_stations),
    path("passenger-flow/", passenger_flow_api),
    # Route geometry + stations
    path("routes/<str:route_id>/shape/", get_route_shape),
    path("routes/<str:route_id>/stops/", get_route_stops),
]
