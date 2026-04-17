// Single node: should return 1e15 PFLOPS, no strategy, no events
var topo1 = new DCN.engine.Topology(
    [{ id: 0, x: 0, y: 0 }],
    [],
    { payloadBytes: 1e9 }
);
var result1 = DCN.engine.Evaluator.evaluate(topo1);
console.log('--- Test 1: Single Node ---');
console.log('valid:', result1.validation.valid);             // true
console.log('strategy:', result1.strategy);                  // null
console.log('pflops:', result1.score.pflops);                // 1e15
console.log('diameter:', result1.score.diameter);             // 0
console.log('completionTime:', result1.score.completionTime); // 0
console.log('events:', result1.events.length);                // 0

// Two nodes, no link: disconnected
var topo2 = new DCN.engine.Topology(
    [{ id: 0, x: 0, y: 0 }, { id: 1, x: 1, y: 0 }],
    [],
    { payloadBytes: 1e9 }
);
var result2 = DCN.engine.Evaluator.evaluate(topo2);
console.log('--- Test 2: Disconnected ---');
console.log('valid:', result2.validation.valid);              // false
console.log('violation:', result2.validation.violations[0].constraint); // 'connectivity'
console.log('score:', result2.score);                         // null

// 2 nodes, 1 link: 100 Gbps, 500ns latency
var topo3 = new DCN.engine.Topology(
    [{ id: 0, x: 0, y: 0 }, { id: 1, x: 1, y: 0 }],
    [{ from: 0, to: 1, bandwidth: 100e9, latency: 500e-9 }],
    { payloadBytes: 1e9 }
);
var result3 = DCN.engine.Evaluator.evaluate(topo3);
console.log('--- Test 3: Two-Node Line ---');
console.log('valid:', result3.validation.valid);               // true
console.log('strategy:', result3.strategy);                    // 'ring' or 'tree' (equivalent here)
console.log('pflops:', result3.score.pflops);                  // ~2e15 / (1 + overhead)
console.log('diameter:', result3.score.diameter);               // 1
console.log('bisectionBandwidth:', result3.score.bisectionBandwidth); // 100e9
console.log('completionTime:', result3.score.completionTime);
console.log('communicationOverhead:', result3.score.communicationOverhead);
console.log('bottleneckLinkId:', result3.score.bottleneckLinkId); // 0
console.log('events:', result3.events.length);

// 4-node ring: 0-1-2-3-0, all 100 Gbps, 500ns
var topo4 = new DCN.engine.Topology(
    [
        { id: 0, x: 0, y: 0 },
        { id: 1, x: 1, y: 0 },
        { id: 2, x: 1, y: 1 },
        { id: 3, x: 0, y: 1 },
    ],
    [
        { from: 0, to: 1, bandwidth: 100e9, latency: 500e-9 },
        { from: 1, to: 2, bandwidth: 100e9, latency: 500e-9 },
        { from: 2, to: 3, bandwidth: 100e9, latency: 500e-9 },
        { from: 3, to: 0, bandwidth: 100e9, latency: 500e-9 },
    ],
    { payloadBytes: 1e9 }
);
var result4 = DCN.engine.Evaluator.evaluate(topo4);
console.log('--- Test 4: Four-Node Ring ---');
console.log('valid:', result4.validation.valid);                // true
console.log('strategy:', result4.strategy);                     // 'ring' or 'tree'
console.log('pflops:', result4.score.pflops);
console.log('diameter:', result4.score.diameter);                // 2
console.log('bisectionBandwidth:', result4.score.bisectionBandwidth); // 200e9
console.log('completionTime:', result4.score.completionTime);
console.log('bottleneckLinkId:', result4.score.bottleneckLinkId);
console.log('events count:', result4.events.length);

// 4-node star: node 0 is hub, connected to 1, 2, 3
var topo5 = new DCN.engine.Topology(
    [
        { id: 0, x: 0, y: 0 },
        { id: 1, x: 1, y: 0 },
        { id: 2, x: 0, y: 1 },
        { id: 3, x: -1, y: 0 },
    ],
    [
        { from: 0, to: 1, bandwidth: 100e9, latency: 500e-9 },
        { from: 0, to: 2, bandwidth: 100e9, latency: 500e-9 },
        { from: 0, to: 3, bandwidth: 100e9, latency: 500e-9 },
    ],
    { payloadBytes: 1e9 }
);
var result5 = DCN.engine.Evaluator.evaluate(topo5);
console.log('--- Test 5: Four-Node Star ---');
console.log('valid:', result5.validation.valid);                // true
console.log('strategy:', result5.strategy);                     // likely 'tree' (star is optimal for tree)
console.log('pflops:', result5.score.pflops);
console.log('diameter:', result5.score.diameter);                // 2
console.log('bisectionBandwidth:', result5.score.bisectionBandwidth); // 100e9
console.log('completionTime:', result5.score.completionTime);
console.log('bottleneckLinkId:', result5.score.bottleneckLinkId);
console.log('events count:', result5.events.length);

// Same 2-node topology but with 10x higher latency — PFLOPS should be lower
var topo6 = new DCN.engine.Topology(
    [{ id: 0, x: 0, y: 0 }, { id: 1, x: 1, y: 0 }],
    [{ from: 0, to: 1, bandwidth: 100e9, latency: 5000e-9 }],
    { payloadBytes: 1e9 }
);
var result6 = DCN.engine.Evaluator.evaluate(topo6);
console.log('--- Test 6: Higher Latency Comparison ---');
console.log('topo3 pflops:', result3.score.pflops);
console.log('topo6 pflops:', result6.score.pflops);
console.log('higher latency => lower pflops:', result6.score.pflops < result3.score.pflops); // true