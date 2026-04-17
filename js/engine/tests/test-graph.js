var g = new DCN.engine.Graph();
g.addNode({ id: 0, x: 0, y: 0, z: 0 });
g.addNode({ id: 1, x: 1, y: 0, z: 0 });
g.addNode({ id: 2, x: 2, y: 0, z: 0 });
g.addNode({ id: 3, x: 3, y: 0, z: 0 });
g.addLink({ from: 0, to: 1, latency: 1 });
g.addLink({ from: 1, to: 2, latency: 2 });
g.addLink({ from: 2, to: 3, latency: 1 });

console.log(g.getDegree(1));           // 2
console.log(g.getDegree(0));           // 1
console.log(g.getNeighbors(1));        // [0, 2]
console.log(g.bfs(0).distances);       // {0: 0, 1: 1, 2: 2, 3: 3}
console.log(g.dijkstra(0).distances);  // {0: 0, 1: 1, 2: 3, 3: 4}
console.log(g.calcDiameter());         // 3 (longest shortest path in hops)