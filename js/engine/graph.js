(function() {

    class Graph {

        constructor() {
            this.nodes = [];
            this.links = [];
            this.adjacency = {};
            this._nodesById = {};
        }

        addNode(node) {
            this.nodes.push(node);
            this._nodesById[node.id] = node;
            this.adjacency[node.id] = [];
        }

        addLink(link) {
            this.links.push(link);
            this.adjacency[link.from].push(link.to);
            this.adjacency[link.to].push(link.from);
        }

        getNodeById(id) {
            return this._nodesById[id] || null;
        }

        getDegree(nodeId) {
            const neighbors = this.adjacency[nodeId];
            if (!neighbors) {
                return 0;
            }

            return neighbors.length;
        }

        getNeighbors(nodeId) {
            return this.adjacency[nodeId] || [];
        }

        getLinkBetween(nodeA, nodeB) {
            for (let link of this.links) {
                const matchForward = (link.from == nodeA && link.to == nodeB);
                const matchReverse = (link.from == nodeB && link.to == nodeA);

                if (matchForward || matchReverse) {
                    return link;
                }
            }

            return null;
        }

        bfs(startId) {
            const distances = {};
            const predecessors = {};

            for (let node of this.nodes) {
                distances[node.id] = Infinity;
                predecessors[node.id] = null;
            }

            distances[startId] = 0;
            const queue = [startId];

            while (queue.length > 0) {
                const current = queue.shift();
                const neighbors = this.adjacency[current];
                const nextDistance = distances[current] + 1;

                for (let neighbor of neighbors) {
                    if (distances[neighbor] != Infinity) {
                        continue;
                    }

                    distances[neighbor] = nextDistance;
                    predecessors[neighbor] = current;
                    queue.push(neighbor);
                }
            }

            return { distances, predecessors };
        }

        dijkstra(startId) {
            const distances = {};
            const predecessors = {};
            const visited = {};

            for (let node of this.nodes) {
                distances[node.id] = Infinity;
                predecessors[node.id] = null;
                visited[node.id] = false;
            }

            distances[startId] = 0;

            for (let i = 0; i < this.nodes.length; i++) {
                const current = this._findMinUnvisited(distances, visited);
                if (current === null) {
                    break;
                }

                visited[current] = true;
                const neighbors = this.adjacency[current];

                for (let neighbor of neighbors) {
                    if (visited[neighbor]) {
                        continue;
                    }

                    const link = this.getLinkBetween(current, neighbor);
                    if (!link) {
                        continue;
                    }

                    const candidateDistance = distances[current] + link.latency;
                    if (candidateDistance < distances[neighbor]) {
                        distances[neighbor] = candidateDistance;
                        predecessors[neighbor] = current;
                    }
                }
            }

            return { distances, predecessors };
        }

        calcDiameter() {
            let maxDistance = 0;

            for (let node of this.nodes) {
                const bfsResult = this.bfs(node.id);

                for (let other of this.nodes) {
                    const distance = bfsResult.distances[other.id];
                    if (distance != Infinity && distance > maxDistance) {
                        maxDistance = distance;
                    }
                }
            }

            return maxDistance;
        }

        ///////////////////////////////////////
        // HELPERS

        _findMinUnvisited(distances, visited) {
            let minId = null;
            let minDist = Infinity;

            for (let node of this.nodes) {
                if (visited[node.id]) {
                    continue;
                }

                if (distances[node.id] < minDist) {
                    minDist = distances[node.id];
                    minId = node.id;
                }
            }

            return minId;
        }

    }

    window.DCN.engine.Graph = Graph;

})();
