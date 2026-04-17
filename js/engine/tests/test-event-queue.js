var eq = new DCN.engine.EventQueue();
eq.enqueue({ t: 5, label: 'C' });
eq.enqueue({ t: 1, label: 'A' });
eq.enqueue({ t: 3, label: 'B' });
console.log(eq.getSize());    // 3
console.log(eq.peek().label); // 'A' (smallest t)
console.log(eq.dequeue().label); // 'A'
console.log(eq.dequeue().label); // 'B'
console.log(eq.dequeue().label); // 'C'
console.log(eq.dequeue());       // null