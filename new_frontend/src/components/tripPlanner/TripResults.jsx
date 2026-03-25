import React, { useState } from "react";
import TripResultCard from "./TripResultCard";
import TripMap from "./map/TripMap";
import { planTrip } from "../../api/metroApi";


export default function TripResults({ results = [],
    onBack,
    from,
    to,
    when,
    departAt,
    preference = "shortest",
    setTripResults,
    setPreference }) {
    const [selectedTripId, setSelectedTripId] = useState(null);
    const safeResults = Array.isArray(results) ? results : [];
    async function changePreference(type) {
        if (!from || !to || setTripResults === undefined || setPreference === undefined) {
            console.error("Missing required props for preference change:", { from, to, setTripResults, setPreference });
            alert("Cannot change route: missing trip details. Please plan a new trip.");
            return;
        }

        try {
            setPreference(type);
            const trips = await planTrip({
                from_location: from,
                to_location: to,
                when,
                depart_at: departAt,
                preference: type === "minimum" ? "min_interchange" : "shortest"
            });
            setTripResults(trips);
        } catch (err) {
            console.error("Failed to update route:", err);
            alert(err.message || "Failed to update route");
        }
    }

    return (
        <>
            <div className="flex w-full justify-center">
                <div className={`w-full max-w-7xl px-4 ${selectedTripId ? "flex gap-4" : ""}`}>

                    <div className={`rounded-2xl shadow-xl p-8 border border-gray-100 ${selectedTripId ? "w-1/2" : "w-full"} bg-white/95 backdrop-blur-md`}>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-gray-800">
                                Suggested Trips
                            </h2>
                            <button
                                className="text-blue-600 text-sm font-medium hover:underline"
                                onClick={onBack}
                            >
                                Edit trip / Start over
                            </button>
                        </div>

                        {/* Trip List */}
                        {safeResults.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">
                                No trips found. Try changing locations or time.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {safeResults.slice(0, 3).map((trip, index) => {
                                    if (!trip || typeof trip !== 'object') {
                                        console.warn("Invalid trip data:", trip);
                                        return null;
                                    }
                                    return (
                                        <TripResultCard
                                            key={trip.trip_id || index}
                                            trip={trip}
                                            routeType={preference}
                                            onRouteChange={changePreference}
                                            onSelect={(trip) => setSelectedTripId(prev => prev === trip.trip_id ? null : trip.trip_id)}
                                            isSelected={selectedTripId === trip.trip_id}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {selectedTripId && (
                        <div className="w-1/2 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Trip Map</h3>
                                <button
                                    onClick={() => setSelectedTripId(null)}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    Close
                                </button>
                            </div>

                            {(() => {
                                const selectedTrip = safeResults.find(t => t.trip_id === selectedTripId);
                                if (!selectedTrip) return <div className="text-gray-500">Selected trip not found.</div>;

                                return (
                                    <>
                                        <div className="mb-3 text-sm text-gray-700">
                                            {selectedTrip.duration} min · {selectedTrip.start_time} – {selectedTrip.end_time}
                                        </div>

                                        <div className="h-80 rounded-lg overflow-hidden border mb-3">
                                            <TripMap segments={selectedTrip.segments} />
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            {selectedTrip.segments.map((seg, idx) => (
                                                <div key={idx} className="p-2 rounded-lg bg-gray-50">
                                                    {seg.mode === 'metro'
                                                        ? `${seg.route_name}: ${seg.on_stop} → ${seg.off_stop}`
                                                        : `Walk ${seg.distance_meters || 'N/A'} m`}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
