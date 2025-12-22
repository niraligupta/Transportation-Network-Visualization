import React, { useState } from "react";
import TripResultCard from "./TripResultCard";
import TripDetailsPanel from "./TripDetailsPanel";

export default function TripResults({ results, onBack }) {
    const [selectedTrip, setSelectedTrip] = useState(null);

    return (
        <>
            <div className="flex w-full justify-center">
                <div className="w-full max-w-3xl px-4">

                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-100">

                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-gray-800">Suggested Trips</h2>
                            <button
                                className="text-blue-600 text-sm font-medium hover:underline"
                                onClick={onBack}
                            >
                                Edit trip / Start over
                            </button>
                        </div>

                        <div className="space-y-4">
                            {results.slice(0, 3).map((trip, i) => (
                                <TripResultCard
                                    key={i}
                                    trip={trip}
                                    onSelect={() => setSelectedTrip(trip)}
                                />
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            {/* LEFT GOOGLE MAPS PANEL */}
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
