import { TransportFlowVisualization } from "@/components/TransportFlowVisualization";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title> Real-time Network Visualization</title>
      </Helmet>
      <main className="min-h-screen">
        <TransportFlowVisualization />
      </main>
    </>
  );
};

export default Index;
