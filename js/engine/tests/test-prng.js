var rng = new DCN.engine.Prng(42);
console.log(rng.next());          // should print the same float every time
console.log(rng.next());          // second call gives a different float, but still deterministic
console.log(rng.nextInt(1, 10));  // integer between 1 and 10 inclusive

var rng2 = new DCN.engine.Prng(42);
console.log(rng2.next());         // should match the first rng.next() exactly