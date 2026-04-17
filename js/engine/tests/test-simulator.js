var t = new DCN.engine.Topology(
    [{id:0,x:0,y:0},{id:1,x:1,y:0},{id:2,x:1,y:1},{id:3,x:0,y:1}],
    [{from:0,to:1,bandwidth:12.5e9,latency:5e-6},{from:1,to:2,bandwidth:12.5e9,latency:5e-6},{from:2,to:3,bandwidth:12.5e9,latency:5e-6},{from:3,to:0,bandwidth:12.5e9,latency:5e-6}],
    {type:'all-reduce',payloadBytes:100e6,iterations:1}, 42
);
var ring = DCN.engine.AllReduceRing.generateSchedule(t);
var result = DCN.engine.Simulator.simulate(t, ring);
console.log('completionTime:', result.completionTime);
console.log('events:', result.events.length);
console.log('linkUtilizations:', result.linkUtilizations);