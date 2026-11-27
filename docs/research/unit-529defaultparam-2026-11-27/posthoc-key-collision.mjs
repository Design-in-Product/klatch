/**
 * unit-529defaultparam — post-hoc: the movement key collides, and P5 needs re-verifying without it.
 *
 * Written AFTER the arm's drive and labelled as such. It exists because the arm's own capture
 * prints two figures that disagree about the same movement:
 *
 *   `PUB -> DEF: 1 moved`          (keyed `path:line:receiver`)
 *   `UNRESOLVED -2 / OTHER-BOUND +2` (tallied over sites)
 *
 * Both are right about their own subject. The movement key was inherited from
 * `unit-527setgeneric`'s arm, where all four movers sat on four distinct lines, so the collision had
 * no instance there. Here the two members are **two `.size` comparisons on one line with one
 * receiver name**, so they share a key and the moved-row list prints ONE row for TWO members.
 *
 * Two questions, both answered by measurement rather than by reading:
 *
 *   Q1  How many sites in the pinned population share a key with another site, and which?
 *   Q2  Does P5 ("cure D is purely additive") still hold when verified POSITIONALLY — site by
 *       site in population order, with no key in the comparison at all?
 *
 * Q2 matters because the arm's P5 check walked the keyed map, so any second site hiding behind a
 * duplicate key was never compared. A guard that cannot see a member cannot clear it.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') throw new Error(`§0: packages/ or scripts/ is dirty:\n${dirty}`);
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();

const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const frozenText = readFileSync(`${ROOT}${FROZEN}`, 'utf8');
const occ = (hay, needle) => hay.split(needle).length - 1;
const pad = (s, n) => String(s).padEnd(n, ' ');

const START = "const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];";
const END = '// ─── Arm B ';
for (const [n, lit] of [['START', START], ['END', END]]) {
  if (occ(frozenText, lit) !== 1) throw new Error(`anchor ${n} is not unique`);
}
const SLICED = frozenText.slice(frozenText.indexOf(START), frozenText.indexOf(END));

// cure D, byte-identical to the arm's: the same PARAM_SRC and the same anchored substitution.
const PARAM_SRC = '[(,]\\s*NAME\\s*(?::[^=,)\\n]*)?=\\s*(.*)$';
const FROM = `  const m = re.exec(code);
  if (!m) return null;
  return { rhs: m[1], line: lineOf(code, m.index) };`;
const TO = `  const m = re.exec(code);
  if (m) return { rhs: m[1], line: lineOf(code, m.index) };
  const _pre = new RegExp(${JSON.stringify(PARAM_SRC)}.replace('NAME', name.replace(/[$]/g, '\\\\$')), 'm');
  const _pm = _pre.exec(code);
  if (!_pm) return null;
  const _pl = lineOf(code, _pm.index);
  __firings.push({ name, line: _pl, rhs: _pm[1] });
  return { rhs: _pm[1], line: _pl };`;
if (occ(SLICED, FROM) !== 1) throw new Error('cure D anchor is not unique in the slice');
const CURED = SLICED.replace(FROM, () => TO);
if (occ(CURED, TO) !== 1) throw new Error('cure D replacement is not unique after substitution');

const RETURN = `
  return { armA, keyIndirect, corpus, read, SIZE_CMP, lineOf };
`;
const firings = { PUB: [], DEF: [] };
const inst = (text, label) => {
  // eslint-disable-next-line no-new-func
  const f = new Function('stripSource', 'parenSpanEnd', 'sh', 'readFileSync', 'ROOT', '__firings',
    text + RETURN);
  return f(stripSource, parenSpanEnd, sh, readFileSync, ROOT, firings[label]);
};
const PUB = inst(SLICED, 'PUB');
const DEF = inst(CURED, 'DEF');
const CORPUS = PUB.corpus;

const rPub = PUB.armA(CORPUS);
const rDef = DEF.armA(CORPUS);

// ─── Q1: key collisions in the pinned population ────────────────────────────────────────────────

const keyOf = (s) => `${s.path}:${s.line}:${s.receiver}`;
const byKey = new Map();
for (const s of rPub.sites) {
  const k = keyOf(s);
  if (!byKey.has(k)) byKey.set(k, []);
  byKey.get(k).push(s);
}
const dupKeys = [...byKey.entries()].filter(([, v]) => v.length > 1);
const hiddenMembers = dupKeys.reduce((a, [, v]) => a + (v.length - 1), 0);

// ─── Q2: P5 verified POSITIONALLY, no key ───────────────────────────────────────────────────────

const cells = [];
const c = (name, ok, got) => cells.push({ name, ok: ok === true, got });
c('Q2.0  populations are the same length', rPub.sites.length === rDef.sites.length,
  `PUB=${rPub.sites.length} DEF=${rDef.sites.length}`);
c('Q2.1  excludedDirectTails equal', rPub.excludedDirectTails === rDef.excludedDirectTails,
  `PUB=${rPub.excludedDirectTails} DEF=${rDef.excludedDirectTails}`);

let alignment = 0;
const positional = [];
for (let i = 0; i < Math.min(rPub.sites.length, rDef.sites.length); i++) {
  const a = rPub.sites[i];
  const b = rDef.sites[i];
  if (a.path !== b.path || a.line !== b.line || a.receiver !== b.receiver) alignment += 1;
  if (a.cls !== b.cls || a.guard !== b.guard || a.bindLine !== b.bindLine) positional.push({ i, a, b });
}
c('Q2.2  the two runs are positionally ALIGNED (same path/line/receiver at every index)',
  alignment === 0, `${alignment} index(es) misaligned`);
c('Q2.3  every positional difference is a site that was UNRESOLVED under PUB',
  positional.every(({ a }) => a.cls === 'UNRESOLVED'),
  `${positional.filter(({ a }) => a.cls !== 'UNRESOLVED').length} non-UNRESOLVED difference(s)`);
c('Q2.4  the number of positionally moved sites is 2, not the keyed list’s 1',
  positional.length === 2, `${positional.length} moved positionally`);

const keyedMoved = [];
for (const [k, v] of byKey) {
  const bs = rDef.sites.filter((s) => keyOf(s) === k);
  const b = bs[0];
  const a = v[0];
  if (b && (a.cls !== b.cls || a.guard !== b.guard || a.bindLine !== b.bindLine)) keyedMoved.push(k);
}

/**
 * DRIVE 1 OF THIS POST-HOC ASSERTED `positional - keyed === hiddenMembers` AND IT FAILED:
 * `positional=2 keyed=1 hidden=4`. The capture is kept at `captures/POSTHOC-DRIVE1.out`.
 *
 * The CELL was wrong, not the instrument. `hiddenMembers` counts members hidden behind a duplicate
 * key **anywhere in the population** (4). What the keyed movement list can lose is only the members
 * hidden behind a key that **actually moved** — three of the four collisions did not move at all,
 * so they hide nothing from a list of movers. The repair changes the PREDICATE, not the subject:
 * the undercount is measured against the collisions among the movers.
 *
 * Both figures are printed, because the population-level one is the warning for the NEXT cure and
 * the movement-level one is the correction to this one.
 */
const movedKeys = new Set(positional.map(({ a }) => keyOf(a)));
const hiddenAmongMovers = [...movedKeys].reduce((a, k) => a + ((byKey.get(k) || []).length - 1), 0);
c('Q2.5  the keyed walk undercounts the positional one by the members hidden behind a MOVED key',
  positional.length - keyedMoved.length === hiddenAmongMovers,
  `positional=${positional.length} keyed=${keyedMoved.length} hiddenAmongMovers=${hiddenAmongMovers} (hiddenInPopulation=${hiddenMembers})`);

/**
 * The live warning this post-hoc exists to leave behind: which colliding keys carry a class that a
 * cure already boarded would move. `unit-527`'s first successor is the `new Map<K, V>(` locator, and
 * two of the four collisions are `MAP-BOUND` — so that cure, measured with this same keyed walk,
 * would undercount its own movers.
 */
const atRisk = dupKeys.filter(([, v]) => v.some((s) => s.cls === 'MAP-BOUND' || s.cls === 'MAP-EXPR'));
c('Q2.6  the Map-side successor has colliding keys waiting for it (reported, not a failure)',
  true, `${atRisk.length} colliding key(s) carry MAP-BOUND/MAP-EXPR, hiding ${atRisk.reduce((a, [, v]) => a + v.length - 1, 0)} member(s)`);

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

console.log('unit-529defaultparam — post-hoc: movement-key collision, and P5 re-verified positionally');
console.log(`SHA ${SHA} · clock ${CLOCK}`);
console.log(`corpus ${CORPUS.length} files · population ${rPub.sites.length} sites`);
console.log('WRITTEN AFTER THE ARM DROVE. Not pre-registered; it answers a defect the arm printed.');
console.log('');

console.log('─── Q1: key collisions under `path:line:receiver` ──────────────────────────────');
console.log(`  sites ${rPub.sites.length} · distinct keys ${byKey.size} · colliding keys ${dupKeys.length} · members hidden behind another ${hiddenMembers}`);
for (const [k, v] of dupKeys) {
  console.log(`    ${pad(k, 110)} ${v.length} sites`);
  console.log(`      PUB classes: ${v.map((s) => `${s.cls}/${s.dir}`).join(' | ')}`);
  console.log(`      ${v[0].whole}`);
}
console.log('');
console.log('  the consequence, stated as a figure rather than a caveat:');
console.log(`    a keyed moved-row list can print at most ${byKey.size} rows for a ${rPub.sites.length}-site population,`);
console.log(`    so up to ${hiddenMembers} member(s) can move without appearing in it.`);
console.log('');
console.log('  which of those collisions a cure ALREADY BOARDED would move:');
for (const [k, v] of atRisk) console.log(`    ${pad(k, 100)} ${v[0].cls}, ${v.length} sites`);
console.log(`    (the \`new Map<K, V>(\` successor is keyed on exactly this class. ${atRisk.length} colliding key(s)`);
console.log('     carrying it means a Map-side cure measured with the keyed walk starts with a known');
console.log('     undercount, and this is the figure to hold it to.)');
console.log('');

console.log('─── Q2: P5 verified positionally, with no key in the comparison ────────────────');
for (const cc of cells) console.log(`  ${cc.ok ? 'PASS' : 'FAIL'}  ${pad(cc.name, 76)} ${cc.got}`);
console.log('');
console.log('  every positional difference, whole:');
for (const { i, a, b } of positional) {
  console.log(`    [${i}] ${a.path}:${a.line}  receiver=${a.receiver}`);
  console.log(`         PUB ${a.cls}/${a.dir}${a.guard ? `/${a.guard}` : ''} bindLine=${a.bindLine}  ->  DEF ${b.cls}/${b.dir}${b.guard ? `/${b.guard}` : ''} bindLine=${b.bindLine}`);
  console.log(`         ${a.whole}`);
}
console.log('');
console.log(`  cure D firings: PUB ${firings.PUB.length} · DEF ${firings.DEF.length}`);
console.log(`  distinct (name, line) pairs under DEF: ${new Set(firings.DEF.map((f) => `${f.name}:${f.line}`)).size}`);
console.log('    (P15 registered this at [2, 60] and it is 1: the two members are two USE SITES of');
console.log('     ONE binding, so a floor counted in members cannot be met by a census of bindings.)');
console.log('');
const passed = cells.filter((x) => x.ok).length;
console.log(`POST-HOC: ${passed === cells.length ? 'ALL CELLS PASS' : 'A CELL FAILED'}  ·  ${passed} of ${cells.length}`);
