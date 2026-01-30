// src/components/TripPlanner.jsx

import React, { useState } from "react";
import TripForm from "./TripForm";
import TripResults from "./TripResults";
import { fetchNearestStop } from "../../api/metroApi";

export default function TripPlanner() {
    const [showResults, setShowResults] = useState(false);
    const [tripResults, setTripResults] = useState([]);
    const [preference, setPreference] = useState("shortest");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [when, setWhen] = useState("leave_now");
    const [departAt, setDepartAt] = useState("");

    const handleUseCurrentLocation = async (setFrom) => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const stop = await fetchNearestStop(
                        coords.latitude,
                        coords.longitude
                    );

                    // Backend uses stop_name
                    setFrom(stop.stop_name);
                } catch {
                    alert("No nearby metro station found");
                }
            },
            () => alert("Could not get your location")
        );
    };
    const handleSwap = () => {
        setTripResults([]);
        setShowResults(false);
    };
    const handlePlanSuccess = (results) => {
        setTripResults(results);
        setShowResults(true);
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            {!showResults ? (
                <TripForm
                    preference={preference}
                    onPlanSuccess={handlePlanSuccess}
                    handleUseCurrentLocation={handleUseCurrentLocation}
                    // pass setters so form can update parent state
                    setFrom={setFrom}
                    setTo={setTo}
                    setWhen={setWhen}
                    setDepartAt={setDepartAt}
                    setPreference={setPreference}
                // preference={preference}
                // onPlanSuccess={(results) => {
                //     setTripResults(results);
                //     setShowResults(true);
                // }}
                // handleUseCurrentLocation={handleUseCurrentLocation}
                // handleSwap={handleSwap}
                />
            ) : (
                <TripResults
                    results={tripResults}
                    preference={preference}
                    setPreference={setPreference}
                    from={from}
                    to={to}
                    when={when}
                    departAt={departAt}
                    setTripResults={setTripResults}
                    onBack={() => setShowResults(false)}
                />
            )}
        </div>
    );
}
