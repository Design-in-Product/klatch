/**
 * Round 281 — a probe that only runs in the worktree that wrote it, and how big that class is.
 *
 * Argus swept Round 280 on 2026-09-27 and found that Theseus's probe **throws** in a worktree
 * that does not already have `.testdata/r280/` on disk: arm I's `writeFileSync` has no
 * `mkdirSync` before it, and `.testdata/` is gitignored, so the directory exists only where the
 * probe has already run. Reproduced here, third worktree, exit 2.
 *
 * That is a fourth instance — and a *different mechanism* from the other three — of the thing
 * Theseus's Round 280 §8 named: a probe driven outside its own round comes back red. The other
 * three were stale pins. This one is an instrument that was never portable in the first place.
 * So the question worth a fire is not the one line; it is **how many probes in `scripts/` only
 * run where they were authored.**
 *
 * The answer is: **one.** That is the headline, and it is a negative result. Two sub-findings
 * matter more than the count:
 *
 *  1. **My first measurement of it said five, and four of those were false positives.** "Writes
 *     files and contains no `mkdirSync`" is not the property. Three of the four delegate their
 *     only `.testdata` write to vitest's `--outputFile`, and vitest creates the parent
 *     recursively (arm D measures this rather than assuming it). The fourth writes its undo
 *     record beside a database path that necessarily exists.
 *  2. **My second measurement said seventeen more, and that number was a regex artifact.**
 *     `/mkdirSync\s*\(([^)]*)\)/` stops at the first `)`, so `mkdirSync(path.join(a, b), {
 *     recursive: true })` truncates to `path.join(a, b` and reads as non-recursive. Arm B pins
 *     that, because the artifact is more reusable than the finding.
 *
 * Arms:
 *   A  census: files under `scripts/` that write, reference `.testdata`, and have no `mkdirSync`
 *   B  the regex artifact: the naive one-line match over-reports non-recursive `mkdirSync`
 *   C  portability, driven: `.testdata/r280` removed, round280 must still reach exit 0
 *      C2 two-sided control — the same write with the directory absent and no `mkdirSync`
 *   D  does vitest's `--outputFile` create a missing parent? (clears 3 of arm A's 5)
 *   E  every non-recursive `mkdirSync` site is a child of a root the probe itself just made
 *
 * Discipline: census by `readdirSync`/`readFileSync`, never `grep` (Round 276: grep is blind to
 * two source files in this repo). Child processes driven with `spawnSync` and the status read
 * directly, never through a pipe. No server bound, no port touched — this probe is static plus
 * one child drive.
 */
import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

type Outcome = 'PASS' | 'FAIL' | 'MEAS' | 'SKIP';
const rows: { id: string; outcome: Outcome; text: string }[] = [];
const record = (id: string, outcome: Outcome, text: string): void => {
  rows.push({ id, outcome, text });
  console.log(`[${outcome === 'PASS' ? 'ok' : outcome === 'FAIL' ? 'FAIL' : outcome}] ${id}  ${text}`);
};
const check = (id: string, cond: boolean, text: string): void =>
  record(id, cond ? 'PASS' : 'FAIL', text);

const SCRIPTS = 'scripts';
const SCRATCH = path.join('.testdata', 'r281');

/** Every `.mts`/`.mjs` directly under `scripts/`, by directory walk rather than a glob or grep. */
function scriptFiles(): string[] {
  return readdirSync(SCRIPTS, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.(mts|mjs)$/.test(d.name))
    .map((d) => d.name)
    .sort();
}

const WRITES = /writeFileSync|createWriteStream|appendFileSync|cpSync|copyFileSync|mkdtempSync/;

async function main(): Promise<void> {
  mkdirSync(SCRATCH, { recursive: true });

  // ---------------------------------------------------------------- A: the census
  const files = scriptFiles();
  const referencing: string[] = [];
  const writing: string[] = [];
  const noMkdir: string[] = [];
  for (const f of files) {
    const src = readFileSync(path.join(SCRIPTS, f), 'utf8');
    if (!src.includes('.testdata')) continue;
    referencing.push(f);
    if (!WRITES.test(src)) continue;
    writing.push(f);
    if (!/mkdirSync|mkdir\(/.test(src)) noMkdir.push(f);
  }
  record('A1', 'MEAS', `scripts/ files: ${files.length}  reference .testdata: ${referencing.length}  and write: ${writing.length}`);
  record('A2', 'MEAS', `write + no mkdirSync anywhere: ${noMkdir.length} — ${noMkdir.join(', ') || '(none)'}`);

  // The four that are NOT defects, and why. Named so a future census that loses one of these
  // exclusions has to re-argue it rather than silently re-flagging the file.
  const exonerated = new Set([
    'backfill-entity-bindings.mts', // undo record written beside an existing db path
    'probe-round251-the-port-lever-mutations.mjs', // .testdata write is vitest --outputFile (arm D)
    'probe-round253-the-db-path-mutations.mjs',
    'probe-round255-the-comment-shadow-mutations.mjs',
  ]);
  // Pre-repair this set was exactly one file, `probe-round280-…-behind.mts`. The repair below
  // (arm A4) is what empties it, so a red here means either a new non-portable probe has been
  // written or the round280 repair was reverted.
  const unexplained = noMkdir.filter((f) => !exonerated.has(f));
  check(
    'A3',
    unexplained.length === 0,
    `after the four documented exclusions the unexplained set is empty (pre-repair it held exactly one: probe-round280); now: ${unexplained.join(', ') || '(none)'}`,
  );

  // The repair itself, read from the line rather than from the diff.
  const r280 = readFileSync(
    path.join(SCRIPTS, 'probe-round280-the-client-half-of-the-pair-and-what-it-leaves-behind.mts'),
    'utf8',
  );
  check(
    'A4',
    /mkdirSync\(dir, \{ recursive: true \}\);/.test(r280) &&
      r280.indexOf('mkdirSync(dir, { recursive: true });') < r280.indexOf('writeFileSync(childPath, child);'),
    'round280 arm I now creates its directory, and does so BEFORE the write',
  );

  // ------------------------------------------------- B: the regex artifact, pinned
  const sample = 'fs.mkdirSync(path.join(TMP, "lib"), { recursive: true });';
  const naive = [...sample.matchAll(/mkdirSync\s*\(([^)]*)\)/g)].map((m) => m[1]);
  const naiveSaysNonRecursive = naive.length > 0 && !/recursive\s*:\s*true/.test(naive[0]);
  const lineScanSaysRecursive = /recursive\s*:\s*true/.test(sample);
  check(
    'B1',
    naiveSaysNonRecursive && lineScanSaysRecursive,
    'the naive `([^)]*)` match reads a nested-paren recursive mkdirSync as non-recursive; a line scan does not',
  );

  // This file is excluded from its own census: the line `if (!/mkdirSync\s*\(/.test(l)) return;`
  // is itself a literal match with no `recursive: true` on it, so a self-inclusive scan reports
  // one site that does not exist. Self-detection, found by running the arm — not reasoned away.
  const SELF = path.basename(new URL(import.meta.url).pathname);
  let nonRecursiveSites = 0;
  const nonRecursiveFiles = new Set<string>();
  for (const f of files) {
    if (f === SELF) continue;
    readFileSync(path.join(SCRIPTS, f), 'utf8')
      .split('\n')
      .forEach((l) => {
        if (!/mkdirSync\s*\(/.test(l)) return;
        if (/recursive\s*:\s*true/.test(l)) return;
        nonRecursiveSites++;
        nonRecursiveFiles.add(f);
      });
  }
  record(
    'B2',
    'MEAS',
    `line scan (excluding this file): ${nonRecursiveSites} non-recursive mkdirSync site(s) in ${nonRecursiveFiles.size} file(s) — ${[...nonRecursiveFiles].map((f) => f.slice(0, 22)).join(', ')}; the naive regex reported 17 files`,
  );

  // ---------------------------------------- C: portability, actually driven
  const r280Dir = path.join('.testdata', 'r280');
  if (existsSync(r280Dir)) rmSync(r280Dir, { recursive: true, force: true });
  check('C0', !existsSync(r280Dir), 'precondition: .testdata/r280 absent before the drive');

  const drive = spawnSync(
    'npx',
    ['tsx', path.join(SCRIPTS, 'probe-round280-the-client-half-of-the-pair-and-what-it-leaves-behind.mts')],
    { encoding: 'utf8', maxBuffer: 1e8, timeout: 300_000 },
  );
  writeFileSync(path.join(SCRATCH, 'round280-drive.txt'), `status=${drive.status}\n${drive.stdout ?? ''}\n--stderr--\n${drive.stderr ?? ''}`);
  check(
    'C1',
    drive.status === 0,
    `round280 driven with its directory removed: exit ${drive.status} (was 2 / ENOENT before the repair)`,
  );
  check(
    'C1b',
    !(drive.stderr ?? '').includes('ENOENT'),
    'no ENOENT in the driven probe’s stderr',
  );

  // Two-sided: the same write with no mkdirSync still fails, so C1 is pinning the repair and not
  // some ambient state that would have made any drive pass.
  const absent = path.join(SCRATCH, `absent-${process.pid}`);
  let controlErr = '';
  try {
    writeFileSync(path.join(absent, 'f.txt'), 'x');
  } catch (e) {
    controlErr = (e as NodeJS.ErrnoException).code ?? String(e);
  }
  check('C2', controlErr === 'ENOENT', `control: writing into a missing directory without mkdirSync still throws (${controlErr || 'it did NOT throw'})`);

  // ------------------------------------- D: does vitest create a missing --outputFile parent?
  const vitestOut = path.join(SCRATCH, `vitest-parent-${process.pid}`, 'out.json');
  rmSync(path.dirname(vitestOut), { recursive: true, force: true });
  const testDir = path.join('packages', 'server', 'src', '__tests__');
  const oneTest = readdirSync(testDir).filter((f) => /\.test\.ts$/.test(f)).sort()[0];
  const v = spawnSync(
    'npx',
    ['vitest', 'run', oneTest, '--root', 'packages/server', '--reporter=json', '--outputFile', path.resolve(vitestOut)],
    { encoding: 'utf8', maxBuffer: 1e8, timeout: 300_000 },
  );
  check(
    'D1',
    v.status === 0 && existsSync(vitestOut),
    `vitest --outputFile creates a missing parent recursively (status ${v.status}, file present ${existsSync(vitestOut)}) — this is what exonerates round251/253/255`,
  );

  // ----------------- E: the surviving non-recursive sites are children of a fresh mkdtemp root
  const r246 = readFileSync(
    path.join(SCRIPTS, 'probe-round246-the-sweep-repaired-and-the-emit-spelling-was-the-bigger-blind-spot.mts'),
    'utf8',
  );
  check(
    'E1',
    r246.includes('mkdtempSync(path.join(os.tmpdir()'),
    'round246’s non-recursive mkdirSync sites hang off a mkdtempSync root it creates itself — not a portability hazard',
  );
  const r197 = readFileSync(
    path.join(SCRIPTS, 'probe-round197-the-verdict-on-a-way-back-and-the-path-that-is-not-the-database.mts'),
    'utf8',
  );
  check(
    'E2',
    /add\('a directory', 3, \(p\) => fs\.mkdirSync\(p\)\)/.test(r197),
    'round197’s non-recursive site is a deliberate fixture (make a path BE a directory), not a setup step',
  );

  // ------------------------------------------------------------------- summary
  const failed = rows.filter((r) => r.outcome === 'FAIL');
  const meas = rows.filter((r) => r.outcome === 'MEAS');
  console.log(
    `\n${rows.length} checks · ${failed.length} failed · ${meas.length} measurements`,
  );
  for (const f of failed) console.log(`  FAIL ${f.id}  ${f.text}`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('probe-round281 THREW — the table above is incomplete:');
  console.error(e);
  process.exit(2);
});
