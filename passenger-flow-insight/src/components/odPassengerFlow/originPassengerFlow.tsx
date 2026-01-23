import BasePassengerFlowMap from "./BasePassengerFlowMap";
import { useMetroData } from "@/hooks/useMetroData";

export default function OriginPassengerFlow() {
    const { stations, arcs } = useMetroData();

    return (
        <BasePassengerFlowMap
            mode="origin"
            stations={stations}
            odData={arcs}
        />
    );
}
