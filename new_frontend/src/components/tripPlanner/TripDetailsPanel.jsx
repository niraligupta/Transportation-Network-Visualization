// src/components/TripDetailsPanel.jsx
import React from "react";
import TripMap from "./map/TripMap";
import SegmentTimeline from "./segments/SegmentDetails";
export default function TripDetailsPanel({ trip, open, onClose }) {
    return (
        <>
            {open && <div className="overlay" onClick={onClose}></div>}

            <div className={`left-panel ${open ? "open" : ""}`}>

                {/* Header */}
                {/* <div className="left-panel-header">
                    <h3 className="text-lg font-semibold">Trip details</h3>
                    <button onClick={onClose} className="text-xl">×</button>
                </div> */}

                {/* Body */}
                <div className="left-panel-body">

                    {/* Trip summary */}
                    {/* <div className="trip-card">
                        <div className="trip-card-header">
                            <div>
                                <div className="duration">{trip.duration} min</div>
                                <div className="time-range">
                                    {trip.start_time} – {trip.end_time}
                                </div>
                            </div>
                        </div>

                        {trip.segments.map((seg, i) => (
                            <div key={i} className="my-2">
                                <div className="font-medium">{seg.mode.toUpperCase()}</div>
                                <div className="text-gray-600 text-sm">
                                    {seg.on_stop || ""} {seg.off_stop ? `→ ${seg.off_stop}` : ""}
                                </div>
                            </div>
                        ))}
                    </div> */}
                    {/* <SegmentTimeline segments={trip.segments} onSegmentClick={(seg, idx) => {
                        // e.g. scroll to details, open SegmentDetails, or center map on seg.shape[0]
                        console.log("clicked segment", idx, seg);
                    }} /> */}
                    {/* Map */}

                    <div className="mb-4">
                        {trip.segments.map((seg, idx) => (
                            <div key={idx} className="mb-3">

                                {seg.mode === "metro" && (
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full mt-1"
                                            style={{ background: seg.route_color }}
                                        />

                                        <div>
                                            <div className="font-semibold text-sm">
                                                {seg.on_stop} → {seg.off_stop}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {seg.route_name}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {seg.mode === "walk" && (
                                    <div className="text-xs text-gray-400 ml-6">
                                        Walk {seg.distance_meters} m
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <TripMap segments={trip.segments} />
                </div>
            </div>
        </>
    );
}
