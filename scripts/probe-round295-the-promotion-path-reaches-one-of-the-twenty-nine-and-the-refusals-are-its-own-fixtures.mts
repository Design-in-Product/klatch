/**
 * The promotion path reaches 1 of the 29, and two of its refusals are a probe's own test fixtures.
 *
 * Round 295, Theseus, 2026-09-29 (WORK fire). Takes my own Round 293 §4 — *"both probes are
 * DEFERRED and nothing runs them on a schedule, so nothing would have told anyone that Round 292
 * had started throwing"* — and Daedalus's Round 294 §6, which carried it forward unchanged:
 * *"the deferred set is still undriven. 29 of the 105 deferred probes are verdict-bearing.
 * Nothing runs them."*
 *
 * Both statements are about a population. Neither of us had asked the next question, which is the
 * one this probe answers: **there IS an instrument that drives DEFERRED probes — Daedalus's
 * Round 285 `promote-probes.mts` — so how much of that population can it actually reach?**
 *
 * Measured this fire: **1 of 29.**
 *
 * ── Why that is not a complaint about the hazard filter ────────────────────────
 *
 * `promote-probes.mts:24` is explicit and correct about its own read-filter:
 *
 *     READ, before driving — over-broad on purpose, a hit means "don't drive", never "hazardous"
 *
 * I am not arguing with that design. Over-broad is the right direction for a tool that drives
 * other people's code unattended. The finding is narrower and is a fact, not a preference:
 * **the over-breadth is not a small margin on this population, it is nearly all of it**, and
 * until this fire nobody had priced it, because `--list` reports the candidates it found and not
 * the verdict-bearing set it missed.
 *
 * ── The mechanism, which is the part worth keeping ─────────────────────────────
 *
 * Two of the refusals are self-inflicted in a specific and recurring way. `hazards()` reads
 * string literals — deliberately, per Round 285's own argument that blanking strings loses real
 * detections. So a probe whose SUBJECT MATTER is source-scanning carries the hazardous spellings
 * as its own known-positive fixtures, and the hazard detector reads those fixtures as evidence
 * that the probe touches the thing:
 *
 *   `probe-round246` line 298:  "import { getDb } from '…/db/index.js';"      → flagged `db`
 *   `probe-round246` line 414:  "fs.readdirSync('.claude/projects');"          → flagged `homedir`
 *
 * `probe-round246` opens no database and reads no home directory. It is a scanner-testing probe,
 * and **the fixtures that make its detector trustworthy are exactly what make it undrivable.**
 * I drove it by hand this fire: `All 4 regression checks passed`, exit 0, tree unchanged.
 *
 * `probe-round284`'s refusal is a true positive in kind and not in risk: it is flagged `net` for
 * `net.connect({ port: 3001 })` at line 463 — a read-only liveness check that reports whether
 * xian's dev server is up (its F1 measurement). The `net` class conflates *binds a port* with
 * *asks whether a port is held*. Driven by hand this fire: `All 16 regression checks passed`,
 * exit 0, and its arm C mutates `scripts/` and restores it, which I checked separately.
 *
 * So the refused set is not a set of hazardous probes. It contains at least two that drive green,
 * hermetically, in under a minute, and which nothing has driven since they were written.
 *
 * ── What this probe asserts, and the polarity ──────────────────────────────────
 *
 * The temptation is to assert "the promotion path reaches too few", which is a pin on a number
 * that SHOULD change and would go red as good news — exactly the defect Daedalus's Round 294 §1
 * repaired in `probe-round224` arm E ("a pin on an absence is not an invariant"). So the
 * population figures here are MEASUREMENTS, recorded and not asserted.
 *
 * The one load-bearing assertion is arm R6, built on the Round 294 two-sided shape: this file
 * declares the probes it has driven green but the hazard filter refuses, and R6 holds the
 * declaration against the measurement in BOTH directions. Widen the filter so `round246` becomes
 * drivable and R6 goes red naming it — which is correct, because the list below is then stale and
 * the finding has been addressed. It cannot be cleared by deleting what it reads.
 *
 *   REFUSED-BUT-DRIVABLE: probe-round246, probe-round284
 *
 * NOT claimed: that the other 27 are drivable. They are unexamined, which is the whole point —
 * this fire drove 2 and found 2 green. A sample of the two cheapest members is the most
 * favourable sample there is, and I am reporting it as such rather than extrapolating from it.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { hazards } from './promote-probes.mts';
import { DEFERRED, verdictBearing } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');

/**
 * The declaration arm R6 grades. Each entry is a DEFERRED probe this seat has driven green, with
 * a tree-preserving run, and which `hazards()` nevertheless refuses. Add one, add it here.
 */
const REFUSED_BUT_DRIVABLE = ['probe-round246', 'probe-round284'];

const results: ProbeVerdict[] = [];
const measurements: string[] = [];

const check = (arm: string, check_: string, pass: boolean) => {
  results.push({ arm, check: check_, pass, kind: 'regression' });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${check_}`);
};
const meas = (arm: string, line: string) => {
  measurements.push(`${arm}  ${line}`);
  console.log(`[MEAS] ${arm}  ${line}`);
};

const readProbe = (f: string): string => readFileSync(join(SCRIPTS, f), 'utf8');
const fileFor = (stem: string): string | undefined =>
  DEFERRED.find((f: string) => f.startsWith(stem));

// ── Section A — the population, using each instrument's own detector ──────────
// Nothing here re-implements a classifier. `verdictBearing` is sweep-probes'; `hazards` is
// promote-probes'. Hand-rolling either would be the exact failure this fleet keeps finding:
// a detector with no known positive returns a smaller number and the smaller number reads
// like good news. Section B drives known positives through `hazards` for that reason.

const vbDeferred = DEFERRED.filter((f: string) => {
  try {
    return verdictBearing(readProbe(f));
  } catch {
    return false; // a missing file is the census's business, not this probe's
  }
});

const hazardOf = new Map<string, string[]>();
for (const f of vbDeferred) hazardOf.set(f, hazards(readProbe(f)));

const reachable = vbDeferred.filter((f: string) => (hazardOf.get(f) ?? []).length === 0);

meas('A1', `verdict-bearing DEFERRED probes: ${vbDeferred.length} (derived from source this run)`);
meas(
  'A2',
  `of those, hazard-clean — i.e. reachable by promote-probes at all: ${reachable.length}` +
    (reachable.length ? ` — ${reachable.join(', ')}` : ''),
);

const histogram: Record<string, number> = {};
for (const hs of hazardOf.values()) for (const h of hs) histogram[h] = (histogram[h] ?? 0) + 1;
meas(
  'A3',
  'hazard reasons across the verdict-bearing set: ' +
    Object.entries(histogram)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}=${v}`)
      .join(' '),
);

check(
  'A4',
  'every verdict-bearing DEFERRED probe is classified by both instruments without throwing',
  hazardOf.size === vbDeferred.length && vbDeferred.length > 0,
);

// ── Section B — known positives for `hazards`, copied from the real call shapes ─
// B2 and B3 are not invented strings. They are the literal fixture lines from
// probe-round246 (298 and 414) that produce its two refusals, so a change to `hazards` that
// stopped reading strings would redden these rather than silently shrinking Section A.

const B_CLEAN = 'const x = 1;\nconsole.log(x);\n';
const B_DB_FIXTURE = `    "import { getDb } from '../../packages/server/src/db/index.js';",\n`;
const B_HOME_FIXTURE = `    "fs.readdirSync('.claude/projects');",\n`;

check('B1', 'known negative: a source with no hazardous spelling reads clean', hazards(B_CLEAN).length === 0);
check(
  'B2',
  'known positive: `getDb` inside a STRING LITERAL is flagged `db` — the round246:298 shape',
  hazards(B_DB_FIXTURE).includes('db'),
);
check(
  'B3',
  "known positive: `.claude/projects` inside a STRING LITERAL is flagged `homedir` — the round246:414 shape",
  hazards(B_HOME_FIXTURE).includes('homedir'),
);

// ── Section C — the drives. Only a run can establish these. ───────────────────

type Drive = { code: number; out: string; conclusion: string | null };

const drive = (file: string): Drive => {
  try {
    const out = execFileSync('npx', ['tsx', join('scripts', file)], {
      cwd: REPO,
      encoding: 'utf8',
      timeout: 240_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    return { code: 0, out, conclusion: conclusionOf(out) };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    return { code: typeof err.status === 'number' ? err.status : -1, out, conclusion: conclusionOf(out) };
  }
};

const conclusionOf = (out: string): string | null => {
  const m = out.match(/^All \d+ regression checks passed\.?$/m);
  return m ? m[0] : null;
};

const treeState = (): string =>
  execFileSync('git', ['-C', REPO, 'status', '--porcelain', '--', 'scripts', 'packages'], {
    encoding: 'utf8',
  });

const treeBefore = treeState();

for (const [arm, stem] of [
  ['C1', 'probe-round246'],
  ['C2', 'probe-round284'],
] as const) {
  const file = fileFor(stem);
  if (!file) {
    check(arm, `${stem} is present in DEFERRED and drivable`, false);
    continue;
  }
  const d = drive(file);
  check(
    arm,
    `${stem} drives green unattended: exit 0 and a conclusion line — got exit ${d.code}, ` +
      `conclusion ${d.conclusion ? `"${d.conclusion}"` : 'NOT FOUND'}`,
    d.code === 0 && d.conclusion !== null,
  );
  meas(`${arm}m`, `${stem} hazards: [${(hazardOf.get(file) ?? []).join(', ') || 'none'}]`);
}

check(
  'C3',
  `the two drives left scripts/ and packages/ where they were found — ` +
    `before ${JSON.stringify(treeBefore)} after ${JSON.stringify(treeState())}`,
  treeBefore === treeState(),
);

// ── Section D — the two-sided agreement, which is the only arm that can expire ─
// Round 294 §2's shape. The declared list above is graded against what was measured, in both
// directions, so neither a widened filter nor a deleted entry can clear it by waiting.

const measuredRefusedButDrivable = (['probe-round246', 'probe-round284'] as const)
  .filter((stem) => {
    const file = fileFor(stem);
    if (!file) return false;
    return (hazardOf.get(file) ?? []).length > 0;
  })
  .map(String);

const declared = [...REFUSED_BUT_DRIVABLE].sort();
const measured = [...measuredRefusedButDrivable].sort();

check(
  'D1',
  `REFUSED-BUT-DRIVABLE agrees with the measured population in both directions — ` +
    `declared [${declared.join(', ')}] · measured [${measured.join(', ')}]`,
  declared.length === measured.length && declared.every((d, i) => d === measured[i]),
);

const docSource = readFileSync(fileURLToPath(import.meta.url), 'utf8');
check(
  'D2',
  'the REFUSED-BUT-DRIVABLE line is present in this file — the arm cannot be cleared by deleting what it reads',
  /REFUSED-BUT-DRIVABLE:\s*probe-round246,\s*probe-round284/.test(docSource),
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round295', results });
