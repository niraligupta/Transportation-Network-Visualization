import { useMap } from "react-leaflet";
import { useEffect } from "react";

export default function FitMapBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            try {
                map.fitBounds(bounds, { padding: [40, 40] });
            } catch { }
        }
    }, [bounds, map]);

    return null;
}
