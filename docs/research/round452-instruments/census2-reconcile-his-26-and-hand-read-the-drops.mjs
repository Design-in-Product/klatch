/**
 * Round 452 — CENSUS pass 2, still measuring, still deciding nothing.
 *
 * Census pass 1 left two things open that a cure must not be built on top of:
 *
 *   R1 — my liveness figure came out **28 of 404**; his Round 451 §4 published **26 of 400**. His
 *        population excluded his own round directory and mine did not. Two figures that differ by
 *        exactly the self-exclusion are the same figure; two that differ by anything else are a
 *        disagreement. Reconciled here by decomposition, not by assertion (443 — reproduce their
 *        figures under their own key before correcting their count).
 *
 *   R2 — pass 1's `K2_upper_initial` drops 193 rows, and the printed sample showed BOTH prose
 *        (`" ok   every KP and control as expected: true"`, id `every`) and what look like
 *        genuine rows (`"  REFUTED       0  no body survives …"`, id `0`; a KP line whose id is a
 *        `file.mjs:24` address). A key whose error set is mixed cannot be graded by its drop
 *        count. So every candidate gets a confusion matrix against a hand reading here, with the
 *        hand reading primary and the key graded against it (380).
 *
 * The hand reading is of DISTINCT id spellings, not of lines: 1045 rows reduce to a small set of
 * ids, and the id is the only thing every candidate keys on. Each distinct id is classified by
 * hand into `ROW` (a real leg/pred identifier, including file addresses and bare counts) or
 * `PROSE` (an English word that happens to sit after a token). The classification is written down
 * below as a literal table so it is auditable and so a key cannot be tuned against a moving
 * target.
 */
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCorpusRows, readVerdict, LEGACY_ROW_TOKENS } from '../lib/verdict.mjs';

const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const PRE_ROUND_REV = '255d9180a98a1c3d487a31ae21d79752a9c7a65e';
const SELF_DIR = 'docs/research/round452-instruments/';
const HIS_DIR = 'docs/research/round451-instruments/';

const all = git(['ls-tree', '-r', '--name-only', PRE_ROUND_REV])
  .split('\n').filter((n) => n.endsWith('.out') && !n.startsWith(SELF_DIR));
const blob = (path) => git(['cat-file', 'blob', `${PRE_ROUND_REV}:${path}`]);
const texts = new Map(all.map((p) => [p, blob(p)]));

const R446_LEGLINES = /^(?: ok |FAIL|REF ) G/;
const LEGACY_INLINE = /^ *([A-Za-z][A-Za-z0-9_]*) +([A-Za-z0-9_.:-]+)(?: +(.*))?$/;

// ── R1 — reconcile 28 of 404 against his 26 of 400 ─────────────────────────────────────────────
const aliveUnreadable = [];
for (const [path, text] of texts) {
  if (readVerdict(text).ok !== true) continue;
  if (readCorpusRows(text).rows.length === 0) continue;
  if (R446_LEGLINES.test(text) === true) continue;
  if (text.split('\n').some((l) => R446_LEGLINES.test(l))) continue;
  aliveUnreadable.push(path);
}
const his = aliveUnreadable.filter((p) => p.startsWith(HIS_DIR));
const notHis = aliveUnreadable.filter((p) => !p.startsWith(HIS_DIR));
console.log(`R1  mine, whole corpus            = ${aliveUnreadable.length} of ${all.length}`);
console.log(`R1  of those, in HIS round dir    = ${his.length}  ${JSON.stringify(his.map((p) => p.slice(HIS_DIR.length)))}`);
console.log(`R1  excluding his dir (his denom) = ${notHis.length} of ${all.filter((p) => !p.startsWith(HIS_DIR)).length}`);
console.log(`R1  agrees with his published 26 of 400: ${notHis.length === 26 && all.filter((p) => !p.startsWith(HIS_DIR)).length === 400}`);
console.log('');

// ── R2 — the distinct ids, and the hand reading ────────────────────────────────────────────────
const rows = [];
for (const [path, text] of texts) {
  for (const line of text.split('\n')) {
    const m = line.match(LEGACY_INLINE);
    if (m === null) continue;
    if (LEGACY_ROW_TOKENS[m[1]] === undefined) continue;
    rows.push({ path, line, token: m[1], id: m[2] });
  }
}
const byId = new Map();
for (const r of rows) {
  if (!byId.has(r.id)) byId.set(r.id, []);
  byId.get(r.id).push(r);
}
console.log(`R2  ${rows.length} legacy-branch rows reduce to ${byId.size} distinct id spellings`);

/**
 * THE HAND READING. Every distinct id spelling that any candidate key disagrees about, classified
 * by reading the line it occurs in. `PROSE` means the capture is an English word and the line is a
 * sentence; `ROW` means the capture identifies a leg, a prediction, a file address or a count and
 * the line is a record. Ids no candidate disagrees about are not listed and are not needed.
 */
const HAND = {
  // prose — the "id" is the second word of an English sentence
  every: 'PROSE', his: 'PROSE', the: 'PROSE', no: 'PROSE', both: 'PROSE', all: 'PROSE',
  it: 'PROSE', this: 'PROSE', one: 'PROSE', each: 'PROSE', a: 'PROSE', an: 'PROSE',
  and: 'PROSE', is: 'PROSE', my: 'PROSE', its: 'PROSE', not: 'PROSE', in: 'PROSE',
  // rows — real identifiers that are not uppercase-initial
  '0': 'ROW', '1': 'ROW', '2': 'ROW', '3': 'ROW', '5': 'ROW',
};

const CANDIDATES = {
  K1_has_upper_or_digit: (id) => /[A-Z0-9]/.test(id),
  K2_upper_initial: (id) => /^[A-Z]/.test(id),
  K5_upper_initial_or_digit_or_address: (id) => /^[A-Z0-9]/.test(id) || /[.:]/.test(id),
};

console.log('');
for (const [name, fn] of Object.entries(CANDIDATES)) {
  // Confusion matrix over the HAND-classified ids only, weighted by row count, so a key is graded
  // against the hand reading rather than against its own drop total.
  let tp = 0; let fp = 0; let tn = 0; let fn_ = 0;
  for (const [id, verdictHand] of Object.entries(HAND)) {
    const n = (byId.get(id) ?? []).length;
    if (n === 0) continue;
    const keeps = fn(id);
    if (verdictHand === 'ROW') { if (keeps) tp += n; else fn_ += n; } else if (keeps) fp += n; else tn += n;
  }
  console.log(`R2  ${name.padEnd(36)} ROW-kept=${String(tp).padStart(3)} ROW-lost=${String(fn_).padStart(3)} `
    + `PROSE-let-in=${String(fp).padStart(3)} PROSE-kept-out=${String(tn).padStart(3)}  separating=${fn_ === 0 && fp === 0}`);
}
console.log('');

// Hand-reading coverage: how much of the disagreement is actually covered by the table above.
const disagreed = [...byId.keys()].filter((id) => {
  const vs = Object.values(CANDIDATES).map((f) => f(id));
  return vs.some((v) => v !== vs[0]);
});
const uncovered = disagreed.filter((id) => HAND[id] === undefined);
console.log(`R2  ids the candidates disagree about = ${disagreed.length}; of those unclassified by hand = ${uncovered.length}`);
console.log('R2  unclassified: ' + JSON.stringify(uncovered.slice(0, 20)));
console.log('');

// The prose the WIDEST candidate still lets in, which is the thing a cure has to be honest about.
const proseIds = Object.entries(HAND).filter(([, v]) => v === 'PROSE').map(([k]) => k);
const proseRows = rows.filter((r) => proseIds.includes(r.id));
console.log(`R2  hand-classified PROSE rows in the corpus = ${proseRows.length} across `
  + `${new Set(proseRows.map((r) => r.path)).size} files`);
for (const r of proseRows.slice(0, 6)) console.log('      ' + JSON.stringify(r.line.slice(0, 92)));
console.log('');
console.log('CENSUS PASS 2 COMPLETE — still no cure in this file.');
void dirname; void fileURLToPath;
