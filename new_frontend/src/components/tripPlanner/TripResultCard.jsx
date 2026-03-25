import React from "react";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";

export default function TripResultCard({ trip, routeType, onRouteChange, onSelect, isSelected }) {
    return (
        <div className={`bg-white rounded-xl shadow-sm p-4 mb-4 border transition-all ${isSelected ? "ring-2 ring-blue-400" : ""}`}>

            {/* HEADER ROW */}
            <div className="space-y-3">

                {/* FROM → TO */}
                <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span>{trip.segments[0]?.on_stop}</span>
                    <span className="text-gray-400">→</span>
                    <span>{trip.segments[trip.segments.length - 1]?.off_stop}</span>
                </div>

                {/* ROUTE TYPE BUTTONS */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onRouteChange("shortest")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition
        ${routeType === "shortest"
                                ? "bg-red-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        📍 Shortest Route
                    </button>

                    <button
                        onClick={() => onRouteChange("minimum")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition
        ${routeType === "minimum"
                                ? "bg-red-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        🔁 Minimum Interchange
                    </button>

                </div>
            </div>

            <div className="flex justify-between items-start">

                {/* LEFT */}
                <div className="flex-1">

                    <div className="text-xl font-semibold">{trip.duration} min</div>
                    <div className="text-sm text-gray-500">
                        {trip.start_time} – {trip.end_time}
                    </div>

                    {trip.wait_time > 0 && (
                        <div className="text-sm text-orange-600 mt-1">
                            Wait {trip.wait_time} min at {trip.segments[0]?.on_stop}
                        </div>
                    )}
                    {/* METRO TIMING INFO */}
                    <div className="text-xs text-blue-600 font-medium mt-1">
                        {trip.wait_time > 0 ? (
                            <>Next metro in {trip.wait_time} min
                                {/* (at {trip.next_metro_at}) */}
                            </>
                        ) : trip.mode === "leave_now" ? (
                            <>Board now — metro just arrived/departing</>
                        ) : trip.mode === "depart_at" ? (
                            <>Metro departs at {trip.start_time}</>
                        ) : (
                            <>Arrives by {trip.end_time}</>
                        )}
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
                    onClick={() => onSelect?.(trip)}
                    className="text-gray-400 text-xl ml-3 hover:text-black"
                >
                    {isSelected ? <FaChevronDown /> : <FaChevronRight />}
                </button>
            </div>

        </div>
    );
}
