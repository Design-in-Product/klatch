/**
 * `unit-465route375` — P7/P8: what the one-route copier bought, as a matched pair.
 *
 * Reproduces Theseus's cells X and Y (11/09 §4) off THIS unit's own driven artefacts rather than
 * off a hand-written stand-in: the two children are the files `probe-round375` actually wrote,
 * one by the PRE-cure `copy373` and one by the CURED one, both importing the SAME sandbox
 * registry. The only variable is whether the child's TEXT route travels with its import.
 *
 * The state: that sandbox registry's `probe-round225` `expect:` pin bumped `All 33` → `All 34` by
 * one asserted substitution. A walk keyed on `/All 33 …/` must stop finding it. The question is
 * which child notices.
 *
 * Run from the repo root: `node docs/research/unit-465route375-2026-11-09/grade-the-two-routes.mjs`
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = process.cwd();
const UNIT = join(REPO, 'docs/research/unit-465route375-2026-11-09');
const SCRATCH = join(UNIT, 'scratch');
const SANDBOX_REG = join(REPO, '.testdata/round375/sweep-mutant.mjs');
const PRE = join(SCRATCH, 'pre-child-mutantpath.mts');
const CUR = join(SCRATCH, 'cur-child-mutantpath.mts');

const grades = [];
const grade = (id, claim, pass) => {
  grades.push({ id, pass });
  console.log(`${pass ? 'TRUE ' : 'FALSE'} ${id}  ${claim}`);
};
const occ = (h, n) => h.split(n).length - 1;

// ── The state, built additively and with its anchor asserted ──
const KP = 'expect: /All 33 regression checks passed/';
const BUMPED = 'expect: /All 34 regression checks passed/';
const baseline = readFileSync(join(SCRATCH, 'sweep-mutant-pre.mjs'), 'utf8');
grade(
  'S1',
  `the kp anchor occurs exactly once in the sandbox registry (${occ(baseline, KP)}), so the bump ` +
    `lands where it is declared and nowhere else`,
  occ(baseline, KP) === 1,
);
writeFileSync(SANDBOX_REG, baseline.replace(KP, BUMPED), 'utf8');
const bumped = readFileSync(SANDBOX_REG, 'utf8');
grade(
  'S2',
  `and the bump is in the file both children import: ${occ(bumped, KP)} occurrence(s) of the old ` +
    `pin, ${occ(bumped, BUMPED)} of the new`,
  occ(bumped, KP) === 0 && occ(bumped, BUMPED) === 1,
);

// ── The two children, read as the artefacts they are rather than re-derived ──
const preSrc = readFileSync(PRE, 'utf8');
const curSrc = readFileSync(CUR, 'utf8');
const preLines = preSrc.split('\n');
const curLines = curSrc.split('\n');
const diff = preLines.map((l, i) => (l === curLines[i] ? -1 : i)).filter((i) => i >= 0);
grade(
  'S3',
  `the two children differ in exactly one line (at ${diff.map((i) => i + 1).join(', ')}) and it is ` +
    `the SWEEP text-route line, so anything that moves below is attributable to the route and not ` +
    `to the copy`,
  preLines.length === curLines.length &&
    diff.length === 1 &&
    /^const SWEEP = /.test(preLines[diff[0]]) &&
    /^const SWEEP = /.test(curLines[diff[0]]),
);
grade(
  'S4',
  `and they import the same registry: ${occ(preSrc, SANDBOX_REG)} / ${occ(curSrc, SANDBOX_REG)} ` +
    `reference(s) to the bumped sandbox copy — the PRE child reaches it only through the module ` +
    `route, the CUR child through both`,
  occ(preSrc, SANDBOX_REG) === 1 && occ(curSrc, SANDBOX_REG) === 2,
);

const rows = (out) => {
  const m = {};
  for (const line of out.split('\n')) {
    const r = /^(\[ok\]|FAIL) (\S+) {2}/.exec(line);
    if (r) m[r[2]] = r[1] === '[ok]' ? 'ok' : 'FAIL';
  }
  return m;
};
const drive = (label, file) => {
  const run = spawnSync('npx', ['tsx', file], { cwd: REPO, encoding: 'utf8', timeout: 300_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  writeFileSync(join(UNIT, `p7-${label}.txt`), out, 'utf8');
  const a1 = /^(\[ok\]|FAIL) A1 {2}[^\n]*attributes round225's own `expect:` line to ([^\n]*)$/m.exec(out);
  console.log(
    `[MEAS] ${label}  exit ${String(run.status)} · A1 ${a1 ? a1[1] : '(no line)'} · ` +
      `kpOwner ${a1 ? a1[2] : '(no line)'}`,
  );
  return { status: run.status, rows: rows(out), a1: a1?.[1] ?? null };
};
const x = drive('cellX-pre-one-route', PRE);
const y = drive('cellY-cur-both-routes', CUR);

grade(
  'P7a',
  `CELL X (Theseus's), the one-route child: its A1 is ${x.a1} on a registry whose kp line now ` +
    `reads All 34 — green because its walk reads the LIVE registry text, not the one it imports. ` +
    `A cell built on this copier to grade that fixture would be dead`,
  x.a1 === '[ok]',
);
grade(
  'P7b',
  `CELL Y, the cured both-routes child: its A1 is ${y.a1} on the same state — the walk now reads ` +
    `the registry the child is actually under, so the bumped pin is visible to it`,
  y.a1 === 'FAIL',
);
const moved = [...new Set([...Object.keys(x.rows), ...Object.keys(y.rows)])]
  .filter((k) => x.rows[k] !== y.rows[k])
  .sort();
grade(
  'P8',
  `and the delta is A1 ALONE: rows differing between the two spawns = ${JSON.stringify(moved)} ` +
    `(X exit ${String(x.status)}, ${Object.keys(x.rows).length} rows; Y exit ${String(y.status)}, ` +
    `${Object.keys(y.rows).length} rows)`,
  moved.length === 1 && moved[0] === 'A1',
);

// Restore the sandbox registry so a later drive of the probe is not reading this unit's state.
writeFileSync(SANDBOX_REG, baseline, 'utf8');
grade(
  'S5',
  `the sandbox registry is restored to the pre-bump bytes (${occ(readFileSync(SANDBOX_REG, 'utf8'), KP)} ` +
    `occurrence(s) of the original pin), so this instrument leaves no state behind for the gate`,
  occ(readFileSync(SANDBOX_REG, 'utf8'), KP) === 1,
);

const bad = grades.filter((g) => !g.pass);
console.log(
  `\n${bad.length === 0 ? `ALL ${grades.length} GRADES TRUE` : `${bad.length} of ${grades.length} GRADES FALSE: ${bad.map((g) => g.id).join(' ')}`}`,
);
process.exit(bad.length === 0 ? 0 : 1);
