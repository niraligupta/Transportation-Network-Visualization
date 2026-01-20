// src/components/TripForm.jsx

import React, { useState, useRef, useEffect } from "react";
import { HiOutlineSwitchVertical } from "react-icons/hi";
import PreferencesModal from "./PreferencesModel";
import { searchMetroStops, planTrip } from "../../api/metroApi";

export default function TripForm({
    onPlanSuccess,
    handleUseCurrentLocation,
    handleSwap
}) {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);

    const [fromFocused, setFromFocused] = useState(false);
    const [toFocused, setToFocused] = useState(false);

    const [errors, setErrors] = useState({ from: "", to: "" });

    const [when, setWhen] = useState("leave_now");
    const [departAt, setDepartAt] = useState("");

    const [loading, setLoading] = useState(false);
    const [showPrefs, setShowPrefs] = useState(false);
    const [detecting, setDetecting] = useState(false);

    const fromRef = useRef(null);
    const toRef = useRef(null);
    const debounceFrom = useRef(null);
    const debounceTo = useRef(null);

    async function fetchSuggestionsNow(query, setter) {
        try {
            const results = await searchMetroStops(query);
            setter(results);
        } catch {
            setter([]);
        }
    }

    function fetchSuggestionsDebounced(query, setter, ref) {
        clearTimeout(ref.current);
        ref.current = setTimeout(() => {
            fetchSuggestionsNow(query, setter);
        }, 250);
    }


    async function handlePlan(e) {
        e.preventDefault();

        const err = { from: "", to: "" };
        if (!from.trim()) err.from = "Please enter start location";
        if (!to.trim()) err.to = "Please enter destination";

        setErrors(err);
        if (err.from || err.to) return;

        setLoading(true);

        try {
            let departValue = null;

            if (when !== "leave_now") {
                if (!departAt) {
                    alert("Please select date & time");
                    setLoading(false);
                    return;
                }
                departValue = new Date(departAt).toISOString();
            }

            const trips = await planTrip({
                from_location: from,
                to_location: to,
                when,
                depart_at: departValue
            });

            onPlanSuccess(trips);
        } catch (err) {
            alert(err.message || "Something went wrong");
        }

        setLoading(false);
    }

    useEffect(() => {
        function onClick(e) {
            if (!fromRef.current?.contains(e.target)) {
                setFromSuggestions([]);
                setFromFocused(false);
            }
            if (!toRef.current?.contains(e.target)) {
                setToSuggestions([]);
                setToFocused(false);
            }
        }
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-xl p-6 relative max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-gray-700">Trip Planner</h3>
                <div className="px-4 py-2 rounded bg-metro-light-blue text-metro-blue font-medium">
                    NexTrip
                </div>
            </div>

            <form onSubmit={handlePlan} className="space-y-6">
                <div className="flex items-start gap-4 relative">
                    <div className="flex flex-col items-center mt-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                            A
                        </div>
                        <div className="w-px bg-gray-300 h-12 my-1" />
                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                            B
                        </div>
                    </div>

                    <div className="flex-1">
                        {/* FROM */}
                        <div ref={fromRef} className="relative">
                            <label className="absolute left-0 text-sm text-gray-500">From</label>
                            <input
                                value={from}
                                onChange={(e) => {
                                    setFrom(e.target.value);
                                    fetchSuggestionsDebounced(
                                        e.target.value,
                                        setFromSuggestions,
                                        debounceFrom
                                    );
                                    setErrors(p => ({ ...p, from: "" }));
                                }}
                                onFocus={() => setFromFocused(true)}
                                placeholder="Enter start location"
                                className="w-full border-b border-gray-300 pt-6 pb-2 bg-transparent focus:outline-none"
                            />

                            <button
                                type="button"
                                disabled={detecting}
                                onClick={async () => {
                                    setDetecting(true);
                                    await handleUseCurrentLocation(setFrom);
                                    setDetecting(false);
                                }}
                                className="absolute right-0 top-2 text-sm text-blue-600 hover:underline"
                            >
                                {detecting ? "Detecting…" : "Use current location"}
                            </button>

                            {fromFocused && fromSuggestions.length > 0 && (
                                <div className="absolute bg-white border shadow-md w-full mt-1 rounded z-40 max-h-52 overflow-auto">
                                    {fromSuggestions.map((s, i) => (
                                        <div
                                            key={i}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            onClick={() => {
                                                setFrom(s);
                                                setFromSuggestions([]);
                                            }}
                                        >
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {errors.from && <p className="text-red-600 text-sm">{errors.from}</p>}
                        </div>

                        <button
                            type="button"
                            onClick={handleSwap}
                            className="absolute right-2 top-[78px] text-gray-600 hover:text-gray-800"
                        >
                            <HiOutlineSwitchVertical size={22} />
                        </button>

                        {/* TO */}
                        <div ref={toRef} className="relative mt-6">
                            <label className="absolute left-0 text-sm text-gray-500">To</label>
                            <input
                                value={to}
                                onChange={(e) => {
                                    setTo(e.target.value);
                                    fetchSuggestionsDebounced(
                                        e.target.value,
                                        setToSuggestions,
                                        debounceTo
                                    );
                                    setErrors(p => ({ ...p, to: "" }));
                                }}
                                onFocus={() => setToFocused(true)}
                                placeholder="Enter destination"
                                className="w-full border-b border-gray-300 pt-6 pb-2 bg-transparent focus:outline-none"
                            />

                            {toFocused && toSuggestions.length > 0 && (
                                <div className="absolute bg-white border shadow-md w-full mt-1 rounded z-40 max-h-52 overflow-auto">
                                    {toSuggestions.map((s, i) => (
                                        <div
                                            key={i}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            onClick={() => {
                                                setTo(s);
                                                setToSuggestions([]);
                                            }}
                                        >
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {errors.to && <p className="text-red-600 text-sm">{errors.to}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <select
                        value={when}
                        onChange={(e) => setWhen(e.target.value)}
                        className="w-2/3 border border-gray-200 rounded px-4 py-2"
                    >
                        <option value="leave_now">Leave now</option>
                        <option value="depart_at">Depart at</option>
                        <option value="arrive_by">Arrive by</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setShowPrefs(true)}
                        className="text-sm text-gray-600 hover:text-gray-800"
                    >
                        Travel preferences
                    </button>
                </div>

                {(when === "depart_at" || when === "arrive_by") && (
                    <input
                        type="datetime-local"
                        value={departAt}
                        onChange={(e) => setDepartAt(e.target.value)}
                        className="w-full border border-gray-200 rounded px-3 py-2"
                    />
                )}

                <div className="pt-4 border-t text-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-metro-blue text-white px-6 py-3 rounded font-semibold hover:opacity-95 disabled:opacity-60"
                    >
                        {loading ? "Planning..." : "PLAN MY TRIP"}
                    </button>
                </div>

                <PreferencesModal open={showPrefs} onClose={() => setShowPrefs(false)} />
            </form>
        </div>
    );
}
