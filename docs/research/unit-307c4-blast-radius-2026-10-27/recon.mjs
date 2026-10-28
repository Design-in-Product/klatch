/**
 * Unit — the blast radius of Daedalus's `scripts/lib` + '/*.mjs' gate, over the DEFERRED probes.
 *
 * WHY THIS EXISTS. Argus's 10-27 STOP memo routed one RED to Daedalus (`probe-round307`'s `C4`,
 * falsified because inline `@type` annotations are a third JSDoc style its tag regex cannot see)
 * and closed with an explicit non-claim:
 *
 *   "Not claimed: I did not check whether any of the other 110 deferred probes reference these two
 *    files' signatures in a way that would also move — out of scope for a sweep that only drives
 *    the 43 swept probes."
 *
 * That gap is what this instrument measures. It is NOT the repair of `C4` — that is routed to
 * Daedalus and is a question about what his probe should mean. It answers only: is 307's `C4` the
 * only victim, or the only one anybody drove?
 *
 * TWO STAGES, because a static hit is a candidate and not a finding:
 *   stage 1 (this file)  select, from the live `DEFERRED` export, every probe whose source names
 *                        any of the 9 lib files the gate commits ACTUALLY touched (derived from the
 *                        commit range, not from the memo, which names 2 of the 9).
 *   stage 2 (drive.mjs)  DRIVE the selected probes at HEAD and at the pre-gate rev and diff exit
 *                        code and summary line.
 *
 * KNOWN POSITIVE ON THE SELECTOR. `probe-round307` is the one probe MEASURED to have moved under
 * this change. It is SWEPT, so it is not in the population — which is what makes it usable as a
 * control on the selector: the selector is run over SWEPT too and must find it. A selector that
 * cannot see the one known victim cannot be trusted to report a zero over the other 110.
 *
 * TWO DEFECTS IN THIS FILE'S OWN FIRST DRIVE (`drive1.recon.out`, kept), both of the shape this
 * thread keeps producing, and both caught by a leg rather than by reading:
 *   1. `DEFERRED` is an array of plain STRINGS; `SWEPT` is an array of `{file,expect,why}`. Reading
 *      `e.file` over both built the path `scripts/undefined` 110 times, so every deferred source
 *      was unreadable and `SELECTED_DEFERRED` printed **0** — a false zero that reads identically
 *      to the answer "none of them reference lib". `T3` refuses on an unreadable source instead of
 *      counting it as a miss, which is the only reason the 0 was not published. Crippled as
 *      `entry-shape-dot-file`.
 *   2. `T1` keyed the probe population on `.mts` only. The population is 140 `.mts` + 13 `.mjs`,
 *      and all 13 `.mjs` are DEFERRED. Keyed on both extensions now.
 *
 * Usage:  node docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs [--cripple=<name>]
 *         cripples: entry-shape-dot-file | needles-dir-only | drop-307 | touched-from-memo
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { SWEPT, DEFERRED } from '../../../scripts/sweep-probes.mjs';

const REPO = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const CRIPPLE = (process.argv.find((a) => a.startsWith('--cripple=')) ?? '').split('=')[1] ?? null;

const GATE_FIRST = 'd5205b76';
const GATE_LAST = '87270c6f';
const PRE_GATE = `${GATE_FIRST}~1`;

const git = (/** @type {string[]} */ args) =>
  execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const REV = git(['rev-parse', 'HEAD']).trim();
const PRE_GATE_REV = git(['rev-parse', PRE_GATE]).trim();

/** The lib files the gate ACTUALLY touched, from the commit range. The memo names 2 of these. */
const touchedReal = git(['diff', '--name-only', PRE_GATE, GATE_LAST])
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => /^scripts\/lib\/[^/]+\.mjs$/.test(s))
  .sort();

/** Cripple `touched-from-memo`: the two files Argus's memo shows diffs for, hand-typed. */
const touchedFromMemo = ['scripts/lib/characterisation-markers.mjs', 'scripts/lib/strip-source.mjs'];
const touched = CRIPPLE === 'touched-from-memo' ? touchedFromMemo : touchedReal;

const basenames = touched.map((p) => p.replace(/^scripts\/lib\//, ''));
const needlesFull = ['scripts/lib', ...basenames, ...basenames.map((b) => b.replace(/\.mjs$/, ''))];
const needles = CRIPPLE === 'needles-dir-only' ? ['scripts/lib'] : needlesFull;

/**
 * Normalise an entry from either export to its filename. `SWEPT` holds objects, `DEFERRED` holds
 * strings; this is the shape whose conflation produced drive1's false zero.
 */
const nameOf = (/** @type {any} */ e) =>
  CRIPPLE === 'entry-shape-dot-file' ? e.file : typeof e === 'string' ? e : e.file;

/** Hits for one probe, or `null` if its source cannot be read — a refusal, never a 0. */
const scan = (/** @type {any} */ e) => {
  const file = nameOf(e);
  const abs = `${REPO}/scripts/${file}`;
  if (typeof file !== 'string' || !existsSync(abs)) return { file: String(file), hits: null };
  const src = readFileSync(abs, 'utf8');
  return { file, hits: needles.filter((n) => src.includes(n)) };
};

/**
 * Cripple `drop-307`: remove the known positive from the scanned SWEPT set. Must redden `S1` —
 * without it, `S1` could be green because the selector works OR because 307 happens to be present
 * whatever the selector does.
 */
const sweptEntries = CRIPPLE === 'drop-307' ? SWEPT.filter((e) => !/round307/.test(e.file)) : SWEPT;

const sweptScan = sweptEntries.map(scan);
const deferredScan = DEFERRED.map(scan);

const unreadable = [...sweptScan, ...deferredScan].filter((r) => r.hits === null);
const selSwept = sweptScan.filter((r) => r.hits && r.hits.length > 0);
const selDeferred = deferredScan.filter((r) => r.hits && r.hits.length > 0);

/* ---- legs ---------------------------------------------------------------------------------- */
const legs = [];
const check = (/** @type {string} */ id, /** @type {boolean|null} */ ok, /** @type {string} */ what) =>
  legs.push({ id, ok, what });

// T1 — the population is the live export and it partitions the probe-* file count at REV.
// Keyed on BOTH extensions: all 13 probe-*.mjs are DEFERRED, and an .mts-only key reddens here.
const probeFiles = git(['ls-tree', '-r', '--name-only', REV, '--', 'scripts/'])
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => /^scripts\/probe-[^/]+\.(mts|mjs)$/.test(s))
  .map((s) => s.replace(/^scripts\//, ''));
const union = new Set([...SWEPT.map((e) => e.file), ...DEFERRED]);
const missing = probeFiles.filter((f) => !union.has(f));
const extra = [...union].filter((f) => !probeFiles.includes(f));
check(
  'T1',
  probeFiles.length > 0 && missing.length === 0 && extra.length === 0,
  `SWEPT ${SWEPT.length} + DEFERRED ${DEFERRED.length} partitions the ${probeFiles.length} probe-*.{mts,mjs} files at REV exactly — missing ${missing.length}, extra ${extra.length}`,
);

// T2 — the touched set is derived from the commit range, and the memo's 2 are a subset of it.
const memoSubset = touchedFromMemo.every((f) => touchedReal.includes(f));
check(
  'T2',
  touched.length === 9 && memoSubset,
  `scripts/lib/*.mjs touched by ${PRE_GATE}..${GATE_LAST}: ${touched.length} (memo shows 2, subset=${memoSubset}) — ${basenames.join(' ')}`,
);

// T3 — a source that cannot be read must refuse, never count as "no hits". This is the leg that
// caught drive1's false zero and it is the reason SELECTED_DEFERRED is reportable at all.
check('T3', unreadable.length === 0, `unreadable probe sources: ${unreadable.length} of ${SWEPT.length + DEFERRED.length}`);

// S1 — KNOWN POSITIVE on the selector: the one measured victim is found.
const found307 = selSwept.find((r) => /round307/.test(r.file)) ?? null;
check(
  'S1',
  found307 !== null,
  `selector finds the measured victim probe-round307: ${found307 ? `yes via [${found307.hits.join(', ')}]` : 'NO'}`,
);

// S2 — KNOWN NEGATIVE on the selector: it is not universal over either population.
check(
  'S2',
  selDeferred.length < DEFERRED.length && selSwept.length < sweptEntries.length,
  `selector is not universal: DEFERRED ${selDeferred.length}/${DEFERRED.length}, SWEPT ${selSwept.length}/${sweptEntries.length}`,
);

// C0 — SELF-TEST, and it is a GATE leg: every cripple named in the usage docblock must be READ
// somewhere in this file, not merely declared. `drop-307` was declared and unimplemented in this
// file's own second draft, and the only symptom was the cripple exiting 0 — which reads exactly
// like "the repair is sound". Keyed on occurrence count in this file's own source, > 1 meaning the
// docblock mention plus at least one dispatch site.
const selfSrc = readFileSync(new URL(import.meta.url), 'utf8');
const declared = (selfSrc.match(/cripples:\s*(.+)/)?.[1] ?? '')
  .split('|')
  .map((s) => s.trim())
  .filter(Boolean);
const unread = declared.filter((n) => selfSrc.split(n).length - 1 <= 1);
check(
  'C0',
  declared.length > 0 && unread.length === 0,
  `declared cripples ${declared.length} [${declared.join(' ')}], declared-but-unread ${unread.length}${unread.length ? ` [${unread.join(' ')}]` : ''}`,
);

/* ---- report -------------------------------------------------------------------------------- */
console.log(`REV ${REV}`);
console.log(`PRE_GATE ${PRE_GATE} = ${PRE_GATE_REV}`);
console.log(`CRIPPLE ${CRIPPLE ?? '(none)'}`);
console.log(`TOUCHED/${touched.length} ${basenames.join(' ')}`);
console.log(`NEEDLES ${needles.length}`);
console.log('');
console.log(`SELECTED_SWEPT ${selSwept.length}/${SWEPT.length}`);
console.log(`SELECTED_DEFERRED ${selDeferred.length}/${DEFERRED.length}`);
for (const r of selDeferred) console.log(`  D ${r.file}  [${r.hits.join(', ')}]`);
console.log('');
for (const l of legs) console.log(`LEG ${l.id} ${l.ok === null ? 'REFUSED' : l.ok ? 'ok' : 'RED'} — ${l.what}`);

const red = legs.filter((l) => l.ok === false).map((l) => l.id);
const refused = legs.filter((l) => l.ok === null).map((l) => l.id);
const token = refused.length ? 'REFUSED' : red.length ? 'RED' : 'ok';
console.log(
  `VERDICT/1 ${token} legs=${legs.length} red=[${red.join(',')}] refused=[${refused.join(',')}]`,
);
process.exitCode = token === 'ok' ? 0 : 1;
