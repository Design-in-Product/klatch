#!/usr/bin/env node
/**
 * Round 428 — grade the cure I applied to Theseus's Round 426 §1 (and the half of §3 that is in
 * the same file).
 *
 * THE SUBJECT is my own Round 425 meta-grader,
 * `docs/research/round425-instruments/a-crash-cannot-print-separates.mjs`.
 *
 * HIS CHARGE. Three of its four published sentences were keyed on a PROPER SUBSET of the conjuncts
 * of their own named `THE DISCRIMINATOR` gate, and in each case the dropped conjunct was the
 * control that makes the reading a reading. A red overall `GATE:` line does not unprint a
 * sentence, and the sentence is what gets quoted into a memo. MY CURE: each reading is now one
 * named const, and the gate and the sentence read THE SAME const.
 *
 * WHY THIS GRADES AS A 2 × 2 AND NOT AS A GREEN RE-DRIVE. A cured instrument that comes back green
 * is consistent with the cure being decoration (Rounds 321/368). So each reading is evaluated in
 * both spellings over both tables:
 *
 *                     | the REAL table            | the table with his kill applied
 *   ------------------+---------------------------+-----------------------------------------
 *   OLD sentence      | publishes (control)       | publishes — PAST a gate that is FALSE
 *   NEW sentence      | publishes (control)       | must NOT publish
 *
 * The REAL column is what makes the KILL column a reading rather than the cure having become a
 * blanket refusal.
 *
 * I DO NOT RE-DRIVE HIS CELLS, AND NEITHER DID HE. Nothing here is about what the subject's eight
 * cells returned; it is about which of those returns the published sentence reads. So:
 *
 *   - the NEW keys are SLICED out of the live subject (never re-typed — Rounds 408/412);
 *   - the OLD keys — sentence AND gate, separately — are SLICED out of the subject's pre-cure
 *     blob, at a rev DERIVED as "the newest rev of this file whose blob does not carry
 *     `const SEPARATES_1_A2 =`", not typed and not `HEAD~1` (Rounds 420/422: an OLD cell sourced
 *     from HEAD inverts the moment cure and grader share a commit — here they do not, and the
 *     derivation says so rather than assuming it);
 *   - the TABLE is parsed out of the subject's own recorded `.out`, and the KNOWN POSITIVE is that
 *     the three NEW keys evaluated over that table reproduce the three published SUMMARY lines of
 *     that same `.out` BYTE-FOR-BYTE. A bad parse cannot survive that.
 *
 * THE VERDICT PREDICATE IS DERIVED FROM EACH SENTENCE'S OWN TWO BRANCH LITERALS, not from a
 * `startsWith` I typed (his Round 426 §4, which I am taking as a lesson rather than leaving to him).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const S_REL = 'docs/research/round425-instruments/a-crash-cannot-print-separates.mjs';
const OUT_REL = 'docs/research/round425-instruments/a-crash-cannot-print-separates.out';
const CURE_TOKEN = 'const SEPARATES_1_A2 =';

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};
const preds = [];
const predict = (name, expected, actual) => {
  const landed = JSON.stringify(expected) === JSON.stringify(actual);
  preds.push({ name, landed, expected, actual });
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });

say('# Round 428 — a published sentence must read its own discriminator, not a subset of it');
say('');
say(`REPO: ${REPO}`);
say(`HEAD at open: ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`subject: ${S_REL}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

say('## 1. The two spellings, both sliced — neither re-typed here');
say('');
gate('the subject is present', existsSync(path.join(REPO, S_REL)), S_REL);
gate('the subject\'s recorded .out is present', existsSync(path.join(REPO, OUT_REL)), OUT_REL);
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at a precondition'); process.exit(2); }

const SRC = readFileSync(path.join(REPO, S_REL), 'utf8');
const OUT = readFileSync(path.join(REPO, OUT_REL), 'utf8');

// --- the pre-cure rev, DERIVED by property ---------------------------------
const history = git('log', '--format=%H', '--', S_REL).stdout.trim().split('\n').filter(Boolean);
const PRE_CURE = history.find((r) => !git('show', `${r}:${S_REL}`).stdout.includes(CURE_TOKEN)) ?? null;
say(`  the subject's rev history (newest first): ${history.map((r) => r.slice(0, 8)).join(', ')}`);
gate('the NEWEST rev carries the cure (so the cure is committed and the OLD row is really old)',
  history.length > 0 && git('show', `${history[0]}:${S_REL}`).stdout.includes(CURE_TOKEN),
  `newest=${history[0]?.slice(0, 8)}`);
gate('a rev of this file predates the cure (there IS an old spelling to grade)', PRE_CURE !== null,
  PRE_CURE === null ? 'REFUSED (null) — no pre-cure blob' : `PRE_CURE=${PRE_CURE.slice(0, 8)}`);
gate('…and it is NOT the rev this grader will land in (cure and grader do not share a commit)',
  PRE_CURE !== null && PRE_CURE !== git('rev-parse', 'HEAD').stdout.trim(),
  `PRE_CURE=${PRE_CURE?.slice(0, 8)} HEAD=${git('rev-parse', 'HEAD').stdout.trim().slice(0, 8)}`);
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED — no gradeable old spelling'); process.exit(2); }
const PRE_SRC = git('show', `${PRE_CURE}:${S_REL}`).stdout;

// --- the three readings, each with its four sliced parts --------------------
// `label` is the text the subject's own SUMMARY line is keyed on; the OLD sentence and OLD gate are
// sliced from PRE_SRC on that same label, so a reading cannot be matched against another's key.
const READINGS = [
  { id: '§1/A2', konst: 'SEPARATES_1_A2',
    label: '§1/A2 cure (a red must name the gate that fired)',
    gateRe: /THE DISCRIMINATOR \(§1\/A2\)[\s\S]*?\n  (D1[\s\S]*?),\n  `/ },
  { id: '§1/A3', konst: 'SEPARATES_1_A3',
    label: '§1/A3 cure (the refusal must name itself)',
    gateRe: /THE DISCRIMINATOR \(§1\/A3\)[\s\S]*?\n  (D1[\s\S]*?),\n  `/ },
  { id: '§2', konst: 'SEPARATES_2',
    label: '§2 cure (walk both trees instead of porcelain over docs/research)',
    gateRe: /THE DISCRIMINATOR \(§2\)[\s\S]*?\n  (D7[\s\S]*?),\n  `/ },
];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const DNAMES = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];
const asFn = (expr) => (expr === null ? null : new Function(...DNAMES, `"use strict"; return (${expr});`));

for (const r of READINGS) {
  // NEW key: the const, sliced from the live subject.
  const km = SRC.match(new RegExp(`^const ${r.konst} = ([\\s\\S]*?);$`, 'm'));
  r.newKey = km === null ? null : km[1];
  gate(`[${r.id}] the NEW key \`${r.konst}\` was sliced out of the live subject`, r.newKey !== null,
    r.newKey === null ? '(no match)' : `${r.newKey.split('\n').length} lines`);
  gate(`[${r.id}] …and the slice stopped inside the declaration (no second \`const\` swallowed)`,
    r.newKey !== null && !/\nconst /.test(r.newKey));
  // THE STRUCTURAL PIN: in the live subject the SUMMARY sentence interpolates the BARE IDENTIFIER
  // and nothing else, so sentence-key and gate-key are the same expression by construction rather
  // than by two edits agreeing. The two branch literals come out of the same slice (Round 426 §4:
  // derive the verdict predicate from the branch literals).
  const sm = SRC.match(new RegExp(`${esc(r.label)}: \\$\\{(\\w+)\\n  \\? '([^']*)'\\n  : '([^']*)'\\}`));
  r.newIdent = sm === null ? null : sm[1];
  r.trueLit = sm === null ? null : sm[2];
  r.falseLit = sm === null ? null : sm[3];
  gate(`[${r.id}] the live SUMMARY sentence interpolates a BARE IDENTIFIER, and it is \`${r.konst}\``,
    r.newIdent === r.konst, r.newIdent === null ? '(no match)' : r.newIdent);
  gate(`[${r.id}] …and the live gate reads the same identifier`,
    new RegExp(`\\n  ${r.konst},\\n`).test(SRC));
  // OLD keys: sentence and gate, sliced separately out of the pre-cure blob.
  const om = PRE_SRC.match(new RegExp(`${esc(r.label)}: \\$\\{\\n([\\s\\S]*?)\\n\\s*\\? `));
  r.oldSent = om === null ? null : om[1].trim();
  gate(`[${r.id}] the OLD SENTENCE key was sliced out of ${PRE_CURE.slice(0, 8)}`, r.oldSent !== null,
    r.oldSent === null ? '(no match)' : r.oldSent.slice(0, 64) + '…');
  const gm = PRE_SRC.match(r.gateRe);
  r.oldGate = gm === null ? null : gm[1].trim();
  gate(`[${r.id}] the OLD GATE key was sliced out of ${PRE_CURE.slice(0, 8)}, separately`,
    r.oldGate !== null, r.oldGate === null ? '(no match)' : r.oldGate.slice(0, 64) + '…');
  // HIS FINDING, as text: the old sentence's conjunct set is a PROPER SUBSET of the old gate's.
  const conj = (e) => (e === null ? null : e.split('&&').map((c) => c.trim().replace(/\s+/g, ' ')).filter(Boolean));
  const cs = conj(r.oldSent); const cg = conj(r.oldGate);
  r.dropped = cs === null || cg === null ? null : cg.filter((c) => !cs.includes(c));
  r.extra = cs === null || cg === null ? null : cs.filter((c) => !cg.includes(c));
  gate(`[${r.id}] HIS FINDING, read as text: every conjunct of the OLD sentence is a conjunct of the `
    + `OLD gate, and the gate has MORE — a proper subset`,
    Array.isArray(r.extra) && r.extra.length === 0 && Array.isArray(r.dropped) && r.dropped.length > 0,
    `dropped by the sentence: ${(r.dropped || ['?']).join(' | ')}${r.extra?.length ? `  [sentence-only: ${r.extra.join(' | ')}]` : ''}`);
  r.newFn = asFn(r.newKey); r.oldSentFn = asFn(r.oldSent); r.oldGateFn = asFn(r.oldGate);
}
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED — a key did not slice'); process.exit(2); }

// --- the table, parsed out of the subject's own recorded .out ---------------
say('');
say('## 2. The REAL table, parsed out of the subject\'s recorded `.out`');
say('');
const CELL_RE = /^ {2}(D\d-[\w-]+): exit (-?\d+|null) \| §1 SUMMARY (".*?"|null) \| disc §1 (OK|FAIL|null) \| A3 (OK|FAIL|null) \| removed (OK|FAIL|null) \| walk (OK|FAIL|null) \| porcelain (OK|FAIL|null)$/gm;
const INNER_RE = /^ {6}inner cells left on disk afterwards: (.*)$/;
const lines = OUT.split('\n');
const REAL = {};
for (const m of OUT.matchAll(CELL_RE)) {
  const j = lines.indexOf(m[0]);
  const im = j >= 0 && j + 1 < lines.length ? lines[j + 1].match(INNER_RE) : null;
  const inner = im === null ? undefined : (im[1] === '(tree gone)' ? null : im[1].split(', '));
  REAL[m[1]] = {
    exit: m[2] === 'null' ? null : Number(m[2]),
    summary1: m[3] === 'null' ? null : JSON.parse(m[3]),
    disc1: m[4] === 'null' ? null : m[4],
    a3: m[5] === 'null' ? null : m[5],
    removed: m[6] === 'null' ? null : m[6],
    walkStray: m[7] === 'null' ? null : m[7],
    porcStray: m[8] === 'null' ? null : m[8],
    innerLeft: inner,
  };
}
const CELL_ORDER = ['D1-new-clean', 'D2-new-A2-crashes', 'D3-old-A2-crashes', 'D4-old-clean',
  'D5-new-A3-exits-2', 'D6-old-A3-exits-2', 'D7-new-cells-leak', 'D8-old-cells-leak'];
gate('all eight of the subject\'s cells were parsed, by name', CELL_ORDER.every((n) => REAL[n]),
  `${Object.keys(REAL).length} parsed: ${Object.keys(REAL).join(', ')}`);
gate('CONTROL: the parse is not uniform — the eight cells do not all carry the same §1 SUMMARY',
  new Set(CELL_ORDER.map((n) => REAL[n]?.summary1)).size > 1,
  [...new Set(CELL_ORDER.map((n) => REAL[n]?.summary1))].map((s) => JSON.stringify(s)).join(' | '));
gate('CONTROL: `innerLeft` parsed as a non-empty array for at least one cell and as null for '
  + 'another (an all-undefined column would make the §2 kill vacuous)',
  CELL_ORDER.some((n) => Array.isArray(REAL[n]?.innerLeft) && REAL[n].innerLeft.length > 0)
  && CELL_ORDER.some((n) => REAL[n]?.innerLeft === null),
  CELL_ORDER.map((n) => `${n.slice(0, 2)}=${Array.isArray(REAL[n]?.innerLeft) ? REAL[n].innerLeft.length : REAL[n]?.innerLeft}`).join(' '));
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED — the table did not parse'); process.exit(2); }

const tableOf = (R) => CELL_ORDER.map((n) => R[n] ?? {});

// --- KNOWN POSITIVE: the sliced NEW keys reproduce the published lines ------
say('');
say('## 3. KNOWN POSITIVE — the sliced keys, over the parsed table, reproduce the subject\'s own');
say('   published SUMMARY lines byte-for-byte');
say('');
for (const r of READINGS) {
  const got = `  ${r.label}: ${r.newFn(...tableOf(REAL)) ? r.trueLit : r.falseLit}`;
  const published = lines.find((l) => l.startsWith(`  ${r.label}:`)) ?? '(not found in .out)';
  gate(`[${r.id}] the reconstructed line is byte-identical to the published one`, got === published,
    got === published ? got.trim().slice(0, 72) + '…' : `reconstructed ${JSON.stringify(got)} vs published ${JSON.stringify(published)}`);
}
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED — the slices do not reproduce the published lines'); process.exit(2); }

// --- the kills -------------------------------------------------------------
// K1–K3 are HIS three, in his own terms. K4 is the conjunct I added beyond what he named, so that
// my addition is graded rather than asserted.
const clone = () => JSON.parse(JSON.stringify(REAL));
const KILLS = [
  { id: 'K1 D4-old-clean dies', why: 'his `D4-old-clean` kill — `D(n)` hands `{}` to every leg of a '
    + 'SKIPPED or depth-refused cell, so this is a state the subject constructs',
    apply: (R) => { delete R['D4-old-clean']; }, hits: ['§1/A2', '§1/A3'] },
  { id: 'K2 D2 dies between its gate line and its verdict', why: 'his field kill — the subject prints '
    + 'the §1 discriminator gate BEFORE the §1 SUMMARY line, so a cell dying between them yields '
    + '`disc1=FAIL, summary1=null`', apply: (R) => { R['D2-new-A2-crashes'].summary1 = null; }, hits: ['§1/A2'] },
  { id: 'K3 D7.innerLeft empty (the leak never reached disk)', why: 'his §2 kill — without it, '
    + '"the porcelain check stayed silent" is true of an empty disk',
    apply: (R) => { R['D7-new-cells-leak'].innerLeft = []; }, hits: ['§2'] },
  { id: 'K4 D8.innerLeft empty', why: 'MINE, not his — the conjunct my cure added that the OLD GATE '
    + 'never carried either, so this row grades my addition instead of asserting it',
    apply: (R) => { R['D8-old-cells-leak'].innerLeft = []; }, hits: ['§2'] },
];
for (const k of KILLS) { k.table = clone(); k.apply(k.table); }

say('');
say('## 4. Expected, written down before the matrix is evaluated');
say('');
say('  REAL column (the control): OLD sentence publishes, OLD gate true, NEW publishes — all three');
say('  readings. If this column moves, the cure has become a blanket refusal and nothing below is');
say('  a reading.');
say('');
say('  KILL column, for each reading the kill hits:');
say('    K1, K2, K3 — OLD sentence PUBLISHES while its OWN OLD GATE is FALSE (his finding), and the');
say('                 NEW key is FALSE, so gate and sentence agree.');
say('    K4         — OLD sentence publishes AND the OLD GATE passes too (it never carried D8), so');
say('                 this row is strictly worse than the three he named, and the NEW key is FALSE.');
say('  KILL column, for each reading the kill does NOT hit: nothing moves, in either spelling. That');
say('  is what makes each kill specific to the conjunct it removes rather than a blanket crippling.');
say('');

say('## 5. The matrix');
say('');
const M = {};
for (const r of READINGS) {
  M[r.id] = { realOldSent: r.oldSentFn(...tableOf(REAL)), realOldGate: r.oldGateFn(...tableOf(REAL)), realNew: r.newFn(...tableOf(REAL)) };
  say(`  ${r.id.padEnd(7)} REAL      old-sentence ${String(M[r.id].realOldSent).padEnd(6)} old-gate ${String(M[r.id].realOldGate).padEnd(6)} NEW ${M[r.id].realNew}`);
  for (const k of KILLS) {
    const cell = { oldSent: r.oldSentFn(...tableOf(k.table)), oldGate: r.oldGateFn(...tableOf(k.table)), neu: r.newFn(...tableOf(k.table)) };
    M[r.id][k.id] = cell;
    say(`  ${r.id.padEnd(7)} ${k.id.slice(0, 9).padEnd(9)} old-sentence ${String(cell.oldSent).padEnd(6)} old-gate ${String(cell.oldGate).padEnd(6)} NEW ${cell.neu}`
      + `   ${k.hits.includes(r.id) ? '<-- this kill hits this reading' : '(not this reading\'s kill)'}`);
  }
}

say('');
say('## 6. The readings');
say('');
for (const r of READINGS) {
  predict(`[${r.id}] CONTROL, real table: the OLD sentence publishes`, true, M[r.id].realOldSent);
  predict(`[${r.id}] CONTROL, real table: the OLD gate passes too`, true, M[r.id].realOldGate);
  predict(`[${r.id}] CONTROL, real table: the NEW key publishes — the cure is not a blanket refusal`,
    true, M[r.id].realNew);
}
say('');
for (const k of KILLS) {
  for (const r of READINGS) {
    const c = M[r.id][k.id];
    if (k.hits.includes(r.id)) {
      predict(`[${r.id}] ${k.id}: HIS FINDING — the OLD sentence still publishes`, true, c.oldSent);
      predict(`[${r.id}] ${k.id}: …and the OLD gate ${k.id.startsWith('K4') ? 'ALSO passes (it never carried this conjunct either)' : 'is FALSE, so the sentence published past it'}`,
        !k.id.startsWith('K4'), c.oldGate === false);
      predict(`[${r.id}] ${k.id}: THE CURE — the NEW key is false, so gate and sentence agree`, false, c.neu);
    } else {
      predict(`[${r.id}] ${k.id}: CONTROL — not this reading's kill, nothing moves (old)`, true, c.oldSent);
      predict(`[${r.id}] ${k.id}: CONTROL — not this reading's kill, nothing moves (new)`, true, c.neu);
    }
  }
}

// --- the discriminator, named once and read by the sentence below -----------
const hisThree = KILLS.filter((k) => !k.id.startsWith('K4'));
const SEPARATES_426_1 =
  READINGS.every((r) => M[r.id].realOldSent === true && M[r.id].realOldGate === true && M[r.id].realNew === true)
  && hisThree.every((k) => READINGS.filter((r) => k.hits.includes(r.id)).every((r) =>
    M[r.id][k.id].oldSent === true && M[r.id][k.id].oldGate === false && M[r.id][k.id].neu === false))
  && hisThree.every((k) => READINGS.filter((r) => !k.hits.includes(r.id)).every((r) =>
    M[r.id][k.id].oldSent === true && M[r.id][k.id].neu === true))
  && READINGS.every((r) => r.newIdent === r.konst && r.dropped.length > 0 && r.extra.length === 0);
const SEPARATES_426_1_K4 = M['§2']['K4 D8.innerLeft empty'].oldSent === true
  && M['§2']['K4 D8.innerLeft empty'].oldGate === true
  && M['§2']['K4 D8.innerLeft empty'].neu === false
  && M['§2'].realNew === true;

say('');
gate('THE DISCRIMINATOR (Round 426 §1): under each of his three kills the OLD sentence publishes '
  + 'while its own OLD gate is FALSE, the NEW key refuses, a kill aimed at another reading moves '
  + 'neither spelling, the REAL column publishes in both spellings, and every live sentence '
  + 'interpolates the bare identifier its gate reads',
  SEPARATES_426_1,
  `real [${READINGS.map((r) => `${r.id}:${M[r.id].realOldSent}/${M[r.id].realOldGate}/${M[r.id].realNew}`).join(' ')}]`);
gate('THE DISCRIMINATOR (my added D8 conjunct): the D8 kill passes the OLD GATE as well as the OLD '
  + 'sentence and is refused only by the NEW key — so the conjunct I added beyond his charge is '
  + 'load-bearing and not decoration',
  SEPARATES_426_1_K4,
  `§2/K4 old-sentence ${M['§2']['K4 D8.innerLeft empty'].oldSent} old-gate ${M['§2']['K4 D8.innerLeft empty'].oldGate} NEW ${M['§2']['K4 D8.innerLeft empty'].neu}`);
gate('CONTROL: the matrix is not vacuous — at least one cell of it is TRUE and at least one FALSE '
  + 'in the NEW column',
  READINGS.some((r) => KILLS.some((k) => M[r.id][k.id].neu === false))
  && READINGS.some((r) => KILLS.some((k) => M[r.id][k.id].neu === true)));

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
// Each sentence reads the SAME const its gate above reads — which is the cure this file grades.
say(`  §1 cure (a sentence must read its own discriminator): ${SEPARATES_426_1
  ? 'SEPARATES — his three kills each publish past a FALSE old gate and are each refused by the new key'
  : 'NOT shown to separate'}`);
say(`  the D8 conjunct I added beyond his charge: ${SEPARATES_426_1_K4
  ? 'LOAD-BEARING — the D8 kill passes the old gate too and only the new key refuses it'
  : 'NOT shown to be load-bearing'}`);
say(`  dropped conjuncts, per reading, read as text: ${READINGS.map((r) => `${r.id} dropped ${r.dropped.length}`).join(' · ')}`);

writeFileSync(path.join(import.meta.dirname, 'a-sentence-keyed-on-a-subset-publishes-past-its-own-gate.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
