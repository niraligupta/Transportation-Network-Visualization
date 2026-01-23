import BasePassengerFlowMap from "./BasePassengerFlowMap";
import { useMetroData } from "@/hooks/useMetroData";

export default function BothPassengerFlow() {
    const { stations, arcs } = useMetroData();

    return (
        <BasePassengerFlowMap
            mode="both"
            stations={stations}
            odData={arcs}
        />
    );
}
