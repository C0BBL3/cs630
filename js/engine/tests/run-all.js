const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');

// Shim the browser globals that the IIFE modules expect.
global.window = global;
global.DCN = { engine: {}, ui: {}, levels: {}, encyclopedia: {} };

// Engine modules in dependency order (mirrors index.html script tags).
const ENGINE_MODULES = [
    'js/engine/prng.js',
    'js/engine/event-queue.js',
    'js/engine/link.js',
    'js/engine/graph.js',
    'js/engine/topology.js',
    'js/engine/bisection-bandwidth.js',
    'js/engine/all-reduce-ring.js',
    'js/engine/all-reduce-tree.js',
    'js/engine/simulator.js',
    'js/engine/scorer.js',
    'js/engine/evaluator.js',
];

// Test files in bottom-up order.
const TEST_FILES = [
    'js/engine/tests/test-prng.js',
    'js/engine/tests/test-event-queue.js',
    'js/engine/tests/test-link.js',
    'js/engine/tests/test-graph.js',
    'js/engine/tests/test-topology.js',
    'js/engine/tests/test-bisection-bandwidth.js',
    'js/engine/tests/test-all-reduce-strategies.js',
    'js/engine/tests/test-simulator.js',
    'js/engine/tests/test-evaluator.js',
];

function loadScript(relativePath) {
    const fullPath = path.join(ROOT, relativePath);
    const code = fs.readFileSync(fullPath, 'utf-8');
    vm.runInThisContext(code, { filename: relativePath });
}

// Load all engine modules.
for (let modulePath of ENGINE_MODULES) {
    loadScript(modulePath);
}

console.log('=== All engine modules loaded ===\n');

// Run each test file.
let passed = 0;
let failed = 0;

for (let testFile of TEST_FILES) {
    const testName = path.basename(testFile, '.js');
    const divider = '─'.repeat(50);

    console.log(divider);
    console.log(`  ${testName}`);
    console.log(divider);

    try {
        loadScript(testFile);
        passed++;
        console.log(`  ✓ ${testName} completed\n`);
    } catch (error) {
        failed++;
        console.error(`  ✗ ${testName} FAILED: ${error.message}\n`);
    }
}

// Summary.
const totalTests = passed + failed;
console.log('══════════════════════════════════════════════════');
console.log(`  ${passed}/${totalTests} test files passed`);
if (failed > 0) {
    console.log(`  ${failed} FAILED`);
}
console.log('══════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
