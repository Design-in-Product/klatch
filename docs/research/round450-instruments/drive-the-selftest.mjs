import { selfTest } from '../lib/verdict.mjs';

// Gate on `!== true`, never on truthiness (356 — a printed self-test that gates nothing).
let result = null;
let err = null;
try { result = selfTest(); } catch (e) { err = e; }
console.log(`selfTest(): ${JSON.stringify(result)}`);
if (result !== true) {
  console.log(`FAILED: ${err === null ? 'returned a non-true value' : err.message}`);
  process.exit(1);
}
console.log('SELFTEST OK');
