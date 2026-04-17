var topo = new DCN.engine.Topology(
    [
        { id: 0, x: 0, y: 0 },
        { id: 1, x: 3, y: 0 },
        { id: 2, x: 0, y: 4 },
    ],
    [
        { from: 0, to: 1, bandwidth: 1000, latency: 0.001 },
        { from: 0, to: 2, bandwidth: 1000, latency: 0.001 },
        { from: 1, to: 2, bandwidth: 1000, latency: 0.001 },
    ],
    { type: 'all-reduce', payloadBytes: 1024, iterations: 1 },
    42
);

var graph = topo.buildGraph();
console.log(graph.calcDiameter());  // 1 (fully connected triangle)

// maxDegree: all nodes have degree 2, so maxDegree=2 should pass
console.log(topo.validate({ maxDegree: 2 }));  // { valid: true, violations: [] }

// maxDegree: limit to 1 — all three nodes violate
console.log(topo.validate({ maxDegree: 1 }));  // { valid: false, violations: [3 entries] }

// maxCableLength: link 0→1 is 3 units, link 0→2 is 4, link 1→2 is 5
console.log(topo.validate({ maxCableLength: 4 }));  // 1 violation (link 1-2 = 5)

// cableBudget: total is 3 + 4 + 5 = 12
console.log(topo.validate({ cableBudget: 10 }));  // 1 violation (12 > 10)
console.log(topo.validate({ cableBudget: 15 }));  // passes