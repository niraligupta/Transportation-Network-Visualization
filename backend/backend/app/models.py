from django.db import models

class Stops(models.Model):
    id = models.BigAutoField(primary_key=True)
    stop_id = models.CharField(max_length=20, db_index=True)
    station_code = models.CharField(max_length=20, db_index=True)
    stop_name = models.CharField(max_length=200, db_index=True)
    line = models.CharField(max_length=50, db_index=True)
    interchange = models.BooleanField(default=False)
    interchange_between = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Comma separated lines e.g. Blue,Yellow"
    )
    stop_lat = models.FloatField()
    stop_lon = models.FloatField()
    line_color = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["stop_id"]),
            models.Index(fields=["stop_name"]),
            models.Index(fields=["station_code"]),
            models.Index(fields=["line"]),
            models.Index(fields=["interchange"]),
        ]

    def __str__(self):
        return f"{self.stop_name} ({self.line})"

class Route(models.Model):
    route_id = models.CharField(max_length=50, primary_key=True)
    route_short_name = models.CharField(max_length=50)
    route_long_name = models.CharField(max_length=255, blank=True)
class Shape(models.Model):
    shape_id = models.CharField(max_length=50, db_index=True)
    shape_pt_lat = models.FloatField()
    shape_pt_lon = models.FloatField()
    shape_pt_sequence = models.IntegerField()
    
    class Meta:
        ordering = ["shape_pt_sequence"]
        indexes = [
            models.Index(fields=['shape_id', 'shape_pt_sequence']),
        ]

class Trip(models.Model):
    trip_id = models.CharField(max_length=50, primary_key=True)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    service_id = models.CharField(max_length=50)
    shape_id = models.ForeignKey(Shape, on_delete=models.CASCADE, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['route']),
        ]
    
    
class StopTime(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, db_index=True)
    stops = models.ForeignKey(Stops, on_delete=models.CASCADE, db_index=True)
    stop_sequence = models.IntegerField(db_index=True)
    arrival_time = models.CharField(max_length=20)
    departure_time = models.CharField(max_length=20)
    class Meta:
        indexes = [
            models.Index(fields=['trip', 'stop_sequence']),
            models.Index(fields=['departure_time']),
        ]


class PassengerFlow(models.Model):
    month = models.CharField(max_length=20, db_index=True)   
    businessday = models.DateField(db_index=True)

    linename = models.CharField(max_length=20)
    sitename = models.CharField(max_length=200)

    station_name = models.CharField(max_length=200, db_index=True)
    station_code = models.CharField(max_length=20)

    hour = models.IntegerField(db_index=True)  # 4 → 23
    entry = models.IntegerField(default=0)
    exit = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["month", "station_name"]),
            models.Index(fields=["station_name", "hour"]),
        ]

    def __str__(self):
        return f"{self.station_name} | {self.month} | {self.hour}"



class ODPassengerFlow(models.Model):
    month = models.CharField(max_length=20, db_index=True)
    origin_station = models.CharField(max_length=200, db_index=True)
    destination_station = models.CharField(max_length=200, db_index=True)
    passengers = models.IntegerField()

    class Meta:
        indexes = [
            models.Index(fields=["month"]),
            models.Index(fields=["origin_station"]),
            models.Index(fields=["destination_station"]),
        ]

    def __str__(self):
        return f"{self.month}: {self.origin_station} → {self.destination_station}"


class BusStop(models.Model):
    bus_stop_id = models.CharField(max_length=20, primary_key=True)
    stop_name = models.CharField(max_length=200)
    stop_lat = models.FloatField()
    stop_lon = models.FloatField()

    def __str__(self):
        return self.stop_name
