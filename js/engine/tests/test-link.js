var link = new DCN.engine.Link('L1', 0, 1, 1000, 0.005);
console.log(link.calcTransmissionDelay(500));  // 0.5
console.log(link.calcTotalDelay(500));         // 0.505