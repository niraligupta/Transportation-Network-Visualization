from django.urls import path
# from .views import (
#     MetroStopList, BusStopList, RouteList,
#     get_route_shape, get_route_stops
# )
# from .views import PlanTripView, NearestStopView,od_flow_months, od_flow_api, passenger_flow_api, top_busiest_stations, line_heatmap, station_hourly_flow,station_summary,dashboard_summary,month_line_station_list,metro_routes,live_metro_positions

from .views.od_flow_views import od_flow_api,od_flow_months
from .views.nearest_stop_views import NearestStopView
from .views.trip_planner_views import PlanTripView,MetroStops
from .views.dashboard_views import month_line_station_list, dashboard_summary,line_heatmap,top_busiest_stations,station_hourly_flow,station_summary
from.views.passenger_flow_views import passenger_flow_api
from.views.live_metro_flow_views import get_route_stops, get_route_shape, MetroStopList,BusStopList,live_metro_positions, metro_routes,RouteList
urlpatterns = [
    path("plan_trip/", PlanTripView.as_view()),
    path("nearest-stop/", NearestStopView.as_view()),
    path("metro-stops-list/", MetroStopList.as_view()),
    path("metro-stops/", MetroStops.as_view()),
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
    path("od-flow/", od_flow_api),
    path("od-flow/months/", od_flow_months),

    # Route geometry + stations
    path("routes/<str:route_id>/shape/", get_route_shape),
    path("routes/<str:route_id>/stops/", get_route_stops),
]
