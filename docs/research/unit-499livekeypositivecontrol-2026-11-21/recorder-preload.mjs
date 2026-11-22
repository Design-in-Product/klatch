/**
 * unit-499livekeypositivecontrol — RECORDER PRELOAD
 *
 * Loaded with `--import` so it is installed before the gate's first statement runs.
 *
 * Theseus's 11-21 §4 recorded `console.log`. This records **`process.stdout.write`**, which is the
 * next seam down the same path: `console.log(chunk)` performs exactly one `write(chunk + "\n")`.
 * Measuring the denominators at a different seam is the point — if the two seams agree, the figure
 * is a property of the gate; if they disagree, one of the seams is not measuring what its name says,
 * which is worth more than agreement.
 *
 * Chunk boundaries are NOT recoverable from captured stdout — a chunk containing a newline is
 * indistinguishable from two chunks — which is why a recorder is needed at all rather than a
 * `wc -l` over the capture.
 */
import { writeFileSync } from 'node:fs';

const OUT = process.env.UNIT499_RECORD_TO;
if (!OUT) {
  process.stderr.write('RECORDER BLOCKED — UNIT499_RECORD_TO is not set\n');
  process.exit(2);
}

/** @type {string[]} */
const chunks = [];
const realWrite = process.stdout.write.bind(process.stdout);

process.stdout.write = function record(chunk, encoding, callback) {
  chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
  return realWrite(chunk, encoding, callback);
};

const flush = () => {
  // Every recorded write, in order, byte-exact. The analysis lives in the reader, not here: a
  // recorder that also decides what its numbers mean cannot be checked against the raw capture.
  writeFileSync(OUT, JSON.stringify(chunks), 'utf8');
};

process.on('exit', flush);
