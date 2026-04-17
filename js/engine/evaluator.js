(function() {

    const AllReduceRing = DCN.engine.AllReduceRing;
    const AllReduceTree = DCN.engine.AllReduceTree;
    const Simulator = DCN.engine.Simulator;
    const Scorer = DCN.engine.Scorer;

    const FLOPS_PER_NODE = 1e15;

    class Evaluator {

        static evaluate(topology, constraints) {
            Evaluator._assignLinkIds(topology);

            const connectivityResult = Evaluator._checkConnectivity(topology);
            if (!connectivityResult.valid) {
                return Evaluator._buildFailureResult(connectivityResult.violations);
            }

            // If we get here, graph is connected.

            if (constraints) {
                const validationResult = topology.validate(constraints);
                if (!validationResult.valid) {
                    return Evaluator._buildFailureResult(validationResult.violations);
                }
            }

            // If we get here, topology passes all constraints.

            const nodeCount = topology.nodes.length;

            if (nodeCount <= 1) {
                return Evaluator._buildSingleNodeResult(topology);
            }

            // If we get here, topology has 2+ nodes. Run both strategies.

            const ringResult = Evaluator._simulateAndScore(topology, 'ring');
            const treeResult = Evaluator._simulateAndScore(topology, 'tree');

            const ringWins = (ringResult.score.pflops >= treeResult.score.pflops);
            const winner = ringWins ? ringResult : treeResult;
            const winnerStrategy = ringWins ? 'ring' : 'tree';

            return {
                validation: { valid: true, violations: [] },
                strategy: winnerStrategy,
                score: winner.score,
                events: winner.events,
            };
        }

        ///////////////////////////////////////
        // HELPERS

        static _simulateAndScore(topology, strategyName) {
            let schedule;
            if (strategyName == 'ring') {
                schedule = AllReduceRing.generateSchedule(topology);
            } else {
                schedule = AllReduceTree.generateSchedule(topology);
            }

            const simResult = Simulator.simulate(topology, schedule);

            const score = Scorer.score(
                topology,
                simResult.completionTime,
                simResult.linkUtilizations,
            );

            return {
                score,
                events: simResult.events,
            };
        }

        static _assignLinkIds(topology) {
            for (let i = 0; i < topology.links.length; i++) {
                const link = topology.links[i];
                if (link.id == null) {
                    link.id = i;
                }
            }
        }

        static _checkConnectivity(topology) {
            const graph = topology.buildGraph();
            const nodeCount = graph.nodes.length;

            if (nodeCount == 0) {
                return { valid: true };
            }

            const startId = graph.nodes[0].id;
            const bfsResult = graph.bfs(startId);

            let reachableCount = 0;
            for (let node of graph.nodes) {
                if (bfsResult.distances[node.id] != Infinity) {
                    reachableCount++;
                }
            }

            if (reachableCount == nodeCount) {
                return { valid: true };
            }

            const unreachableCount = nodeCount - reachableCount;
            return {
                valid: false,
                violations: [{
                    constraint: 'connectivity',
                    message: `Network is disconnected: ${unreachableCount} node(s) cannot be reached`,
                }],
            };
        }

        static _buildSingleNodeResult(topology) {
            const score = {
                pflops: FLOPS_PER_NODE,
                diameter: 0,
                bisectionBandwidth: 0,
                bottleneckLinkId: null,
                completionTime: 0,
                communicationOverhead: 0,
            };

            return {
                validation: { valid: true, violations: [] },
                strategy: null,
                score,
                events: [],
            };
        }

        static _buildFailureResult(violations) {
            return {
                validation: { valid: false, violations },
                strategy: null,
                score: null,
                events: [],
            };
        }

    }

    window.DCN.engine.Evaluator = Evaluator;

})();
