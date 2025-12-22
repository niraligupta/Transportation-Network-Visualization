import React, { useState } from "react";
import TripForm from "./TripForm";
import TripResults from "./TripResults";

export default function TripPlanner() {
    const [showResults, setShowResults] = useState(false);
    const [tripResults, setTripResults] = useState([]);

    // -------------------------------
    // USE CURRENT LOCATION FUNCTION
    // -------------------------------
    const handleUseCurrentLocation = async (setFrom) => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;

                try {
                    const res = await fetch(
                        `http://localhost:8000/api/nearest-stop/?lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();

                    if (data?.name) {
                        setFrom(data.name);  // autofill input
                    } else {
                        alert("No nearby stop found");
                    }
                } catch (err) {
                    alert("Error fetching nearest stop");
                }
            },
            () => {
                alert("Could not get your location");
            }
        );
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            {!showResults ? (
                <TripForm
                    onPlanSuccess={(results) => {
                        setTripResults(results);
                        setShowResults(true);
                    }}

                    // 🔥 THIS WAS MISSING
                    handleUseCurrentLocation={handleUseCurrentLocation}
                />
            ) : (
                <TripResults
                    results={tripResults}
                    onBack={() => {
                        setShowResults(false);
                    }}
                />
            )}
        </div>
    );
}
