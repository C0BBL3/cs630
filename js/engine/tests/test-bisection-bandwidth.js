function makeGraph(nodeIds, links) {
    var g = new DCN.engine.Graph();
    for (var i = 0; i < nodeIds.length; i++) {
        g.addNode({ id: nodeIds[i], x: i, y: 0 });
    }
    for (var i = 0; i < links.length; i++) {
        g.addLink(links[i]);
    }
    return g;
}

var g = makeGraph([0], []);
console.log('Test 1 (single node):', DCN.engine.BisectionBandwidth.calc(g), '=== 0');

var g = makeGraph([0, 1], [{ from: 0, to: 1, bandwidth: 100 }]);
console.log('Test 2 (pair):', DCN.engine.BisectionBandwidth.calc(g), '=== 100');

var g = makeGraph([0, 1], []);
console.log('Test 3 (disconnected pair):', DCN.engine.BisectionBandwidth.calc(g), '=== 0');

var g = makeGraph([0,1,2,3], [
    { from: 0, to: 1, bandwidth: 1 },
    { from: 0, to: 2, bandwidth: 1 },
    { from: 0, to: 3, bandwidth: 1 },
    { from: 1, to: 2, bandwidth: 1 },
    { from: 1, to: 3, bandwidth: 1 },
    { from: 2, to: 3, bandwidth: 1 },
]);
console.log('Test 4 (K4, bw=1):', DCN.engine.BisectionBandwidth.calc(g), '=== 4');

var g = makeGraph([0,1,2,3], [
    { from: 0, to: 1, bandwidth: 10 },
    { from: 1, to: 2, bandwidth: 10 },
    { from: 2, to: 3, bandwidth: 10 },
    { from: 3, to: 0, bandwidth: 10 },
]);
console.log('Test 5 (ring, bw=10):', DCN.engine.BisectionBandwidth.calc(g), '=== 20');

var g = makeGraph([0,1,2,3], [
    { from: 0, to: 1, bandwidth: 5 },
    { from: 0, to: 2, bandwidth: 5 },
    { from: 0, to: 3, bandwidth: 5 },
]);
console.log('Test 6 (star, bw=5):', DCN.engine.BisectionBandwidth.calc(g), '=== 10');

var g = makeGraph([0,1,2,3], [
    { from: 0, to: 1, bandwidth: 1 },
    { from: 1, to: 2, bandwidth: 1 },
    { from: 2, to: 3, bandwidth: 1 },
]);
console.log('Test 7 (path):', DCN.engine.BisectionBandwidth.calc(g), '=== 1');

var g = makeGraph([0,1,2,3], [
    { from: 0, to: 1, bandwidth: 100 },
    { from: 0, to: 2, bandwidth: 1 },
    { from: 1, to: 3, bandwidth: 1 },
    { from: 2, to: 3, bandwidth: 100 },
]);
console.log('Test 8 (mixed bw):', DCN.engine.BisectionBandwidth.calc(g), '=== 2');

var g = makeGraph([0,1,2,3,4], [
    { from: 0, to: 1, bandwidth: 1 },
    { from: 1, to: 2, bandwidth: 1 },
    { from: 2, to: 3, bandwidth: 1 },
    { from: 3, to: 4, bandwidth: 1 },
    { from: 4, to: 0, bandwidth: 1 },
]);
console.log('Test 9 (5-ring):', DCN.engine.BisectionBandwidth.calc(g), '=== 2');

var g = makeGraph(['a','b','c','d'], [
    { from: 'a', to: 'b', bandwidth: 7 },
    { from: 'b', to: 'c', bandwidth: 7 },
    { from: 'c', to: 'd', bandwidth: 7 },
    { from: 'd', to: 'a', bandwidth: 7 },
]);
console.log('Test 10 (string IDs):', DCN.engine.BisectionBandwidth.calc(g), '=== 14');