// Census for the routed `expect` 8->9 decision (Theseus, 11/08 ~15:1x memo §3).
//
// Question: for each member of the 372-377 family, does the file ALREADY carry an arm
// asserting the presence of the registry entry it is keyed on, at or before the first
// registry dereference? If yes, a presence guard can be made by re-ordering
// (count-preserving, as round372's A2-above-A1b was). If no, the guard is necessarily
// a NEW arm and that entry's registry `expect` must bump.
//
// LIVE is split from prose with lib/strip-source.mjs, because a docblock that quotes a
// dereference is not a dereference -- this seat's own U1, 11/08 WORK fire.
//
// SELF-CHECK, printed per file and not optional: the arm count this detector finds is
// compared against the registry's own `expect: /All N regression checks passed/` pin.
// A first version of this scanner found 1 arm in a 26-arm file, because it required the
// label literal on the same line as `check(`. A source scanner under-reports silently,
// so its figure is not usable until it reproduces a figure the subject publishes itself.
import { readFileSync } from 'node:fs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const FILES = process.argv.slice(2);
if (FILES.length === 0) throw new Error('usage: census-arm-positions.mjs <probe.mts>...');

const SWEEP = 'scripts/sweep-probes.mjs';

/** The registry's declared arm count for a probe file, read off the live registry. */
const expectedArms = (/** @type {string} */ basename) => {
  const src = readFileSync(SWEEP, 'utf8');
  const i = src.indexOf(`file: '${basename}'`);
  if (i < 0) return { n: null, why: 'no registry entry' };
  const after = src.slice(i, i + 4000);
  const m = /expect:\s*\/All (\d+) regression checks passed\//.exec(after);
  if (!m) return { n: null, why: 'entry has no All-N expect pin' };
  return { n: Number(m[1]), why: null };
};

// An arm's declaration as the probes spell it: a check-family call whose first argument
// is the label literal, which may sit on a continuation line.
const ARM = /\bcheck\w*\(\s*'([A-Za-z][A-Za-z0-9]*)'/g;
// The dereference shapes in play: the `!` spellings this seat censused (33), the registry
// lookup Theseus showed is the actual hazard (9), and the bare property access off a
// lookup result, which carries no `!` at all (his U2).
const DEREF = [
  ['bang', /\.(refusal|skip)!/],
  ['find-bang', /SWEPT\.find\([^)]*\)!/],
  ['find-plain', /SWEPT\.find\(/],
];

/** Line number of a character offset in a string. */
const lineOf = (/** @type {string} */ s, /** @type {number} */ off) => s.slice(0, off).split('\n').length;

for (const f of FILES) {
  const basename = f.replace(/^.*\//, '');
  const raw = readFileSync(f, 'utf8');
  const liveText = stripSource(raw);
  const live = liveText.split('\n');

  const arms = [];
  ARM.lastIndex = 0;
  let m;
  while ((m = ARM.exec(liveText))) arms.push({ label: m[1], line: lineOf(liveText, m.index) });

  const derefs = [];
  live.forEach((l, i) => {
    for (const [kind, re] of DEREF) {
      if (re.test(l)) derefs.push({ kind, line: i + 1, text: l.trim().slice(0, 110) });
    }
  });

  const firstDeref = derefs.length ? Math.min(...derefs.map((d) => d.line)) : null;
  const armsBefore = arms.filter((a) => firstDeref !== null && a.line < firstDeref);
  const exp = expectedArms(basename);
  const verdict =
    exp.n === null ? `UNGRADED (${exp.why})` : arms.length === exp.n ? 'SOUND' : `UNSOUND (off by ${arms.length - exp.n})`;

  console.log('='.repeat(100));
  console.log(basename);
  console.log(`  detector self-check: found ${arms.length} arms, registry expect ${exp.n ?? '(none)'} -> ${verdict}`);
  console.log(`  arms: ${arms.map((a) => `${a.label}@${a.line}`).join(' ')}`);
  console.log(`  first dereference: ${firstDeref === null ? '(none)' : firstDeref}`);
  console.log(
    `  arms strictly before it: ${armsBefore.length} -> ${armsBefore.map((a) => `${a.label}@${a.line}`).join(' ') || '(none)'}`,
  );
  console.log('  dereference sites:');
  for (const d of derefs) console.log(`    ${d.kind.padEnd(10)} :${String(d.line).padEnd(5)} ${d.text}`);
}
