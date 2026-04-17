(function() {

    var Graph = DCN.engine.Graph;

    class Topology {

        constructor(nodes, links, workload, seed) {
            this.nodes = nodes;
            this.links = links;
            this.workload = workload;
            this.seed = seed;
            this._graph = null;
        }

        buildGraph() {
            if (this._graph) {
                return this._graph;
            }

            const graph = new Graph();

            for (let node of this.nodes) {
                graph.addNode(node);
            }

            for (let link of this.links) {
                graph.addLink(link);
            }

            this._graph = graph;
            return this._graph;
        }

        validate(constraints) {
            const violations = [];

            if (constraints.maxDegree != null) {
                const degreeResult = this.validateMaxDegree(constraints.maxDegree);
                if (!degreeResult.valid) {
                    violations.push.apply(violations, degreeResult.violations);
                }
            }

            if (constraints.maxCableLength != null) {
                const cableLengthResult = this.validateMaxCableLength(constraints.maxCableLength);
                if (!cableLengthResult.valid) {
                    violations.push.apply(violations, cableLengthResult.violations);
                }
            }

            if (constraints.cableBudget != null) {
                const cableBudgetResult = this.validateCableBudget(constraints.cableBudget);
                if (!cableBudgetResult.valid) {
                    violations.push.apply(violations, cableBudgetResult.violations);
                }
            }

            if (constraints.requirePlanar) {
                const planarResult = this.validateRequirePlanar();
                if (!planarResult.valid) {
                    violations.push.apply(violations, planarResult.violations);
                }
            }

            const valid = (violations.length == 0);
            return { valid, violations };
        }

        validateMaxDegree(maxDegree) {
            const graph = this.buildGraph();
            const violations = [];

            for (let node of this.nodes) {
                const degree = graph.getDegree(node.id);
                if (degree > maxDegree) {
                    violations.push({
                        constraint: 'maxDegree',
                        message: `Node ${node.id} has degree ${degree}, exceeds max ${maxDegree}`,
                    });
                }
            }

            const valid = (violations.length == 0);
            return { valid, violations };
        }

        validateMaxCableLength(maxCableLength) {
            const violations = [];

            for (let link of this.links) {
                const length = this._calcLinkLength(link);
                if (length > maxCableLength) {
                    violations.push({
                        constraint: 'maxCableLength',
                        message: `Link ${link.from}-${link.to} has length ${length.toFixed(2)}, exceeds max ${maxCableLength}`,
                    });
                }
            }

            const valid = (violations.length == 0);
            return { valid, violations };
        }

        validateCableBudget(cableBudget) {
            let totalLength = 0;

            for (let link of this.links) {
                totalLength += this._calcLinkLength(link);
            }

            const violations = [];
            if (totalLength > cableBudget) {
                violations.push({
                    constraint: 'cableBudget',
                    message: `Total cable length ${totalLength.toFixed(2)} exceeds budget ${cableBudget}`,
                });
            }

            const valid = (violations.length == 0);
            return { valid, violations };
        }

        validateRequirePlanar() {
            return { valid: true, violations: [] };
        }

        ///////////////////////////////////////
        // HELPERS

        _calcLinkLength(link) {
            const fromNode = this._getNodeById(link.from);
            const toNode = this._getNodeById(link.to);

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const dz = (toNode.z || 0) - (fromNode.z || 0);

            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

        _getNodeById(nodeId) {
            for (let node of this.nodes) {
                if (node.id == nodeId) {
                    return node;
                }
            }

            return null;
        }

    }

    window.DCN.engine.Topology = Topology;

})();
