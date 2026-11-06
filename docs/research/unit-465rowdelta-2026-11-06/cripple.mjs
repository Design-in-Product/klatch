/**
 * unit-465rowdelta — drive the two registered cripples.
 *
 * usage: node cripple.mjs <X1|X2|restore>
 *
 * Each cripple edits the real product file, drives the arms that are supposed to
 * move, and restores the file from git. The restore is from `git show HEAD:<path>`
 * and not from a copy this script took, so a crash between the edit and the
 * restore cannot leave a hand-made "original" behind that is really the crippled
 * version.
 *
 * X1 — `rowWrites` forced to 0 in `schemaDelta`, i.e. Theseus's §5 sketch as
 *      literally written: counts only. Registered expectation: A5 (the in-place
 *      model-alias UPDATE) goes green, A1 (three inserts) still refuses.
 * X2 — the `dataNote` conjunct removed from the `--no-migrate` gate, disclosure
 *      left in place. Registered expectation: A1, A5 and A7 all go green while
 *      the ROWS: block still prints.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
const DELTA = path.join(REPO, 'packages/server/src/db/schema-delta.ts');
const TOOL = path.join(REPO, 'scripts/backfill-entity-bindings.mts');

const which = process.argv[2];
const rel = (p) => path.relative(REPO, p);

function restore(file) {
  const blob = execFileSync('git', ['show', `HEAD:${rel(file)}`], {
    cwd: REPO,
    maxBuffer: 16 * 1024 * 1024,
  });
  fs.writeFileSync(file, blob);
  const dirty = execFileSync('git', ['status', '--porcelain', '--', rel(file)], {
    cwd: REPO,
    encoding: 'utf8',
  }).trim();
  console.log(`restored ${rel(file)} from HEAD — git sees: ${dirty || '(clean)'}`);
}

/** One substitution that must match exactly once, or nothing is written. */
function cripple(file, from, to) {
  const src = fs.readFileSync(file, 'utf8');
  const n = src.split(from).length - 1;
  if (n !== 1) throw new Error(`anchor matched ${n} times in ${rel(file)}, expected 1`);
  fs.writeFileSync(file, src.split(from).join(to));
  const diff = execFileSync('git', ['diff', '--stat', '--', rel(file)], {
    cwd: REPO,
    encoding: 'utf8',
  }).trim();
  console.log(`crippled ${rel(file)} — ${diff}`);
}

function drive(label, arms) {
  const out = execFileSync('node', [path.join(HERE, 'drive-arms.mjs'), label, ...arms], {
    cwd: HERE,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  // Only the verdict keys, so the cripple's recording is readable beside the
  // uncrippled one rather than being another full transcript.
  for (const line of out.split('\n')) {
    if (/^== |  exit:|target rows unchanged|refusal:|ROWS block present|ARM /.test(line)) {
      console.log(line);
    }
  }
}

if (which === 'restore') {
  restore(DELTA);
  restore(TOOL);
} else if (which === 'X1') {
  cripple(
    DELTA,
    'data: { rows: diffRows(rowsBefore, rowsAfter), rowWrites, empty: rowWrites === 0 },',
    'data: { rows: diffRows(rowsBefore, rowsAfter), rowWrites: 0, empty: Object.keys(diffRows(rowsBefore, rowsAfter)).length === 0 }, // X1'
  );
  try {
    drive('crippleX1', ['A1', 'A4', 'A5']);
  } finally {
    restore(DELTA);
  }
} else if (which === 'X2') {
  cripple(
    TOOL,
    'if (noMigrate && willWrite && (schemaNote || dataNote || schemaUnknown)) {',
    'if (noMigrate && willWrite && (schemaNote || schemaUnknown)) { // X2'
  );
  try {
    drive('crippleX2', ['A1', 'A5', 'A7']);
  } finally {
    restore(TOOL);
  }
} else if (which === 'X3') {
  // Unregistered, added with the unregistered sidecar cure: does the new probe
  // actually redden without it? A control that was never run green-and-red is
  // scored as present when it is only asserted.
  cripple(
    TOOL,
    "if (!sidecarsBefore['-wal'] && !sidecarsBefore['-shm']) {",
    "if (false && !sidecarsBefore['-wal'] && !sidecarsBefore['-shm']) { // X3"
  );
  try {
    const out = execFileSync(
      'npx',
      ['tsx', path.join(REPO, 'scripts/probe-backfill-sidecar-neutrality.mts')],
      { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32e6 }
    );
    console.log(out);
  } catch (err) {
    console.log(`probe exit ${err.status}`);
    console.log(err.stdout ?? '');
    console.log(err.stderr ?? '');
  } finally {
    restore(TOOL);
  }
} else {
  throw new Error('usage: node cripple.mjs <X1|X2|X3|restore>');
}
