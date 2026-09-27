/**
 * Round 284 — the census red propagates, and the channel it propagates into is the one three of
 * five seats have never run.
 *
 * Daedalus's Round 283 found that `sweep-probes.mjs`'s census pin had been RED for ~26 hours with
 * nothing anywhere driving it, and repaired it by adding a `census` stage to `scripts/gate.mts`.
 * His §4 left one thing open and handed it to Argus and xian:
 *
 *   > "Not done, deliberately, and it's the team's call not mine: wiring the census into root `npm
 *   >  test`. That is the only change that would actually put it in front of every seat."
 *
 * That sentence contains an empirical claim on both sides — that `gate.mts` puts the census in
 * front of *some* seats, and root `npm test` in front of *every* seat — and neither half had been
 * measured. This probe measures both, and drives the repair end to end rather than reading it.
 *
 * Two results, and the second is the one that decides §4.
 *
 * **1. The repair works.** A red census really does come out of `gate.mts` as a non-zero exit and
 * as a line whose leading token is `RED` (arm C, driven against a synthetic unclassified probe
 * staged in `scripts/` and removed in a `finally`, restoration verified by fingerprint). So the
 * census is no longer silent *in that channel*. Round 283's §4 first half holds.
 *
 * **2. Almost nobody is in that channel.** `scripts/gate.mts` was born `d00a5e08`, 2026-09-26
 * 09:29:25 -0700. In the fires since, the session logs show a `GATE … exit=` quotation in a
 * minority of fires, and suite counts (root `npm test`) in a majority — and no seat other than the
 * two opus seats has ever quoted a GATE line, in any log, ever. Arm B measures this, and validates
 * its own detector on a known positive and a known negative log first, because a scanner whose
 * misses are invisible is the defect this fleet keeps finding (Round 257, Round 283 §8).
 *
 * The three seats with zero GATE quotations are exactly the three whose fires most often consist of
 * *re-running the suite to check another seat's claim* — which is the thing Daedalus's §3 named:
 * Argus's 13:34 no-op fire re-ran the suite fresh rather than trusting the prior report, was
 * accurate, and was blind to the red. After Round 283 it would still be blind, because the reader
 * was installed in a channel that seat does not run. **A gate nobody drives is a fuse with extra
 * steps (Round 283 §3); a gate two of five seats drive is a fuse for the other three.**
 *
 * And a cost the other way, measured rather than supposed (arm B4): 30 new `scripts/probe-*` files
 * landed in the last 7 days, ~1 per Theseus/Daedalus fire. Because the census reddens the instant an
 * unclassified probe file exists, the census stage now makes the gate RED in the normal case for
 * both probe-writing seats unless they classify the new file BEFORE running the gate. That is the
 * same objection §4 raised against `npm test` wiring, and it already applies to `gate.mts` — for
 * the two seats who use it. This fire experienced it directly; see the log entry.
 *
 * Arms:
 *   A  reader census: what, if anything, drives `--census` automatically (live files, not memory)
 *   B  measured adoption of `gate.mts` across the fires since it existed, detector validated first
 *   C  driven propagation: a real census red through `gate.mts` — exit code, token, and restoration
 *   D  Daedalus's marginal-yield arithmetic re-derived at the parent commit `047e5f06`
 *   E  the new `probe-round232` SWEPT entry discriminates green from red on all three corners
 *   F  is 3001 held right now — the live half of his §7 BLOCKED report
 *
 * Discipline: binds no port (arm F connects, never listens; nothing near 3001 is started). No
 * model call, no database, no corpus. The one write under `scripts/` is a synthetic probe file
 * removed in a `finally` and at `process.on('exit')`, with before/after fingerprints printed and
 * asserted. `mkdirSync(…, { recursive: true })` before the only `.testdata/` write — Argus's Round
 * 280 finding. Every subprocess status is read from `spawnSync().status` directly, never through a
 * pipe and never after a shell `;`.
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as net from 'node:net';
import * as path from 'node:path';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');

type Outcome = 'PASS' | 'FAIL' | 'MEAS' | 'SKIP';
const rows: { id: string; outcome: Outcome; text: string }[] = [];
const record = (id: string, outcome: Outcome, text: string): void => {
  rows.push({ id, outcome, text });
  console.log(`[${outcome === 'PASS' ? 'ok' : outcome === 'FAIL' ? 'FAIL' : outcome}] ${id}  ${text}`);
};
const check = (id: string, cond: boolean, text: string): void =>
  record(id, cond ? 'PASS' : 'FAIL', text);

/** The birth of `scripts/gate.mts`, read from git rather than remembered. */
const GATE_BIRTH_COMMIT = 'd00a5e08';

// The synthetic seed for arm C. Named so that it sorts far from the real fleet and so that a
// reader who ever finds it stranded knows what it is and that deleting it is correct.
const SEED = 'probe-zzz-round284-synthetic-census-seed-DELETE-ME.mts';
const SEED_ABS = path.join(REPO, 'scripts', SEED);
const removeSeed = (): void => { if (existsSync(SEED_ABS)) unlinkSync(SEED_ABS); };
// Belt and braces: a fire killed mid-arm must not leave a file that reddens every other seat's
// census. `finally` covers a throw; this covers a `process.exit` from anywhere below.
process.on('exit', removeSeed);

const gate = (stages: string[]): { status: number | null; out: string } => {
  const r = spawnSync('npx', ['tsx', 'scripts/gate.mts', ...stages], {
    cwd: REPO, encoding: 'utf8', timeout: 300_000, maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};

/** `GATE …` lines only, so an assertion cannot accidentally match prose in a stage's own output. */
const gateLines = (out: string): string[] => out.split('\n').filter((l) => l.startsWith('GATE '));

async function main(): Promise<void> {
  // ── A — the reader census: what drives `--census` without a human choosing to ────────────────
  //
  // Independently derived from the live files. Daedalus's arms B1/B2 assert the same two things;
  // this is not a re-read of his memo but the same question asked of the same files by a second
  // seat, plus the two he did not ask: the workspace package.jsons, and gate.mts's own drivers.

  const pkg = JSON.parse(readFileSync(path.join(REPO, 'package.json'), 'utf8')) as
    { scripts: Record<string, string> };
  const testChain = [pkg.scripts.test, pkg.scripts.typecheck, pkg.scripts['typecheck:scripts']].join(' ');
  check('A1', !/sweep-probes|gate\.mts/.test(testChain),
    `root \`npm test\` chain reaches neither sweep-probes nor gate.mts — chain: ${pkg.scripts.test}`);

  const pkgFiles = ['package.json', ...readdirSync(path.join(REPO, 'packages'))
    .map((w) => path.join('packages', w, 'package.json'))].filter((p) => existsSync(path.join(REPO, p)));
  const scriptRefs = pkgFiles.filter((p) => /sweep-probes|gate\.mts/
    .test(JSON.stringify((JSON.parse(readFileSync(path.join(REPO, p), 'utf8')) as
      { scripts?: Record<string, string> }).scripts ?? {})));
  check('A2', scriptRefs.length === 0,
    `no npm script in any of the ${pkgFiles.length} package.json files invokes the census or the gate ` +
    `(so \`npm run <anything>\` cannot reach it): refs=${JSON.stringify(scriptRefs)}`);

  const ci = readFileSync(path.join(REPO, '.github/workflows/ci.yml'), 'utf8');
  check('A3', !/sweep-probes|gate\.mts/.test(ci) && !/scripts\/\*\*/.test(ci),
    'ci.yml names neither the census nor the gate, and its path filter does not include scripts/** ' +
    '— so a push that lands an unclassified probe cannot redden CI either');

  // Positive control for the whole arm: the thing whose reader we are counting must actually exist.
  const gateSrc = readFileSync(path.join(REPO, 'scripts/gate.mts'), 'utf8');
  check('A4', /census:\s*\['node',\s*\['scripts\/sweep-probes\.mjs',\s*'--census'\]\]/.test(gateSrc),
    'the Round 283 repair is present in gate.mts: a `census` stage spawning `--census`');
  record('A5', 'MEAS',
    `so the census has exactly one reader class: a seat that voluntarily types \`npx tsx ` +
    `scripts/gate.mts\`. Nothing scheduled, nothing in CI, nothing behind \`npm run\`.`);

  // ── B — how many fires are in that channel, and whose ────────────────────────────────────────
  //
  // B1 validates the detector before B2 counts with it. A scanner that silently misses is worse
  // than no scanner, and this file's own argument depends on the count, so the count's instrument
  // has to be shown to work in both directions on files whose answer is known independently.

  const LOGS = path.join(REPO, 'docs/logs');
  const readLog = (f: string): string => readFileSync(path.join(LOGS, f), 'utf8');
  const hasGateLine = (t: string): boolean => /GATE (ok|RED) exit=/.test(t);
  const hasSuiteCounts = (t: string): boolean => /npm (run )?test/.test(t) && /\d{3,4} passed/.test(t);

  // Known positive: Daedalus's Round 283 log quotes the five GATE lines verbatim in its §10.
  // Known negative: my own START-fire log this morning quoted `npm test` counts and no GATE line.
  const POS = '2026-09-27-0917-daedalus-opus-log.md';
  const NEG = '2026-09-27-1047-theseus-opus-log.md';
  check('B1', hasGateLine(readLog(POS)) && !hasGateLine(readLog(NEG)),
    `detector validated in both directions on known files: ${POS} has a GATE line, ${NEG} does not ` +
    '(mine, this morning — I quoted the suite counts and did not run the gate)');

  // `readdirSync`, not a glob and not grep: on this project a glob has dropped a file from a count
  // and grep has emitted no row at all for a file containing a NUL byte.
  const logFiles = readdirSync(LOGS).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{4}-.*\.md$/.test(f)).sort();
  const birthIso = execFileSync('git', ['show', '-s', '--format=%ad', '--date=format:%Y-%m-%d %H%M', GATE_BIRTH_COMMIT],
    { cwd: REPO, encoding: 'utf8' }).trim();
  const [birthDay, birthHHMM] = birthIso.split(' ');
  const after = (f: string): boolean => {
    const m = /^(\d{4}-\d{2}-\d{2})-(\d{4})/.exec(f);
    if (m === null) return false;
    return m[1] > birthDay || (m[1] === birthDay && m[2] >= birthHHMM);
  };
  const since = logFiles.filter(after);
  const g = since.filter((f) => hasGateLine(readLog(f)));
  const s = since.filter((f) => hasSuiteCounts(readLog(f)));
  record('B2', 'MEAS',
    `fires since gate.mts was born (${GATE_BIRTH_COMMIT}, ${birthIso}): ${since.length}. ` +
    `Quoting a GATE line: ${g.length}. Quoting suite counts: ${s.length}. ` +
    `The census's channel is read in ${g.length}/${since.length} fires; the channel it was ` +
    `deliberately kept out of is read in ${s.length}/${since.length}.`);

  const seatOf = (f: string): string => (/^\d{4}-\d{2}-\d{2}-\d{4}-([a-z]+)/.exec(f)?.[1] ?? '?');
  const perSeat = new Map<string, { n: number; gate: number }>();
  for (const f of logFiles) {
    const k = seatOf(f);
    const e = perSeat.get(k) ?? { n: 0, gate: 0 };
    e.n += 1;
    if (hasGateLine(readLog(f))) e.gate += 1;
    perSeat.set(k, e);
  }
  const seatSummary = [...perSeat.entries()].sort()
    .map(([k, e]) => `${k}=${e.gate}/${e.n}`).join(' ');
  // Stated with its denominator, because the honest one is short: `gate.mts` is ONE DAY old, so a
  // seat's 0/110 is mostly 0-of-fires-that-predate-the-file and is not evidence about that seat.
  record('B3', 'MEAS',
    `GATE quotations per seat over all ${logFiles.length} session logs — ${seatSummary} — but ` +
    `gate.mts has existed for ${since.length} of those fires, so the all-time ratio understates ` +
    'nothing and proves nothing. The load-bearing cut is the next line.');
  const seatSince = new Map<string, { n: number; gate: number }>();
  for (const f of since) {
    const k = seatOf(f);
    const e = seatSince.get(k) ?? { n: 0, gate: 0 };
    e.n += 1;
    if (hasGateLine(readLog(f))) e.gate += 1;
    seatSince.set(k, e);
  }
  record('B3b', 'MEAS',
    'GATE quotations per seat in the fires SINCE gate.mts existed — ' +
    `${[...seatSince.entries()].sort().map(([k, e]) => `${k}=${e.gate}/${e.n}`).join(' ')}. ` +
    'The two opus seats have run it; the three seats whose fires most often consist of re-running ' +
    'the suite to check another seat\'s claim have not, which is exactly the blindness Round 283 §3 ' +
    'described and exactly the blindness a reader installed in this channel does not remove.');

  // The cost of the repair in the channel where it IS read, measured on the same axis Daedalus
  // priced for `npm test`: how often does an unclassified probe file exist mid-fire?
  const added = execFileSync('git',
    ['log', '--since=2026-09-20', '--diff-filter=A', '--format=%h', '--name-only', '--', 'scripts/probe-*'],
    { cwd: REPO, encoding: 'utf8' })
    .split('\n').map((l) => l.trim()).filter((l) => l.startsWith('scripts/probe-'));
  record('B4', 'MEAS',
    `new scripts/probe-* files landed since 2026-09-20: ${added.length} in 7 days (~${(added.length / 7).toFixed(1)}/day, ` +
    'about one per Theseus/Daedalus fire). Each one reddens the census from the moment it is written ' +
    'until it is classified — so the census stage makes the gate RED in the NORMAL case for both ' +
    'probe-writing seats unless they classify BEFORE running the gate.');

  // ── C — does the red actually come out, and does it come out labelled? ───────────────────────
  //
  // Read of gate.mts says `if (status !== 0) worst = status ?? 1` and renderGate throws rather than
  // print `ok` on a non-zero status. Read is not driven. This drives it: stage a real unclassified
  // probe under `scripts/`, run the real gate, read the real status.

  const fpBefore = fingerprint(REPO, 'scripts');
  const censusBefore = readdirSync(path.join(REPO, 'scripts')).filter((f) => /^probe-/.test(f)).sort();
  record('C0', 'MEAS', `scripts/ window before arm C: ${censusBefore.length} probe files · ` +
    `git status --porcelain -- scripts: ${JSON.stringify(windowState(REPO, 'scripts'))}`);

  let clean: { status: number | null; out: string };
  let red: { status: number | null; out: string };
  let twoStage: { status: number | null; out: string };
  try {
    // C1 — the negative control FIRST, on the tree as it stands. On the run that first drove this
    // arm, THIS probe file was itself unclassified and the census was red because of it — which is
    // the cost arm B4 prices, met in the fire that wrote it. It reads green here because the file
    // was added to DEFERRED before the gate was run, which is the ordering discipline B4 names.
    clean = gate(['census']);
    const thisFileUnclassified = /unclassified\s+probe-round284/.test(clean.out);
    record('C1', 'MEAS',
      `census on the live tree, this probe file already classified: status=` +
      `${clean.status}, still named as unclassified=${thisFileUnclassified}. ` +
      `Line: ${gateLines(clean.out).join(' | ') || '(none)'}`);

    writeFileSync(SEED_ABS,
      '// Round 284 arm C. Synthetic, unclassified on purpose, deleted in the same arm that wrote\n' +
      '// it. If you are reading this in a committed tree, something went wrong: delete it.\n' +
      'export {};\n');
    check('C2', existsSync(SEED_ABS), `synthetic unclassified probe staged at scripts/${SEED}`);

    red = gate(['census']);
    const lines = gateLines(red.out);
    check('C3', red.status === 1,
      `a census red propagates out of gate.mts as a non-zero exit: status=${red.status} (expected 1)`);
    check('C4', lines.length === 2 && lines.every((l) => l.startsWith('GATE RED exit=1')),
      `both quotable lines lead with RED and the exit code — no reading of the counts can mistake ` +
      `this run for a clean one. Lines: ${JSON.stringify(lines)}`);
    check('C5', new RegExp(`unclassified\\s+${SEED}`).test(red.out),
      'the red names the offending file, so the reader knows what to do without re-deriving it');

    // C6 — ordering. The census is stage ONE and the gate does not stop on it: a seat running the
    // full gate pays every later stage before seeing the summary. Driven with `typecheck` as the
    // cheap stand-in for the two suites (~15 s rather than ~40 s); the control-flow question is
    // identical because the loop is uniform over stages.
    twoStage = gate(['census', 'typecheck']);
    const tl = gateLines(twoStage.out);
    check('C6', twoStage.status === 1 && tl.length === 3
      && tl[0].startsWith('GATE RED exit=1 census')
      && tl[1].startsWith('GATE ok exit=0 typecheck')
      && tl[2].startsWith('GATE RED exit=1 gate(census+typecheck)'),
      'a red census does not stop the gate: the later stage still runs and still reports its own ' +
      `green, and the summary carries the worst status. Lines: ${JSON.stringify(tl)}`);
  } finally {
    removeSeed();
  }

  const fpAfter = fingerprint(REPO, 'scripts');
  const censusAfter = readdirSync(path.join(REPO, 'scripts')).filter((f) => /^probe-/.test(f)).sort();
  check('C7', !existsSync(SEED_ABS)
    && censusAfter.join('\n') === censusBefore.join('\n')
    && fpAfter === fpBefore,
    `arm C restored the tree it mutated: seed gone, probe census back to ${censusAfter.length} files, ` +
    `scripts/ fingerprint identical (${fpAfter === fpBefore})`);

  // C8 — the same negative control AFTER the mutation, which is the only version of it that is
  // evidence: a control run before a mutation cannot distinguish "restored" from "never touched".
  const cleanAgain = gate(['census']);
  check('C8', cleanAgain.status === clean.status
    && gateLines(cleanAgain.out).join('|') === gateLines(clean.out).join('|'),
    `post-restoration census reproduces the pre-mutation run exactly: status=${cleanAgain.status}`);

  // ── D — the marginal-yield arithmetic, re-derived at the parent commit ───────────────────────
  //
  // Not parsed out of the memo and not regex-scraped out of the old file: the historical module is
  // written to a temp path and IMPORTED, so `SWEPT`/`DEFERRED` are the same values that file's own
  // `main()` would have used. `main()` does not run on import — it is guarded on argv[1].

  const TD = path.join(REPO, '.testdata/r284');
  mkdirSync(TD, { recursive: true });                    // Argus, Round 280: create before writing.
  const PARENT = '047e5f06';
  const histPath = path.join(TD, `sweep-probes-at-${PARENT}.mjs`);
  writeFileSync(histPath, execFileSync('git', ['show', `${PARENT}:scripts/sweep-probes.mjs`],
    { cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
  const hist = await import(histPath) as { SWEPT: { file: string }[]; DEFERRED: string[] };
  const histSwept = hist.SWEPT.map((e) => e.file);
  const histDeclared = new Set([...histSwept, ...hist.DEFERRED]);

  // The file list AT that commit, from git — not today's directory, which is the whole point.
  const filesAtParent = execFileSync('git', ['ls-tree', '--name-only', `${PARENT}:scripts`],
    { cwd: REPO, encoding: 'utf8' }).split('\n').map((l) => l.trim()).filter((f) => /^probe-/.test(f));
  const unclassifiedAtParent = filesAtParent.filter((f) => !histDeclared.has(f)).sort();
  check('D1', unclassifiedAtParent.length === 4
    && unclassifiedAtParent.every((f) => /^probe-round2(76|80|81|82)/.test(f)),
    `the census was red at the tip both seats started from (${PARENT}): ` +
    `${unclassifiedAtParent.length} unclassified — ${unclassifiedAtParent.map((f) => f.slice(0, 18)).join(', ')}`);

  // The three hermetic verdict-bearing residue probes of Round 283 §5, DERIVED from the directory
  // by round number rather than typed out. The first cut of this arm typed the names from the memo
  // and got one wrong by four words (`…-of-interpolation-and-neither-did-i.mts` for
  // `…-of-interpolation.mts`), which made a `filter` miss silently and reported Daedalus's
  // arithmetic as off by one when it was exactly right. A hand-typed filename is a recalled fact
  // wearing the costume of a measured one; the directory is the source.
  const scriptsDir = readdirSync(path.join(REPO, 'scripts'));
  const byRound = (n: string): string[] => scriptsDir.filter((f) => f.startsWith(`probe-round${n}-`));
  const VERDICT_BEARING = ['232', '245', '257'].map((n) => {
    const hits = byRound(n);
    if (hits.length !== 1) throw new Error(`round ${n}: expected exactly 1 probe file, found ${hits.length}`);
    return hits[0];
  });
  record('D1b', 'MEAS', `residue filenames derived from the directory, not typed: ${VERDICT_BEARING.join(', ')}`);
  const presentAtParent = VERDICT_BEARING.filter((f) => filesAtParent.includes(f));
  const alreadySwept = VERDICT_BEARING.filter((f) => histSwept.includes(f));
  check('D2', presentAtParent.length === 3 && alreadySwept.length === 2
    && !alreadySwept.includes(VERDICT_BEARING[0]),
    `Round 283 §6 arithmetic holds: of the 3 hermetic verdict-bearing residue probes, ` +
    `${alreadySwept.length} were already SWEPT at ${PARENT} — so the marginal yield of the whole ` +
    `four-boolean design over the existing classification is ${3 - alreadySwept.length} probe`);

  // No cast: the module's own JSDoc types are the ones to grade against, and a cast here would be
  // asserting a shape rather than reading it. (`as {...}` failed to compile precisely because the
  // real `SWEPT` is `readonly` — the cast would have been a lie tsc happened to catch.)
  const live = await import('./sweep-probes.mjs');
  const liveSweptFiles = live.SWEPT.map((e) => e.file);
  check('D3', liveSweptFiles.includes(VERDICT_BEARING[0])
    && unclassifiedAtParent.every((f) => live.DEFERRED.includes(f)),
    `at HEAD: round232 promoted to SWEPT (${liveSweptFiles.length} swept), and all four formerly ` +
    `unclassified probes are in DEFERRED (${live.DEFERRED.length} deferred)`);

  // ── E — does the new SWEPT entry discriminate, or is it a pin that cannot go red? ────────────
  //
  // A promotion to SWEPT installs an `expect` pattern that the sweep grades every future run
  // against. If that pattern matches a red run, the promotion has added a check that cannot fail —
  // Round 223's finding, one layer up. Driven on the real output, then on all three corners.

  const r232 = live.SWEPT.find((e) => e.file === VERDICT_BEARING[0]);
  if (r232 === undefined) {
    record('E0', 'FAIL', 'round232 is not in SWEPT at HEAD — arm E cannot run');
  } else {
    const run = spawnSync('npx', ['tsx', path.join('scripts', r232.file)],
      { cwd: REPO, encoding: 'utf8', timeout: 300_000, maxBuffer: 64 * 1024 * 1024 });
    const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
    const green = live.classify(run.status, out, r232.expect, r232.refusal, r232.skip);
    check('E1', run.status === 0 && green.state === 'PASS',
      `driven here, independently of the fire that promoted it: probe-round232 status=${run.status}, ` +
      `the installed entry grades it ${green.state}`);

    // Corner 2: the probe goes red the way `probe-outcome.mts` makes probes go red.
    const asRed = out.replace(/All 7 regression checks passed.*/g, 'FAILED — 1 of 7, 7 measurements, 0 skips');
    const c2 = live.classify(1, asRed, r232.expect, r232.refusal, r232.skip);
    // Corner 3: the probe prints its pass line and then dies on the way out — output green, code not.
    const c3 = live.classify(1, out, r232.expect, r232.refusal, r232.skip);
    // Corner 4: exit 0 but the pinned summary is absent — the `0/0 checks passed` shape.
    const c4 = live.classify(0, out.replace(/All 7 regression checks passed/g, 'nothing to do'),
      r232.expect, r232.refusal, r232.skip);
    check('E2', c2.state === 'RED' && c3.state === 'RED' && c4.state === 'RED',
      `the entry discriminates on all three corners — red-output+code1=${c2.state}, ` +
      `green-output+code1=${c3.state}, green-code+missing-summary=${c4.state}. ` +
      'The promotion added a check that can fail, which is the only kind worth adding.');
  }

  // ── F — the live half of §7: is 3001 actually held? ──────────────────────────────────────────
  //
  // Connects; never listens. Daedalus reported `probe-round225` BLOCKED on 3001 being held and
  // correctly declined to clear it. Whether that is still true is a fact about this machine right
  // now, and it decays — so it is recorded as a measurement with a timestamp, never as a check.

  const held = await new Promise<string>((resolve) => {
    const sock = net.connect({ port: 3001, host: '127.0.0.1' });
    const done = (v: string): void => { sock.destroy(); resolve(v); };
    sock.setTimeout(1500);
    sock.once('connect', () => done('HELD (something is listening)'));
    sock.once('timeout', () => done('no answer within 1500 ms'));
    sock.once('error', (e: NodeJS.ErrnoException) => done(`free (${e.code})`));
  });
  record('F1', 'MEAS', `3001 at ${new Date().toISOString()}: ${held}. ` +
    "If HELD and it is xian's dev server, probe-round225's BLOCKED is legitimate and the third " +
    'state is working as Round 269/271 designed it.');

  const failed = rows.filter((r) => r.outcome === 'FAIL');
  const passed = rows.filter((r) => r.outcome === 'PASS');
  const meas = rows.filter((r) => r.outcome === 'MEAS');
  console.log(`\n${passed.length} check(s) passed · ${failed.length} failed · ${meas.length} measurement(s)`);
  for (const r of meas) console.log(`[MEAS] ${r.id}  ${r.text}`);
  if (failed.length > 0) {
    for (const r of failed) console.log(`[FAIL] ${r.id}  ${r.text}`);
    process.exit(1);
  }
}

main().then(
  () => process.exit(0),
  (err: unknown) => { console.error('THREW —', err); process.exit(2); },
);
