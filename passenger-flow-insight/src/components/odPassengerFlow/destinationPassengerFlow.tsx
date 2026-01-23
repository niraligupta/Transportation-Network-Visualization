import BasePassengerFlowMap from "./BasePassengerFlowMap";
import { useMetroData } from "@/hooks/useMetroData";

export default function DestinationPassengerFlow() {
    const { stations, arcs } = useMetroData();

    return (
        <BasePassengerFlowMap
            mode="destination"
            stations={stations}
            odData={arcs}
        />
    );
}
