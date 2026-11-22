/**
 * unit-501redbranchpin — arm
 *
 * Answers Daedalus's `unit-500` §6: *whether the red branch's 742 bytes join the pin.*
 *
 * Drives the REAL gate (`scripts/verify-decl-body-slicers.mjs`) five times and reads BOTH streams
 * every time:
 *
 *   D0  green baseline                    (expected rc=0)
 *   D1  plant A visible via `git add -N`  (expected rc=1)
 *   D2  plant B — SAME BYTES, longer path (expected rc=1)
 *   D3  both plants at once               (expected rc=1)
 *   D4  index reset, plants removed       (expected rc=0, byte-identical to D0)
 *
 * R1 is structural, not a promise: the gate is **driven**, never modified; its baseline file is
 * never written; the plants live under this unit's directory and are removed in a `finally`, where
 * the index entries are also reset and `git status --porcelain` is asserted byte-identical to its
 * opening value. If it is not, this arm throws rather than continuing — a dirty index is a
 * stop-and-report, not a self-recovery.
 *
 * R5, Daedalus's P5 trap: the exemption-marker token is never written literally anywhere in this
 * unit, and every brace comparison in the PLANT is assembled from `String.fromCharCode`, so this
 * file cannot put itself into the population it measures.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = resolve(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const CAPS = resolve(HERE, 'captures');

const UNIT_DIR_REL = 'docs/research/unit-501redbranchpin-2026-11-22';
// Paths chosen so that B is longer than A by a known number of characters and NOTHING else differs.
const REL_A = `${UNIT_DIR_REL}/plant-a.mjs`;
const REL_B = `${UNIT_DIR_REL}/plant-bbbbbbbbbb.mjs`;
const K = REL_B.length - REL_A.length;

const OB = String.fromCharCode(123); // `{`  — assembled, never quoted as a comparison here
const CB = String.fromCharCode(125); // `}`
const Q = String.fromCharCode(39); //  `'`

/**
 * The plant: a hand-rolled brace-balance body slicer with no paren and no colon comparison, so the
 * gate's file-level guard key reads it UNGUARDED, and no exemption marker, so nothing exempts it.
 * Built by concatenation so that the quoted one-character brace comparisons exist only in the
 * WRITTEN file and not in this source.
 */
const PLANT = [
  '// unit-501 plant. Written and removed inside one arm; never committed.',
  'export function bodyOf(src, from) {',
  '  let depth = 0;',
  '  for (let i = from; i < src.length; i += 1) {',
  '    const c = src[i];',
  `    if (c === ${Q}${OB}${Q}) depth += 1;`,
  `    else if (c === ${Q}${CB}${Q}) {`,
  '      depth -= 1;',
  '      if (depth === 0) return src.slice(from, i + 1);',
  '    }',
  '  }',
  `  return ${Q}${Q};`,
  '}',
  '',
].join('\n');

const sha = (s) => createHash('sha256').update(s).digest('hex');
const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' });
const status = () => git('status', '--porcelain');

// ONE spawn per drive, both streams captured separately. `execFileSync` returns stdout only on a
// clean exit, which is precisely the stream-level blindness Daedalus's P3 was refuted by — so this
// arm reads the channels from `spawnSync` rather than from a throw/no-throw shape.
const drive = (label) => {
  const r = spawnSync('node', [GATE], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.error) throw r.error;
  const out = r.stdout ?? '';
  const err = r.stderr ?? '';
  const rc = r.status;
  const rec = {
    label,
    rc,
    outBytes: Buffer.byteLength(out, 'utf8'),
    errBytes: Buffer.byteLength(err, 'utf8'),
    outLines: out === '' ? 0 : out.replace(/\n$/, '').split('\n').length,
    errLines: err === '' ? 0 : err.replace(/\n$/, '').split('\n').length,
    outSha: sha(out),
    errSha: sha(err),
  };
  mkdirSync(CAPS, { recursive: true });
  writeFileSync(resolve(CAPS, `${label}.out`), out);
  writeFileSync(resolve(CAPS, `${label}.err`), err);
  return { ...rec, out, err };
};

const STATUS_OPEN = status();
const results = {};
const fails = [];
const check = (id, ok, detail) => {
  results[id] = { ok, detail };
  if (!ok) fails.push(`${id}: ${detail}`);
  console.log(`${ok ? 'TRUE ' : 'FALSE'}  ${id}  ${detail}`);
};

try {
  // ---- R2: the two plants must be the same bytes, or this arm measures content, not path length.
  const shaPlant = sha(PLANT);
  writeFileSync(resolve(ROOT, REL_A), PLANT);
  writeFileSync(resolve(ROOT, REL_B), PLANT);
  // Read back off disk, not from the variable: the claim is that the two FILES are the same bytes.
  const shaA = sha(readFileSync(resolve(ROOT, REL_A)));
  const shaB = sha(readFileSync(resolve(ROOT, REL_B)));
  if (shaA !== shaB || shaA !== shaPlant) throw new Error(`R2 REFUSE — plant bytes differ: ${shaA} vs ${shaB}`);
  console.log(`R2 ok — plant bytes sha256 ${shaA.slice(0, 12)} on both paths; k = ${K} characters`);

  // ---- D0: green baseline. R3: if this is not rc=0 the tree is not in the state the pin describes.
  const d0 = drive('d0-green-baseline');
  if (d0.rc !== 0) throw new Error(`R3 REFUSE — opening drive is rc=${d0.rc}, not green`);
  console.log(`D0 green  rc=0  stdout ${d0.outBytes}B / ${d0.outLines} lines   stderr ${d0.errBytes}B / ${d0.errLines} lines`);

  // ---- D1 / D2: one plant at a time, made visible to `git ls-files` with an index entry only.
  git('add', '-N', REL_A);
  const d1 = drive('d1-red-plant-a');
  git('reset', '-q', '--', REL_A);

  git('add', '-N', REL_B);
  const d2 = drive('d2-red-plant-b-longer-path');
  git('reset', '-q', '--', REL_B);

  // R4: a flat reading is only interesting if the plant actually reddened the gate, naming itself.
  const redOk = (d, rel) => d.rc === 1 && d.err.includes(rel);
  if (!redOk(d1, REL_A) || !redOk(d2, REL_B)) {
    throw new Error(`R4 REFUSE — plant did not redden the gate at its red channel: d1 rc=${d1.rc} d2 rc=${d2.rc}`);
  }
  console.log(`D1 red    rc=1  stdout ${d1.outBytes}B / ${d1.outLines} lines   stderr ${d1.errBytes}B / ${d1.errLines} lines`);
  console.log(`D2 red    rc=1  stdout ${d2.outBytes}B / ${d2.outLines} lines   stderr ${d2.errBytes}B / ${d2.errLines} lines`);

  // ---- D3: both plants red at once.
  git('add', '-N', REL_A);
  git('add', '-N', REL_B);
  const d3 = drive('d3-red-both-plants');
  git('reset', '-q', '--', REL_A);
  git('reset', '-q', '--', REL_B);
  if (d3.rc !== 1) throw new Error(`R4 REFUSE — two-plant drive is rc=${d3.rc}`);
  console.log(`D3 red x2 rc=1  stdout ${d3.outBytes}B / ${d3.outLines} lines   stderr ${d3.errBytes}B / ${d3.errLines} lines`);

  // ---------------------------------------------------------------- P1
  check(
    'P1',
    d2.errBytes - d1.errBytes === K && d1.errLines === d2.errLines,
    `stderr ${d1.errBytes} -> ${d2.errBytes} = delta ${d2.errBytes - d1.errBytes} against k=${K}; `
    + `lines ${d1.errLines} vs ${d2.errLines}`,
  );

  // ---------------------------------------------------------------- P2
  check(
    'P2',
    d1.outSha === d2.outSha && d1.outBytes === d2.outBytes,
    `red stdout sha ${d1.outSha.slice(0, 12)} vs ${d2.outSha.slice(0, 12)}, ${d1.outBytes}B vs ${d2.outBytes}B`,
  );

  // ---------------------------------------------------------------- P3
  // Keyed on INTEGERS, not words: route 3 prints the baseline PATH, so a word-keyed predicate on
  // "baseline" would be wrong about this stderr by construction.
  const errNoPaths = d1.err
    .split('\n')
    .filter((l) => !l.includes(REL_A) && !l.includes(REL_B))
    .join('\n');
  const ints = (errNoPaths.match(/\d+/g) ?? []).map(Number).sort((a, b) => a - b);
  const want = [1, 1, 2, 3].sort((a, b) => a - b); // announced count N=1, plus route literals 1,2,3
  check(
    'P3',
    JSON.stringify(ints) === JSON.stringify(want),
    `integers in red stderr outside the path lines: [${ints}] against expected [${want}]`,
  );

  // ---------------------------------------------------------------- P4
  check(
    'P4',
    d3.errLines === d1.errLines + 1 && d3.outSha === d1.outSha && /RED — 2 new/.test(d3.err),
    `stderr lines ${d1.errLines} -> ${d3.errLines} (want +1); stdout sha equal: ${d3.outSha === d1.outSha}; `
    + `count announced as 2: ${/RED — 2 new/.test(d3.err)}`,
  );

  // ---------------------------------------------------------------- P6
  check(
    'P6',
    d1.outBytes === 3935 && d1.outLines === 38,
    `red stdout ${d1.outBytes}B / ${d1.outLines} lines against his D2's 3935B / 38 lines`,
  );

  // ---------------------------------------------------------------- P5 — derived, not asserted
  check(
    'P5',
    results.P1.ok && results.P2.ok && results.P4.ok,
    `antecedents P1/P2/P4 = ${results.P1.ok}/${results.P2.ok}/${results.P4.ok}`,
  );

  // ---- D4: back to green, and byte-identical to D0 or the whole run is about a moving tree.
  const d4 = drive('d4-green-after-reset');
  check(
    'D4',
    d4.rc === 0 && d4.outSha === d0.outSha,
    `rc=${d4.rc}, stdout sha equal to D0: ${d4.outSha === d0.outSha} (${d4.outBytes}B)`,
  );

  // ---- Reported, not predicted: the green figures, and the delta the red state makes to stdout.
  console.log('');
  console.log(`green stdout        ${d0.outBytes}B / ${d0.outLines} lines   stderr ${d0.errBytes}B`);
  console.log(`red   stdout        ${d1.outBytes}B / ${d1.outLines} lines   (delta ${d1.outBytes - d0.outBytes}B, ${d1.outLines - d0.outLines} lines)`);
  console.log(`red   stderr A      ${d1.errBytes}B / ${d1.errLines} lines`);
  console.log(`red   stderr B      ${d2.errBytes}B / ${d2.errLines} lines`);
  console.log(`red   stderr A+B    ${d3.errBytes}B / ${d3.errLines} lines`);
  console.log(`k (path length difference)  ${K}`);
  writeFileSync(resolve(HERE, 'captures', 'figures.json'), `${JSON.stringify({
    k: K, relA: REL_A, relB: REL_B, plantSha: shaPlant,
    d0: { rc: d0.rc, outBytes: d0.outBytes, outLines: d0.outLines, errBytes: d0.errBytes, outSha: d0.outSha },
    d1: { rc: d1.rc, outBytes: d1.outBytes, outLines: d1.outLines, errBytes: d1.errBytes, errLines: d1.errLines, outSha: d1.outSha },
    d2: { rc: d2.rc, outBytes: d2.outBytes, outLines: d2.outLines, errBytes: d2.errBytes, errLines: d2.errLines, outSha: d2.outSha },
    d3: { rc: d3.rc, outBytes: d3.outBytes, outLines: d3.outLines, errBytes: d3.errBytes, errLines: d3.errLines, outSha: d3.outSha },
    d4: { rc: d4.rc, outBytes: d4.outBytes, outSha: d4.outSha },
    verdicts: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.ok])),
  }, null, 2)}\n`);
} finally {
  // R1 — index first, then the files, then prove the tree came back.
  for (const rel of [REL_A, REL_B]) {
    try { git('reset', '-q', '--', rel); } catch { /* no index entry to clear */ }
    if (existsSync(resolve(ROOT, rel))) rmSync(resolve(ROOT, rel));
  }
  const closed = status();
  if (closed !== STATUS_OPEN) {
    console.error('R1 STOP — `git status --porcelain` did not return to its opening value.');
    console.error(`--- open ---\n${STATUS_OPEN}--- close ---\n${closed}`);
    process.exitCode = 2;
  } else {
    console.log('\nR1 ok — git status --porcelain byte-identical at open and close; no plant on disk, no index entry.');
  }
}

if (fails.length) {
  console.log(`\n${fails.length} prediction(s) not TRUE as written:`);
  for (const f of fails) console.log(`  ${f}`);
}
