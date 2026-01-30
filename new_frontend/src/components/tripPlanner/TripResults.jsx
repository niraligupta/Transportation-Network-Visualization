import React, { useState } from "react";
import TripResultCard from "./TripResultCard";
import TripDetailsPanel from "./TripDetailsPanel";
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
    const [selectedTrip, setSelectedTrip] = useState(null);
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
                <div className="w-full max-w-3xl px-4">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-100">

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
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedTrip && (
                <TripDetailsPanel
                    trip={selectedTrip}
                    open={true}
                    onClose={() => setSelectedTrip(null)}
                />
            )}
        </>
    );
}
