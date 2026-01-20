import React, { useState } from "react";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import TripMap from "./map/TripMap";

export default function TripResultCard({ trip }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border transition-all">

            {/* HEADER ROW */}
            <div className="flex justify-between items-start">

                {/* LEFT */}
                <div className="flex-1">
                    <div className="text-xl font-semibold">{trip.duration} min</div>
                    <div className="text-sm text-gray-500">
                        {trip.start_time} – {trip.end_time}
                    </div>

                    {/* INTERCHANGE COUNT */}
                    {(() => {
                        const count = trip.segments.filter(s => s.mode === "metro").length - 1;
                        return count > 0 && (
                            <div className="text-xs text-orange-600 font-medium mt-1 mb-2">
                                {count} Interchange{count > 1 ? "s" : ""}
                            </div>
                        );
                    })()}

                    {/* ROUTE FLOW */}
                    <div className="space-y-2 mt-2">
                        {trip.segments
                            .filter(seg => seg.mode === "metro")
                            .map((seg, i, arr) => (
                                <div key={i}>
                                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                                        <span
                                            className="w-3 h-3 rounded-full"
                                            style={{ background: seg.route_color }}
                                        />
                                        <span className="text-sm font-semibold">
                                            {seg.on_stop} to {seg.off_stop}
                                        </span>
                                    </div>

                                    {i < arr.length - 1 && (
                                        <div className="text-xs text-gray-500 ml-6 my-1">
                                            Change at <span className="font-medium">{seg.off_stop}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>

                {/* ARROW BUTTON */}
                <button
                    onClick={() => setExpanded(p => !p)}
                    className="text-gray-400 text-xl ml-3 hover:text-black"
                >
                    {expanded ? <FaChevronDown /> : <FaChevronRight />}
                </button>
            </div>


            {expanded && (
                <div className="mt-4 border-t pt-4 space-y-4">

                    {/* SEGMENT DETAILS WITH ROUTE */}
                    <div className="space-y-3">
                        {trip.segments.map((seg, idx) => (
                            <div key={idx}>

                                {seg.mode === "metro" && (
                                    <div className="flex items-start gap-3">

                                        {/* Route color dot */}
                                        <span
                                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                                            style={{ background: seg.route_color }}
                                        />

                                        <div>
                                            {/* ROUTE NAME */}
                                            <div className="text-sm font-semibold text-gray-800">
                                                {seg.route_name}
                                            </div>

                                            {/* STATIONS */}
                                            <div className="text-sm text-gray-600">
                                                {seg.on_stop} → {seg.off_stop}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {seg.mode === "walk" && (
                                    <div className="text-xs text-gray-500 ml-6">
                                        🚶 Walk {seg.distance_meters} m
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* MAP */}
                    <div className="h-64 rounded-lg overflow-hidden border">
                        <TripMap segments={trip.segments} />
                    </div>
                </div>
            )}

        </div>
    );
}
