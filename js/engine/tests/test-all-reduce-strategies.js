var t = new DCN.engine.Topology(
    [{id:0,x:0,y:0}, {id:1,x:1,y:0}, {id:2,x:1,y:1}, {id:3,x:0,y:1}],
    [{from:0,to:1,bandwidth:12.5e9,latency:0.000005}, {from:1,to:2,bandwidth:12.5e9,latency:0.000005}, {from:2,to:3,bandwidth:12.5e9,latency:0.000005}, {from:3,to:0,bandwidth:12.5e9,latency:0.000005}],
    {type:'all-reduce', payloadBytes:100e6, iterations:1},
    42
);
var ring = DCN.engine.AllReduceRing.generateSchedule(t);
console.log('Ring phases:', 2*(4-1), 'entries:', ring.length);  // 6 phases, 24 entries
var tree = DCN.engine.AllReduceTree.generateSchedule(t);
console.log('Tree phases:', tree[tree.length-1].phase + 1, 'entries:', tree.length); // 4 phases, 6 entries