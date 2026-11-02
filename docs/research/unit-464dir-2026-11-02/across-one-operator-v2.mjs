// unit-464dir — stage 3b: the same structural test, with the defect drive4 recorded repaired.
//
// drive4 is kept, and it is the most useful recording in this unit, because it REPORTED WHAT I
// WANTED TO SEE while being broken: "of the rows I called conjunctive, across-one-operator = 0 of
// 2 (my hand read predicts 0)". Both known-positives came out false — `preSrc !== postSrc` was
// read as `frozen !== frozen` — so the 0 of 2 was produced by an instrument that could not find a
// cross-state comparison anywhere. Without GKP/GKP2 it would have read as confirmation.
//
// THE CAUSE: drive4 split the whole CALL SPAN, not the predicate argument. Two compounding effects:
//
//   1. The span begins `(` so the depth counter never returns to 0 and the top-level `&&` split
//      found nothing — every row reported `conjuncts=1`, which was the visible symptom.
//   2. `stripSource` blanks string bodies but DELIBERATELY preserves code inside `${…}`, which is
//      correct. So the why-string's interpolations — `${preSrc.split('\n').length}` — put `preSrc`
//      on the right-hand side of the comparison, and `sideKind` tests frozen first, so a `live`
//      operand carrying a frozen identifier in the adjacent why-text read as `frozen`.
//
// THE REPAIR: split the call span on top-level commas and take the argument that is not wholly a
// string or template literal. That also fixes the argument-ORDER variance for free — `check(id,
// pred, why)` puts the predicate second and `g(id, why, pred)` puts it third, and C2b@99 is the
// second shape. A row where that rule leaves anything other than exactly one candidate is
// published UNRESOLVED and is not scored.

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

const LABEL = {
  preSrc: 'frozen', postSrc: 'live', preHas: 'frozen', postHas: 'live',
  HIS: 'live', MINE: 'live', pathOf: 'fn',
  preCtrl: 'live', preCtrlMatches: 'mixed',
  preDecl: 'frozen', postDecl: 'live', bucket: 'fn',
  clonePre: 'frozen', clonePost: 'live', CLONE: 'literal', resolve: 'fn',
  ctrlPinned: 'fn', transition: 'fn', rec3Arm: 'frozen',
  rec4Rows: 'frozen', tripleKey: 'fn',
  atPin: 'frozen', atRecency: 'frozen', defectiveShape: 'frozen', liftAt: 'fn',
  changed: 'mixed', checkerNow: 'live', checkerThen: 'frozen', moved: 'mixed',
};
const CMP = ['===', '!==', '==', '!='];

const his = readFileSync(join(RES, 'unit-464class-2026-11-02/HAND-READ.tsv'), 'utf8')
  .split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'))
  .filter((c) => c[4] === 'CROSS-STATE').map(([file, line, id, k, c, subkind]) => ({ file, line: Number(line), id, subkind }));
const my = readFileSync(join(RES, SELF, 'HAND-READ-12.tsv'), 'utf8')
  .split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'))
  .map(([file, line, id, direction]) => ({ file, line: Number(line), id, direction }));
const myBy = new Map(my.map((r) => [`${r.file}:${r.line}:${r.id}`, r]));

const noArrows = (t) => stripSource(t, true).replace(/=>/g, '  ');
function lineStarts(s) { const a = [0]; for (let i = 0; i < s.length; i++) if (s[i] === '\n') a.push(i + 1); return a; }
function matchParen(b, o) { let d = 0; for (let i = o; i < b.length; i++) { if (b[i] === '(') d++; else if (b[i] === ')') { d--; if (!d) return i + 1; } } return -1; }

/** Top-level split of `text` (inside its own outer parens) on `seps`. */
function splitTop(text, seps) {
  const b = noArrows(text);
  const out = []; let depth = 0, start = 0;
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    if ('([{'.includes(c)) { depth++; if (depth === 1 && i === 0) start = 1; continue; }
    if (')]}'.includes(c)) { depth--; if (depth === 0) { out.push(text.slice(start, i)); return out; } continue; }
    if (depth !== 1) continue;
    for (const s of seps) if (b.startsWith(s, i)) { out.push(text.slice(start, i)); start = i + s.length; i += s.length - 1; break; }
  }
  out.push(text.slice(start));
  return out;
}

/**
 * True when the argument is wholly a string/template literal (possibly concatenated).
 *
 * drive5 (kept) is the recording of this predicate being wrong, and it failed in the one direction
 * a gate can catch: `stripSource` blanks a string's BODY and keeps its QUOTES, so `'GDELTA'` came
 * back as `'      '` — two characters, not zero — and every three-argument row was published
 * UNRESOLVED. Ten of twelve. All three known-positives read `across=undefined` and all three gates
 * went red, which is the behaviour being asked of them: an instrument that cannot reach its rows
 * must say so rather than return a tidy `0 of 0`.
 *
 * Two things are removed here that drive5 did not remove: the quote characters themselves, and the
 * code inside a template's `${…}`. `stripSource` preserves interpolated code deliberately and
 * correctly — but a why-string's interpolations are not the predicate, and leaving them in is the
 * same leak that produced drive4's `frozen !== frozen`.
 */
function blankInterp(t) {
  const out = t.split('');
  for (let i = 0; i + 1 < t.length; i++) {
    if (t[i] !== '$' || t[i + 1] !== '{') continue;
    let d = 0;
    for (let j = i + 1; j < t.length; j++) {
      if (t[j] === '{') d++;
      else if (t[j] === '}') { d--; if (!d) { for (let k = i; k <= j; k++) if (out[k] !== '\n') out[k] = ' '; i = j; break; } }
    }
  }
  return out.join('');
}
const isWhollyLiteral = (t) => blankInterp(noArrows(t)).replace(/[\s+'"`]/g, '').length === 0;

const idsOf = (t) => [...new Set((noArrows(t).match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []))];
const sideKind = (t) => {
  const ls = idsOf(t).map((i) => LABEL[i]).filter((l) => l && l !== 'fn');
  if (ls.includes('frozen') && ls.includes('live')) return 'both';
  if (ls.includes('frozen')) return 'frozen';
  if (ls.includes('live')) return 'live';
  if (ls.includes('mixed')) return 'mixed';
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
  const span = src.slice(open, matchParen(blank, open));

  const args = splitTop(span, [',']).map((a) => a.trim()).filter((a) => a.length);
  const candidates = args.filter((a) => !isWhollyLiteral(a));
  const row = { ...h, mine: (myBy.get(`${h.file}:${h.line}:${h.id}`) || {}).direction, args: args.length, candidates: candidates.length };
  if (candidates.length !== 1) { row.unresolved = `${candidates.length} non-literal arguments`; rows.push(row); continue; }

  let pred = candidates[0];
  const inlined = [];
  for (const id of idsOf(pred)) {
    if (LABEL[id] !== 'fn') continue;
    const m = src.match(new RegExp(`^const ${id} = \\(([^)]*)\\) =>([\\s\\S]*?);\\n`, 'm'));
    if (m && new RegExp(`\\b${id}\\s*\\(`).test(pred)) {
      pred = pred.replace(new RegExp(`\\b${id}\\s*\\(([^()]*)\\)`, 'g'), `( ${m[2].trim()} )`);
      inlined.push(id);
    }
  }
  row.inlined = inlined;
  row.pred = pred.replace(/\s+/g, ' ').slice(0, 150);

  const cs = splitTop(`(${pred})`, ['&&', '||']).map((s) => s.trim()).filter(Boolean);
  row.conjuncts = cs.length;
  row.comparisons = [];
  for (const c of cs) {
    const cb = noArrows(c);
    const op = CMP.find((o) => cb.includes(o));
    if (!op) continue;
    const at = cb.indexOf(op);
    const L = sideKind(c.slice(0, at)), R = sideKind(c.slice(at + op.length));
    const across = (L === 'frozen' && R === 'live') || (L === 'live' && R === 'frozen') || L === 'both' || R === 'both';
    row.comparisons.push({ op, L, R, across });
  }
  row.across = row.comparisons.some((c) => c.across);
  rows.push(row);
}

const byId = (id, line) => rows.find((r) => r.id === id && r.line === line);
const kp1 = byId('GROWREPRO', 211), kp2 = byId('GDELTA', 60), kp3 = byId('GPATHS', 88);
gate('GKP', !!kp1 && kp1.across === true, `KP GROWREPRO@211 (genuinely keyed, tripleKey(preCtrl.rows) === tripleKey(rec4Rows)) across=${kp1 && kp1.across} — must be true`);
gate('GKP2', !!kp2 && kp2.across === true, `KP GDELTA@60 (genuinely delta, preSrc !== postSrc) across=${kp2 && kp2.across} — must be true; this test separates {delta,keyed} from {conjunctive}, not delta from keyed`);
gate('GKP3', !!kp3 && kp3.across === true, `KP GPATHS@88 (keyed on a path literal, but still a frozen-vs-live comparison) across=${kp3 && kp3.across} — must be true: cure-INERT is a separate axis from across-one-operator`);
gate('GREACH', rows.length === 12, `${rows.length} of 12 rows reached`);
gate('GJOINED', rows.every((r) => r.mine), `${rows.filter((r) => r.mine).length} of 12 joined onto my hand read`);
gate('GUNRES', true, `${rows.filter((r) => r.unresolved).length} rows UNRESOLVED by the argument rule (published, not skipped): ${rows.filter((r) => r.unresolved).map((r) => r.id + '@' + r.line + ' (' + r.unresolved + ')').join(', ') || 'none'}`);
gate('GNODEPEND', g(['status', '--porcelain', '--', 'packages/', 'scripts/']).length === 0, 'git status --porcelain -- packages/ scripts/ is 0 bytes');

const scored = rows.filter((r) => !r.unresolved);
const conj = scored.filter((r) => r.mine === 'conjunctive');
const nonConj = scored.filter((r) => r.mine !== 'conjunctive');

const lines = [];
const say = (s = '') => lines.push(s);
say(`unit-464dir / across-one-operator-v2 — pinned rev ${PIN.slice(0, 12)}, drive rev ${g(['rev-parse', 'HEAD']).trim().slice(0, 12)}`);
say();
say('LABELLING (hand-declared, printed so it can be disagreed with)');
for (const [k, v] of Object.entries(LABEL)) say(`  ${k.padEnd(18)} ${v}`);
say();
say('ROWS');
for (const r of rows) {
  say(`  ${r.id.padEnd(10)}@${String(r.line).padEnd(4)} his ${r.subkind.padEnd(6)} mine ${String(r.mine).padEnd(12)} args=${r.args} cand=${r.candidates} ${r.unresolved ? 'UNRESOLVED: ' + r.unresolved : `across=${r.across} conjuncts=${r.conjuncts} inlined=[${r.inlined.join(',')}]`}`);
  if (r.pred) say(`        pred: ${r.pred}`);
  for (const c of r.comparisons || []) say(`        ${c.L} ${c.op} ${c.R}   across=${c.across}`);
  if (r.comparisons && r.comparisons.length === 0) say('        (no equality comparison among the conjuncts)');
}
say();
say('THE RESULT — does across-one-operator track the conjunctive label?');
say(`  scored rows: ${scored.length} of 12 (${rows.length - scored.length} unresolved)`);
say(`  rows I called conjunctive: ${conj.map((r) => r.id + '@' + r.line).join(' ') || 'none'}`);
say(`    across = ${conj.filter((r) => r.across).length} of ${conj.length}   (my hand read predicts 0)`);
say(`  rows I did not: ${nonConj.map((r) => r.id + '@' + r.line).join(' ')}`);
say(`    across = ${nonConj.filter((r) => r.across).length} of ${nonConj.length}   (my hand read predicts all of them)`);
say();
say('GATES');
for (const gt of gates) say(`  ${gt.ok ? 'ok  ' : 'RED '} ${gt.id}  ${gt.note}`);
const allOk = gates.every((gt) => gt.ok);
say();
say(`VERDICT: ${allOk ? 'ok' : 'RED'} — ${gates.filter((gt) => !gt.ok).length} of ${gates.length} gates red`);

const text = lines.join('\n') + '\n';
process.stdout.write(text);
writeFileSync(join(RES, SELF, 'across.v2.txt'), text);
process.exit(allOk ? 0 : 1);
