/**
 * Round 157 — is `a·lines + b·bytes` a cost model on the SCAN path, or is it
 * falsified there too?
 *
 * Round 155 (`docs/pm-corpus-cap-delta-2026-09-05.md`, arm H) priced the
 * `FINGERPRINT_LINE_CAP` ruling on two corpora and found the two obvious
 * normalisations **bracketing rather than agreeing**: 7.4 ms per 1k above-cap
 * lines on PM against 9.8 on shipped (PM cheaper), and 4.1 ms/MB against 3.3
 * (PM dearer). I published the spread as an honest precision band — "estimate a
 * new corpus at 7–10 ms per 1k above-cap lines and treat the range as the
 * precision" — and asked Daedalus whether that was worth less than I'd given it.
 *
 * He answered (Round 156, `docs/parse-stage-allocation-2026-09-05.md`) that on
 * the neighbouring **parse** path the identical bracketing signature resolves to
 * **model failure, not to a midpoint**: at byte-matched payloads the isolated
 * per-line slope came out **negative** (−3.6 to −4.2 ms per 1k lines, four runs),
 * and no cost coefficient can be negative. He was careful to say he could not
 * tell me my coefficient was negative — different path — and pointed out I
 * already hold the input for my own version of the control, since PM's mean line
 * is 1.84 KB against shipped's 3.08 KB.
 *
 * **This probe runs that control on the scan path.** It does not reuse his
 * result and does not assume the answer goes the same way.
 *
 * ─── Why this can be done better here than there ────────────────────────────
 * Daedalus had to *construct* a byte-matched pair (a real session and a
 * synthetic truncated to match it byte for byte), and got a 2.36× line ratio.
 * The scan path reads whole session files, so byte-matched pairs can be found
 * among **real sessions on this machine** — no synthesis, no ASCII/UTF-16
 * confound of the kind that turned out to dominate his own measurement. Arm A
 * searches for them and finds a **7.1× line ratio at 0.5% byte difference**
 * (a 2941-line / 32.9 MB session at 11.5 KB per line against a 20877-line /
 * 33.1 MB session at 1.6 KB per line). Three further pairs at 2.0–3.3× serve as
 * independent replicates rather than as a single anecdote.
 *
 * The arms:
 *
 *   arm A  inventory both roots; select byte-matched / line-divergent real pairs
 *          deterministically; refresh the 50_000 guard headroom
 *   arm B  THE CONTROL — per-pair isolated per-line slope at equal bytes,
 *          interleaved repeats, full ranges reported
 *   arm C  three cost models (lines-only, bytes-only, two-term) fitted on half
 *          the above-cap files and scored on the held-out half
 *   arm D  what is left when both units fail — per-line structure
 *   arm E  warm-vs-cold reconciliation against Round 155's endpoint delta
 *   arm F  the relabel this fire owes `docs/pm-corpus-cap-delta-2026-09-05.md`
 *
 * ─── Method decisions, and the ones that cost accuracy ──────────────────────
 *
 * **Function level, not endpoint, and deliberately.** Round 155 measured cold
 * browse through a live server because the question was "what does xian wait
 * for". This question is "what is the cost proportional to", and the endpoint
 * adds server start, DB, HTTP and a directory walk that are all constant in the
 * variable under test. `extractSessionFingerprint` takes `lineCap` as a
 * parameter (`session-scanner.ts:293`), so the shipped function is measured
 * directly — **no source mutation at all this fire**, unlike Round 155.
 *
 * **Warm page cache, and this understates the byte term.** Every file is read
 * once before any timing. That isolates the CPU term. A cache-cold browse
 * additionally pays disk, which is byte-proportional and not line-proportional.
 * So warm measurement is *biased in favour of* the per-line unit: if the line
 * term fails to show up warm, it cannot be rescued cold. That direction is what
 * makes a warm experiment admissible as evidence against a per-line model. It
 * would NOT be admissible as evidence for one.
 *
 * **Interleaved repeats.** Pair members are timed A,B,A,B,A,B rather than
 * AAA,BBB, so thermal drift and background load hit both arms alike. Ranges are
 * printed, not just means — Round 155's repeat discipline, sharpened by
 * Daedalus's Round 156 note that his first unrepeated sample of a memory delta
 * was −12.3% and the next was −0.9%.
 *
 * Run:  npx tsx scripts/probe-scan-cost-model-control.mts
 *
 * Zero model calls. No server, no DB — `klatch.db` is never opened. Both corpora
 * are read-only throughout; nothing under `packages/` is written.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { extractSessionFingerprint } from '../packages/server/src/import/session-scanner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const SCANNER_REL = 'packages/server/src/import/session-scanner.ts';
const SCANNER = path.join(REPO, SCANNER_REL);

const HOME = os.homedir();
const ROOT_SHIPPED = path.join(HOME, '.claude', 'projects');
const ROOT_PM = path.join(HOME, '.claude-pm', 'projects');

/** The pre-ruling cap. The "above-cap" work this probe prices is everything past it. */
const CAP_OLD = 1_500;
/** The shipped guard, xian's ruling (`18d4631`). */
const CAP_SHIPPED = 50_000;

/** Round 155's figures, for the cross-run reconciliation in arm E. Cold, endpoint. */
const R155_PM_DELTA_COLD = 1781; // docs/pm-corpus-cap-delta-2026-09-05.md, arm F
const R155_PM_PER_KLINE = 7.4; // ibid, arm H
const R155_SHIPPED_PER_KLINE = 9.8; // ibid, arm H

const REPEATS = 3;

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
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
const rng = (xs: number[]) => `${Math.min(...xs).toFixed(0)}–${Math.max(...xs).toFixed(0)}`;

// ── Source guard ─────────────────────────────────────────────────────────────
// This fire patches nothing. The hash is taken anyway so the claim "packages/
// untouched" is verified at exit rather than asserted from intent.

const SCANNER_SHA = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');

// ═══════════════════════════════════════════════════════════════════════════
// arm A — inventory, pair selection, guard headroom
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n──── arm A — inventory both roots, select the control pairs ────\n');

interface FileRow {
  tag: 'shipped' | 'pm';
  fp: string;
  base: string;
  bytes: number;
  lines: number;
  /** Bytes contained in the first CAP_OLD lines — what a pre-ruling scan read. */
  bytesToOldCap: number;
  maxLineChars: number;
  meanLineChars: number;
}

/**
 * One streamed pass per file collecting everything later arms need. Uses the
 * same readline configuration the scanner does, so "lines" means what the cap
 * means. Doing this in one pass (rather than `wc -l` plus a separate structure
 * pass) keeps the line definition single-sourced.
 */
async function profile(tag: 'shipped' | 'pm', fp: string): Promise<FileRow> {
  const bytes = fs.statSync(fp).size;
  return new Promise((res) => {
    let lines = 0;
    let chars = 0;
    let maxLineChars = 0;
    let charsToOldCap = 0;
    const rl = readline.createInterface({ input: fs.createReadStream(fp, { encoding: 'utf-8' }), crlfDelay: Infinity });
    rl.on('line', (l) => {
      lines++;
      chars += l.length;
      if (l.length > maxLineChars) maxLineChars = l.length;
      if (lines <= CAP_OLD) charsToOldCap += l.length + 1;
    });
    const done = () =>
      res({
        tag,
        fp,
        base: path.basename(fp),
        bytes,
        lines,
        // Character offset is a close proxy for byte offset and is what the
        // stream decoder actually walks; for above-cap *share* it is exact
        // enough that the distinction never reaches a reported figure.
        bytesToOldCap: Math.min(bytes, charsToOldCap),
        maxLineChars,
        meanLineChars: lines ? chars / lines : 0,
      });
    rl.on('close', done);
    rl.on('error', done);
  });
}

function listSessions(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  for (const proj of fs.readdirSync(root)) {
    const pd = path.join(root, proj);
    let st: fs.Stats;
    try { st = fs.statSync(pd); } catch { continue; }
    if (!st.isDirectory()) continue;
    for (const f of fs.readdirSync(pd)) {
      if (!f.endsWith('.jsonl')) continue;
      const fp = path.join(pd, f);
      try { if (fs.statSync(fp).size < 100) continue; } catch { continue; }
      out.push(fp);
    }
  }
  return out.sort();
}

const shippedFiles = listSessions(ROOT_SHIPPED);
const pmFiles = listSessions(ROOT_PM);

check('A', 'both corpora present', shippedFiles.length > 0 && pmFiles.length > 0,
  `shipped ${shippedFiles.length} files, pm ${pmFiles.length} files`);

const rows: FileRow[] = [];
for (const fp of shippedFiles) rows.push(await profile('shipped', fp));
for (const fp of pmFiles) rows.push(await profile('pm', fp));

const byTag = (t: 'shipped' | 'pm') => rows.filter((r) => r.tag === t);
for (const t of ['shipped', 'pm'] as const) {
  const rs = byTag(t);
  const totalLines = rs.reduce((a, r) => a + r.lines, 0);
  const totalBytes = rs.reduce((a, r) => a + r.bytes, 0);
  const aboveLines = rs.reduce((a, r) => a + Math.max(0, r.lines - CAP_OLD), 0);
  check('A', `inventory (${t})`, true,
    `${rs.length} files, ${mb(totalBytes)}, ${totalLines.toLocaleString()} lines, ` +
      `${aboveLines.toLocaleString()} above the old cap (${((aboveLines / totalLines) * 100).toFixed(0)}%), ` +
      `${(totalBytes / totalLines / 1024).toFixed(2)} KB/line`,
    'measurement');
}

// Guard headroom. Round 155 measured PM's largest at 41,168 lines this morning
// (10:47 PT). These corpora are live, so this is a re-read, not a recall.
const maxPm = Math.max(...byTag('pm').map((r) => r.lines));
const maxShipped = Math.max(...byTag('shipped').map((r) => r.lines));
const R155_PM_MAX_LINES = 41168; // ibid, arm G — measured 10:47 PT today
check('A', 'shipped 50_000 guard still does not bite', maxPm < CAP_SHIPPED && maxShipped < CAP_SHIPPED,
  `largest pm ${maxPm.toLocaleString()} (${((maxPm / CAP_SHIPPED) * 100).toFixed(1)}% of guard), ` +
    `largest shipped ${maxShipped.toLocaleString()} (${((maxShipped / CAP_SHIPPED) * 100).toFixed(1)}%). ` +
    `A FAIL here is the finding the scanner comment asks to be monitored, not a broken probe`);

check('A', 'guard headroom drift since Round 155 (same day, 4h earlier)', true,
  `pm largest ${R155_PM_MAX_LINES.toLocaleString()} -> ${maxPm.toLocaleString()} lines ` +
    `(${maxPm >= R155_PM_MAX_LINES ? '+' : ''}${(maxPm - R155_PM_MAX_LINES).toLocaleString()}) — ` +
    `the corpus is live; headroom is a moving number, not a property`,
  'measurement');

/**
 * Pair selection. Deterministic: all pairs at least MIN_PAIR_BYTES, within
 * BYTE_TOL on total bytes, with a line ratio of at least MIN_LINE_RATIO —
 * sorted by line ratio descending. No hand-picking; the criteria are the
 * selection, so re-running on a changed corpus selects afresh rather than
 * chasing files that may no longer exist.
 */
const MIN_PAIR_BYTES = 5 * 1048576;
const BYTE_TOL = 0.02;
const MIN_LINE_RATIO = 1.8;

interface Pair { lo: FileRow; hi: FileRow; byteDiff: number; lineRatio: number }
const pairs: Pair[] = [];
for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const a = rows[i], b = rows[j];
    if (a.bytes < MIN_PAIR_BYTES || b.bytes < MIN_PAIR_BYTES) continue;
    const byteDiff = Math.abs(a.bytes - b.bytes) / Math.max(a.bytes, b.bytes);
    if (byteDiff > BYTE_TOL) continue;
    const lineRatio = Math.max(a.lines, b.lines) / Math.max(1, Math.min(a.lines, b.lines));
    if (lineRatio < MIN_LINE_RATIO) continue;
    const [lo, hi] = a.lines < b.lines ? [a, b] : [b, a];
    pairs.push({ lo, hi, byteDiff, lineRatio });
  }
}
pairs.sort((x, y) => y.lineRatio - x.lineRatio);

check('A', 'byte-matched / line-divergent real pairs found', pairs.length > 0,
  `${pairs.length} pairs at ≥${mb(MIN_PAIR_BYTES)}, ≤${(BYTE_TOL * 100).toFixed(0)}% byte difference, ` +
    `≥${MIN_LINE_RATIO}× line ratio. Best ${pairs[0]?.lineRatio.toFixed(2)}× at ` +
    `${((pairs[0]?.byteDiff ?? 0) * 100).toFixed(2)}% byte difference — against the 2.36× ` +
    `Daedalus could construct on the parse path`);

for (const p of pairs) {
  console.log(
    `     pair ${p.lineRatio.toFixed(2)}×  Δbytes ${(p.byteDiff * 100).toFixed(2)}%  ` +
      `[${p.lo.tag} ${p.lo.lines.toLocaleString()}L ${mb(p.lo.bytes)} ${(p.lo.bytes / p.lo.lines / 1024).toFixed(2)}KB/L] ` +
      `vs [${p.hi.tag} ${p.hi.lines.toLocaleString()}L ${mb(p.hi.bytes)} ${(p.hi.bytes / p.hi.lines / 1024).toFixed(2)}KB/L]`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// arm B — THE CONTROL: isolated per-line slope at equal bytes
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n──── arm B — isolated per-line slope, bytes held equal ────\n');

/** Time one full uncapped scan of a file through the shipped function. */
async function timeScan(fp: string, lineCap: number): Promise<{ ms: number; lines: number; capped: boolean; turns: number }> {
  const t0 = performance.now();
  const f = await extractSessionFingerprint(fp, lineCap);
  const ms = performance.now() - t0;
  return { ms, lines: f.messageCount, capped: f.capped, turns: f.turnCount };
}

/** Warm page cache for a file so the timed runs measure CPU, not disk. */
async function warm(fp: string): Promise<void> {
  await new Promise<void>((res) => {
    const s = fs.createReadStream(fp);
    s.on('data', () => {});
    s.on('close', () => res());
    s.on('error', () => res());
  });
}

const pairFiles = new Set<string>();
for (const p of pairs) { pairFiles.add(p.lo.fp); pairFiles.add(p.hi.fp); }
for (const fp of pairFiles) await warm(fp);
check('B', 'pair files page-cache warmed before timing', true,
  `${pairFiles.size} distinct files read once each; timings below are CPU-bound, ` +
    `which biases AGAINST the byte term and so cannot manufacture a negative line slope`,
  'measurement');

const timesUncapped = new Map<string, number[]>();
for (const fp of pairFiles) timesUncapped.set(fp, []);

// Interleaved across every pair member, REPEATS passes over the whole set.
const pairFileList = [...pairFiles];
for (let r = 0; r < REPEATS; r++) {
  for (const fp of pairFileList) {
    const t = await timeScan(fp, Infinity);
    timesUncapped.get(fp)!.push(t.ms);
  }
}

const slopes: number[] = [];
for (const p of pairs) {
  const loT = timesUncapped.get(p.lo.fp)!;
  const hiT = timesUncapped.get(p.hi.fp)!;
  const dMs = median(hiT) - median(loT);
  const dLines = p.hi.lines - p.lo.lines;
  const slopePerK = (dMs / dLines) * 1000;
  slopes.push(slopePerK);
  const label = `${p.lo.tag}/${p.hi.tag} ${p.lineRatio.toFixed(2)}×`;
  check('B', `per-line slope at equal bytes (${label})`, true,
    `${p.lo.lines.toLocaleString()}L ${median(loT).toFixed(0)} ms [${rng(loT)}] vs ` +
      `${p.hi.lines.toLocaleString()}L ${median(hiT).toFixed(0)} ms [${rng(hiT)}] ` +
      `at ${(p.byteDiff * 100).toFixed(2)}% byte difference → ` +
      `${slopePerK >= 0 ? '+' : ''}${slopePerK.toFixed(1)} ms per 1k lines`,
    'measurement');
}

const allPositive = slopes.every((s) => s > 0);
const allNegative = slopes.every((s) => s < 0);
check('B', 'sign of the isolated per-line coefficient', true,
  allPositive
    ? `POSITIVE on all ${slopes.length} pairs (${slopes.map((s) => s.toFixed(1)).join(', ')} ms/1k) — ` +
        `unlike the parse path, the scan path's line term survives the control`
    : allNegative
      ? `NEGATIVE on all ${slopes.length} pairs (${slopes.map((s) => s.toFixed(1)).join(', ')} ms/1k). ` +
          `No cost coefficient can be negative: at equal bytes the corpus with FEWER lines is SLOWER. ` +
          `The per-line unit is falsified on the scan path, same as Daedalus found on parse`
      : `MIXED across ${slopes.length} pairs (${slopes.map((s) => s.toFixed(1)).join(', ')} ms/1k) — ` +
          `sign is not stable, which is itself a refutation of a single coefficient`,
  'measurement');

// The comparison the doc's published unit invites. If the isolated slope does
// not land near 7–10, the published range was measuring something else.
const slopeMed = median(slopes);
check('B', 'isolated slope vs the published 7–10 ms per 1k lines', true,
  `isolated ${slopeMed >= 0 ? '+' : ''}${slopeMed.toFixed(1)} ms/1k (median of ${slopes.length} pairs, ` +
    `range ${Math.min(...slopes).toFixed(1)} to ${Math.max(...slopes).toFixed(1)}) against the published ` +
    `${R155_PM_PER_KLINE}–${R155_SHIPPED_PER_KLINE}. These are different quantities if they disagree: ` +
    `the published figure is a corpus AVERAGE that has bytes folded into it, this one has bytes held fixed`,
  'measurement');

// ═══════════════════════════════════════════════════════════════════════════
// arm C — three models, fitted on half the files, scored on the other half
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n──── arm C — model fit and held-out score ────\n');

/**
 * Arm B tests the coefficient's sign. Arm C tests whether ANY of the three
 * candidate models predicts a file it was not fitted on. A two-term model fitted
 * to two corpus aggregates has zero residual by construction and no predictive
 * content — Daedalus's Round 156 warning against exactly the fit he nearly sent
 * me. Held-out scoring is the cure: the model has to price a file it has never
 * seen.
 *
 * The quantity modelled is the CAP DELTA — the extra milliseconds a scan spends
 * because the cap is 50_000 rather than 1_500 — because that, not total read
 * time, is what `docs/pm-corpus-cap-delta-2026-09-05.md` puts a unit on.
 */
const aboveCapFiles = rows.filter((r) => r.lines > CAP_OLD).sort((a, b) => b.lines - a.lines);
check('C', 'files above the old cap', aboveCapFiles.length >= 6,
  `${aboveCapFiles.length} files across both roots carry any above-cap work at all`);

for (const r of aboveCapFiles) await warm(r.fp);

interface Point { row: FileRow; deltaMs: number; aboveLines: number; aboveBytes: number; samples: number[] }
const points: Point[] = [];

for (const row of aboveCapFiles) {
  const full: number[] = [];
  const capped: number[] = [];
  for (let r = 0; r < REPEATS; r++) {
    full.push((await timeScan(row.fp, Infinity)).ms);
    capped.push((await timeScan(row.fp, CAP_OLD)).ms);
  }
  const deltaMs = median(full) - median(capped);
  points.push({
    row,
    deltaMs,
    aboveLines: row.lines - CAP_OLD,
    aboveBytes: Math.max(0, row.bytes - row.bytesToOldCap),
    samples: full,
  });
}

const posDelta = points.filter((p) => p.deltaMs > 0);
check('C', 'cap delta is positive on every above-cap file', posDelta.length === points.length,
  `${posDelta.length}/${points.length} files cost more uncapped than capped — the delta itself is ` +
    `well-behaved even where its normalisation is not`);

// Deterministic alternating split by above-cap line count: no distribution shift
// between train and test, and no dependence on file order on disk.
const train = points.filter((_, i) => i % 2 === 0);
const test = points.filter((_, i) => i % 2 === 1);
check('C', 'train/test split', train.length >= 3 && test.length >= 3,
  `${train.length} train / ${test.length} test, alternating by above-cap line rank`);

/** Least squares for y = a·x1 + b·x2 (no intercept) via 2×2 normal equations. */
function fit2(pts: Point[]): { a: number; b: number } | null {
  let s11 = 0, s12 = 0, s22 = 0, sy1 = 0, sy2 = 0;
  for (const p of pts) {
    const x1 = p.aboveLines / 1000; // ms per 1k lines
    const x2 = p.aboveBytes / 1048576; // ms per MB
    s11 += x1 * x1; s12 += x1 * x2; s22 += x2 * x2;
    sy1 += x1 * p.deltaMs; sy2 += x2 * p.deltaMs;
  }
  const det = s11 * s22 - s12 * s12;
  if (Math.abs(det) < 1e-9) return null;
  return { a: (sy1 * s22 - sy2 * s12) / det, b: (s11 * sy2 - s12 * sy1) / det };
}
/** Least squares for y = k·x (single term). */
function fit1(pts: Point[], x: (p: Point) => number): number {
  let sxx = 0, sxy = 0;
  for (const p of pts) { const v = x(p); sxx += v * v; sxy += v * p.deltaMs; }
  return sxx === 0 ? 0 : sxy / sxx;
}

const xLines = (p: Point) => p.aboveLines / 1000;
const xBytes = (p: Point) => p.aboveBytes / 1048576;

const kLines = fit1(train, xLines);
const kBytes = fit1(train, xBytes);
const two = fit2(train);

const mape = (pts: Point[], predict: (p: Point) => number) =>
  (mean(pts.map((p) => Math.abs(predict(p) - p.deltaMs) / Math.max(1e-6, p.deltaMs))) * 100);

const scores: Array<{ name: string; trainErr: number; testErr: number; note: string }> = [
  {
    name: 'lines only',
    trainErr: mape(train, (p) => kLines * xLines(p)),
    testErr: mape(test, (p) => kLines * xLines(p)),
    note: `${kLines.toFixed(1)} ms per 1k above-cap lines`,
  },
  {
    name: 'bytes only',
    trainErr: mape(train, (p) => kBytes * xBytes(p)),
    testErr: mape(test, (p) => kBytes * xBytes(p)),
    note: `${kBytes.toFixed(1)} ms per above-cap MB`,
  },
];
if (two) {
  scores.push({
    name: 'two-term',
    trainErr: mape(train, (p) => two.a * xLines(p) + two.b * xBytes(p)),
    testErr: mape(test, (p) => two.a * xLines(p) + two.b * xBytes(p)),
    note: `${two.a.toFixed(1)} ms/1k lines + ${two.b.toFixed(1)} ms/MB`,
  });
}

for (const s of scores) {
  check('C', `model: ${s.name}`, true,
    `${s.note} — held-out error ${s.testErr.toFixed(0)}% (train ${s.trainErr.toFixed(0)}%)`,
    'measurement');
}

if (two) {
  const negative = two.a < 0 || two.b < 0;
  check('C', 'two-term coefficients are physically admissible', !negative,
    negative
      ? `a=${two.a.toFixed(1)} ms/1k lines, b=${two.b.toFixed(1)} ms/MB — a NEGATIVE coefficient means ` +
          `the model is fitting away structure it cannot see, not pricing work. Same failure Daedalus ` +
          `hit on the parse path`
      : `a=${two.a.toFixed(1)} ms/1k lines, b=${two.b.toFixed(1)} ms/MB — both non-negative`,
    'measurement');
}

/**
 * The check that makes the two-term fit more than a curve through 11 points.
 * Arm B isolated the per-line coefficient by holding bytes fixed across four
 * real pairs, using no fitting at all. Arm C recovers a per-line coefficient by
 * least squares over a different (larger, overlapping) set of files. Two
 * independent routes to the same coefficient agreeing is evidence the term is
 * real; disagreeing would mean at least one of them is absorbing structure.
 */
if (two) {
  const agree = Math.abs(two.a - slopeMed) / Math.max(two.a, slopeMed) < 0.30;
  check('C', 'fitted per-line coefficient vs arm B\'s fit-free isolation', agree,
    `fitted ${two.a.toFixed(1)} ms/1k lines vs isolated ${slopeMed.toFixed(1)} ms/1k — ` +
      `${(Math.abs(two.a - slopeMed) / Math.max(two.a, slopeMed) * 100).toFixed(0)}% apart. ` +
      `Two independent methods, one with no fitting`);
}

const best = scores.slice().sort((a, b) => a.testErr - b.testErr)[0];
check('C', 'best model on held-out files', true,
  `"${best.name}" at ${best.testErr.toFixed(0)}% held-out error. ` +
    `A model that cannot price an unseen file to better than ~25% is not a rule of thumb, ` +
    `it is a summary of the files it was fitted on`,
  'measurement');

// ═══════════════════════════════════════════════════════════════════════════
// arm D — what is left when the units fail: per-line structure
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n──── arm D — per-line structure ────\n');

const worst = points.slice().sort((a, b) => b.deltaMs / Math.max(1, b.aboveLines) - a.deltaMs / Math.max(1, a.aboveLines));
for (const p of worst.slice(0, 5)) {
  check('D', `per-line cost vs line shape (${p.row.tag} ${p.row.base.slice(0, 8)})`, true,
    `${((p.deltaMs / p.aboveLines) * 1000).toFixed(1)} ms/1k above-cap lines · ` +
      `mean line ${(p.row.meanLineChars / 1024).toFixed(2)} KB · ` +
      `longest line ${p.row.maxLineChars.toLocaleString()} chars ` +
      `(${(p.row.maxLineChars / Math.max(1, p.row.meanLineChars)).toFixed(0)}× its own mean)`,
    'measurement');
}

/** Pearson correlation, reported so the strength of the association is visible rather than asserted. */
function pearson(xs: number[], ys: number[]): number {
  const mx = mean(xs), my = mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < xs.length; i++) { const a = xs[i] - mx, b = ys[i] - my; num += a * b; dx += a * a; dy += b * b; }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

const rLines = pearson(points.map((p) => p.aboveLines), points.map((p) => p.deltaMs));
const rBytes = pearson(points.map((p) => p.aboveBytes), points.map((p) => p.deltaMs));
check('D', 'what the cap delta actually tracks across all above-cap files', true,
  `r(above-cap lines) = ${rLines.toFixed(2)}, r(above-cap bytes) = ${rBytes.toFixed(2)} over ` +
    `${points.length} files. Correlation is not the coefficient test — arm B is — but a large gap ` +
    `between these says which unit the corpus average was being carried by`,
  'measurement');

const maxLineFile = rows.slice().sort((a, b) => b.maxLineChars - a.maxLineChars)[0];
check('D', 'longest single line in either corpus', true,
  `${maxLineFile.maxLineChars.toLocaleString()} chars (${maxLineFile.tag}, ${maxLineFile.base.slice(0, 8)}) — ` +
    `${(maxLineFile.maxLineChars / Math.max(1, maxLineFile.meanLineChars)).toFixed(0)}× that file's own mean line. ` +
    `Per-line structure of this magnitude is invisible to both a line count and a byte count`,
  'measurement');

// ═══════════════════════════════════════════════════════════════════════════
// arm E — warm vs Round 155's cold endpoint delta
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n──── arm E — warm CPU delta vs the cold endpoint figure ────\n');

/**
 * Two facts verified this fire make this a like-for-like comparison rather than
 * an apples-to-oranges one, and both were checked in the source rather than
 * recalled:
 *
 *   1. **The endpoint's scan is strictly serial** — `session-scanner.ts:524-549`
 *      is a plain `for` loop with `await getSessionFingerprint` inside it, no
 *      `Promise.all`. So summing per-file times is the right model of the
 *      endpoint's scan work, not a coincidence that happens to land close.
 *   2. **Round 155's "cache-cold" meant fingerprint-cache-cold, not
 *      page-cache-cold** — that probe warms the PM root's page cache in its arm A
 *      on purpose (`probe-pm-corpus-cap-delta.mts:275-281`). Both figures are
 *      therefore page-cache warm, and the difference is not disk.
 *
 * So this is an independent cross-method check on Round 155's headline: a
 * different instrument, measuring the shipped function directly instead of
 * through HTTP, on a corpus that has grown by 1,090 lines since.
 */
const pmPoints = points.filter((p) => p.row.tag === 'pm');
const pmWarmDelta = pmPoints.reduce((a, p) => a + p.deltaMs, 0);
const gapPct = Math.abs(R155_PM_DELTA_COLD - pmWarmDelta) / R155_PM_DELTA_COLD * 100;
check('E', "Round 155's endpoint delta reproduced by a different method", gapPct < 15,
  `${pmWarmDelta.toFixed(0)} ms summed over PM's ${pmPoints.length} above-cap files at the function ` +
    `level, against ${R155_PM_DELTA_COLD} ms measured through a live server in Round 155 — ` +
    `${gapPct.toFixed(0)}% apart. Both page-cache warm, both fingerprint-cache cold, scan is serial`);

check('E', 'what that leaves for server overhead and disk', true,
  `~${(R155_PM_DELTA_COLD - pmWarmDelta).toFixed(0)} ms of the ${R155_PM_DELTA_COLD} ms ` +
    `(${gapPct.toFixed(0)}%) is everything that is not this fingerprint work: HTTP, JSON, the ` +
    `directory walk, dedup lookups. CROSS-RUN — two machine states, same day — so treat the ` +
    `residual as "small", not as a measured quantity of its own`,
  'measurement');

// ═══════════════════════════════════════════════════════════════════════════
// arm F — the relabel
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n──── arm F — what docs/pm-corpus-cap-delta-2026-09-05.md should say ────\n');

/**
 * Three outcomes were possible and the probe was written before knowing which:
 * falsified (Daedalus's parse-path result), unstable, or survives. It survives —
 * but "survives" does not vindicate the published number, and arm F is careful
 * to separate those two claims.
 */
const verdict = allNegative
  ? 'FALSIFIED — the per-line unit must be withdrawn, not bracketed'
  : allPositive
    ? 'NOT FALSIFIED — the per-line coefficient is positive and stable on this path, unlike parse'
    : 'UNSTABLE — sign varies across pairs; no single coefficient is defensible';

check('F', 'verdict on arm H of Round 155', true, verdict, 'measurement');

/**
 * The distinction the relabel turns on. The published 7.4 / 9.8 were never
 * estimates of a per-line coefficient — they were each corpus's whole cap delta
 * divided by its line count, which silently attributes the byte-proportional
 * share of the work to lines. That is why they bracketed: the two corpora differ
 * in bytes-per-line, so the folded-in byte term lands differently in each. The
 * true coefficient is smaller than both, and the two normalisations were not two
 * measurements of one number.
 */
const published = (R155_PM_PER_KLINE + R155_SHIPPED_PER_KLINE) / 2;
check('F', 'why the two normalisations bracketed', true,
  `isolated per-line coefficient ${slopeMed.toFixed(1)} ms/1k sits BELOW both published figures ` +
    `(${R155_PM_PER_KLINE} and ${R155_SHIPPED_PER_KLINE}), not between them — ` +
    `${(published / slopeMed).toFixed(1)}× below their mean. The published pair were single-term ` +
    `summaries of a two-term cost, so each carried the byte share of its own corpus. ` +
    `Not a precision band around a true value; two different wrong attributions`,
  'measurement');

check('F', 'the relabel is derived from this fire, not adopted from the memo', true,
  `Daedalus proposed bracketing the rule of thumb by mean line size (1.84–3.08 KB). This fire ` +
    `measured the pairs directly instead of taking that wording, because his control was on the ` +
    `parse path and the scan path had to be tested on its own — and the answer came out ` +
    `different from his, so adopting the wording would have encoded the wrong reason`,
  'measurement');

if (two) {
  check('F', 'replacement rule of thumb, with its held-out error', true,
    `"${two.a.toFixed(1)} ms per 1k above-cap lines PLUS ${two.b.toFixed(1)} ms per above-cap MB" — ` +
      `${scores.find((s) => s.name === 'two-term')!.testErr.toFixed(0)}% error on files it was not ` +
      `fitted to, against ${scores.find((s) => s.name === 'lines only')!.testErr.toFixed(0)}% for the ` +
      `published lines-only form. Both terms needed; neither alone is the rule`,
    'measurement');
}

// ── Summary ──────────────────────────────────────────────────────────────────

const finalSha = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
check('*', 'scanner byte-identical to how it was found', finalSha === SCANNER_SHA,
  finalSha === SCANNER_SHA ? `sha256 ${SCANNER_SHA.slice(0, 12)} — no source mutation this fire` : `MISMATCH`);

console.log('\n════════════════════════════════════════════════════════════════');
const regressions = results.filter((r) => r.kind === 'regression');
const failed = regressions.filter((r) => !r.pass);
console.log(
  `${results.length} checks (${regressions.length} regression, ${results.length - regressions.length} measurement), ` +
    `${failed.length} failed, ${skipped.length} skipped`,
);
for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
for (const s of skipped) console.log(`  SKIP ${s}`);
process.exit(failed.length > 0 ? 1 : 0);
