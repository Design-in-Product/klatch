/**
 * Round 227 probe — `probe-browse-latency-end-to-end` arm O, on a corpus where
 * the cap actually fires.
 *
 * Theseus, 2026-09-17 STOP fire. Daedalus's Round 224 §4 handoff, assigned to me
 * again in his Round 226 memo ("take (a)").
 *
 * ─── The assignment ─────────────────────────────────────────────────────────
 *
 * Arm O of `probe-browse-latency-end-to-end` went red the first time that probe
 * ran in 13 days:
 *
 *   FAIL [O] endpoint delta matches the fingerprint delta
 *            predicted 5 ms vs measured 14 ms (65.5% off);
 *            endpoint moved ±1 ms for a fingerprint delta of ±10 ms
 *
 * Daedalus's read, which he explicitly declined to act on and handed here:
 *
 *   "the check is vacuous on this corpus, and the fix is not a tolerance. Arm M
 *    measured the cap firing on 0/536 files and turns retained 100% — so the
 *    'uncapped' counterfactual is byte-identical work to the capped one, the
 *    true delta is ~0 by construction […] By the taxonomy I just built it should
 *    skip when the cap doesn't fire […] It needs a corpus where the cap fires."
 *
 * He is right that the tolerance is the wrong knob. This probe tests the rest of
 * it: **is the corpus the reason?**
 *
 * ─── The competing explanation, read out of the source before running ───────
 *
 * `session-scanner.ts:439` — the fingerprint cache is process-lifetime, in
 * memory, keyed on `(path, mtimeMs, sizeBytes, lineCap)`. `timeBrowse` takes
 * five samples against a freshly spawned server, so sample 0 populates the cache
 * and samples 1–4 are hits. Arm O then feeds `median(samples.slice(1))` — the
 * WARM median — into a decomposition of the form
 *
 *     browse = fingerprint + remainder
 *
 * and predicts that removing the cap moves it by the fingerprint delta. But the
 * warm median is, by construction, the browse path with the fingerprint work
 * already paid. If that holds, arm O cannot come out right on ANY corpus: a
 * corpus where the cap bites enlarges `mUncapped - mCapped` while leaving
 * `warmN - warmL` pinned at the cache's noise floor, so the check fails harder,
 * not less.
 *
 * Both explanations predict the same red on ~/.claude/projects. They diverge on
 * a corpus where the cap fires, which is exactly what was asked for:
 *
 *   - "the corpus" predicts arm O's arithmetic PASSES here.
 *   - "the cache" predicts it FAILS here, and passes on the COLD samples.
 *
 * ─── Why a synthetic corpus, and why CLAUDE_CONFIG_DIR ──────────────────────
 *
 * No corpus on this machine fires the 50,000-line cap — that is the finding
 * behind the cap decision itself (Round 148: ~/.claude-pm tops out at 40,397
 * lines). So the corpus is built here, to a size chosen to bite hard: three
 * files of 80,000 lines against a cap of 50,000, so 37.5% of each big file is
 * unread at the shipped cap and the turn counts differ, not just the timings.
 *
 * The root is moved with `CLAUDE_CONFIG_DIR` (replace semantics,
 * session-scanner.ts:146-153), NOT `KLATCH_EXTRA_SESSION_ROOTS` (additive) —
 * additive would drag the real 536-file corpus into every sample and bury the
 * signal under 2.7 s of unrelated fingerprinting.
 *
 * Run:  npx tsx scripts/probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts
 *
 * Zero model calls. Scratch DB under `.testdata/`; `klatch.db` is never opened.
 * The real corpus under ~/.claude/projects is never read by this probe at all.
 *
 * ─── On source mutation ─────────────────────────────────────────────────────
 * Arm D needs a server generation with the cap removed, and the product call
 * sites don't pass `lineCap` — same constraint arm N lives under. Same
 * discipline: original bytes captured and sha256'd at start, patch applied,
 * restored in a `finally`, re-read and asserted byte-identical before exit, and
 * asserted again in the summary. Nothing is committed in the patched state.
 *
 * Arms:
 *   A  build the corpus and prove the cap fires ON IT — `capped: true` from the
 *      shipped function, and a turn count that differs between capped and
 *      uncapped. A corpus that only costs more is not a corpus where the cap
 *      fires; it has to change the answer.
 *   B  arm M's measurement on this corpus: fingerprint sum at cap vs uncapped
 *   C  the endpoint, capped, per-sample — and `fingerprintCapped` at the wire,
 *      which is the cap firing at the surface rather than in a unit call
 *   D  the endpoint, uncapped, per-sample, via the temporary constant patch
 *   E  arm O's arithmetic, verbatim, on the WARM samples (what ships today)
 *   F  the same arithmetic on the COLD samples
 *   G  the discriminator: does the warm endpoint contain fingerprint work at all?
 *
 * Tolerances for E/F/G were pre-registered in docs/logs/2026-09-17-1947-theseus-opus-log.md
 * at 19:58, before the first run.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn, type ChildProcess } from 'child_process';
import { requireAnUnoccupiedPort, waitUntilOurServerIsUp, reapOnExit } from './lib/probe-server-ownership.mts';
import { summariseAndExit } from './lib/probe-outcome.mts';
import { readNumericConstant } from './lib/probe-source-constants.mts';

const PROBE = 'probe-round227-arm-o-on-a-corpus-where-the-cap-fires';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round227');
const CONFIG = path.join(SCRATCH, 'config');
const PROJECTS = path.join(CONFIG, 'projects');
const DB = path.join(SCRATCH, 'scratch.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER = path.join(REPO, 'packages/server/src/import/session-scanner.ts');

const SAMPLES = 5;

/** Chosen against the shipped cap, not the other way round — see arm A. */
const BIG_FILES = 3;
const BIG_LINES = 80_000;
const SMALL_FILES = 5;
const SMALL_LINES = 400;

// ── Pre-registered tolerances ────────────────────────────────────────────────
/** Arm O's own tolerance, re-used verbatim so E and F grade by its rule, not mine. */
const ARM_O_TOLERANCE_PCT = 20;
/** G1: the warm endpoint moves by less than this fraction of the fingerprint delta. */
const WARM_INERTNESS_FRACTION = 0.25;
/** G2: the cold endpoint delta lands within this fraction of the fingerprint delta. */
const COLD_AGREEMENT_FRACTION = 0.5;

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'NOTE' : 'FAIL';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
const skipped: string[] = [];
function skip(arm: string, why: string) {
  skipped.push(`[${arm}] ${why}`);
  console.log(`SKIP [${arm}] ${why}`);
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const ms = (n: number) => `${n.toFixed(0)} ms`;
const pct = (n: number) => `${n.toFixed(1)}%`;

// ── Source guard, before anything else touches the tree ──────────────────────

const SCANNER_ORIGINAL = fs.readFileSync(SCANNER);
const SCANNER_SHA = crypto.createHash('sha256').update(SCANNER_ORIGINAL).digest('hex');
const SHIPPED_CAP = readNumericConstant(SCANNER_ORIGINAL.toString('utf8'), 'FINGERPRINT_LINE_CAP', PROBE);

// Round 238: this used to WRITE `SCANNER_ORIGINAL` back, because arm D patched
// `FINGERPRINT_LINE_CAP` in source to get an uncapped server. `KLATCH_FINGERPRINT_LINE_CAP`
// (Round 237) replaced the patch, so nothing here writes into `packages/` any more and
// the function only reads.
//
// The restoring *exit hook* was deleted rather than converted, and that is the part worth
// a sentence: with no patch to undo, a hook that writes `SCANNER_ORIGINAL` back can only
// do harm — it would silently revert an edit another agent made to the scanner while this
// probe was running, and report success doing it. Verification stays (the final sha check
// at the bottom of the run); the write is gone.
function scannerUnchanged(): boolean {
  return crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex') === SCANNER_SHA;
}

console.log(`${PROBE}`);
console.log(`shipped FINGERPRINT_LINE_CAP = ${SHIPPED_CAP} (read from source, sha256 ${SCANNER_SHA.slice(0, 12)})`);

if (BIG_LINES <= SHIPPED_CAP) {
  console.log(`\n!! BIG_LINES (${BIG_LINES}) is not above the shipped cap (${SHIPPED_CAP}).`);
  console.log(`   This probe exists to drive a corpus where the cap fires; it cannot with these sizes.`);
  process.exit(1);
}
console.log(`corpus sized to bite: ${BIG_LINES} lines vs cap ${SHIPPED_CAP} — ${pct(100 * (1 - SHIPPED_CAP / BIG_LINES))} of each big file unread at the shipped cap\n`);

// ── Server lifecycle ─────────────────────────────────────────────────────────

let server: ChildProcess | undefined;
reapOnExit(() => server);

function killServer() {
  if (server && server.exitCode === null) { try { server.kill('SIGTERM'); } catch { /* gone */ } }
  server = undefined;
}

/**
 * The child's environment, with the cap lever set for exactly one generation.
 *
 * `lineCap` undefined **deletes** `KLATCH_FINGERPRINT_LINE_CAP` rather than merely not
 * setting it. The probe inherits the fire's environment, so if the variable were already
 * set out there, the "shipped cap" generation would quietly run at that value instead —
 * and every arm would still be green, measuring a cap nobody in this file chose. That is
 * the same failure the lever was built to end (`session-scanner.ts:323`), arriving from
 * the other direction. The same reasoning covers `KLATCH_EXPORT_ROOT` in Round 236.
 */
function childEnv(lineCap?: number): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    KLATCH_DB: DB,
    CLAUDE_CONFIG_DIR: CONFIG,
    ANTHROPIC_API_KEY: '',
  };
  if (lineCap === undefined) delete env.KLATCH_FINGERPRINT_LINE_CAP;
  else env.KLATCH_FINGERPRINT_LINE_CAP = String(lineCap);
  return env;
}

/**
 * `lineCap` undefined spawns the shipped cap. Passing a number sets
 * `KLATCH_FINGERPRINT_LINE_CAP` for that generation only.
 *
 * Note that this does NOT verify the lever took effect, and deliberately so: "the
 * variable was set" describes the apparatus, not the server. Arm D's `capped === 0`
 * check is what proves the server actually ran the cap it was handed.
 */
async function startServer(tag: string, lineCap?: number): Promise<void> {
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'a');
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    // ANTHROPIC_API_KEY stripped: nothing here should be able to reach the model,
    // and a probe that *could* is one edit away from one that does.
    env: childEnv(lineCap),
    stdio: ['ignore', logFd, logFd],
  });
  await waitUntilOurServerIsUp(server, logPath, PORT);
}

async function timeBrowse(n: number) {
  const samples: number[] = [];
  let bytes = 0, sessions = 0, projects = 0, capped = 0, turns = 0;
  // Round 234: WHICH files, not just how many. Arm C used to compare
  // `sessions === files.length`, and a count cannot tell "the corpus I built"
  // from "a corpus of the same size" — my own Round 233 lesson, applied here
  // one round late.
  let paths: string[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    const res = await fetch(`${BASE}/api/import/claude-code/sessions`, { headers: { connection: 'close' } });
    const text = await res.text();
    const body = JSON.parse(text);
    samples.push(performance.now() - t0);
    bytes = Buffer.byteLength(text);
    const all = ((body.projects ?? []) as any[]).flatMap((p) => p.sessions ?? []);
    sessions = all.length;
    projects = (body.projects ?? []).length;
    capped = all.filter((s: any) => s.fingerprintCapped).length;
    turns = all.reduce((acc: number, s: any) => acc + (s.turnCount ?? 0), 0);
    paths = all.map((s: any) => s.path).filter(Boolean);
  }
  return { samples, bytes, sessions, projects, capped, turns, paths, cold: samples[0], warm: median(samples.slice(1)) };
}

/**
 * ─── 2026-09-19, Theseus (Round 234) — the endpoint walks a SECOND corpus ────
 *
 * This probe relocates `CLAUDE_CONFIG_DIR` onto a synthetic corpus it builds
 * itself, and every arm from B down was written on the premise that the
 * relocation is total. It is not, since Daedalus's Round 234 repair of
 * `routes/import.ts:106`: the browse also returns `<repo>/exports/sessions`,
 * resolved from the module's own location, reading no environment variable.
 *
 * Verified, not assumed — `paths.ts` reads no `process.env` at all, and the
 * export path has exactly one call site. **There is no lever a probe can pull to
 * relocate or suppress this corpus.** Relocation was a complete isolation
 * mechanism only for as long as the export scan was broken; the fix took that
 * property away as a side effect, and this is the first probe to pay for it.
 *
 * So the synthetic corpus stays the FIXTURE (arm A's inventory and cap claims
 * are about the files this probe wrote, and must not drift), while the
 * arithmetic arms — B, E, F, G — sum over the population the endpoint actually
 * walks. Arm O's remainder is only a decomposition if its two terms cover the
 * same files, which is the whole finding of Round 233 arriving in a second probe.
 */
function exportedCorpusFiles(): string[] {
  const exportDir = path.join(REPO, 'exports', 'sessions');
  if (!fs.existsSync(exportDir)) return [];
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(exportDir, { withFileTypes: true }); } catch { return []; }
  const out: string[] = [];
  for (const f of entries) {
    if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
    const p = path.join(exportDir, f.name);
    try { if (fs.statSync(p).size < 100) continue; } catch { continue; } // mirrors session-scanner.ts:650
    out.push(p);
  }
  return out;
}

await requireAnUnoccupiedPort(PORT, PROBE);

// ── Arm A — build the corpus, and prove the cap fires on it ──────────────────
//
// "A corpus where the cap fires" has to mean the cap CHANGES THE ANSWER, not
// merely that it costs time. The check below is on turn counts, not on ms.

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(PROJECTS, { recursive: true });

const PROJECT_DIR = path.join(PROJECTS, '-Users-probe-round227-synthetic');
fs.mkdirSync(PROJECT_DIR, { recursive: true });

function writeSession(file: string, lines: number, seed: string) {
  // Alternating human/assistant events. The user events carry string content and
  // `permissionMode`, which is what isHumanTurnBoundary (parser.ts:402) counts —
  // so half the lines are turns and a truncated read is a visibly lower count.
  const out = fs.createWriteStream(file);
  for (let i = 0; i < lines; i++) {
    const ev = i % 2 === 0
      ? { type: 'user', permissionMode: 'default', message: { role: 'user', content: `${seed} human line ${i} — padding to a realistic width so the parse cost is not trivial.` } }
      : { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: `${seed} assistant line ${i} — padding to a realistic width so the parse cost is not trivial.` }] } };
    out.write(JSON.stringify(ev) + '\n');
  }
  return new Promise<void>((resolve, reject) => { out.end(); out.on('finish', () => resolve()); out.on('error', reject); });
}

const bigFiles: string[] = [];
const smallFiles: string[] = [];
for (let i = 0; i < BIG_FILES; i++) {
  const f = path.join(PROJECT_DIR, `big-0000000${i}-0000-0000-0000-00000000000${i}.jsonl`);
  await writeSession(f, BIG_LINES, `big${i}`);
  bigFiles.push(f);
}
for (let i = 0; i < SMALL_FILES; i++) {
  const f = path.join(PROJECT_DIR, `small-000000${i}-0000-0000-0000-00000000000${i}.jsonl`);
  await writeSession(f, SMALL_LINES, `small${i}`);
  smallFiles.push(f);
}
const files = [...bigFiles, ...smallFiles];
const corpusBytes = files.reduce((a, f) => a + fs.statSync(f).size, 0);

/**
 * The population the ENDPOINT walks: the synthetic fixture plus the repo's
 * exported sessions, which the relocation cannot exclude (see above). Arm A
 * keeps using `files` — its claims are about the fixture as constructed. Arms
 * B/E/F/G use this, because they are compared against endpoint measurements.
 */
const exportedFiles = exportedCorpusFiles();
const walkedFiles = [...files, ...exportedFiles];

const { extractSessionFingerprint } = await import(path.join(REPO, 'packages/server/src/import/session-scanner.ts'));

const UNCAPPED = Number.MAX_SAFE_INTEGER;
const fpCapped = new Map<string, any>();
const fpUncapped = new Map<string, any>();
for (const f of files) {
  fpCapped.set(f, await extractSessionFingerprint(f, SHIPPED_CAP));
  fpUncapped.set(f, await extractSessionFingerprint(f, UNCAPPED));
}

const bigAllCapped = bigFiles.every((f) => fpCapped.get(f).capped === true);
const smallNoneCapped = smallFiles.every((f) => fpCapped.get(f).capped === false);
check('A', 'the cap fires on this corpus and only where it should', bigAllCapped && smallNoneCapped,
  `${bigFiles.filter((f) => fpCapped.get(f).capped).length}/${BIG_FILES} big files capped, ` +
  `${smallFiles.filter((f) => fpCapped.get(f).capped).length}/${SMALL_FILES} small files capped (expect ${BIG_FILES} and 0)`);

const turnsCapped = files.reduce((a, f) => a + fpCapped.get(f).turnCount, 0);
const turnsUncapped = files.reduce((a, f) => a + fpUncapped.get(f).turnCount, 0);
check('A', 'the cap changes the answer, not only the cost', turnsUncapped > turnsCapped,
  `turns ${turnsCapped} → ${turnsUncapped} uncapped (${pct(100 * turnsCapped / turnsUncapped)} retained, ` +
  `+${turnsUncapped - turnsCapped} recovered) — contrast ~/.claude/projects, 1987 → 1987, 100% retained`);

check('A', 'corpus inventory', true,
  `${files.length} files / ${(corpusBytes / 1e6).toFixed(1)} MB under ${path.relative(REPO, PROJECTS)} — ` +
  `${BIG_FILES} × ${BIG_LINES} lines, ${SMALL_FILES} × ${SMALL_LINES} lines`,
  'measurement');

// ── Arm B — arm M's measurement, on this corpus ──────────────────────────────
//
// Same shape as probe-browse-latency-end-to-end arm M: warm the page cache for
// both passes equally, then time a capped pass and an uncapped pass.

// Round 234: over `walkedFiles`, not `files` — these sums are subtracted from
// endpoint timings in E and F, and a sum over 8 files minus a browse over 9 is
// not a decomposition.
for (const f of walkedFiles) await extractSessionFingerprint(f, SHIPPED_CAP);

let t0 = performance.now();
for (const f of walkedFiles) await extractSessionFingerprint(f, SHIPPED_CAP);
const mCapped = performance.now() - t0;

t0 = performance.now();
for (const f of walkedFiles) await extractSessionFingerprint(f, UNCAPPED);
const mUncapped = performance.now() - t0;

const fingerprintDelta = mUncapped - mCapped;
check('B', 'fingerprint sum at cap vs uncapped, this corpus', true,
  `cap ${SHIPPED_CAP} ${ms(mCapped)}, uncapped ${ms(mUncapped)}, delta +${ms(fingerprintDelta)} ` +
  `(+${pct(100 * fingerprintDelta / mCapped)} of the scan) — over ${walkedFiles.length} file(s): ` +
  `${files.length} synthetic + ${exportedFiles.length} exported`,
  'measurement');
check('B', 'the fingerprint delta is large enough to be measurable at the endpoint', fingerprintDelta > 50,
  `+${ms(fingerprintDelta)}; arm O on ~/.claude/projects had +10 ms, which is why its 20% band ran over noise`);

// ── Arm C — the endpoint, capped ─────────────────────────────────────────────

let L: Awaited<ReturnType<typeof timeBrowse>> | undefined;
try {
  await startServer('capped');
  L = await timeBrowse(SAMPLES);
} finally {
  killServer();
}

// ─── 2026-09-19, Theseus (Round 234) — "and nothing else" was the premise ────
//
// This read `L!.sessions === files.length` and went red on Daedalus's export-scan
// repair: `9 sessions across 2 projects (expect 8 / 1)`. The arm was not wrong
// about the endpoint — the endpoint was right and the arm's world had one corpus
// in it.
//
// Restated as the invariant it was always for: the endpoint returns exactly the
// population this probe accounted for, no more and no less. Compared as a SET,
// so an unexpected file is named rather than summarised into a count, and so a
// swap of equal size cannot pass. "Nothing else" survives — it now means
// "nothing this probe has not accounted for" rather than "nothing but the
// fixture."
const returned = new Set(L!.paths.map((p) => path.resolve(p)));
const accounted = new Set(walkedFiles.map((f) => path.resolve(f)));
const unexpected = [...returned].filter((p) => !accounted.has(p));
const missing = [...accounted].filter((p) => !returned.has(p));
check('C', 'the endpoint returns exactly the corpus this probe accounted for, and nothing else',
  L!.paths.length > 0 && unexpected.length === 0 && missing.length === 0,
  `${L!.sessions} sessions across ${L!.projects} projects ` +
  `(accounted: ${files.length} synthetic + ${exportedFiles.length} exported = ${walkedFiles.length}), ` +
  `${(L!.bytes / 1e3).toFixed(0)} kB payload` +
  (unexpected.length ? `; UNEXPECTED: ${unexpected.slice(0, 3).join(', ')}` : '') +
  (missing.length ? `; NOT RETURNED: ${missing.slice(0, 3).join(', ')}` : ''));
check('C', 'the cap fires AT THE WIRE, not only in a unit call', L!.capped === BIG_FILES,
  `fingerprintCapped on ${L!.capped}/${L!.sessions} sessions (expect ${BIG_FILES})`);
check('C', 'capped browse, per sample', true,
  `cold ${ms(L!.cold)}, warm median ${ms(L!.warm)} over ${SAMPLES - 1} — [${L!.samples.map((s) => s.toFixed(0)).join(', ')}]`,
  'measurement');

// ── Arm D — the endpoint, uncapped ───────────────────────────────────────────

// Round 238: this generation used to be produced by writing a patched
// `session-scanner.ts` to disk and restoring it in the `finally`. It now sets
// `KLATCH_FINGERPRINT_LINE_CAP` on the child instead (Round 237). `MAX_SAFE_INTEGER`
// is what the patch substituted and is what the resolver accepts as its largest legal
// value, so "uncapped" means the same number it always did.
let N: Awaited<ReturnType<typeof timeBrowse>> | undefined;
try {
  await startServer('uncapped', Number.MAX_SAFE_INTEGER);
  N = await timeBrowse(SAMPLES);
} finally {
  killServer();
}

// The claim is about the scanner, so it is checked against the scanner — not against a
// flag recording that this probe chose not to write. It would catch a stray write from
// anywhere in the run, including one this file does not know about.
const scannerIntact = scannerUnchanged();
check('D', 'the uncapped generation was obtained without writing into packages/', scannerIntact,
  scannerIntact
    ? `session-scanner.ts still sha256 ${SCANNER_SHA.slice(0, 12)}; cap set via KLATCH_FINGERPRINT_LINE_CAP on the child`
    : `session-scanner.ts CHANGED during the run — run \`git diff ${path.relative(REPO, SCANNER)}\``);

check('D', 'the uncapped generation really was uncapped', N!.capped === 0 && N!.sessions === L!.sessions,
  `fingerprintCapped on ${N!.capped}/${N!.sessions} sessions (expect 0/${L!.sessions}); ` +
  `turns ${L!.turns} → ${N!.turns} at the wire`);
check('D', 'uncapped browse, per sample', true,
  `cold ${ms(N!.cold)}, warm median ${ms(N!.warm)} over ${SAMPLES - 1} — [${N!.samples.map((s) => s.toFixed(0)).join(', ')}]`,
  'measurement');

// ── Arm E — arm O's arithmetic, verbatim, on the WARM samples ────────────────
//
// This is the input arm O uses today (`median(samples.slice(1))`), run on the
// corpus it was said to need.
//
// The check below is deliberately NOT "arm O is broken". An arm that asserts a
// defect is present dies of its own success the moment the defect is fixed —
// Round 225's rule, and this probe is not exempt from it. What is asserted is
// the durable fact underneath: a cache-hit measurement cannot track a change in
// the work the cache elides. That stays true after arm O is repaired, and would
// correctly go red if browse ever stopped caching fingerprints — at which point
// arm O's warm form really would be fine.

console.log('');
const warmPredicted = L!.warm + fingerprintDelta;
const warmErrPct = Math.abs(warmPredicted - N!.warm) / N!.warm * 100;
const warmRemainder = L!.warm - mCapped;

check('E', "arm O's decomposition, warm — browse = fingerprint + remainder", true,
  `browse ${ms(L!.warm)} = fingerprint ${ms(mCapped)} (${pct(100 * mCapped / L!.warm)}) + remainder ${ms(warmRemainder)} (${pct(100 * warmRemainder / L!.warm)}) ` +
  `— a remainder below zero is the decomposition reporting that it does not hold`,
  'measurement');
check('E', 'a warm-median browse cannot track the fingerprint delta, however hard the cap bites',
  warmErrPct >= ARM_O_TOLERANCE_PCT,
  `arm O's own ${ARM_O_TOLERANCE_PCT}% band, fed the warm median: predicted ${ms(warmPredicted)} vs measured ${ms(N!.warm)} ` +
  `(${pct(warmErrPct)} off) — worse than the ${pct(65.5)} it recorded on ~/.claude/projects, where the cap fired on nothing`);

// ── Arm F — the same arithmetic on the COLD samples ──────────────────────────

const coldPredicted = L!.cold + fingerprintDelta;
const coldErrPct = Math.abs(coldPredicted - N!.cold) / N!.cold * 100;
const coldRemainder = L!.cold - mCapped;

check('F', "arm O's decomposition, cold — browse = fingerprint + remainder", true,
  `browse ${ms(L!.cold)} = fingerprint ${ms(mCapped)} (${pct(100 * mCapped / L!.cold)}) + remainder ${ms(coldRemainder)} (${pct(100 * coldRemainder / L!.cold)})`,
  'measurement');
check('F', "arm O's check passes when fed the cold sample instead of the warm median", coldErrPct < ARM_O_TOLERANCE_PCT,
  `predicted ${ms(coldPredicted)} vs measured ${ms(N!.cold)} (${pct(coldErrPct)} off); ` +
  `endpoint moved +${ms(N!.cold - L!.cold)} for a fingerprint delta of +${ms(fingerprintDelta)}`);

// ── Arm G — the discriminator ────────────────────────────────────────────────
//
// "the corpus" and "the cache" both predict arm O red on ~/.claude/projects.
// They diverge here. G1 and G2 are the two halves of the same claim, and a
// probe that only asserted G1 would be asserting an absence.

const warmMove = Math.abs(N!.warm - L!.warm);
check('G', 'the WARM endpoint contains no fingerprint work', warmMove < WARM_INERTNESS_FRACTION * fingerprintDelta,
  `removing the cap moved warm browse by ${ms(warmMove)} against a fingerprint delta of ${ms(fingerprintDelta)} ` +
  `(${pct(100 * warmMove / fingerprintDelta)} of it; threshold ${pct(100 * WARM_INERTNESS_FRACTION)})`);

const coldMove = N!.cold - L!.cold;
const coldAgreement = Math.abs(coldMove - fingerprintDelta) / fingerprintDelta;
check('G', 'the COLD endpoint does contain it', coldAgreement < COLD_AGREEMENT_FRACTION,
  `removing the cap moved cold browse by ${ms(coldMove)} against a fingerprint delta of ${ms(fingerprintDelta)} ` +
  `(${pct(100 * coldAgreement)} apart; threshold ${pct(100 * COLD_AGREEMENT_FRACTION)})`);

check('G', 'cold and warm differ by about the whole fingerprint scan', true,
  `capped: cold ${ms(L!.cold)} − warm ${ms(L!.warm)} = ${ms(L!.cold - L!.warm)} vs fingerprint sum ${ms(mCapped)}; ` +
  `uncapped: cold ${ms(N!.cold)} − warm ${ms(N!.warm)} = ${ms(N!.cold - N!.warm)} vs ${ms(mUncapped)}`,
  'measurement');

// ── Arm H — the KLATCH_DB leak, and a control that it is really the ordering ──
//
// Found while comparing two runs of `probe-browse-latency-end-to-end`: its arm P
// reported "0 channels → 397 µs" on one run and "0 channels → 782 µs" on the
// next. The x-axis was a lie. `db/index.ts:24` computes `DB_PATH` in a
// module-level `const` at load time, and arm P set `process.env.KLATCH_DB`
// AFTER arm M had already pulled `db/index.ts` in transitively — so the
// assignment no-opped and 2000 rows per run went into the worktree's real
// `klatch.db`.
//
// Claiming "it is the ordering" from a source read is exactly what this project
// forbids, so it is driven here. Two children, differing ONLY in when the
// variable is set. Both are pointed at scratch paths in their spawn env, so
// neither can write to the real `klatch.db` even if the claim is wrong — a
// control for a data-loss bug must not be able to cause one.

const LATE_ENV_DB = path.join(SCRATCH, 'h-load-time.db');   // set in the child's spawn env
const LATE_ASSIGN_DB = path.join(SCRATCH, 'h-assigned.db'); // assigned late, in-process
const EARLY_DB = path.join(SCRATCH, 'h-early.db');

const dbIndex = path.join(REPO, 'packages/server/src/db/index.ts');

function childSource(order: 'late' | 'early'): string {
  return order === 'late'
    ? `const { getDb } = await import(${JSON.stringify(dbIndex)});\n` +
      `process.env.KLATCH_DB = ${JSON.stringify(LATE_ASSIGN_DB)};\n` +
      `console.log(getDb().name);\n`
    : `process.env.KLATCH_DB = ${JSON.stringify(EARLY_DB)};\n` +
      `const { getDb } = await import(${JSON.stringify(dbIndex)});\n` +
      `console.log(getDb().name);\n`;
}

function runChild(order: 'late' | 'early', spawnEnvDb: string): Promise<string> {
  const file = path.join(SCRATCH, `h-child-${order}.mts`);
  fs.writeFileSync(file, childSource(order));
  return new Promise((resolve, reject) => {
    const c = spawn('npx', ['tsx', file], {
      cwd: REPO,
      env: { ...process.env, KLATCH_DB: spawnEnvDb, ANTHROPIC_API_KEY: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    c.stdout.on('data', (d) => { out += d; });
    c.stderr.on('data', (d) => { err += d; });
    c.on('close', (code) => code === 0
      ? resolve(out.trim().split('\n').filter(Boolean).pop() ?? '')
      : reject(new Error(`child ${order} exited ${code}: ${err}`)));
  });
}

const lateOpened = path.resolve(await runChild('late', LATE_ENV_DB));
const earlyOpened = path.resolve(await runChild('early', LATE_ENV_DB));

check('H', 'a KLATCH_DB assignment made after the import is a no-op',
  lateOpened === path.resolve(LATE_ENV_DB) && lateOpened !== path.resolve(LATE_ASSIGN_DB),
  `child set KLATCH_DB to ${path.basename(LATE_ASSIGN_DB)} after importing db/index.ts; ` +
  `getDb() opened ${path.basename(lateOpened)} — the value present at MODULE LOAD, not the assigned one`);

check('H', 'the same assignment made before the import is honoured',
  earlyOpened === path.resolve(EARLY_DB),
  `child set KLATCH_DB to ${path.basename(EARLY_DB)} before importing db/index.ts; ` +
  `getDb() opened ${path.basename(earlyOpened)} — so the ordering is the whole mechanism`);

check('H', 'the repo klatch.db is not what either child opened',
  lateOpened !== path.resolve(REPO, 'klatch.db') && earlyOpened !== path.resolve(REPO, 'klatch.db'),
  `neither child touched ${path.relative(REPO, path.join(REPO, 'klatch.db'))} — both were pinned to scratch paths in their spawn env`);

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n─── summary ───');
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : r.kind === 'measurement' ? 'NOTE' : 'FAIL'} [${r.arm}] ${r.check}`);
}
for (const s of skipped) console.log(`  SKIP ${s}`);

const finalSha = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
if (finalSha !== SCANNER_SHA) {
  console.log(`\n!! session-scanner.ts changed during this run (sha ${finalSha.slice(0, 12)} vs ${SCANNER_SHA.slice(0, 12)}).`);
  // Round 238: this used to say "run git checkout". Since this probe stopped patching
  // source, it is no longer the likely author of such a change — another agent editing
  // the scanner concurrently is — and `git checkout` would silently destroy their work.
  // Inspect before reverting.
  console.log(`   This probe no longer writes to it. Inspect with \`git diff ${path.relative(REPO, SCANNER)}\` before reverting anything.`);
  process.exit(1);
}
console.log(`\nsession-scanner.ts verified unmodified (sha256 ${SCANNER_SHA.slice(0, 12)}).`);

summariseAndExit({ probeName: PROBE, results, skipped });
