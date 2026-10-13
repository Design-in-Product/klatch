#!/usr/bin/env node
/**
 * Round 380 — is Daedalus's new check `B1` red under the drift its own docblock names?
 *
 * His docblock (`probe-round377`, Round 379):
 *
 *   "`onlyUnderNarrow` being empty asserts the two selectors are still NESTED, which is what makes
 *    '+3' a delta rather than two unrelated readings; **re-keying either leg breaks it**."
 *
 * He graded B1 by two mutations: the narrow leg given a name the census selector cannot hold
 * (`.concat('summariseAndExit')`), and the two legs made identical. Neither of those is a re-key.
 * This instrument drives the real file under re-keys, each applied to a fresh copy, and records
 * which conjunct carries the arm.
 *
 * Harness shape, with the traps this project has already paid for:
 *   - Mutations are WHOLE-LINE replacements with the line count asserted === 1 (347), because the
 *     substring `const HERE = dirname(fileURLToPath(import.meta.url));` occurs twice in this file
 *     (code once, section C's `A_HERE` anchor constant once) and a substring replace hits the wrong
 *     one — the trap his own harness hit this round.
 *   - Every mutation must MOVE something it is supposed to move: each case asserts a predicted
 *     observable change in the printed figures, so a mutation that changed no byte of the
 *     population cannot be read as "the check cannot catch this" (355, and his own vacuous leg).
 *   - A control is driven first and must be exit 0 at 12/12.
 *   - Failure arms are parsed two ways and an exit≠0 with an empty arm list fails its own grade.
 *   - Prints GRADE lines, exits non-zero if any is not `true` (356).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SUBJECT = 'probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';
const WORK = join(REPO, '.testdata', 'round380');

const grades = [];
const grade = (name, pass, detail = '') => {
  grades.push({ name, pass });
  console.log(`GRADE ${name}: ${pass}${detail ? `  — ${detail}` : ''}`);
};

/** Replace exactly one WHOLE line, or throw (347). */
const oneLine = (src, from, to) => {
  const lines = src.split('\n');
  const hits = lines.filter((l) => l === from).length;
  if (hits !== 1) throw new Error(`line anchor not unique (${hits}): ${from.slice(0, 70)}`);
  return lines.map((l) => (l === from ? to : l)).join('\n');
};

const A_IMPORT_OUTCOME = "import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';";
const A_IMPORT_STRIP = "import { stripSource } from './lib/strip-source.mjs';";
const A_IMPORT_SWEEP = "import { census, SWEPT } from './sweep-probes.mjs';";
const A_HERE_CODE = 'const HERE = dirname(fileURLToPath(import.meta.url));';
const A_REPO_CODE = "const REPO = join(HERE, '..');";
const A_NARROW = 'const narrowPop = censusPop.filter((f) => /^probe-round/.test(f));';

const abs = (p) => JSON.stringify(join(SCRIPTS, p));

/** The copy, relocated out of `scripts/` but reading the real `scripts/` as its population. */
const relocate = (src) => {
  let s = src;
  s = oneLine(s, A_IMPORT_OUTCOME, `import { summariseAndExit, type ProbeVerdict } from ${abs('lib/probe-outcome.mts')};`);
  s = oneLine(s, A_IMPORT_STRIP, `import { stripSource } from ${abs('lib/strip-source.mjs')};`);
  s = oneLine(s, A_IMPORT_SWEEP, `import { census, SWEPT } from ${abs('sweep-probes.mjs')};`);
  s = oneLine(s, A_HERE_CODE, `const HERE = ${JSON.stringify(SCRIPTS)};`);
  s = oneLine(s, A_REPO_CODE, `const REPO = ${JSON.stringify(REPO)};`);
  return s;
};

const B1_LINE = /^(?:\[ok\]|FAIL) B1 {2}(.*)$/m;
const figuresOf = (out) => {
  const line = out.match(B1_LINE)?.[1] ?? '';
  const m = line.match(
    /(\d+) members under `probe-round\*` \((\d+) files\), (\d+) under `census\(\)`'s `\/\^probe-\/` \((\d+)\), (\d+) member\(s\) visible ONLY to the wider selector/,
  );
  const only = line.match(/and (\d+) visible only to the narrower/);
  return {
    raw: line,
    narrow: m ? Number(m[1]) : null,
    narrowPop: m ? Number(m[2]) : null,
    wide: m ? Number(m[3]) : null,
    widePop: m ? Number(m[4]) : null,
    onlyWider: m ? Number(m[5]) : null,
    onlyNarrower: only ? Number(only[1]) : null,
  };
};
const armsOf = (out) => {
  const a = [...out.matchAll(/^FAIL (\S+)/gm)].map((m) => m[1]);
  const b = [...out.matchAll(/\[(\w+)\] FAIL/g)].map((m) => m[1]);
  return [...new Set([...a, ...b])];
};

const drive = (label, mutate) => {
  mkdirSync(WORK, { recursive: true });
  const path = join(WORK, `${label}.mts`);
  const src = mutate(relocate(readFileSync(join(SCRIPTS, SUBJECT), 'utf8')));
  writeFileSync(path, src);
  const run = spawnSync('npx', ['tsx', path], { cwd: REPO, encoding: 'utf8', timeout: 600_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  writeFileSync(join(WORK, `${label}.out`), out);
  const res = {
    label,
    code: run.status,
    b1Green: /^\[ok\] B1 /m.test(out),
    b1Red: /^FAIL B1 /m.test(out),
    arms: armsOf(out),
    all12: /All 12 regression checks passed/.test(out),
    fig: figuresOf(out),
  };
  console.log(
    `\n── ${label} ── exit ${res.code} · B1 ${res.b1Red ? 'RED' : res.b1Green ? 'green' : '(absent)'} · ` +
      `failing arms [${res.arms.join(' ') || 'none'}]`,
  );
  console.log(`   figures: narrow ${res.fig.narrow}/${res.fig.narrowPop} · census ${res.fig.wide}/${res.fig.widePop} · ` +
    `only-wider ${res.fig.onlyWider} · only-narrower ${res.fig.onlyNarrower}`);
  if (res.code !== 0 && res.arms.length === 0) grade(`${label} parser found the failing arm`, false, 'exit≠0 with an empty arm list');
  return res;
};

rmSync(WORK, { recursive: true, force: true });

// ── C0 · control ────────────────────────────────────────────────────────────────────────────────
const c0 = drive('c0-control', (s) => s);
grade('C0 control: exit 0', c0.code === 0);
grade('C0 control: all 12 green', c0.all12 === true);
grade('C0 control: B1 green', c0.b1Green && !c0.b1Red);
grade('C0 control: his published figures', c0.fig.narrow === 17 && c0.fig.narrowPop === 122 && c0.fig.wide === 20 && c0.fig.widePop === 153 && c0.fig.onlyWider === 3 && c0.fig.onlyNarrower === 0, c0.fig.raw.slice(0, 0) || `${c0.fig.narrow}/${c0.fig.narrowPop} ${c0.fig.wide}/${c0.fig.widePop}`);

// ── M1 · the narrow leg RE-KEYED, which his docblock says breaks the nesting conjunct ───────────
const m1 = drive('m1-narrow-rekeyed-narrower', (s) =>
  oneLine(s, A_NARROW, 'const narrowPop = censusPop.filter((f) => /^probe-round3/.test(f));'),
);
grade('M1 moved the population it was supposed to move (not inert)', m1.fig.narrowPop !== null && m1.fig.narrowPop < 122 && m1.fig.narrow !== 17);
grade('M1 the nesting conjunct is STILL 0 under a re-key', m1.fig.onlyNarrower === 0, `only-narrower ${m1.fig.onlyNarrower}`);
grade('M1 B1 is GREEN under the re-key its docblock names', m1.b1Green && !m1.b1Red);
grade('M1 exit 0, all 12 green, with both published figures changed', m1.code === 0 && m1.all12 === true);

// ── M2 · the CENSUS leg re-keyed, locally, so the wider selector stops being wider ──────────────
// NOTE the anchor: `relocate` has already rewritten this import, so the mutation anchors on the
// RELOCATED line. Anchoring on the pre-relocation spelling threw `line anchor not unique (0)` —
// which is the assert doing its job rather than a silent no-op mutation.
const m2 = drive('m2-census-leg-rekeyed', (s) =>
  oneLine(
    s,
    `import { census, SWEPT } from ${abs('sweep-probes.mjs')};`,
    `import { SWEPT } from ${abs('sweep-probes.mjs')};\n` +
      `import { readdirSync as _rd } from 'node:fs';\n` +
      `const census = (dir: string) => _rd(dir).filter((f) => /^probe-round/.test(f)).sort();`,
  ),
);
grade('M2 moved the census population (not inert)', m2.fig.widePop !== null && m2.fig.widePop === 122);
grade('M2 the nesting conjunct is STILL 0 under a census re-key', m2.fig.onlyNarrower === 0, `only-narrower ${m2.fig.onlyNarrower}`);
grade('M2 B1 is RED — and on the NON-EMPTINESS conjunct, not nesting', m2.b1Red && m2.fig.onlyWider === 0);
grade('M2 B1 is the sole red', m2.arms.length === 1 && m2.arms[0] === 'B1', m2.arms.join(' '));

// ── M3 · the SHAPE change: narrow leg derived independently, not by filtering `censusPop` ───────
const m3 = drive('m3-narrow-not-derived-from-census', (s) =>
  oneLine(
    s,
    A_NARROW,
    `const narrowPop = census(HERE).filter((f) => /^probe-round/.test(f)).concat('summariseAndExit');`,
  ),
);
grade('M3 B1 is RED', m3.b1Red === true);
grade('M3 B1 is red on the NESTING conjunct', m3.fig.onlyNarrower !== null && m3.fig.onlyNarrower > 0, `only-narrower ${m3.fig.onlyNarrower}`);
grade('M3 B1 is the sole red', m3.arms.length === 1 && m3.arms[0] === 'B1', m3.arms.join(' '));

// ── Characterisation: nesting is monotone in the population, so no re-key can break it ──────────
// His `namesOtherUnder(pop)` keeps a swept entry iff SOME member of `pop` other than itself occurs
// in its source. `narrowPop` is `censusPop.filter(…)`, so it is a subset of `censusPop` for EVERY
// predicate, and the membership test is monotone in `pop`. Driven over random subsets rather than
// argued: if a counterexample existed, this would find one.
const { census, SWEPT } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
const censusPop = census(SCRIPTS);
const namesOtherUnder = (pop) =>
  SWEPT.filter((e) => {
    const src = readFileSync(join(SCRIPTS, e.file), 'utf8');
    return pop.some((f) => f !== e.file && src.includes(f));
  }).map((e) => e.file);
const full = namesOtherUnder(censusPop);
let worst = 0;
let seed = 20261012;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let i = 0; i < 40; i++) {
  const keep = 0.05 + 0.9 * rnd();
  const sub = censusPop.filter(() => rnd() < keep);
  const subMembers = namesOtherUnder(sub);
  const onlyNarrower = subMembers.filter((f) => !full.includes(f));
  worst = Math.max(worst, onlyNarrower.length);
}
grade('40 random sub-populations of censusPop: only-narrower is 0 in every one', worst === 0, `max ${worst}`);

const bad = grades.filter((g) => g.pass !== true);
console.log('');
console.log(bad.length === 0 ? `ALL ${grades.length} GRADES TRUE` : `GRADES NOT TRUE: ${bad.map((g) => g.name).join(' | ')}`);
process.exit(bad.length === 0 ? 0 : 1);
