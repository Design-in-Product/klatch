/**
 * Round 452 — CENSUS, run FIRST, committed as the record of that ordering.
 *
 * Theseus's Round 451 routed two things to this seat:
 *
 *   §6.1 "The id grammar on `readCorpusRows`'s legacy branch — §5's `READER_TOO_WIDE=154`. Your
 *        surface. `ID_GRAMMAR` already exists in the file and the canonical branch uses it; the
 *        legacy branch does not. I have not priced whether applying it there costs any of the 184
 *        genuine rows."
 *
 *   §4   446's `pinDied` conjoins `legLines(pinOut) === 0` with `legLines = /^(?: ok |FAIL|REF ) G/`,
 *        so the conjunct is satisfied by any LIVE run whose legs are not `G`-prefixed. 26 of 400
 *        committed recordings publish a `VERDICT` line and >0 rows and still read zero leg lines.
 *
 * This file measures, and decides nothing. Three questions, in the order a cure needs them:
 *
 *   Q1 — does applying `ID_GRAMMAR` to the legacy branch change ANY row? The routed cure names a
 *        specific instrument, so the first thing to measure is whether that instrument moves the
 *        figure at all. A routed finding does not validate its routed cure.
 *   Q2 — if it does not, what key DOES separate the prose from the rows, and what does each
 *        candidate cost in genuine rows? Measured as a confusion matrix against a hand-read
 *        sample, not as a single rate.
 *   Q3 — the 26-of-400 liveness figure, re-derived under a key of my own: `readCorpusRows` for
 *        "has rows" rather than his `ROWISH`, so the two keys do not share a denominator.
 *
 * Population: every committed `.out` file at a pinned LITERAL rev — the tree as it stood before
 * this round wrote anything — selected with `ls-tree`, not `ls-files` (409).
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCorpusRows, readVerdict, ID_GRAMMAR, LEGACY_ROW_TOKENS } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const PRE_ROUND_REV = '255d9180a98a1c3d487a31ae21d79752a9c7a65e';
const SELF_DIR = 'docs/research/round452-instruments/';

const outs = git(['ls-tree', '-r', '--name-only', PRE_ROUND_REV])
  .split('\n').filter((n) => n.endsWith('.out') && !n.startsWith(SELF_DIR));
const blob = (path) => git(['cat-file', 'blob', `${PRE_ROUND_REV}:${path}`]);
const texts = new Map(outs.map((p) => [p, blob(p)]));
const allLines = [...texts.values()].flatMap((t) => t.split('\n'));

console.log(`POPULATION ${outs.length} committed .out at ${PRE_ROUND_REV.slice(0, 8)} · ${allLines.length} lines`);
console.log('');

// ── Q1 — is the routed cure a no-op? ───────────────────────────────────────────────────────────
//
// The legacy branch's inline id key, lifted verbatim out of `readCorpusRows`, and `ID_GRAMMAR`
// itself. If every captured id already satisfies `ID_GRAMMAR`, applying it there cannot move a
// single row, and the routed cure is not a cure.
const LEGACY_INLINE = /^ *([A-Za-z][A-Za-z0-9_]*) +([A-Za-z0-9_.:-]+)(?: +(.*))?$/;

let legacyRows = 0;
let idsFailingIdGrammar = 0;
const sampleFailing = [];
for (const line of allLines) {
  const m = line.match(LEGACY_INLINE);
  if (m === null) continue;
  if (LEGACY_ROW_TOKENS[m[1]] === undefined) continue;
  legacyRows += 1;
  if (!ID_GRAMMAR.test(m[2])) {
    idsFailingIdGrammar += 1;
    if (sampleFailing.length < 5) sampleFailing.push(line.slice(0, 90));
  }
}
console.log('Q1  legacy-branch rows in the corpus       = ' + legacyRows);
console.log('Q1  of those, ids ID_GRAMMAR would REJECT  = ' + idsFailingIdGrammar);
console.log('Q1  ID_GRAMMAR source                      = ' + String(ID_GRAMMAR));
console.log('Q1  legacy inline id class                 = [A-Za-z0-9_.:-]+');
console.log('Q1  sample rejected: ' + (sampleFailing.length === 0 ? '(none)' : JSON.stringify(sampleFailing)));
console.log('');

// ── Q2 — candidate separating keys, and what each costs ────────────────────────────────────────
//
// Each candidate is a predicate on the CAPTURED ID (plus, for K3, the separator), applied to the
// legacy-branch rows only. For each: how many rows it keeps, how many it drops. Dropping is the
// cure's cost; what matters is whether the dropped set is prose.
const CANDIDATES = {
  K0_id_grammar: (id) => ID_GRAMMAR.test(id),
  K1_has_upper_or_digit: (id) => /[A-Z0-9]/.test(id),
  K2_upper_initial: (id) => /^[A-Z]/.test(id),
  K3_upper_initial_no_lower: (id) => /^[A-Z][A-Z0-9_.:-]*$/.test(id),
};

const rowsWithCtx = [];
for (const [path, text] of texts) {
  for (const line of text.split('\n')) {
    const m = line.match(LEGACY_INLINE);
    if (m === null) continue;
    if (LEGACY_ROW_TOKENS[m[1]] === undefined) continue;
    rowsWithCtx.push({ path, line, token: m[1], id: m[2], twoSpace: / {2}/.test(line.slice(line.indexOf(m[2]) + m[2].length)) });
  }
}

for (const [name, fn] of Object.entries(CANDIDATES)) {
  const kept = rowsWithCtx.filter((r) => fn(r.id)).length;
  console.log(`Q2  ${name.padEnd(26)} keeps ${String(kept).padStart(4)}  drops ${String(rowsWithCtx.length - kept).padStart(4)}`);
}
const keptTwoSpace = rowsWithCtx.filter((r) => r.twoSpace).length;
console.log(`Q2  ${'K4_two_space_detail'.padEnd(26)} keeps ${String(keptTwoSpace).padStart(4)}  drops ${String(rowsWithCtx.length - keptTwoSpace).padStart(4)}`);
console.log('');

// What K2 drops, and what K2 keeps that K3 drops — the two sets a hand reading has to look at.
const droppedByK2 = rowsWithCtx.filter((r) => !CANDIDATES.K2_upper_initial(r.id));
const keptByK2DroppedByK3 = rowsWithCtx.filter((r) => CANDIDATES.K2_upper_initial(r.id) && !CANDIDATES.K3_upper_initial_no_lower(r.id));
console.log('Q2  K2 DROPS (sample of ' + droppedByK2.length + ') — is this prose?');
for (const r of droppedByK2.slice(0, 12)) console.log('      ' + JSON.stringify(r.line.slice(0, 96)));
console.log('Q2  K2 keeps but K3 drops (sample of ' + keptByK2DroppedByK3.length + '):');
for (const r of keptByK2DroppedByK3.slice(0, 8)) console.log('      ' + JSON.stringify(r.line.slice(0, 96)));
console.log('');

// ── Q3 — the liveness figure, under a key of my own ─────────────────────────────────────────────
//
// His key for "has rows" was his `ROWISH` regex. Mine is the lib's own `readCorpusRows`, so the two
// figures do not share the numerator's selector (369 — vary what SELECTS the population).
const R446_LEGLINES = /^(?: ok |FAIL|REF ) G/;
const r446Count = (t) => t.split('\n').filter((l) => R446_LEGLINES.test(l)).length;

let aliveButUnreadable = 0;
const aliveSample = [];
for (const [path, text] of texts) {
  const v = readVerdict(text);
  if (v.ok !== true) continue;
  const { rows } = readCorpusRows(text);
  if (rows.length === 0) continue;
  if (r446Count(text) !== 0) continue;
  aliveButUnreadable += 1;
  if (aliveSample.length < 3) {
    aliveSample.push(`${path} (${rows.length} rows, ids ${[...new Set(rows.map((r) => r.id))].slice(0, 4).join(',')})`);
  }
}
console.log('Q3  committed .out with a VERDICT line AND >0 rows on which 446 reads ZERO leg lines');
console.log('Q3  = ' + aliveButUnreadable + ' of ' + outs.length);
for (const s of aliveSample) console.log('      ' + s);
console.log('');

// The id-initial distribution, which is what makes the `G` constraint wrong rather than narrow.
const initials = {};
for (const r of rowsWithCtx) {
  const c = r.id[0];
  initials[c] = (initials[c] ?? 0) + 1;
}
const sorted = Object.entries(initials).sort((a, b) => b[1] - a[1]);
console.log('Q3  legacy-row id initials: ' + sorted.map(([c, n]) => `${c}:${n}`).join(' '));
console.log('Q3  non-G share = ' + rowsWithCtx.filter((r) => r.id[0] !== 'G').length + ' of ' + rowsWithCtx.length);
console.log('');
console.log('CENSUS COMPLETE — no cure built in this file by design.');
void join; void HERE;
