(function() {

    const Prng = DCN.engine.Prng;

    const EXACT_MAX_NODES = 20;
    const SPECTRAL_ITERATIONS = 100;
    const SPECTRAL_SEED = 42;

    class BisectionBandwidth {

        static calc(graph) {
            const nodeCount = graph.nodes.length;
            if (nodeCount <= 1) {
                return 0;
            }

            if (nodeCount <= EXACT_MAX_NODES) {
                return BisectionBandwidth._calcExact(graph);
            }

            return BisectionBandwidth._calcSpectral(graph);
        }

        ///////////////////////////////////////
        // HELPERS

        static _calcExact(graph) {
            const nodeCount = graph.nodes.length;
            const halfSize = Math.floor(nodeCount / 2);

            const bitByNodeId = {};
            for (let i = 0; i < nodeCount; i++) {
                bitByNodeId[graph.nodes[i].id] = i;
            }

            let minCrossingBandwidth = Infinity;

            let mask = (1 << halfSize) - 1;
            const limit = 1 << nodeCount;

            while (mask < limit) {
                let crossingBandwidth = 0;

                for (let link of graph.links) {
                    const fromBit = bitByNodeId[link.from];
                    const toBit = bitByNodeId[link.to];
                    const fromInSubset = ((mask >> fromBit) & 1) == 1;
                    const toInSubset = ((mask >> toBit) & 1) == 1;

                    if (fromInSubset != toInSubset) {
                        crossingBandwidth += link.bandwidth;
                    }
                }

                if (crossingBandwidth < minCrossingBandwidth) {
                    minCrossingBandwidth = crossingBandwidth;
                }

                const lowestBit = mask & -mask;
                const ripple = mask + lowestBit;
                mask = (((ripple ^ mask) >> 2) / lowestBit) | ripple;
            }

            return minCrossingBandwidth;
        }

        static _calcSpectral(graph) {
            const nodeCount = graph.nodes.length;
            const laplacian = BisectionBandwidth._buildLaplacian(graph);

            let maxDiagonal = 0;
            for (let i = 0; i < nodeCount; i++) {
                if (laplacian[i][i] > maxDiagonal) {
                    maxDiagonal = laplacian[i][i];
                }
            }
            const sigma = 2 * maxDiagonal + 1;

            const shiftedMatrix = [];
            for (let i = 0; i < nodeCount; i++) {
                shiftedMatrix[i] = [];
                for (let j = 0; j < nodeCount; j++) {
                    const diagonalOffset = (i == j) ? sigma : 0;
                    shiftedMatrix[i][j] = diagonalOffset - laplacian[i][j];
                }
            }

            const prng = new Prng(SPECTRAL_SEED);
            let vector = [];
            for (let i = 0; i < nodeCount; i++) {
                vector[i] = prng.next() - 0.5;
            }
            vector = BisectionBandwidth._projectAndNormalize(vector);

            for (let iter = 0; iter < SPECTRAL_ITERATIONS; iter++) {
                const product = BisectionBandwidth._matVecMul(shiftedMatrix, vector);
                vector = BisectionBandwidth._projectAndNormalize(product);
            }

            const crossingBandwidth = BisectionBandwidth._calcCrossingBandwidthByFiedler(graph, vector);
            return crossingBandwidth;
        }

        static _calcCrossingBandwidthByFiedler(graph, fiedlerVector) {
            const nodeCount = graph.nodes.length;
            const halfSize = Math.floor(nodeCount / 2);

            const nodesByComponent = [];
            for (let i = 0; i < nodeCount; i++) {
                nodesByComponent.push({
                    nodeId: graph.nodes[i].id,
                    component: fiedlerVector[i],
                });
            }
            nodesByComponent.sort(BisectionBandwidth._compareByComponent);

            const leftNodeIds = {};
            for (let i = 0; i < halfSize; i++) {
                leftNodeIds[nodesByComponent[i].nodeId] = true;
            }

            let crossingBandwidth = 0;
            for (let link of graph.links) {
                const fromInLeft = (leftNodeIds[link.from] == true);
                const toInLeft = (leftNodeIds[link.to] == true);

                if (fromInLeft != toInLeft) {
                    crossingBandwidth += link.bandwidth;
                }
            }

            return crossingBandwidth;
        }

        static _buildLaplacian(graph) {
            const nodeCount = graph.nodes.length;

            const indexByNodeId = {};
            for (let i = 0; i < nodeCount; i++) {
                indexByNodeId[graph.nodes[i].id] = i;
            }

            const laplacian = [];
            for (let i = 0; i < nodeCount; i++) {
                laplacian[i] = [];
                for (let j = 0; j < nodeCount; j++) {
                    laplacian[i][j] = 0;
                }
            }

            for (let link of graph.links) {
                const fromIndex = indexByNodeId[link.from];
                const toIndex = indexByNodeId[link.to];
                const bandwidth = link.bandwidth;

                laplacian[fromIndex][toIndex] -= bandwidth;
                laplacian[toIndex][fromIndex] -= bandwidth;
                laplacian[fromIndex][fromIndex] += bandwidth;
                laplacian[toIndex][toIndex] += bandwidth;
            }

            return laplacian;
        }

        static _matVecMul(matrix, vector) {
            const n = vector.length;
            const result = [];

            for (let i = 0; i < n; i++) {
                let sum = 0;
                for (let j = 0; j < n; j++) {
                    sum += matrix[i][j] * vector[j];
                }
                result[i] = sum;
            }

            return result;
        }

        static _projectAndNormalize(vector) {
            const n = vector.length;

            let sum = 0;
            for (let i = 0; i < n; i++) {
                sum += vector[i];
            }
            const mean = sum / n;

            const projected = [];
            for (let i = 0; i < n; i++) {
                projected[i] = vector[i] - mean;
            }

            let normSquared = 0;
            for (let i = 0; i < n; i++) {
                normSquared += projected[i] * projected[i];
            }
            const norm = Math.sqrt(normSquared);

            if (norm == 0) {
                return projected;
            }

            const normalized = [];
            for (let i = 0; i < n; i++) {
                normalized[i] = projected[i] / norm;
            }

            return normalized;
        }

        static _compareByComponent(a, b) {
            return a.component - b.component;
        }

    }

    window.DCN.engine.BisectionBandwidth = BisectionBandwidth;

})();
