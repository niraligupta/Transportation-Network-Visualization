// TripPlanner.jsx (full)
import React, { useState, useRef, useEffect } from "react";
import { HiOutlineSwitchVertical } from "react-icons/hi";
import PreferencesModal from "./tripPlanner/PreferencesModel";
import TripMap from "./TripMap";
import 'leaflet/dist/leaflet.css';

export default function TripPlanner() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);

    const [fromFocused, setFromFocused] = useState(false);
    const [toFocused, setToFocused] = useState(false);

    const [when, setWhen] = useState("leave_now");
    const [departAt, setDepartAt] = useState("");
    const [showPrefs, setShowPrefs] = useState(false);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({ from: "", to: "" });

    const [isSwapping, setIsSwapping] = useState(false);

    const [tripResults, setTripResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const fromRef = useRef(null);
    const toRef = useRef(null);
    const debounceFrom = useRef(null);
    const debounceTo = useRef(null);

    // fetch suggestions
    async function fetchSuggestionsNow(query, setter) {
        if (!query || query.trim().length === 0) {
            setter([]);
            return;
        }
        try {
            const res = await fetch(`http://localhost:8000/api/search-stops/?q=${encodeURIComponent(query)}`);
            if (!res.ok) {
                setter([]);
                return;
            }
            const data = await res.json();
            setter((data || []).map(d => d.name || d.stop_name || ""));
        } catch (err) {
            console.error("Autocomplete error", err);
            setter([]);
        }
    }
    function fetchSuggestionsDebounced(query, setter, timerRef) {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchSuggestionsNow(query, setter), 220);
    }

    // use current location -> nearest stop
    async function handleUseCurrentLocation() {
        if (!navigator.geolocation) {
            alert("Geolocation not supported.");
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                const res = await fetch(`http://localhost:8000/api/nearest-stop/?lat=${latitude}&lon=${longitude}`);
                if (!res.ok) {
                    alert("Unable to find nearest metro station.");
                    return;
                }
                const data = await res.json();
                if (data.name) {
                    setFrom(data.name);
                    setFromSuggestions([]);
                    setErrors(p => ({ ...p, from: "" }));
                } else {
                    alert("No nearby metro station found.");
                }
            } catch (err) {
                console.error(err);
                alert("Nearest stop request failed.");
            }
        }, (err) => {
            console.error(err);
            alert("Unable to fetch current location.");
        }, { enableHighAccuracy: true, timeout: 10000 });
    }

    function handleSwap() {
        setIsSwapping(true);
        setTimeout(() => {
            const tmp = from;
            setFrom(to);
            setTo(tmp);
            setFromSuggestions([]);
            setToSuggestions([]);
            setIsSwapping(false);
        }, 200);
    }

    // plan trip
    async function handlePlan(e) {
        e.preventDefault();
        const errs = { from: "", to: "" };
        if (!from.trim()) errs.from = "Please enter starting point.";
        if (!to.trim()) errs.to = "Please enter destination.";
        setErrors(errs);
        if (errs.from || errs.to) return;

        setLoading(true);
        try {
            let departValue = null;
            if (when === "depart_at" || when === "arrive_by") {
                if (!departAt) {
                    alert("Please select date & time.");
                    setLoading(false);
                    return;
                }
                departValue = new Date(departAt).toISOString();
            }

            const res = await fetch("http://localhost:8000/api/plan_trip/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from_location: from,
                    to_location: to,
                    when,
                    depart_at: departValue
                })
            });

            if (!res.ok) {
                const err = await res.json();
                console.error("Plan API error", err);
                alert(err.error || "Failed to plan trip");
                setLoading(false);
                return;
            }

            const data = await res.json();
            // normalize segments: ensure each segment has shape array
            const normalized = (data.trips || []).map(t => {
                t.showMap = false;
                t.highlightIndex = null;
                t.segments = t.segments?.map(seg => ({
                    ...seg,
                    shape: Array.isArray(seg.shape) ? seg.shape : []
                })) || [];
                return t;
            });
            setTripResults(normalized);
            setShowResults(true);
        } catch (err) {
            console.error(err);
            alert("Error planning trip.");
        } finally {
            setLoading(false);
        }
    }

    // click outside close suggestions
    useEffect(() => {
        function onDocClick(e) {
            if (!fromRef.current?.contains(e.target)) setFromSuggestions([]);
            if (!toRef.current?.contains(e.target)) setToSuggestions([]);
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    useEffect(() => {
        return () => {
            clearTimeout(debounceFrom.current);
            clearTimeout(debounceTo.current);
        };
    }, []);

    // highlight segment handler (for map)
    function onHighlightSegment(tripIndex, segIndex) {
        setTripResults(prev => {
            const copy = [...prev];
            copy[tripIndex].highlightIndex = (copy[tripIndex].highlightIndex === segIndex) ? null : segIndex;
            return copy;
        });
    }

    // marker drag callback -> update inputs (simple lat,lng string)
    function onMarkersChange(tripIndex, { start, end }) {
        if (start) setFrom(`${start[0].toFixed(5)}, ${start[1].toFixed(5)}`);
        if (end) setTo(`${end[0].toFixed(5)}, ${end[1].toFixed(5)}`);
        // optionally auto re-plan here
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-xl p-6 relative max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-gray-700">Trip Planner</h3>
                    <div className="px-4 py-2 rounded bg-metro-light-blue text-metro-blue font-medium">NexTrip</div>
                </div>

                <form onSubmit={handlePlan} className="space-y-6">
                    <div className="flex items-start gap-4 relative">
                        <div className="flex flex-col items-center mt-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white font-bold">A</div>
                            <div className="w-px bg-gray-300 h-12 my-1" />
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500 text-white font-bold">B</div>
                        </div>

                        <div className="flex-1">
                            {/* FROM */}
                            <div ref={fromRef} className="relative">
                                <label className="absolute left-0 text-sm text-gray-500">From</label>
                                <input
                                    value={from}
                                    onFocus={() => setFromFocused(true)}
                                    onBlur={() => setFromFocused(false)}
                                    onChange={(e) => { setFrom(e.target.value); fetchSuggestionsDebounced(e.target.value, setFromSuggestions, debounceFrom); setErrors(p => ({ ...p, from: "" })); }}
                                    placeholder="Enter start location"
                                    className="w-full border-b border-gray-300 pt-6 pb-2 bg-transparent focus:outline-none"
                                />
                                <button type="button" onClick={handleUseCurrentLocation} className="absolute right-0 top-2 text-sm text-blue-600 hover:underline">Use current location</button>

                                {fromSuggestions.length > 0 && (
                                    <div className="absolute bg-white border shadow-md w-full mt-1 rounded z-40 max-h-52 overflow-auto">
                                        {fromSuggestions.map((s, i) => (
                                            <div key={i} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setFrom(s); setFromSuggestions([]); }}>
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* swap */}
                            <button type="button" onClick={handleSwap} className="absolute right-2 top-[78px] text-gray-600 hover:text-gray-800" aria-label="Swap">
                                <HiOutlineSwitchVertical size={22} />
                            </button>

                            {/* TO */}
                            <div ref={toRef} className="relative mt-6">
                                <label className="absolute left-0 text-sm text-gray-500">To</label>
                                <input
                                    value={to}
                                    onFocus={() => setToFocused(true)}
                                    onBlur={() => setToFocused(false)}
                                    onChange={(e) => { setTo(e.target.value); fetchSuggestionsDebounced(e.target.value, setToSuggestions, debounceTo); setErrors(p => ({ ...p, to: "" })); }}
                                    placeholder="Enter destination"
                                    className="w-full border-b border-gray-300 pt-6 pb-2 bg-transparent focus:outline-none"
                                />
                                {toSuggestions.length > 0 && (
                                    <div className="absolute bg-white border shadow-md w-full mt-1 rounded z-40 max-h-52 overflow-auto">
                                        {toSuggestions.map((s, i) => (
                                            <div key={i} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setTo(s); setToSuggestions([]); }}>
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* when & prefs */}
                    <div className="flex items-center justify-between">
                        <div className="w-2/3">
                            <select value={when} onChange={(e) => setWhen(e.target.value)} className="w-full border border-gray-200 rounded px-4 py-2">
                                <option value="leave_now">Leave now</option>
                                <option value="depart_at">Depart at</option>
                                <option value="arrive_by">Arrive by</option>
                            </select>
                        </div>

                        <div className="text-right">
                            <button type="button" onClick={() => setShowPrefs(true)} className="text-sm text-gray-600 hover:text-gray-800">Travel preferences</button>
                        </div>
                    </div>

                    {(when === "depart_at" || when === "arrive_by") && (
                        <div>
                            <label className="text-sm text-gray-500">Select date & time</label>
                            <input type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)} className="w-full border border-gray-200 rounded px-3 py-2 mt-2" />
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 text-center">
                        <button type="submit" disabled={loading} className="bg-metro-blue text-white px-6 py-3 rounded font-semibold hover:opacity-95 disabled:opacity-60">
                            {loading ? "Planning..." : "PLAN MY TRIP"}
                        </button>
                    </div>
                </form>

                {/* Suggested Trips */}
                {showResults && (
                    <div className="mt-8 p-6 bg-white shadow-lg rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Suggested trip</h2>
                            <div>
                                <button onClick={() => { setShowResults(false); setTripResults([]); }} className="text-sm text-gray-500 hover:underline">Edit trip / Start over</button>
                            </div>
                        </div>

                        {tripResults.length === 0 && <p className="text-sm text-gray-500">No results returned.</p>}

                        {tripResults.map((trip, tIndex) => {
                            const duration = trip.duration ?? "—";
                            const start = trip.start_time ?? "";
                            const end = trip.end_time ?? "";

                            return (
                                <div key={tIndex} className="border rounded-lg p-4 mb-4 bg-gray-50 hover:shadow transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-lg font-bold">{duration} min</p>
                                            <p className="text-xs text-gray-500">{start} – {end}</p>
                                        </div>
                                        <div className="text-sm text-gray-500">Option {tIndex + 1}</div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                                        {Array.isArray(trip.segments) && trip.segments.map((seg, sIndex) => {
                                            const label = seg.mode === "walk" ? `🚶 ${seg.distance_meters ?? ""} m` : (seg.route || seg.mode);
                                            const colorClass = seg.mode === "walk" ? "bg-green-100 text-green-700" : seg.mode === "rail" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700";
                                            const isActive = trip.highlightIndex === sIndex;
                                            return (
                                                <button
                                                    key={sIndex}
                                                    onClick={() => onHighlightSegment(tIndex, sIndex)}
                                                    className={`${colorClass} px-3 py-1 rounded text-sm border ${isActive ? "ring-2 ring-offset-1 ring-blue-300" : ""}`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Toggle map */}
                                    <div className="mt-3">
                                        <button className="text-sm text-gray-600 hover:underline mb-2" onClick={() => {
                                            setTripResults(prev => {
                                                const copy = [...prev];
                                                copy[tIndex].showMap = !copy[tIndex].showMap;
                                                return copy;
                                            });
                                        }}>
                                            {trip.showMap ? "Hide map" : "Show map"}
                                        </button>

                                        {trip.showMap && (
                                            <TripMap
                                                segments={trip.segments}
                                                highlightIndex={trip.highlightIndex}
                                                onHighlightChange={(index) => onHighlightSegment(tIndex, index)}
                                                draggableMarkers={true}
                                                onMarkersChange={(pos) => onMarkersChange(tIndex, pos)}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            <PreferencesModal open={showPrefs} onClose={() => setShowPrefs(false)} />
        </>
    );
}
