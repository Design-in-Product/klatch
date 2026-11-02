// unit-464dir — stage 2: grade the delta/keyed split against the hand read of its own 12 rows.
//
// The hand read (HAND-READ-12.tsv) is the verdict and was committed before this file existed.
// This file does three things and classifies nothing:
//
//   1. joins my rows onto HIS (unit-464class-2026-11-02/HAND-READ.tsv) on (file, line, id) and
//      lifts his `subkind` column ITSELF — my TSV does not carry it, so a departure cannot be
//      manufactured by my transcription of his verdict (GNOTRETYPED asserts that);
//   2. measures P2 independently of either harness: the fixture/clone path literal extracted from
//      the SUBJECT source at the harness's own PRE_REV and at HEAD, plus whether the cure's diff
//      touches the line that carries it;
//   3. prints the departure matrix.
//
// GATES and PREDICTIONS are separate blocks and the exit code is keyed on the GATES ONLY. A gate
// whose predicate is a prediction's predicate can only suppress the prediction, which is the
// defect his 11/01 drive4 recorded; none of the legs below reads a prediction's verdict.

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = '/Users/xian/Development/klatch-worktrees/theseus';
const RES = join(ROOT, 'docs/research');
const SELF = 'unit-464dir-2026-11-02';
const PIN = 'b0de039bd79f3fa30daba69353d2eeaf48c42a2e';
const g = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const gates = [];
const gate = (id, ok, note) => { gates.push({ id, ok, note }); return ok; };
const preds = [];
const predict = (id, claim, landed, note) => { preds.push({ id, claim, landed, note }); };

const readTsv = (p) => {
  const raw = readFileSync(p, 'utf8');
  const body = raw.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  return { raw, rows: body.map((l) => l.split('\t')) };
};

// ─────────────────────────────────────────────────────────────────────── his rows, his column
const his = readTsv(join(RES, 'unit-464class-2026-11-02/HAND-READ.tsv'));
const hisRows = his.rows.map(([file, line, id, kind, cls, subkind, why]) => ({ file, line: Number(line), id, kind, cls, subkind, why }));
const hisCross = hisRows.filter((r) => r.cls === 'CROSS-STATE');

// ─────────────────────────────────────────────────────────────────────── my rows, my columns
const mine = readTsv(join(RES, SELF, 'HAND-READ-12.tsv'));
const myRows = mine.rows.map(([file, line, id, direction, reach, addressing, why]) => ({ file, line: Number(line), id, direction, reach, addressing, why }));

gate('GNOTRETYPED', !/\bsubkind\b/.test(mine.raw.split('\n').filter((l) => !l.startsWith('#')).join('\n')),
  "my TSV's data rows carry no `subkind` column — his verdict is joined, never transcribed");

const key = (r) => `${r.file}:${r.line}:${r.id}`;
const hisByKey = new Map(hisCross.map((r) => [key(r), r]));
const joined = myRows.map((r) => ({ ...r, his: hisByKey.get(key(r)) }));
const unjoined = joined.filter((r) => !r.his);
gate('GJOIN', unjoined.length === 0 && joined.length === 12,
  `${joined.length - unjoined.length} of ${joined.length} of my rows joined onto his 12 CROSS-STATE rows (${unjoined.length} unjoined)`);
gate('GROWKEY', hisCross.every((r) => myRows.some((m) => key(m) === key(r))),
  `every one of his ${hisCross.length} CROSS-STATE keys is present in my read (no row of his silently dropped)`);

// ───────────────────────────────────── GPREDROWS: the rows P1/P3 named, lifted from MY markdown
//
// Keyed on the registration's own literals, not on the prediction's verdict — the figure this
// gates is WHICH ROWS are scored, which is a key, not an outcome.
let predRowsOk = false, predRowsNote = 'pre-registration unreadable';
try {
  const reg = readFileSync(join(RES, SELF, 'PRE-REGISTRATION.md'), 'utf8');
  const named = [...reg.matchAll(/`(\w+)`\s*\n?\s*\(`(grade-[a-z-]+\.mjs):(\d+)`\)/g)].map((m) => ({ id: m[1], file: m[2], line: Number(m[3]) }));
  const uniq = [...new Map(named.map((n) => [`${n.file}:${n.line}:${n.id}`, n])).values()];
  const found = uniq.filter((n) => myRows.some((r) => r.id === n.id && r.line === n.line && r.file.endsWith(n.file)));
  predRowsOk = uniq.length >= 3 && found.length === uniq.length;
  predRowsNote = `${uniq.length} rows named in the registration's markdown (${uniq.map((n) => n.id + '@' + n.line).join(' ')}), ${found.length} of them present in the read`;
} catch (e) { predRowsNote = `RED: ${e.message}`; }
gate('GPREDROWS', predRowsOk, predRowsNote);

// ─────────────────────────────────────────────── P2: the two inert literals, measured myself
//
// Independent of either harness: I extract the literal from the SUBJECT source at the harness's
// own PRE_REV and at HEAD with my own regex, and read the cure's diff myself.
const harnessOf = (f) => g(['show', `${PIN}:docs/research/${f}`]);
const litCases = [
  {
    row: 'GPATHS@88', harness: 'unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs',
    subjConst: /const GATE =\s*\n?\s*'([^']+)'/, lit: /^const (HIS|MINE) = '(.+?)';$/gm,
  },
  {
    row: 'GPATH@104', harness: 'unit-464cure3-2026-11-01/grade-the-steal-cures.mjs',
    subjConst: /const SUBJ =\s*\n?\s*'([^']+)'/, lit: /^const (CLONE) = resolve\('(.+?)'\);$/gm,
  },
];
const litResults = [];
for (const c of litCases) {
  const hsrc = harnessOf(c.harness);
  const revM = hsrc.match(/const PRE_REV = '([0-9a-f]{8,40})'/);
  const subjM = hsrc.match(c.subjConst);
  const out = { row: c.row, rev: revM && revM[1], subj: subjM && subjM[1] };
  if (!out.rev || !out.subj) { out.error = `could not find PRE_REV (${!!out.rev}) or the subject const (${!!out.subj}) in the harness`; litResults.push(out); continue; }
  const grab = (src) => [...src.matchAll(c.lit)].map((m) => `${m[1]}=${m[2]}`);
  let preLits = [], postLits = [];
  try { preLits = grab(g(['show', `${out.rev}:${out.subj}`])); } catch (e) { out.error = `PRE read failed: ${e.message.split('\n')[0]}`; }
  try { postLits = grab(g(['show', `HEAD:${out.subj}`])); } catch (e) { out.error = `POST read failed: ${e.message.split('\n')[0]}`; }
  out.preLits = preLits; out.postLits = postLits;
  out.identical = preLits.length > 0 && preLits.join('|') === postLits.join('|');
  // The cure, as this harness itself defines it: PRE_REV..HEAD over the subject.
  const diff = g(['diff', `${out.rev}..HEAD`, '--', out.subj]);
  const changed = diff.split('\n').filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l));
  out.diffLines = changed.length;
  const values = postLits.map((s) => s.split('=').slice(1).join('='));
  out.diffTouchingLit = changed.filter((l) => values.some((v) => v && l.includes(v))).length;
  litResults.push(out);
}
gate('GLITREACH', litResults.every((r) => !r.error && r.preLits.length > 0 && r.postLits.length > 0),
  litResults.map((r) => `${r.row}: PRE ${r.preLits ? r.preLits.length : 0} / POST ${r.postLits ? r.postLits.length : 0} literals${r.error ? ' ERROR ' + r.error : ''}`).join(' · '));
gate('GCUREREACH', litResults.every((r) => r.diffLines > 0),
  litResults.map((r) => `${r.row}: ${r.diffLines} changed lines in ${(r.rev || '?').slice(0, 8)}..HEAD over the subject`).join(' · ') +
  ' — a zero here would make "the cure does not touch the literal" an unreached arm, not a measurement');

// ────────────────────────────────────────────────────────────────── the surface and the tree
const unitDirs = readdirSync(RES).filter((d) => d.startsWith('unit-464') && statSync(join(RES, d)).isDirectory());
gate('GSELFEXCL', unitDirs.filter((d) => d === SELF).length === 1,
  `${unitDirs.length} unit-464* dirs, 1 excluded as own, ${unitDirs.length - 1} on the surface; nothing under unit-464class-2026-11-02/ is written`);
const touched = g(['status', '--porcelain', '--', 'docs/research/unit-464class-2026-11-02/']);
gate('GHISDIRCLEAN', touched.length === 0, `git status --porcelain over HIS unit dir is ${touched.length} bytes — this unit reads it and does not write it`);
gate('GNODEPEND', g(['status', '--porcelain', '--', 'packages/', 'scripts/']).length === 0, 'git status --porcelain -- packages/ scripts/ is 0 bytes');

// ────────────────────────────────────────────────────────────────────────── the matrix
const DIRS = ['delta', 'keyed', 'conjunctive', 'staleness'];
const matrix = {};
for (const h of ['delta', 'keyed']) for (const m of DIRS) matrix[`${h}|${m}`] = 0;
for (const r of joined) matrix[`${r.his.subkind}|${r.direction}`] = (matrix[`${r.his.subkind}|${r.direction}`] ?? 0) + 1;

const dirDepartures = joined.filter((r) => r.his.subkind !== r.direction);
const reachDepartures = joined.filter((r) => r.his.subkind === r.direction && r.his.subkind === 'keyed' && r.reach === 'inert');
const allDepartures = [...dirDepartures, ...reachDepartures];

const myKeyed = joined.filter((r) => r.direction === 'keyed');
const keyedHazard = myKeyed.filter((r) => r.reach === 'reachable');
const hisKeyed = joined.filter((r) => r.his.subkind === 'keyed');
const addressing = {};
for (const r of joined.filter((r) => r.direction === 'delta' || r.direction === 'staleness')) addressing[r.addressing] = (addressing[r.addressing] ?? 0) + 1;

// ────────────────────────────────────────────────────────────── the predictions, scored
predict('P1', 'the classes are not disjoint: >=2 of his 7 keyed rows compare a cure-INERT figure, namely GPATHS@88 and GPATH@104',
  reachDepartures.length >= 2 && reachDepartures.every((r) => ['GPATHS', 'GPATH'].includes(r.id)),
  `${reachDepartures.length} of his ${hisKeyed.length} keyed rows are keyed-and-inert: ${reachDepartures.map((r) => r.id + '@' + r.line).join(' ')}`);

predict('P2', 'both inert figures are source literals, byte-identical across the two states, on lines the cure does not touch',
  litResults.every((r) => r.identical && r.diffTouchingLit === 0),
  litResults.map((r) => `${r.row}: PRE==POST ${r.identical} (${r.postLits.join(',')}), ${r.diffLines} cure-changed lines of which ${r.diffTouchingLit} touch the literal`).join(' · '));

predict('P3', '>=1 of the 12 is conjunctive — two single-state assertions, no cross-state comparison — namely GLIFT2@186',
  joined.some((r) => r.direction === 'conjunctive' && r.id === 'GLIFT2'),
  `conjunctive: ${joined.filter((r) => r.direction === 'conjunctive').map((r) => r.id + '@' + r.line).join(' ')} — ${joined.filter((r) => r.direction === 'conjunctive').length} of 12, so the sub-kind split over the 12 is not 5+7`);

predict('P4', '5 of 5 delta rows address their frozen side by a LITERAL rev or path',
  (addressing.literal ?? 0) === 5 && Object.keys(addressing).length === 1,
  `addressing over my delta+staleness rows: ${JSON.stringify(addressing)} — refuted in the direction registered as the worse finding if anything is 'recency'`);

predict('P5', 'exactly 3 of 12 rows depart from his cell (1 direction, 2 reach)',
  allDepartures.length === 3 && dirDepartures.length === 1 && reachDepartures.length === 2,
  `${allDepartures.length} of 12 depart: ${dirDepartures.length} direction (${dirDepartures.map((r) => r.id + '@' + r.line + ' ' + r.his.subkind + '→' + r.direction).join(', ')}) and ${reachDepartures.length} reach (${reachDepartures.map((r) => r.id + '@' + r.line).join(', ')})`);

// ────────────────────────────────────────────────────────────────────────────── the report
const lines = [];
const say = (s = '') => lines.push(s);
say(`unit-464dir / grade-direction — pinned rev ${PIN.slice(0, 12)}, drive rev ${g(['rev-parse', 'HEAD']).trim().slice(0, 12)}`);
say();
say('HIS SUBKIND (joined, not transcribed)  ×  MY DIRECTION');
say(`  ${''.padEnd(14)}${DIRS.map((d) => d.padStart(13)).join('')}`);
for (const h of ['delta', 'keyed']) say(`  his ${h.padEnd(10)}${DIRS.map((d) => String(matrix[`${h}|${d}`]).padStart(13)).join('')}`);
say();
say(`HIS keyed = ${hisKeyed.length}.  Of those: keyed-and-reachable ${hisKeyed.filter((r) => r.direction === 'keyed' && r.reach === 'reachable').length} · keyed-but-inert ${reachDepartures.length} · re-read as conjunctive ${hisKeyed.filter((r) => r.direction === 'conjunctive').length}`);
say(`MY keyed  = ${myKeyed.length}, of which ${keyedHazard.length} reachable — the hazard population`);
say(`FROZEN-SIDE ADDRESSING over the delta/staleness rows: ${JSON.stringify(addressing)}`);
say();
say('EVERY ROW');
for (const r of joined) {
  const flag = r.his.subkind !== r.direction ? ' <<DIRECTION' : (r.reach === 'inert' ? ' <<REACH' : '');
  say(`  ${r.id.padEnd(10)} ${r.file.split('/')[1].padEnd(28)}:${String(r.line).padEnd(4)} his ${r.his.subkind.padEnd(6)} mine ${r.direction.padEnd(12)} ${r.reach.padEnd(10)} ${r.addressing.padEnd(15)}${flag}`);
}
say();
say('P2 MEASUREMENT (my own extraction, not either harness\'s)');
for (const r of litResults) {
  say(`  ${r.row}  subject ${r.subj}`);
  say(`    PRE_REV ${(r.rev || '?').slice(0, 8)}  PRE literals [${(r.preLits || []).join(', ')}]`);
  say(`                      POST literals [${(r.postLits || []).join(', ')}]  identical=${r.identical}`);
  say(`    cure diff PRE_REV..HEAD over the subject: ${r.diffLines} changed lines, ${r.diffTouchingLit} of them carry the literal`);
}
say();
say('PREDICTIONS (scored; the exit code does NOT read this block)');
for (const p of preds) say(`  ${p.landed ? 'LANDS   ' : 'REFUTED '} ${p.id}  ${p.claim}\n            → ${p.note}`);
say();
say('GATES (the exit code reads these only)');
for (const gt of gates) say(`  ${gt.ok ? 'ok  ' : 'RED '} ${gt.id}  ${gt.note}`);
const allOk = gates.every((gt) => gt.ok);
say();
say(`VERDICT: ${allOk ? 'ok' : 'RED'} — ${gates.filter((gt) => !gt.ok).length} of ${gates.length} gates red · predictions ${preds.filter((p) => p.landed).length} land / ${preds.filter((p) => !p.landed).length} refuted`);

const text = lines.join('\n') + '\n';
process.stdout.write(text);
writeFileSync(join(RES, SELF, 'grade.txt'), text);
process.exit(allOk ? 0 : 1);
