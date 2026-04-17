(function() {

    class AllReduceRing {

        static generateSchedule(topology) {
            const graph = topology.buildGraph();
            const nodeCount = topology.nodes.length;
            const payloadBytes = topology.workload.payloadBytes;

            if (nodeCount <= 1) {
                return [];
            }

            const ringOrder = AllReduceRing._buildRingOrder(graph);
            const chunkSize = Math.ceil(payloadBytes / nodeCount);
            const numPhases = 2 * (nodeCount - 1);

            const schedule = [];

            for (let phase = 0; phase < numPhases; phase++) {
                for (let i = 0; i < nodeCount; i++) {
                    const fromNode = ringOrder[i];
                    const toNode = ringOrder[(i + 1) % nodeCount];
                    const packetId = `r-${phase}-${i}`;

                    schedule.push({
                        phase,
                        fromNode,
                        toNode,
                        sizeBytes: chunkSize,
                        packetId,
                    });
                }
            }

            return schedule;
        }

        ///////////////////////////////////////
        // HELPERS

        static _buildRingOrder(graph) {
            const nodeCount = graph.nodes.length;
            const ringOrder = [];
            const visited = {};

            let currentId = graph.nodes[0].id;
            ringOrder.push(currentId);
            visited[currentId] = true;

            for (let step = 1; step < nodeCount; step++) {
                const bfsResult = graph.bfs(currentId);

                let nearestId = null;
                let nearestDistance = Infinity;

                for (let node of graph.nodes) {
                    if (visited[node.id]) {
                        continue;
                    }

                    const distance = bfsResult.distances[node.id];
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestId = node.id;
                    }
                }

                if (nearestId == null) {
                    throw new Error('Cannot build ring order: graph is disconnected');
                }

                ringOrder.push(nearestId);
                visited[nearestId] = true;
                currentId = nearestId;
            }

            return ringOrder;
        }

    }

    window.DCN.engine.AllReduceRing = AllReduceRing;

})();
