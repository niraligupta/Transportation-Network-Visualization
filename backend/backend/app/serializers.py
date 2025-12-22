from rest_framework import serializers
from .models import PassengerFlow, Stop, BusStop, Route, Shape, Trip, StopTime

class PassengerFlowSerializer(serializers.ModelSerializer):
    class Meta:
        model = PassengerFlow
        fields = ["station_name", "entry", "exit", "hour", "date"]

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = "__all__"


class BusStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusStop
        fields = "__all__"


class RouteSerializer(serializers.ModelSerializer):
    color = serializers.SerializerMethodField()
    clean_name = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = ["route_id", "route_short_name", "route_long_name", "color", "clean_name"]

    def get_color(self, obj):
        if obj.route_long_name and "_" in obj.route_long_name:
            return obj.route_long_name.split("_")[0].strip().upper()
        return ""

    def get_clean_name(self, obj):
        if obj.route_long_name and "_" in obj.route_long_name:
            return obj.route_long_name.split("_", 1)[1].strip()
        return obj.route_long_name or obj.route_short_name or ""


class ShapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shape
        fields = ["shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence"]


class StopTimeSerializer(serializers.ModelSerializer):
    stop_name = serializers.CharField(source="stop.stop_name", read_only=True)
    lat = serializers.FloatField(source="stop.stop_lat", read_only=True)
    lon = serializers.FloatField(source="stop.stop_lon", read_only=True)

    class Meta:
        model = StopTime
        fields = ["stop_sequence", "arrival_time", "departure_time", "stop_name", "lat", "lon"]