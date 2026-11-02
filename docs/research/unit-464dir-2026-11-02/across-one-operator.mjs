// unit-464dir — stage 3: the one axis I departed from his read on, measured mechanically.
//
// My hand read calls GLIFT2@186 and GCTRLPRE@194 `conjunctive` rather than `keyed`: the predicate
// reads both states but never compares them to each other. That is a STRUCTURAL claim, so it has a
// structural test which does not need either harness driven:
//
//   Is there any single comparison operator in the predicate with a FROZEN-derived identifier on
//   one side and a LIVE-derived identifier on the other?
//
//   keyed       → yes. The two states meet across one operator.
//   conjunctive → no.  Each state meets a LITERAL across its own operator.
//
// What is hand-supplied and what is mechanical, stated plainly: the frozen/live LABEL of each
// identifier is hand-declared below and printed, because that labelling is precisely what
// LEG-CLASS-CONVENTION.md §3 measured a detector failing at. What is mechanical is the
// across-one-operator test over the labelled identifiers — and that is the whole of the claim.
//
// One level of same-file arrow inlining, declared: `ctrlPinned` is `(c) => …` in the same file, so
// its body is substituted for the call before the split. Deeper closures are NOT followed, and a
// row needing one is published UNRESOLVED rather than scored.
//
// KNOWN POSITIVE, in the real call shape: GROWREPRO@211 is `tripleKey(preCtrl.rows) ===
// tripleKey(rec4Rows)` — genuinely keyed — and MUST come out `across`. Without it an instrument
// that answered "not across" for everything would score my hand read perfectly.
// KNOWN NEGATIVE: GDELTA@60 is `preSrc !== postSrc`, which MUST come out `across` as well: delta
// and keyed both put the two states across one operator, and only the DIRECTION of the operator
// separates them. That is the point of the test — it separates {delta, keyed} from
// {conjunctive}, not delta from keyed.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = '/Users/xian/Development/klatch-worktrees/theseus';
const RES = join(ROOT, 'docs/research');
const SELF = 'unit-464dir-2026-11-02';
const PIN = 'b0de039bd79f3fa30daba69353d2eeaf48c42a2e';
const g = (a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const gates = [];
const gate = (id, ok, note) => { gates.push({ id, ok, note }); return ok; };

// ── the hand-declared labelling. FROZEN = derived from a pinned rev or a committed recording.
//    LIVE = derived from the worktree or from a run made in this process.
const LABEL = {
  preSrc: 'frozen', postSrc: 'live',
  preHas: 'frozen', postHas: 'live',
  HIS: 'live', MINE: 'live', pathOf: 'fn',            // HIS/MINE are pathOf(postSrc) — live
  preCtrl: 'live', preCtrlMatches: 'mixed',           // a COUNT of live-vs-frozen agreement
  preDecl: 'frozen', postDecl: 'live', bucket: 'fn',
  clonePre: 'frozen', clonePost: 'live', CLONE: 'literal', resolve: 'fn',
  ctrlPinned: 'fn', transition: 'fn', rec3Arm: 'frozen',
  rec4Rows: 'frozen', tripleKey: 'fn',
  atPin: 'frozen', atRecency: 'frozen', defectiveShape: 'frozen', liftAt: 'fn',
  changed: 'mixed', checkerNow: 'live', checkerThen: 'frozen',
  moved: 'mixed',
};

const CMP = ['===', '!==', '==', '!='];

const his = readFileSync(join(RES, 'unit-464class-2026-11-02/HAND-READ.tsv'), 'utf8')
  .split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'))
  .filter((c) => c[4] === 'CROSS-STATE')
  .map(([file, line, id, kind, cls, subkind]) => ({ file, line: Number(line), id, subkind }));

const my = readFileSync(join(RES, SELF, 'HAND-READ-12.tsv'), 'utf8')
  .split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'))
  .map(([file, line, id, direction]) => ({ file, line: Number(line), id, direction }));
const myBy = new Map(my.map((r) => [`${r.file}:${r.line}:${r.id}`, r]));

function lineStarts(s) { const a = [0]; for (let i = 0; i < s.length; i++) if (s[i] === '\n') a.push(i + 1); return a; }
function matchParen(b, o) { let d = 0; for (let i = o; i < b.length; i++) { if (b[i] === '(') d++; else if (b[i] === ')') { d--; if (!d) return i + 1; } } return -1; }

/** Split on top-level `&&` / `||` only — a comparison inside a nested call stays whole. */
function conjuncts(text) {
  const b = stripSource(text, true).replace(/=>/g, '  ');
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const c = b[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (depth === 0 && ((c === '&' && b[i + 1] === '&') || (c === '|' && b[i + 1] === '|'))) {
      out.push(text.slice(start, i)); start = i + 2; i++;
    }
  }
  out.push(text.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

const idsOf = (t) => [...new Set((stripSource(t, true).replace(/=>/g, '  ').match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []))];
const sideKind = (t) => {
  const labels = idsOf(t).map((i) => LABEL[i]).filter(Boolean).filter((l) => l !== 'fn');
  if (labels.includes('frozen')) return 'frozen';
  if (labels.includes('live')) return 'live';
  if (labels.includes('mixed')) return 'mixed';
  return 'literal-or-unknown';
};

const srcCache = new Map();
const rows = [];
for (const h of his) {
  const p = `docs/research/${h.file}`;
  if (!srcCache.has(p)) srcCache.set(p, g(['show', `${PIN}:${p}`]));
  const src = srcCache.get(p);
  const blank = stripSource(src, true);
  const open = blank.indexOf('(', lineStarts(src)[h.line - 1]);
  let text = src.slice(open, matchParen(blank, open));

  // One level of same-file arrow inlining, declared.
  const inlined = [];
  for (const id of idsOf(text)) {
    if (LABEL[id] !== 'fn') continue;
    const m = src.match(new RegExp(`^const ${id} = \\(([^)]*)\\) =>([\\s\\S]*?);\\n`, 'm'));
    if (m && new RegExp(`\\b${id}\\s*\\(`).test(text)) {
      text = text.replace(new RegExp(`\\b${id}\\s*\\(([^()]*)\\)`, 'g'), `( ${m[2].trim()} )`);
      inlined.push(id);
    }
  }

  const cs = conjuncts(text);
  const comparisons = [];
  for (const c of cs) {
    const cb = stripSource(c, true).replace(/=>/g, '  ');
    const op = CMP.find((o) => cb.includes(o));
    if (!op) continue;
    const at = cb.indexOf(op);
    const L = sideKind(c.slice(0, at)), R = sideKind(c.slice(at + op.length));
    comparisons.push({ op, L, R, across: (L === 'frozen' && R === 'live') || (L === 'live' && R === 'frozen') });
  }
  const across = comparisons.some((c) => c.across);
  const mineRow = myBy.get(`${h.file}:${h.line}:${h.id}`);
  rows.push({ ...h, mine: mineRow && mineRow.direction, inlined, conjuncts: cs.length, comparisons, across, text });
}

const kp = rows.find((r) => r.id === 'GROWREPRO');
const kn = rows.find((r) => r.id === 'GDELTA');
gate('GKP', !!kp && kp.across, `KP GROWREPRO@211 (genuinely keyed) comes out across=${kp && kp.across} — must be true or this instrument cannot find a cross-state comparison at all`);
gate('GKP2', !!kn && kn.across, `KP GDELTA@60 (genuinely delta) comes out across=${kn && kn.across} — the test separates {delta,keyed} from {conjunctive}, not delta from keyed`);
gate('GREACH', rows.length === 12 && rows.every((r) => r.text.trim().length > 0), `${rows.length} of 12 predicates sliced and non-empty`);
gate('GJOINED', rows.every((r) => r.mine), `${rows.filter((r) => r.mine).length} of 12 joined onto my hand read`);
gate('GCMPREACH', rows.every((r) => r.comparisons.length > 0 || r.conjuncts > 0),
  `every row yielded >=1 conjunct; ${rows.filter((r) => r.comparisons.length === 0).length} rows yielded no equality comparison at all (reported, not skipped)`);
gate('GNODEPEND', g(['status', '--porcelain', '--', 'packages/', 'scripts/']).length === 0, 'git status --porcelain -- packages/ scripts/ is 0 bytes');

// The agreement this drive is for: does across/not-across track my conjunctive label?
const conj = rows.filter((r) => r.mine === 'conjunctive');
const nonConj = rows.filter((r) => r.mine !== 'conjunctive');

const lines = [];
const say = (s = '') => lines.push(s);
say(`unit-464dir / across-one-operator — pinned rev ${PIN.slice(0, 12)}, drive rev ${g(['rev-parse', 'HEAD']).trim().slice(0, 12)}`);
say();
say('LABELLING (hand-declared, printed so it can be disagreed with)');
for (const [k, v] of Object.entries(LABEL)) say(`  ${k.padEnd(18)} ${v}`);
say();
say('ROWS');
for (const r of rows) {
  say(`  ${r.id.padEnd(10)}@${String(r.line).padEnd(4)} his ${r.subkind.padEnd(6)} mine ${String(r.mine).padEnd(12)} across=${String(r.across).padEnd(5)} conjuncts=${r.conjuncts} inlined=[${r.inlined.join(',')}]`);
  for (const c of r.comparisons) say(`        ${c.op}  ${c.L} ${c.op} ${c.R}   across=${c.across}`);
  if (r.comparisons.length === 0) say('        (no equality comparison at top level — UNRESOLVED by this test)');
}
say();
say('THE RESULT');
say(`  rows I called conjunctive: ${conj.map((r) => r.id + '@' + r.line).join(' ')}`);
say(`    of those, across-one-operator = ${conj.filter((r) => r.across).length} of ${conj.length}  (my hand read predicts 0)`);
say(`  rows I did NOT call conjunctive: ${nonConj.length}`);
say(`    of those, across-one-operator = ${nonConj.filter((r) => r.across).length} of ${nonConj.length}`);
say();
say('GATES');
for (const gt of gates) say(`  ${gt.ok ? 'ok  ' : 'RED '} ${gt.id}  ${gt.note}`);
const allOk = gates.every((gt) => gt.ok);
say();
say(`VERDICT: ${allOk ? 'ok' : 'RED'} — ${gates.filter((gt) => !gt.ok).length} of ${gates.length} gates red`);

const text = lines.join('\n') + '\n';
process.stdout.write(text);
writeFileSync(join(RES, SELF, 'across.txt'), text);
process.exit(allOk ? 0 : 1);
