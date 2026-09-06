/**
 * Round 158 — was Round 156's negative per-line slope an ENCODING confound?
 *
 * WHY THIS PROBE EXISTS.
 *
 * Round 156 (`probe-parse-stage-allocation.mts`, arm D) reported that at equal
 * bytes the corpus with FEWER lines was SLOWER, giving a per-line coefficient of
 * -3.6 to -4.2 ms per 1k lines, and concluded from the impossible sign that the
 * `cost = a*lines + b*bytes` model was FALSIFIED on the parse path. That
 * conclusion went to Theseus and to the team.
 *
 * The same fire, arm G, established that the two payloads in that comparison
 * differ in a THIRD property: the real corpus contains characters above U+00FF,
 * so V8 stores its content string at two bytes per char, while the pure-ASCII
 * synthetic is stored at one. That alone moved the memory floor by +35.5 MB on a
 * 35.4 MB payload.
 *
 * Round 156 therefore published a "byte-matched control" whose pair was NOT
 * matched on the property Round 156 itself had just identified as dominant. The
 * slope's sign is exactly what an unmodelled positive term on the real side
 * would produce. Theseus named the general shape of this in his 9/5 reply
 * ("you controlled for bytes exactly and the property that mattered wasn't one
 * you were looking at") without noticing it also applies to the arm-D slope; I
 * did not notice either. This probe checks it.
 *
 * THE FIX IS A BETTER CONTROL, NOT AN ADJUSTMENT.
 *
 * Round 156 already built the payload that repairs the pair: the synthetic with
 * three ASCII bytes overwritten by the three UTF-8 bytes of `…`. It is the same
 * byte count and the same line count as the plain synthetic, and it is stored
 * two-bytes-per-char like the real corpus. So:
 *
 *   REAL      lines_R   bytes_B   two-byte string
 *   SYNTH     lines_S   bytes_B   one-byte string
 *   WIDE      lines_S   bytes_B   two-byte string     <- the correct partner
 *
 * `(ms(WIDE) - ms(REAL)) / (lines_S - lines_R)` isolates the per-line term with
 * bytes AND representation both held equal. That is the experiment arm D should
 * have run. Round 156 built the payload and used it only for memory.
 *
 * ARMS
 *   Z  calibration + payload construction, all byte counts and wide counts read
 *      back from disk rather than assumed
 *   B  the encoding term in TIME: SYNTH vs WIDE, identical but for one char
 *   C  the repaired slope: REAL vs WIDE, and the Round 156 slope re-measured
 *      beside it so the correction is visible rather than asserted
 *   E  is one wide char the same as many? A fourth payload at the real corpus's
 *      own wide-char COUNT, same bytes, same lines. Separates V8's binary
 *      representation flip from UTF-8 decode density. Without this, arm C has an
 *      open confound of its own.
 *   H  Theseus's optional handback: a two-term model FITTED on one set of real
 *      sessions and SCORED on a disjoint set it never saw, against lines-only
 *      and bytes-only. Distinguishes "the model is wrong" from "the model was
 *      fitted wrong" on the parse path.
 *
 * A FAILING CHECK IN ARM C IS A REPORTABLE OUTCOME, as in Round 156 — but the
 * polarity is now the other way round: arm C's check fails if the repaired slope
 * is STILL negative, which would mean the encoding confound does not explain
 * Round 156 and the falsification stands. Either way the probe reports which.
 *
 * NOT MUTATED: `packages/` is never written. `klatch.db` is never opened. Real
 * session files are read in place and never copied or modified.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'parse-encoding-confound');
const REAL_DB = path.join(REPO, 'klatch.db');
const PARSER_TS = path.join(REPO, 'packages/server/src/import/parser.ts');

// ─────────────────────────────────────────────────────────────────────────────
// CHILD MODE
// ─────────────────────────────────────────────────────────────────────────────

const stageArg = process.argv.find((a) => a.startsWith('--stage='));

if (stageArg) {
  const stage = stageArg.slice('--stage='.length);
  const fileArg = process.argv.find((a) => a.startsWith('--file='));
  const file = fileArg ? fileArg.slice('--file='.length) : '';
  const baselineRaw = process.resourceUsage().maxRSS;
  let sink: unknown;
  const hold: unknown[] = [];
  let extra: unknown = undefined;
  const t0 = performance.now();

  if (stage === 'full') {
    // Exactly Round 156's `full` stage, unmodified: what the import route calls.
    const { parseClaudeCodeSessionFromContent } = await import(PARSER_TS);
    const content = fs.readFileSync(file, 'utf-8');
    const session = parseClaudeCodeSessionFromContent(content);
    hold.push(content, session);
    sink = `${session.turns.length} turns / ${session.eventCount} events`;
  } else if (stage === 'shape') {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    let maxLine = 0;
    for (const l of lines) if (l.length > maxLine) maxLine = l.length;
    let wide = 0;
    for (let i = 0; i < content.length; i++) if (content.charCodeAt(i) > 0xff) wide++;
    sink = JSON.stringify({
      bytes: fs.statSync(file).size, chars: content.length,
      lines: lines.length, maxLine, wide,
    });
  } else if (stage === 'batch') {
    /**
     * Arm H runs in ONE child, not one child per file, and this is a deliberate
     * deviation from the one-stage-one-process rule the memory arms need.
     *
     * Reason: arm H measures TIME ONLY — no maxRSS figure is taken from it — and
     * a per-file child would pay tsx's compile cost 40+ times for a measurement
     * that is about relative predictive error between three models on the SAME
     * timings. A shared process is also the closer model of a live server, which
     * has parsed before.
     *
     * Guards against the obvious objections, since a shared process is the
     * weaker instrument: a warm-up parse before any timing is recorded; TWO
     * passes in OPPOSITE file order so JIT warm-up and any monotonic drift do
     * not align with the file list; per-file MIN of the two passes.
     */
    const { parseClaudeCodeSessionFromContent } = await import(PARSER_TS);
    const files: string[] = JSON.parse(process.argv.find((a) => a.startsWith('--files='))!.slice('--files='.length));
    const warm = fs.readFileSync(files[0], 'utf-8');
    parseClaudeCodeSessionFromContent(warm);

    const timings = new Map<string, number[]>();
    for (const pass of [files, [...files].reverse()]) {
      for (const f of pass) {
        const content = fs.readFileSync(f, 'utf-8');
        const t = performance.now();
        const s = parseClaudeCodeSessionFromContent(content);
        const ms = performance.now() - t;
        if (s.turns.length < 0) throw new Error('unreachable');
        if (!timings.has(f)) timings.set(f, []);
        timings.get(f)!.push(ms);
      }
    }
    extra = files.map((f) => {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0).length;
      let wide = 0;
      for (let i = 0; i < content.length; i++) if (content.charCodeAt(i) > 0xff) { wide = 1; break; }
      return {
        f, ms: Math.min(...timings.get(f)!), passes: timings.get(f)!,
        bytes: fs.statSync(f).size, chars: content.length, lines, wide,
      };
    });
    sink = `${files.length} files timed twice`;
  } else {
    throw new Error(`unknown stage ${stage}`);
  }

  const ms = performance.now() - t0;
  const peakRaw = process.resourceUsage().maxRSS;
  const held = hold.length;
  /**
   * Bulk results go through a FILE, not stdout, and only a path travels on the
   * pipe. Arm H's payload silently truncated at exactly 65536 bytes on the
   * first two runs of this probe — `process.stdout.write` because `exit()`
   * discards the unflushed tail, and then `fs.writeSync(1, …)` because a
   * non-blocking pipe accepts a partial write and reports it in a return value
   * this code was ignoring. The parent died on unterminated JSON both times,
   * which is the good failure. A truncation that still parsed would have put a
   * silently shortened file list into a held-out fit.
   */
  const payload = JSON.stringify({
    stage, ms, baselineRaw, peakRaw, held, sink: String(sink).slice(0, 200), extra,
  });
  const outArg = process.argv.find((a) => a.startsWith('--out='));
  if (outArg) {
    fs.writeFileSync(outArg.slice('--out='.length), payload);
    fs.writeSync(1, JSON.stringify({ stage, ms, viaFile: true }) + '\n');
  } else {
    fs.writeSync(1, payload + '\n');
  }
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// PARENT MODE
// ─────────────────────────────────────────────────────────────────────────────

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  console.log(`${pass ? 'PASS' : kind === 'measurement' ? 'NOTE' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}
const skipped: string[] = [];
function skip(arm: string, why: string) {
  skipped.push(`[${arm}] ${why}`);
  console.log(`SKIP [${arm}] ${why}`);
}

const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
const msf = (n: number) => `${n.toFixed(0)} ms`;
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

const realDbBefore = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;
const parserSrcBefore = fs.readFileSync(PARSER_TS, 'utf8');

fs.mkdirSync(SCRATCH, { recursive: true });

type StageResult = { stage: string; ms: number; baselineRaw: number; peakRaw: number; held: number; sink: string; extra?: unknown };
function runStage(stage: string, args: string[], viaFile = false): StageResult {
  const out = path.join(SCRATCH, `stage-${stage}.json`);
  if (viaFile && fs.existsSync(out)) fs.unlinkSync(out);
  const raw = execFileSync('npx', ['tsx', import.meta.filename, `--stage=${stage}`, ...args,
    ...(viaFile ? [`--out=${out}`] : [])], {
    cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  // Exactly one child run per call, either way — the file is written BY that
  // run, not by a second one.
  return viaFile
    ? JSON.parse(fs.readFileSync(out, 'utf8'))
    : JSON.parse(raw.trim().split('\n').pop()!);
}

console.log('\n── arm Z: payloads ──────────────────────────────────────────────');

/** Every `.jsonl` under ~/.claude/projects, read in place, never copied. */
function corpus(): Array<{ p: string; size: number }> {
  const root = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(root)) return [];
  const all: Array<{ p: string; size: number }> = [];
  for (const d of fs.readdirSync(root)) {
    const dir = path.join(root, d);
    let st: fs.Stats;
    try { st = fs.statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const p = path.join(dir, f);
      try { all.push({ p, size: fs.statSync(p).size }); } catch { /* vanished */ }
    }
  }
  return all;
}

const CAP_BYTES = 50 * 1024 * 1024;
const ALL = corpus();
const underCap = ALL.filter((f) => f.size <= CAP_BYTES).sort((a, b) => b.size - a.size);

if (underCap.length === 0) {
  skip('B..H', 'no real session corpus at ~/.claude/projects — every arm here needs one');
  finish();
}

/**
 * The SAME payload Round 156 used: largest real session under the import cap.
 * Selecting by the same criterion is what makes the two rounds comparable; if
 * the corpus has grown and a different file now wins, the check below says so
 * rather than silently comparing two different experiments.
 */
const REAL_FILE = underCap[0].p;
const MATCH_BYTES = underCap[0].size;
check('Z', 'real payload selected by Round 156\'s own criterion',
  MATCH_BYTES > 8 * 1024 * 1024 && MATCH_BYTES <= CAP_BYTES,
  `${mb(MATCH_BYTES)}, largest of ${ALL.length} sessions under the ${mb(CAP_BYTES)} cap — `
  + `Round 156 measured 35.4 MB / 37,117,377 B; this run has ${MATCH_BYTES} B`);

/** Round 156's synthetic, reproduced byte-identically by the same construction. */
const SYNTH_FILE = path.join(SCRATCH, 'synthetic.jsonl');
{
  const line = JSON.stringify({
    type: 'user',
    uuid: '00000000-0000-4000-8000-000000000000',
    timestamp: '2026-09-05T00:00:00.000Z',
    message: { role: 'user', content: 'synthetic padding for an allocation measurement. '.repeat(20) },
  }) + '\n';
  const fd = fs.openSync(SYNTH_FILE, 'w');
  let written = 0;
  const chunk = line.repeat(64);
  while (written + chunk.length <= MATCH_BYTES) written += fs.writeSync(fd, chunk);
  while (written + line.length <= MATCH_BYTES) written += fs.writeSync(fd, line);
  const remainder = MATCH_BYTES - written;
  if (remainder > 0) fs.writeSync(fd, ' '.repeat(remainder - 1) + '\n');
  fs.closeSync(fd);
}

/** Round 156's arm-G payload: same bytes, same lines, ONE char above U+00FF. */
const WIDE1_FILE = path.join(SCRATCH, 'wide-one.jsonl');
{
  const buf = fs.readFileSync(SYNTH_FILE);
  const at = buf.indexOf('pad');
  if (at === -1) throw new Error('probe bug: marker not found in the synthetic payload');
  Buffer.from('…', 'utf-8').copy(buf, at);
  fs.writeFileSync(WIDE1_FILE, buf);
}

const shapeReal = JSON.parse(runStage('shape', [`--file=${REAL_FILE}`]).sink);
const shapeSynth = JSON.parse(runStage('shape', [`--file=${SYNTH_FILE}`]).sink);
const shapeWide1 = JSON.parse(runStage('shape', [`--file=${WIDE1_FILE}`]).sink);

/**
 * Arm E's payload: the same synthetic with as many `pad` markers replaced by `…`
 * as the real corpus has wide characters. Byte count is preserved exactly (3
 * ASCII bytes out, 3 UTF-8 bytes in) and LINE count is preserved (no newline is
 * touched); only the char count falls, by 2 per replacement. If arm E measures
 * the same cost as arm B, V8's representation flip is the whole story and one
 * wide char is as expensive as a million. If arm E costs more, decode density is
 * a separate term and arm C's pair is matched on representation but not on that.
 */
const WIDEN_FILE = path.join(SCRATCH, 'wide-many.jsonl');
let widenReplacements = 0;
{
  const buf = fs.readFileSync(SYNTH_FILE);
  const ell = Buffer.from('…', 'utf-8');
  const want = shapeReal.wide as number;
  let at = 0;
  while (widenReplacements < want) {
    at = buf.indexOf('pad', at);
    if (at === -1) break;
    ell.copy(buf, at);
    at += 3;
    widenReplacements++;
  }
  fs.writeFileSync(WIDEN_FILE, buf);
}
const shapeWiden = JSON.parse(runStage('shape', [`--file=${WIDEN_FILE}`]).sink);

check('Z', 'all four payloads are byte-identical in size',
  fs.statSync(SYNTH_FILE).size === MATCH_BYTES
  && fs.statSync(WIDE1_FILE).size === MATCH_BYTES
  && fs.statSync(WIDEN_FILE).size === MATCH_BYTES,
  `${MATCH_BYTES} B each — real, synthetic, wide-one, wide-many`);

check('Z', 'the synthetic is pure Latin-1 and the two wide payloads are not',
  shapeSynth.wide === 0 && shapeWide1.wide === 1 && shapeWiden.wide > 1,
  `wide chars: real ${shapeReal.wide}, synthetic ${shapeSynth.wide}, `
  + `wide-one ${shapeWide1.wide}, wide-many ${shapeWiden.wide} `
  + `(${widenReplacements} replacements requested to match the real corpus)`);

check('Z', 'the wide payloads keep the synthetic\'s LINE count',
  shapeWide1.lines === shapeSynth.lines && shapeWiden.lines === shapeSynth.lines,
  `${shapeSynth.lines} lines in all three synthetics vs ${shapeReal.lines} in the real corpus — `
  + `dLines = ${shapeSynth.lines - shapeReal.lines}`,
  'regression');

check('Z', 'wide-many shortens chars but not bytes, and by how much',
  true,
  `chars: synthetic ${shapeSynth.chars}, wide-many ${shapeWiden.chars} `
  + `(${(((shapeSynth.chars - shapeWiden.chars) / shapeSynth.chars) * 100).toFixed(2)}% fewer, `
  + `2 per replacement, bytes unchanged)`,
  'measurement');

check('Z', 'line shape of the two corpora, for interpreting any slope',
  true,
  `real ${(shapeReal.bytes / shapeReal.lines).toFixed(0)} B/line, longest ${shapeReal.maxLine} chars; `
  + `synthetic ${(shapeSynth.bytes / shapeSynth.lines).toFixed(0)} B/line, longest ${shapeSynth.maxLine}`,
  'measurement');

// ── arms B / C / E — timed, repeated, interleaved ────────────────────────────

console.log('\n── arms B/C/E: timing, 3 repeats, interleaved ───────────────────');

/**
 * Interleaved rather than blocked: all four payloads once, then all four again.
 * A blocked order (three runs of REAL, then three of SYNTH) would let any
 * machine-level drift over the run masquerade as a payload difference — which is
 * precisely the failure mode being investigated.
 */
const REPEATS = 3;
const timings: Record<string, number[]> = { real: [], synth: [], wide1: [], widen: [] };
for (let i = 0; i < REPEATS; i++) {
  timings.real.push(runStage('full', [`--file=${REAL_FILE}`]).ms);
  timings.synth.push(runStage('full', [`--file=${SYNTH_FILE}`]).ms);
  timings.wide1.push(runStage('full', [`--file=${WIDE1_FILE}`]).ms);
  timings.widen.push(runStage('full', [`--file=${WIDEN_FILE}`]).ms);
}

for (const k of ['real', 'synth', 'wide1', 'widen'] as const) {
  const t = timings[k];
  const spread = ((Math.max(...t) - Math.min(...t)) / mean(t)) * 100;
  check('B', `${k}: full parse, ${REPEATS} runs`, true,
    `${t.map((x) => x.toFixed(0)).join(' / ')} ms — mean ${msf(mean(t))}, spread ${spread.toFixed(1)}%`,
    'measurement');
}

/** Arm B — the encoding term in time. Same bytes, same lines, one char apart. */
const encodingMs = mean(timings.wide1) - mean(timings.synth);
const encodingPct = (encodingMs / mean(timings.synth)) * 100;
check('B', 'the one-character encoding term, in TIME',
  true,
  `wide-one ${msf(mean(timings.wide1))} vs synthetic ${msf(mean(timings.synth))} = `
  + `${encodingMs >= 0 ? '+' : ''}${encodingMs.toFixed(0)} ms (${encodingPct.toFixed(1)}%) for ONE character — `
  + `Round 156 measured the same edit as +35.5 MB of memory but never timed it`,
  'measurement');

/** Arm E — is a million wide chars worse than one? */
const densityMs = mean(timings.widen) - mean(timings.wide1);
check('E', 'does wide-char DENSITY cost anything beyond the representation flip?',
  true,
  `wide-many (${shapeWiden.wide} wide chars) ${msf(mean(timings.widen))} vs `
  + `wide-one (1 wide char) ${msf(mean(timings.wide1))} = ${densityMs >= 0 ? '+' : ''}${densityMs.toFixed(0)} ms `
  + `(${((densityMs / mean(timings.wide1)) * 100).toFixed(1)}%) — `
  + `if this is small beside the arm-B term, the flip is the whole story and arm C's pair is matched`,
  'measurement');

const dLines = shapeSynth.lines - shapeReal.lines;

/** Round 156's slope, re-measured here so the correction is visible not asserted. */
const r156Ms = mean(timings.synth) - mean(timings.real);
const r156Slope = (r156Ms / dLines) * 1000;
check('C', 'Round 156\'s slope, re-measured on this run\'s payloads',
  true,
  `REAL vs SYNTHETIC: dMs ${r156Ms.toFixed(0)}, dLines ${dLines} → `
  + `${r156Slope.toFixed(2)} ms per 1k lines — Round 156 published -3.6 to -4.2`,
  'measurement');

/**
 * Arm C — the repaired control. REAL vs WIDE-ONE: bytes equal, V8 string
 * representation equal, lines differ. Under `cost = a*lines + b*bytes + c*wide`
 * both the byte term and the representation term cancel, so dMs/dLines is `a`.
 */
const repairedMs = mean(timings.wide1) - mean(timings.real);
const repairedSlope = (repairedMs / dLines) * 1000;

/** The same, against wide-many — matched on density too, if arm E says it matters. */
const repairedNMs = mean(timings.widen) - mean(timings.real);
const repairedNSlope = (repairedNMs / dLines) * 1000;

check('C', 'REPAIRED slope: bytes AND representation held equal [a FAIL here IS the Round 158 result]',
  repairedSlope > 0,
  `REAL vs WIDE-ONE: dMs ${repairedMs.toFixed(0)}, dLines ${dLines} → `
  + `${repairedSlope.toFixed(2)} ms per 1k lines — `
  + (repairedSlope > 0
    ? 'POSITIVE. Round 156\'s negative sign was the unmodelled representation term, not a falsification: '
      + 'the lines+bytes model is underspecified on the parse path, not wrong'
    : 'STILL NEGATIVE. The encoding confound does not explain Round 156 and the falsification stands'));

check('C', 'the same repair against the density-matched payload',
  true,
  `REAL vs WIDE-MANY: dMs ${repairedNMs.toFixed(0)}, dLines ${dLines} → `
  + `${repairedNSlope.toFixed(2)} ms per 1k lines`,
  'measurement');

/**
 * Per-run rather than mean-of-means, because a sign that only survives in the
 * average is not a result. Round 156's slope was negative in all four of its
 * runs; the repaired slope has to clear the same bar.
 */
const perRun = timings.real.map((_, i) => ((timings.wide1[i] - timings.real[i]) / dLines) * 1000);
check('C', 'the repaired slope\'s sign holds run by run [a FAIL here IS the Round 158 result]',
  perRun.every((s) => s > 0),
  `per-run slopes: ${perRun.map((s) => s.toFixed(2)).join(' / ')} ms per 1k lines — `
  + `${perRun.filter((s) => s > 0).length}/${perRun.length} positive`);

// ── arm H — Theseus's optional handback: a HELD-OUT score on the parse path ──

console.log('\n── arm H: held-out two-term score on real sessions ──────────────');

/**
 * Theseus's point, taken as asked: my negative slope falsified the two-term
 * model via a controlled pair, but the route he actually used on the scan path —
 * FIT on some files, SCORE on files the fit never saw — is a different question,
 * and it is the one that separates "the model is wrong" from "the model was
 * fitted wrong". His scan-path result was lines-only 25-26%, bytes-only 12-13%,
 * two-term 9-10% held-out error. This is that table for parse.
 *
 * Pool: real sessions from 512 KB up to 8 MB. The floor keeps timings above
 * process noise; the ceiling keeps the batch's wall clock bounded and excludes
 * the four multi-tens-of-MB outliers that would otherwise dominate a
 * least-squares fit on nine points.
 */
const POOL_MIN = 512 * 1024;
const POOL_MAX = 8 * 1024 * 1024;
const pool = underCap.filter((f) => f.size >= POOL_MIN && f.size <= POOL_MAX)
  .sort((a, b) => a.p.localeCompare(b.p));

if (pool.length < 12) {
  skip('H', `only ${pool.length} real sessions in [${mb(POOL_MIN)}, ${mb(POOL_MAX)}] — `
    + 'a held-out score needs at least 12 to leave both halves meaningful');
} else {
  const batch = runStage('batch', [`--files=${JSON.stringify(pool.map((f) => f.p))}`], true);
  const rows = batch.extra as Array<{ f: string; ms: number; passes: number[]; bytes: number; chars: number; lines: number; wide: number }>;

  check('H', 'pool size and composition', true,
    `${rows.length} real sessions, ${mb(Math.min(...rows.map((r) => r.bytes)))}-${mb(Math.max(...rows.map((r) => r.bytes)))}, `
    + `${rows.filter((r) => r.wide).length} of ${rows.length} contain a char above U+00FF`,
    'measurement');

  const passSpread = rows.map((r) => Math.abs(r.passes[0] - r.passes[1]) / Math.min(...r.passes));
  check('H', 'the two opposite-order passes agree, so the shared process is not drifting',
    mean(passSpread) < 0.35,
    `mean |pass1-pass2| / min = ${(mean(passSpread) * 100).toFixed(1)}%, worst `
    + `${(Math.max(...passSpread) * 100).toFixed(1)}% — per-file MIN is used throughout`);

  /**
   * Split by INDEX PARITY over a path-sorted list, not by size and not at
   * random. Splitting by size would hand the fit a range it must extrapolate out
   * of, which measures extrapolation rather than the model. Randomness is
   * unavailable to a probe that has to be reproducible.
   */
  const fitSet = rows.filter((_, i) => i % 2 === 0);
  const holdSet = rows.filter((_, i) => i % 2 === 1);

  const fitOne = (key: 'lines' | 'bytes') => {
    // least squares through the origin: cost = k * x
    const num = fitSet.reduce((s, r) => s + r[key] * r.ms, 0);
    const den = fitSet.reduce((s, r) => s + r[key] * r[key], 0);
    return num / den;
  };

  const fitTwo = () => {
    // normal equations for cost = a*lines + b*bytes, no intercept
    let sll = 0, slb = 0, sbb = 0, sly = 0, sby = 0;
    for (const r of fitSet) {
      sll += r.lines * r.lines; slb += r.lines * r.bytes; sbb += r.bytes * r.bytes;
      sly += r.lines * r.ms; sby += r.bytes * r.ms;
    }
    const det = sll * sbb - slb * slb;
    if (det === 0) return { a: NaN, b: NaN };
    return { a: (sbb * sly - slb * sby) / det, b: (sll * sby - slb * sly) / det };
  };

  const err = (predict: (r: typeof rows[0]) => number) =>
    mean(holdSet.map((r) => Math.abs(predict(r) - r.ms) / r.ms)) * 100;

  const kLines = fitOne('lines');
  const kBytes = fitOne('bytes');
  const two = fitTwo();

  const eLines = err((r) => kLines * r.lines);
  const eBytes = err((r) => kBytes * r.bytes);
  const eTwo = err((r) => two.a * r.lines + two.b * r.bytes);

  check('H', 'lines-only, held out', true,
    `${(kLines * 1000).toFixed(2)} ms per 1k lines → ${eLines.toFixed(1)}% mean error on ${holdSet.length} unseen sessions`,
    'measurement');
  check('H', 'bytes-only, held out', true,
    `${(kBytes * 1048576).toFixed(2)} ms per MB → ${eBytes.toFixed(1)}% mean error on ${holdSet.length} unseen sessions`,
    'measurement');
  check('H', 'two-term, held out', true,
    `${(two.a * 1000).toFixed(2)} ms per 1k lines + ${(two.b * 1048576).toFixed(2)} ms per MB → `
    + `${eTwo.toFixed(1)}% mean error on ${holdSet.length} unseen sessions`,
    'measurement');

  /**
   * THE ARM-H VERDICT, and the reason a negative coefficient is checked here
   * separately from the held-out error. Theseus's scan-path fit produced two
   * NON-NEGATIVE coefficients. If the parse-path fit produces a negative one, the
   * two-term model is failing on this path in the fitted regime too, which is the
   * same verdict Round 156's controlled pair reached by a different route — and
   * a low held-out error would not rescue it.
   */
  check('H', 'both fitted coefficients are non-negative, as a cost model requires',
    two.a >= 0 && two.b >= 0,
    `a = ${(two.a * 1000).toFixed(2)} ms/1k lines, b = ${(two.b * 1048576).toFixed(2)} ms/MB — `
    + (two.a >= 0 && two.b >= 0
      ? 'both non-negative on the fitted set, so a held-out score is meaningful'
      : 'a NEGATIVE coefficient survives the fit, so the model is failing on parse in the fitted regime too'));

  check('H', 'does the second term earn its place on unseen data?',
    true,
    `best single term ${Math.min(eLines, eBytes).toFixed(1)}% vs two-term ${eTwo.toFixed(1)}% — `
    + (eTwo < Math.min(eLines, eBytes)
      ? `two-term wins by ${(Math.min(eLines, eBytes) - eTwo).toFixed(1)} points`
      : `two-term does NOT beat the best single term; on parse the second term buys nothing held out`)
    + `. Theseus measured scan at lines 25-26 / bytes 12-13 / two-term 9-10`,
    'measurement');

  /**
   * The worst miss is reported in PERCENT and at 2 decimal places of ms. The
   * first version of this check printed `msf` on both sides and read
   * "predicted 5 ms, measured 5 ms" for a 60% relative miss — the pool's small
   * files parse in single-digit milliseconds, so whole-ms rounding hides
   * exactly the disagreement the check exists to surface.
   */
  const relErr = (r: typeof rows[0]) => Math.abs(two.a * r.lines + two.b * r.bytes - r.ms) / r.ms;
  const worst = [...holdSet].sort((a, b) => relErr(b) - relErr(a))[0];
  check('H', 'the worst held-out miss, named rather than averaged away', true,
    `${path.basename(worst.f)}: predicted ${(two.a * worst.lines + two.b * worst.bytes).toFixed(2)} ms, `
    + `measured ${worst.ms.toFixed(2)} ms (${(relErr(worst) * 100).toFixed(1)}% off) — ${mb(worst.bytes)}, `
    + `${worst.lines} lines, ${(worst.bytes / worst.lines).toFixed(0)} B/line`,
    'measurement');

  const over8 = holdSet.filter((r) => relErr(r) > 0.08).length;
  check('H', 'how concentrated the error is', true,
    `${over8} of ${holdSet.length} held-out sessions miss by more than 8%; `
    + `median relative error ${([...holdSet].map(relErr).sort((x, y) => x - y)[Math.floor(holdSet.length / 2)] * 100).toFixed(1)}%`,
    'measurement');

  /**
   * ARM J — the guard against this probe's own headline being over-applied.
   *
   * Arm H's 2-3% is a WARM-process figure fitted on sessions of 0.5-4.3 MB. The
   * arm-B/C payload is 35.5 MB, measured COLD in its own process. Both
   * differences push the same way, and a reader who takes "2.3% held-out" and
   * applies it to an import-sized file would be wrong by much more than 2.3%.
   * Reported here rather than left for someone to discover, because Round 156's
   * whole failure was a figure quoted outside the regime it was measured in.
   *
   * This does NOT separate the two causes — extrapolation 8x past the fitted
   * range, and warm-vs-cold. It only bounds their combined size.
   */
  const predReal = two.a * shapeReal.lines + two.b * MATCH_BYTES;
  const coldReal = mean(timings.real);
  check('J', 'the fitted model applied 8x outside its range, against a COLD measurement', true,
    `predicts ${msf(predReal)} for the ${mb(MATCH_BYTES)} real payload (${shapeReal.lines} lines); `
    + `arm B measured ${msf(coldReal)} cold — ${(((predReal - coldReal) / coldReal) * 100).toFixed(0)}% off. `
    + `Fitted range was ${mb(Math.min(...rows.map((r) => r.bytes)))}-${mb(Math.max(...rows.map((r) => r.bytes)))}, warm. `
    + `Arm H's error figure does NOT transfer to import-sized files, and this check exists to say so`,
    'measurement');
}

// ── no-mutation regressions ──────────────────────────────────────────────────

console.log('\n── did this probe change anything it should not have? ───────────');

check('X', 'parser.ts is byte-identical to before the probe ran',
  fs.readFileSync(PARSER_TS, 'utf8') === parserSrcBefore,
  `${parserSrcBefore.length} chars, full content compared`);

const realDbAfter = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;
check('X', 'klatch.db untouched',
  (!realDbBefore && !realDbAfter)
  || (!!realDbBefore && !!realDbAfter
    && realDbBefore.size === realDbAfter.size
    && realDbBefore.mtimeMs === realDbAfter.mtimeMs),
  realDbBefore ? `${realDbBefore.size} B, mtime unchanged` : 'no klatch.db present');

check('X', 'the real session file was read in place, never rewritten',
  fs.statSync(REAL_FILE).size === MATCH_BYTES,
  `${REAL_FILE} still ${MATCH_BYTES} B`);

finish();

function finish(): never {
  const regs = results.filter((r) => r.kind === 'regression');
  const failed = regs.filter((r) => !r.pass);
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`${results.length} checks (${regs.length} regression, ${results.length - regs.length} measurement), `
    + `${failed.length} failed, ${skipped.length} skipped`);
  for (const f of failed) console.log(`  FAILED [${f.arm}] ${f.check}`);
  for (const s of skipped) console.log(`  SKIPPED ${s}`);
  process.exit(failed.length > 0 ? 1 : 0);
}
