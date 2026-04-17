(function() {

    class AllReduceTree {

        static generateSchedule(topology) {
            const graph = topology.buildGraph();
            const nodeCount = topology.nodes.length;
            const payloadBytes = topology.workload.payloadBytes;

            if (nodeCount <= 1) {
                return [];
            }

            const tree = AllReduceTree._buildSpanningTree(graph);
            const schedule = [];
            let phase = 0;

            // REDUCE: each depth level sends to parent, from leaves toward root

            for (let d = tree.maxDepth; d >= 1; d--) {
                for (let node of topology.nodes) {
                    if (tree.depth[node.id] != d) {
                        continue;
                    }

                    const parentId = tree.parent[node.id];
                    const packetId = `t-${phase}-${node.id}`;

                    schedule.push({
                        phase,
                        fromNode: node.id,
                        toNode: parentId,
                        sizeBytes: payloadBytes,
                        packetId,
                    });
                }
                phase++;
            }

            // BROADCAST: each depth level sends to children, from root toward leaves

            for (let d = 0; d < tree.maxDepth; d++) {
                for (let node of topology.nodes) {
                    if (tree.depth[node.id] != d) {
                        continue;
                    }

                    const nodeChildren = tree.children[node.id];
                    for (let childId of nodeChildren) {
                        const packetId = `t-${phase}-${node.id}-${childId}`;

                        schedule.push({
                            phase,
                            fromNode: node.id,
                            toNode: childId,
                            sizeBytes: payloadBytes,
                            packetId,
                        });
                    }
                }
                phase++;
            }

            return schedule;
        }

        ///////////////////////////////////////
        // HELPERS

        static _buildSpanningTree(graph) {
            const nodeCount = graph.nodes.length;

            let bestRoot = graph.nodes[0].id;
            let bestMaxDepth = Infinity;

            for (let node of graph.nodes) {
                const bfsResult = graph.bfs(node.id);

                let maxDepth = 0;
                for (let other of graph.nodes) {
                    const depth = bfsResult.distances[other.id];
                    if (depth != Infinity && depth > maxDepth) {
                        maxDepth = depth;
                    }
                }

                if (maxDepth < bestMaxDepth) {
                    bestMaxDepth = maxDepth;
                    bestRoot = node.id;
                }
            }

            // Build BFS spanning tree from the optimal root

            const bfsResult = graph.bfs(bestRoot);

            const parent = {};
            const children = {};
            const depth = {};

            for (let node of graph.nodes) {
                parent[node.id] = bfsResult.predecessors[node.id];
                children[node.id] = [];
                depth[node.id] = bfsResult.distances[node.id];
            }

            for (let node of graph.nodes) {
                const parentId = parent[node.id];
                if (parentId != null) {
                    children[parentId].push(node.id);
                }
            }

            return {
                root: bestRoot,
                parent,
                children,
                depth,
                maxDepth: bestMaxDepth,
            };
        }

    }

    window.DCN.engine.AllReduceTree = AllReduceTree;

})();
