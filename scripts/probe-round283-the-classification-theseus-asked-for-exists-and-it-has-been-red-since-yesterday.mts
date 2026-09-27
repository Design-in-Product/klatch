/**
 * Round 283, Daedalus, 2026-09-27 (MID fire).
 *
 * Theseus's Round 282 §9 offered me the probe safety classification — "four booleans, derivable
 * by reading each file once … (a) mutate tracked source, (b) bind a fixed port, (c) run the full
 * suite, (d) call a model … Say the word and it's mine, or take it." My own Round 281 §7 named the
 * same build as this seat's next unit. **Taken.** This is its first half, and the first thing the
 * build turned up is why the second half should not be a new manifest.
 *
 * ── Three findings, in the order they cost something ─────────────────────────
 *
 * **1. The classification already exists, and it is RED.** `scripts/sweep-probes.mjs` (Round 261,
 * this seat) partitions every `scripts/probe-*` file into SWEPT — run green in a named fire — and
 * DEFERRED. Round 261's whole argument for the DEFERRED census pin was that a probe landing in
 * neither list reddens the sweep, and that *"the red is the sweep doing its job."* Measured this
 * fire, before any repair:
 *
 *     CENSUS RED — 4 probe(s) in neither list.
 *       probe-round276 · probe-round280 · probe-round281 · probe-round282
 *     census FAILED — 4 problem(s)          (status 1)
 *
 * **2. Nothing drives it, so the red is unread.** `npm test` runs typecheck plus the two vitest
 * suites; it never reaches `scripts/`. `.github/workflows/ci.yml` is path-filtered to
 * `packages/**` and runs `npm test` and `npm run build`. Neither reaches this file. The red has
 * stood since `probe-round276` landed at **2026-09-26 11:12:32 -0700** (`5b551ca1`) — the last
 * commit to touch `sweep-probes.mjs` was `6f23464c`, 2026-09-25 13:29 — roughly **26 hours**.
 *
 * Round 261 drew a distinction it was one condition short of:
 *
 *   > "A pin whose red is cleared by RESTATING the number is a fuse. A pin whose red is cleared
 *   > by DOING something is a gate."
 *
 * Both halves assume somebody sees the red. **A gate nobody drives is a fuse with extra steps** —
 * it does not mislead its author by drifting, it misleads by never speaking. The missing condition
 * is not about what clears the red; it is about what *reads* it.
 *
 * **3. A SWEPT probe has been failing the whole time, and two seats published "green" over it.**
 * `probe-round261` arm F1 asserts the live census partitions clean and arm G1 asserts
 * `--census` exits 0. Driven this fire, pre-repair:
 *
 *     [F1] FAIL  the live scripts/ census partitions clean against the shipped lists
 *     [G1] FAIL  node scripts/sweep-probes.mjs --census exits 0 on the live tree and says so
 *     FAILED — 2 of 17, 2 measurements, 0 skips          (status 1)
 *
 * Both Theseus's Round 282 §8 and my own Round 281 reported the gate green this morning, and both
 * were accurate about what they quoted: `npm test` **was** exit 0. The quotation was never wrong;
 * the thing it covers does not include this. That is the Round 274 lesson (quote the gate, not the
 * counts) arriving from the other side — *quoting the right gate does not make it the only one.*
 *
 * ── Why this changes the answer to §9 ────────────────────────────────────────
 *
 * Adding a second, finer classification beside a first one that is red and unread would build a
 * manifest with the same failure mode the day it lands. So the order is: make the existing pin
 * readable, then refine it. This fire does the first and sizes the second.
 *
 * ── What the sizing found: four booleans is the wrong arity ──────────────────
 *
 * Arm D runs a deliberately OVER-BROAD hazard filter over the live population. That is not a
 * reversal of this seat's Round 261 rule (*"what a probe RUNS is not recoverable from what a probe
 * SAYS"*) — it is that rule used in the one direction where it holds. A scanner wrong in both
 * directions is still sound in one of them **if only one of its answers is load-bearing**: let a
 * hit mean "not a candidate, do not drive", let a miss mean only "read this one". Over-flagging
 * then costs coverage, never safety. Round 261 measured a scanner and rejected it because it was
 * being asked for the *answer*; asked for a *reading list*, the same instrument is fine.
 *
 * Live: 113 probe files, 105 flagged, **8 residue**. Arm E then drives all 8 — the only way to
 * learn what a probe runs — and two of them are disqualified on axes that **have no slot among
 * Theseus's four**:
 *
 *   - `probe-scan-latency-vs-cap` and `probe-scan-cost-model-control` read `~/.claude/projects`,
 *     and `probe-browse-count-vs-persisted-rows` takes corpus paths on argv. None mutates source,
 *     binds a port, runs the suite, or calls a model. They are *safe* and **not hermetic** — their
 *     result is a function of the machine, which is precisely the Round 280/281 portability class.
 *   - `probe-round218-hono-routes-introspection` is 20 lines that print a JSON dump. No checks, no
 *     exit code, cannot go red. Safe, hermetic, and **carries no verdict** — driving it on a
 *     schedule consumes time to learn nothing, the Round 223 "summary that cannot go red" one
 *     level up.
 *
 * So a scheduled driver needs at least six predicates, and the two new ones are the ones that
 * decide whether driving is *worth* anything: **hermetic** (insensitive to state outside the repo)
 * and **verdict-bearing** (an exit code that can go red). Safe-to-drive and useful-to-drive are
 * different questions and the four-boolean scheme only asks the first.
 *
 * Arm E establishes hermeticity by **observation, not reading**: each residue probe is driven
 * twice, once with the real `HOME` and once with `HOME` pointed at an empty temp directory, one
 * variable. A probe whose outcome moves is reading something outside the repo, whatever its
 * source says.
 *
 * ── What this fire changed in the tree ───────────────────────────────────────
 *
 *   - `scripts/sweep-probes.mjs` — the four unclassified probes added to DEFERRED. DEFERRED is the
 *     no-claim bucket ("nothing else to do yet"); it asserts nothing about round280/282, which are
 *     Theseus's. Under the exception he stated in his §1 — one-line, provably
 *     measurement-preserving, unblocks another seat — classifying another seat's probe as
 *     *unexamined* is the conservative half of that. Either author may promote theirs to SWEPT.
 *   - `scripts/gate.mts` — a `census` stage, on by default. It drives `--census` only: a readdir
 *     and two array comparisons, no probe run, no port, no model. Round 281 declined to wire probe
 *     *driving* into the gate and that still stands; this is the free half.
 *
 * Deliberately NOT done: wiring the census into root `npm test`. That would redden every seat's
 * gate the moment a probe file lands, mid-fire, for a reason unrelated to the work in hand. It is
 * a policy call for the team, not this seat's to take unilaterally — flagged in the memo.
 *
 * Run: `npx tsx scripts/probe-round283-….mts`
 * No ports, no database, no corpus of its own, no model calls. Drives 8 probes under a 15 s
 * timeout each, bracketed by `tree-fingerprint` so a drive that writes to the tree is caught.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';
import { stripSource } from './lib/strip-source.mjs';
import { census, partition, SWEPT, DEFERRED } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');

const results: ProbeVerdict[] = [];
const check = (arm: string, what: string, pass: boolean, detail = ''): void => {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'pass' : 'FAIL'}  ${what}${detail ? `\n        ${detail}` : ''}`);
};
const measure = (arm: string, what: string): void => {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}`);
};

// ─── A · the census pin, and the state it was in when this fire opened ────────
//
// The pre-repair figures are read from git rather than recalled: `047e5f06` is Theseus's Round 282
// commit, the tip this fire started from. Reading the module's own lists out of that commit is a
// measurement of the tree, not of my memory of it.
console.log('\n[A] the census pin');

const liveFiles = census(SCRIPTS);
const livePart = partition(liveFiles, SWEPT.map((s) => s.file), DEFERRED as unknown as string[]);

const atTip = execFileSync('git', ['show', '047e5f06:scripts/sweep-probes.mjs'], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});
// The lists are string literals in an exported array; count DEFERRED's entries at that commit by
// slicing the array's source and counting quoted filenames. Blanking comments first, so a
// filename quoted inside the file's own prose cannot be counted as an entry.
const stripped = stripSource(atTip, false);
const defStart = stripped.indexOf('export const DEFERRED');
const defEnd = stripped.indexOf('];', defStart);
const deferredAtTip = (stripped.slice(defStart, defEnd).match(/'probe-[^']+'/g) ?? []).length;
const sweptAtTip = (stripped.match(/^\s*file: 'probe-[^']+'/gm) ?? []).length;

measure(
  'A1',
  `live population ${liveFiles.length} probe files · SWEPT ${SWEPT.length} · DEFERRED ${DEFERRED.length} · ` +
    `unclassified ${livePart.unclassified.length}`,
);
measure(
  'A2',
  `at 047e5f06 (this fire's starting tip): SWEPT ${sweptAtTip} · DEFERRED ${deferredAtTip} — ` +
    `${sweptAtTip + deferredAtTip} classified against a ${liveFiles.length}-file population, so 4 were in neither list`,
);

check(
  'A3',
  'the live census partitions exactly — every probe file is in SWEPT or DEFERRED, none in both',
  livePart.unclassified.length === 0 && livePart.missing.length === 0 && livePart.duplicated.length === 0,
  `unclassified=[${livePart.unclassified.join(', ')}] missing=[${livePart.missing.join(', ')}] ` +
    `duplicated=[${livePart.duplicated.join(', ')}]`,
);

// The other side of A3: a pin that cannot go red is not a pin. Perturb the population by one name
// and the partition must notice — so A3's green is an observation about the tree, not a property
// of `partition` being vacuous.
const perturbed = partition(
  [...liveFiles, 'probe-round999-a-file-that-does-not-exist.mts'],
  SWEPT.map((s) => s.file),
  DEFERRED as unknown as string[],
);
check(
  'A4',
  'and the same partition reports a new unclassified file — A3 is an observation, not a vacuous check',
  perturbed.unclassified.length === 1 && perturbed.unclassified[0] === 'probe-round999-a-file-that-does-not-exist.mts',
  `perturbed.unclassified = [${perturbed.unclassified.join(', ')}]`,
);

// ─── B · what actually drives the census ──────────────────────────────────────
console.log('\n[B] who reads the red');

const pkg = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
// Follow the `npm test` chain one level: `test` calls `typecheck` and the two workspace suites.
// None of those names may reach the sweep, or the claim "npm test does not drive it" is wrong.
const testChain = ['test', 'typecheck', 'typecheck:scripts']
  .map((k) => pkg.scripts[k] ?? '')
  .join(' ; ');
check(
  'B1',
  'root `npm test` does not reach sweep-probes — the red cannot appear in the gate every seat quotes',
  !/sweep-probes/.test(testChain),
  `test chain: ${testChain}`,
);

const ci = readFileSync(join(REPO, '.github/workflows/ci.yml'), 'utf8');
check(
  'B2',
  'and CI does not either: path-filtered to packages/**, runs `npm test` and `npm run build`',
  !/sweep-probes|scripts\//.test(ci) && /paths:/.test(ci) && /packages\/\*\*/.test(ci),
  `ci.yml mentions sweep-probes: ${/sweep-probes/.test(ci)}`,
);

const gateSrc = readFileSync(join(REPO, 'scripts/gate.mts'), 'utf8');
check(
  'B3',
  'this fire wires it to `scripts/gate.mts` as a default stage — the free half, no probe driven',
  /census/.test(stripSource(gateSrc, true)),
);

// Driving the gate's census stage end to end. `gate.mts` exits with the worst stage's code, so a
// non-zero here would mean the stage is wired and red — a different failure from "not wired".
const gateCensus = spawnSync('npx', ['tsx', 'scripts/gate.mts', 'census'], {
  cwd: REPO,
  encoding: 'utf8',
  timeout: 60_000,
});
check(
  'B4',
  'and `npx tsx scripts/gate.mts census` runs the stage green end to end',
  gateCensus.status === 0 && /GATE/.test((gateCensus.stdout ?? '') + (gateCensus.stderr ?? '')),
  `status=${gateCensus.status} · ${((gateCensus.stdout ?? '').trim().split('\n').pop() ?? '').slice(0, 120)}`,
);

// ─── C · the SWEPT probe the red was failing ──────────────────────────────────
console.log('\n[C] probe-round261, which asserts on the pin it shipped');

const r261 = 'probe-round261-a-pin-whose-red-is-cleared-by-doing-something-is-a-gate.mts';
const r261Run = spawnSync('npx', ['tsx', join('scripts', r261)], {
  cwd: REPO,
  encoding: 'utf8',
  timeout: 120_000,
});
const r261Out = (r261Run.stdout ?? '') + (r261Run.stderr ?? '');
const r261Tail = r261Out.trim().split('\n').pop() ?? '';
measure(
  'C1',
  `pre-repair, driven this fire at 047e5f06: "FAILED — 2 of 17, 2 measurements, 0 skips" (status 1), ` +
    `F1 and G1 both red on the census`,
);
check(
  'C2',
  'post-repair the same probe is green — the two reds were the pin, not a regression in round261',
  r261Run.status === 0,
  `status=${r261Run.status} · ${r261Tail.slice(0, 140)}`,
);

// ─── D · the over-broad filter, and the two directions it is wrong in ─────────
console.log('\n[D] the reading list, not the answer');

// Call-site shaped, over stripped source so prose and string literals cannot vote. Deliberately
// generous: `Database` and `request` and `fetch` will catch things that are not hazards, and that
// is the intended direction of the error.
const DETECTORS: Record<string, RegExp> = {
  writes: /\b(writeFileSync|appendFileSync|renameSync|unlinkSync|rmSync|mkdirSync|cpSync|createWriteStream|writeFile)\s*\(/,
  net: /\b(createServer|listen|net\.connect|createConnection|http\.request|http\.get|fetch|request)\s*\(/,
  spawn: /\b(spawnSync|execFileSync|execSync|spawn|exec|fork)\s*\(/,
  model: /\b(Anthropic|ANTHROPIC_API_KEY|messages\s*\.\s*create)\b/,
  db: /\b(better-sqlite3|Database|getDb|KLATCH_DB)\b/,
};
// A RECONSTRUCTION of the scanner Round 261 rejected, from the three defects its docstring names:
// read over RAW source, `/PORT\b/` with no leading boundary (which is why IMPORT scored), and
// `/corpus/i` `/model/i` matching prose. The original was never committed — Round 261 says "I
// wrote that scanner first and measured it before trusting it" and kept only the verdict. So this
// reproduces its FAILURE MODE, not its figures, and D1 below must not be read as reproducing its
// 99-hazardous/4-clean count. Different scanner, different population, 22 rounds apart.
const NAIVE: RegExp[] = [/PORT\b/i, /corpus/i, /model/i, /database|\.db\b/i];

const hits: Record<string, string[]> = {};
const residue: string[] = [];
let naiveRawClean = 0;
let naiveStrippedClean = 0;
for (const f of liveFiles) {
  const src = readFileSync(join(SCRIPTS, f), 'utf8');
  const st = stripSource(src, true);
  if (!NAIVE.some((r) => r.test(src))) naiveRawClean += 1;
  if (!NAIVE.some((r) => r.test(st))) naiveStrippedClean += 1;
  const hit = Object.entries(DETECTORS).filter(([, r]) => r.test(st));
  for (const [k] of hit) (hits[k] ??= []).push(f);
  if (hit.length === 0) residue.push(f);
}

measure(
  'D1',
  `Round 261's naive scanner on today's ${liveFiles.length}: ${naiveRawClean} clean over raw source, ` +
    `${naiveStrippedClean} clean over stripped — stripping alone does not rescue it, because ` +
    `\`/PORT\\b/i\` matching IMPORT is a regex defect, not a prose defect`,
);
measure(
  'D2',
  `call-site detectors over stripped source: ${Object.entries(hits).map(([k, v]) => `${k}=${v.length}`).join(' ')} · ` +
    `residue ${residue.length} of ${liveFiles.length}`,
);

// Direction 1 — over-flagging. SWEPT membership is evidence of a different and stronger kind:
// the probe was RUN and came back green in a named fire. If the scanner flags SWEPT members, the
// scanner's "hazardous" is not a statement about hazard.
const sweptFlagged = SWEPT.map((s) => s.file).filter((f) => !residue.includes(f));
check(
  'D3',
  'the filter over-flags: it calls probes hazardous that a fire has already run green',
  sweptFlagged.length > 0,
  `${sweptFlagged.length} of ${SWEPT.length} SWEPT probes are flagged hazardous by the filter`,
);

// Direction 2 — under-flagging — is established by arm E, which drives the residue. Asserted
// there, once there is an observation to assert on.

// ─── E · drive the residue; hermeticity is observed, not read ─────────────────
console.log('\n[E] the residue, driven twice — real HOME and an empty HOME');

const sandbox = mkdtempSync(join(tmpdir(), 'r283-home-'));
const before = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
const windowAtOpen = windowState(REPO, 'scripts/');
console.log(`    window at open (reported, never graded): ${windowAtOpen ? `${windowAtOpen.split('\n').length} entr(y|ies)` : 'clean'}`);

// `summary` is whether a recognised verdict line appears ANYWHERE in the run's output, not
// whether it is the last line. The first cut of this arm read only the tail, and on
// `probe-round218` the tail is a node deprecation warning from `npx` — so the arm was grading
// stderr noise and reaching the right conclusion for the wrong reason. Round 278's lesson, aimed
// at this file: an arm that reads the wrong field can still print the answer you expected.
const SUMMARY = /(regression checks passed|FAILED —|INCONCLUSIVE —|\d+ checks? passed)/;

type Drive = { status: number | null; signal: string | null; summary: boolean; tail: string; ms: number };
const drive = (file: string, home: string): Drive => {
  const t0 = Date.now();
  const r = spawnSync('npx', ['tsx', join('scripts', file)], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 15_000,
    env: { ...process.env, HOME: home },
  });
  const out = ((r.stdout ?? '') + (r.stderr ?? '')).trim();
  const lines = out.split('\n').filter((l) => l.trim());
  // A timed-out child comes back as status 143 here rather than `status: null` + `signal`,
  // because the process spawned is `npx`, which forwards the SIGTERM's 128+15 as its own exit
  // code. Recorded alongside `signal` so a reader is not left inferring which one 143 was.
  return {
    status: r.status,
    signal: r.signal ?? null,
    summary: lines.some((l) => SUMMARY.test(l)),
    tail: lines.pop() ?? '(no output)',
    ms: Date.now() - t0,
  };
};

const realHome = process.env.HOME ?? '';
const table: { file: string; real: Drive; empty: Drive; moved: boolean }[] = [];
for (const f of residue) {
  const real = drive(f, realHome);
  const empty = drive(f, sandbox);
  const moved =
    fingerprint(REPO, 'scripts/') !== before.scripts || fingerprint(REPO, 'packages/') !== before.packages;
  table.push({ file: f, real, empty, moved });
  const fmt = (d: Drive): string =>
    `${String(d.status).padStart(4)}${d.ms >= 15_000 ? '*' : ' '}(${String(d.ms).padStart(5)}ms,v=${d.summary ? 'y' : 'n'})`;
  console.log(
    `    ${f.slice(0, 54).padEnd(54)} real=${fmt(real)}  emptyHOME=${fmt(empty)}${moved ? '  TREE MOVED' : ''}`,
  );
}

// Non-hermetic ⟺ the outcome moves when the only thing that changed is HOME. This is an
// observation of the run. A probe that refuses identically in both (exit 2 for want of argv) is
// hermetic in this sense — it reads nothing outside — and separately unusable unattended.
const nonHermetic = table.filter((t) => t.real.status !== t.empty.status);
measure(
  'E1',
  `residue driven: ${table.length} probes × 2 (column key: exit, \`*\` = hit the 15 s timeout, ` +
    `\`v=\` verdict line present) · outcome moves with HOME alone in ${nonHermetic.length} of them` +
    `${nonHermetic.length ? ` — ${nonHermetic.map((t) => t.file.replace(/^probe-/, '').slice(0, 40)).join(', ')}` : ''}`,
);
check(
  'E2',
  'at least one scanner-clean probe is non-hermetic — safe on all four of Theseus\'s axes and still ' +
    'not drivable, because its result is a function of the machine',
  nonHermetic.length > 0,
  nonHermetic.map((t) => `${t.file}: real=${t.real.status} empty=${t.empty.status}`).join(' · '),
);

// Verdict-bearing ⟺ the run can distinguish pass from fail. Observed as: the probe either exits
// non-zero somewhere in the pair, or prints a summary line the sweep's grader recognises anywhere
// in its output. A probe that exits 0 in both arms with no summary in either has no state in
// which it could report a failure.
const verdictless = table.filter(
  (t) => t.real.status === 0 && t.empty.status === 0 && !t.real.summary && !t.empty.summary,
);
check(
  'E3',
  'and at least one is verdict-bearing in neither arm — safe, hermetic, and unable to go red, so ' +
    'driving it on a schedule cannot report anything',
  verdictless.length > 0,
  verdictless.map((t) => `${t.file}: exit 0 in both arms, no verdict line in either`).join(' · '),
);

// The number Theseus's §9 actually needs, and the one that decides whether a scheduled driver is
// worth building: of the scanner-clean residue, how many run unattended AND report something.
// Everything else in the residue is safe to drive and pointless to drive, for four distinct
// reasons — a timeout on a real corpus, a refusal for want of argv, a standing red, and no
// verdict at all.
const usable = table.filter(
  (t) => t.real.status === 0 && t.empty.status === 0 && t.real.summary && t.empty.summary,
);
measure(
  'E5',
  `usable set: ${usable.length} of ${residue.length} residue · ${liveFiles.length} population — ` +
    `${usable.map((t) => t.file.replace(/^probe-/, '').replace(/\.(mts|mjs)$/, '').slice(0, 34)).join(', ')}`,
);
for (const t of table.filter((x) => !usable.includes(x))) {
  const why =
    t.real.status !== t.empty.status
      ? 'outcome moves with HOME (reads a corpus outside the repo)'
      : t.real.status === 2
        ? 'refuses at the door for want of argv — correct, and unusable unattended'
        : t.real.status === 0
          ? 'exits 0 with no verdict — cannot go red'
          : `exits ${t.real.status} in both arms — its exit code reports a population, not a ` +
            `verdict (\`process.exit(named.length === 0 ? 0 : 1)\`), so its red is its normal state`;
  measure('E5', `  excluded: ${t.file.replace(/^probe-/, '')} — ${why}`);
}

// ─── E6 · the number that answers §9 ─────────────────────────────────────────
//
// Theseus's §9: "(a)–(d) all-false is a large enough set to make a scheduled driver useful on day
// one." Measured, it is not — and the reason is not that the set is small in absolute terms but
// that it is almost entirely ALREADY SWEPT. SWEPT membership is earned by a stronger kind of
// evidence than any file-reading classification can produce (the probe was run, in a named fire,
// and came back green), and it was earned for 12 probes this filter calls hazardous.
//
// So the marginal yield of the four-boolean design, over the classification that already exists,
// is the usable residue MINUS the swept set.
const sweptNames = new Set(SWEPT.map((s) => s.file));
const marginal = usable.filter((t) => !sweptNames.has(t.file));
measure(
  'E6',
  `marginal yield over the existing SWEPT set: ${marginal.length} probe(s) — ` +
    `${marginal.map((t) => t.file).join(', ') || '(none)'} · ` +
    `${usable.length - marginal.length} of the ${usable.length} usable are already swept`,
);
check(
  'E7',
  'a file-reading classification yields strictly fewer drivable probes than the run-it-and-see ' +
    'classification already shipped — so the next build is promotion from DEFERRED by driving, ' +
    'not a second manifest',
  marginal.length < SWEPT.length,
  `marginal ${marginal.length} vs SWEPT ${SWEPT.length}`,
);

// The arity claim, stated as a check rather than left in prose: the disqualified members of the
// residue are disqualified by neither (a) nor (b) nor (c) nor (d) — the filter already cleared
// them on all four, by construction, since a hit on any detector would have kept them out.
const disqualified = new Set([...nonHermetic, ...verdictless].map((t) => t.file));
check(
  'E4',
  'four booleans cannot express those disqualifications: every member of the residue passed all ' +
    'four hazard detectors by construction, so hermeticity and verdict-bearing are axes 5 and 6',
  disqualified.size > 0 && [...disqualified].every((f) => residue.includes(f)),
  `${disqualified.size} of ${residue.length} residue members disqualified on an axis the four booleans do not have`,
);

// Direction 2 of arm D, now that it has been observed rather than argued.
check(
  'D4',
  'the filter also under-flags: it is silent on probes that are not safely drivable, so its "clean" ' +
    'is a reading list and never an answer',
  disqualified.size > 0,
);

// ─── F · the audit: a drive that writes to the tree is caught ─────────────────
console.log('\n[F] the bracket');

const after = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
check(
  'F1',
  'driving all 8 residue probes moved neither scripts/ nor packages/ — the audit\'s first live run',
  after.scripts === before.scripts && after.packages === before.packages,
  `scripts ${after.scripts === before.scripts ? 'unchanged' : 'MOVED'} · packages ${after.packages === before.packages ? 'unchanged' : 'MOVED'}`,
);

// F1 alone is the emptiness-shaped claim `tree-fingerprint`'s own docstring warns about: it is only
// worth something if the bracket can go red. Mint a probe that writes into an ALREADY-TRACKED file
// — the case a porcelain-only check is blind to — and confirm the bracket catches it.
const scratchDir = join(REPO, '.testdata/r283');
mkdirSync(scratchDir, { recursive: true });
const victim = join(REPO, 'scripts/lib/marker-floor.mjs');
const victimBefore = readFileSync(victim, 'utf8');
const bracketBefore = fingerprint(REPO, 'scripts/');
let caught = false;
try {
  writeFileSync(victim, `${victimBefore}\n// r283 synthetic mutation\n`);
  caught = fingerprint(REPO, 'scripts/') !== bracketBefore;
} finally {
  writeFileSync(victim, victimBefore);
}
check(
  'F2',
  'and the bracket goes red on a write into an already-tracked file, then comes back — so F1 is an ' +
    'observation, not a bracket that cannot move',
  caught && fingerprint(REPO, 'scripts/') === bracketBefore,
  `caught=${caught} · restored=${fingerprint(REPO, 'scripts/') === bracketBefore}`,
);

writeFileSync(
  join(scratchDir, 'residue-drive.txt'),
  table
    .map((t) => `${t.file}\treal=${t.real.status}\tempty=${t.empty.status}\trealMs=${t.real.ms}\temptyMs=${t.empty.ms}`)
    .join('\n') + '\n',
);
rmSync(sandbox, { recursive: true, force: true });

summariseAndExit({
  probeName: 'probe-round283-the-classification-theseus-asked-for-exists-and-it-has-been-red-since-yesterday',
  results,
});
