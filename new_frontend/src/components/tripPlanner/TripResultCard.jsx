import React from "react";
import { FaSubway } from "react-icons/fa";  // Metro icon

const ROUTE_COLORS = {
    RED: "#D32F2F",
    BLUE: "#1976D2",
    GREEN: "#388E3C",
    YELLOW: "#FBC02D",
    ORANGE: "#FB8C00",
    MAGENTA: "#C2185B",
    AQUA: "#0097A7",
    GRAY: "#9E9E9E",
    VIOLET: "#7B1FA2"
};

export default function TripResultCard({ trip, onSelect }) {
    return (
        <div
            className="bg-white rounded-xl shadow-sm p-4 mb-4 border hover:shadow-md cursor-pointer transition-all"
            onClick={onSelect}
        >
            <div className="flex justify-between items-center">

                {/* LEFT SIDE */}
                <div>
                    <div className="text-xl font-semibold">{trip.duration} min</div>
                    <div className="text-sm text-gray-500">
                        {trip.start_time} – {trip.end_time}
                    </div>

                    {/* ROUTE (METRO ICON + CLEAN NAME) */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {trip.segments
                            .filter(seg => seg.mode === "metro")
                            .map((seg, i) => {

                                const color = ROUTE_COLORS[seg.route_color?.toUpperCase()] || "#444";

                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg shadow-sm"
                                    >
                                        {/* Metro icon with color */}
                                        <FaSubway size={18} color={color} />

                                        {/* Route Title */}
                                        <span className="text-sm font-semibold" style={{ color }}>
                                            {seg.route_name}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* RIGHT ARROW */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    className="text-gray-400 text-3xl font-light hover:text-black"
                >
                    ›
                </button>

                {/* <div className="text-gray-400 text-3xl font-light">›</div> */}
            </div>
        </div>
    );
}
