(function() {

    const BisectionBandwidth = DCN.engine.BisectionBandwidth;

    const FLOPS_PER_NODE = 1e15;
    const COMPUTE_SECONDS_PER_ITERATION = 0.01;

    class Scorer {

        static score(topology, completionTime, linkUtilizations) {
            const graph = topology.buildGraph();
            const nodeCount = topology.nodes.length;

            const diameter = graph.calcDiameter();
            const bisectionBandwidth = BisectionBandwidth.calc(graph);
            const bottleneckLinkId = Scorer._findBottleneckLinkId(linkUtilizations);

            const peakPflops = nodeCount * FLOPS_PER_NODE;
            const communicationOverhead = completionTime / COMPUTE_SECONDS_PER_ITERATION;
            const pflops = peakPflops / (1 + communicationOverhead);

            return {
                pflops,
                diameter,
                bisectionBandwidth,
                bottleneckLinkId,
                completionTime,
                communicationOverhead,
            };
        }

        ///////////////////////////////////////
        // HELPERS

        static _findBottleneckLinkId(linkUtilizations) {
            let bottleneckLinkId = null;
            let maxUtilization = -1;

            for (let linkId of Object.keys(linkUtilizations)) {
                const utilization = linkUtilizations[linkId];
                if (utilization > maxUtilization) {
                    maxUtilization = utilization;
                    bottleneckLinkId = Number(linkId);
                }
            }

            return bottleneckLinkId;
        }

    }

    window.DCN.engine.Scorer = Scorer;

})();
