/**
 * Round 156 — what is inside the parse stage's 2.13x, and does that multiple
 * survive contact with a real corpus?
 *
 * Round 154 (`docs/accepted-multipart-allocation-2026-09-05.md`) decomposed the
 * 9x accepted-multipart peak into four stages of roughly 2x each and left two
 * items open, both explicitly mine:
 *
 *   1. "The 2.13x inside parseClaudeCodeSessionFromContent — measured as a
 *      total, not decomposed."
 *   2. "Synthetic-payload caveat: every figure is a function of byte count
 *      EXCEPT the parse arm, whose 2.13x is for 42,411 single-line events. A
 *      corpus heavy with tool artifacts could parse to a different multiple.
 *      Not measured."
 *
 * This probe takes both, because they are the same question asked twice: is the
 * parse cost paid per LINE or per BYTE? Round 154 could not tell, having only
 * one payload shape.
 *
 * THE CONTROL ROUND 154 DID NOT HAVE. Two payloads at IDENTICAL byte count and
 * very different line shape: a real session file off disk, and the Round 154
 * synthetic truncated to the real file's exact size. Bytes held constant, line
 * shape varied. If the multiple is the same, parse is byte-dominated and the
 * Round 154 figure travels. If it differs, there is a per-line term and the
 * synthetic caveat was a real one.
 *
 * WHY THIS ALSO ANSWERS THESEUS'S ARM H. His Round 155 memo
 * (`docs/pm-corpus-cap-delta-2026-09-05.md`) found ms-per-line and ms-per-MB
 * bracketing in opposite directions across two corpora and could not choose a
 * unit, because his two corpora differed in BOTH lines and bytes at once. This
 * one holds bytes fixed, which is the experiment that separates the terms. It
 * measures a different code path (parse, not scan) so it does not settle his
 * question — but if parse turns out to have both a per-line and a per-byte term,
 * "the unit is neither, it is a two-term cost" stops being a guess.
 *
 * METHOD, inherited from Round 154 and not re-litigated: one stage per FRESH
 * CHILD PROCESS (the V8-heap-sizing confound makes shared-process decomposition
 * meaningless), `process.resourceUsage().maxRSS` for an exact high-water mark,
 * and an arm Z that calibrates the maxRSS unit against a known 200 MB before any
 * figure is believed.
 *
 * THE REAL CORPUS IS READ, NEVER COPIED. The probe points at a session file in
 * place, read-only, and reports only counts, sizes and timings. No transcript
 * content reaches stdout, the doc, or `.testdata`.
 *
 * WHAT THIS PROBE DOES NOT DO. It does not modify any file in `packages/`, does
 * not start a server, and never opens `klatch.db` (all three guarded at exit).
 * It recommends nothing about MAX_IMPORT_SIZE; that ruling is xian's.
 *
 * Run: npx tsx scripts/probe-parse-stage-allocation.mts
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'parse-stage-allocation');
const REAL_DB = path.join(REPO, 'klatch.db');
const PARSER_TS = path.join(REPO, 'packages/server/src/import/parser.ts');
const PARSER_MOD = path.join(REPO, 'packages/server/src/import/parser.ts');

// ─────────────────────────────────────────────────────────────────────────────
// CHILD MODE — one stage, one process, exits with its own peak.
// ─────────────────────────────────────────────────────────────────────────────

const stageArg = process.argv.find((a) => a.startsWith('--stage='));

/** kilobytes on Linux, bytes on macOS. Arm Z decides which; child reports raw. */
function rawMaxRss(): number {
  return process.resourceUsage().maxRSS;
}

if (stageArg) {
  const stage = stageArg.slice('--stage='.length);
  const file = process.argv.find((a) => a.startsWith('--file='))!.slice('--file='.length);
  const baselineRaw = rawMaxRss();
  const t0 = performance.now();

  /**
   * `sink` exists only so V8 cannot prove the intermediate dead and elide the
   * work. Every stage must ALSO keep its intermediate reachable until the peak
   * is taken — otherwise the stage measures a collection, not an allocation.
   * That is what `hold` is for; it is read at the end of the process.
   */
  let sink: unknown;
  const hold: unknown[] = [];

  if (stage === 'Z') {
    // Calibration: allocate a known, touched, non-elidable 200 MB.
    const KNOWN = 200 * 1024 * 1024;
    const b = Buffer.allocUnsafe(KNOWN);
    b.fill(7);
    hold.push(b);
    sink = b[KNOWN - 1];
  } else if (stage === 'nothing') {
    // The empty stage. Everything below is a delta from this process's own
    // baseline, but the baseline is taken BEFORE the dynamic import of the
    // parser — so stages that import it carry a compile cost that stages
    // without it do not. This arm and `parserImport` size that confound
    // instead of letting it sit inside the parse figures unattributed.
    sink = 'no work';
  } else if (stage === 'parserImport') {
    // The import, and nothing else. Subtract from any importing stage.
    const mod = await import(PARSER_MOD);
    hold.push(mod);
    sink = `${Object.keys(mod).length} exports`;
  } else if (stage === 'content') {
    // FLOOR for everything below: the content string, in memory, nothing else.
    // This is the state the route is in at the moment it calls the parser.
    const content = fs.readFileSync(file, 'utf-8');
    hold.push(content);
    sink = `${content.length} chars`;
  } else if (stage === 'split') {
    // + the array `parseJsonlContent` iterates. Is it a copy of the content or
    // 42k pointers into it? Measured here rather than argued from V8 internals.
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    hold.push(content, lines);
    sink = `${lines.length} lines`;
  } else if (stage === 'trim') {
    // + `line.trim()` on every line, all retained. V8 is documented to return
    // the receiver when there is nothing to trim; JSONL lines have nothing to
    // trim. If that holds, this stage costs the array of refs and no chars.
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const trimmed: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      trimmed.push(t);
    }
    hold.push(content, lines, trimmed);
    sink = `${trimmed.length} non-empty`;
  } else if (stage === 'jsonl') {
    // The real `parseJsonlContent`, not a transcription — the events array is
    // what parseEvents then walks, and it is live for that whole walk.
    const { parseJsonlContent } = await import(PARSER_MOD);
    const content = fs.readFileSync(file, 'utf-8');
    const res = parseJsonlContent(content);
    hold.push(content, res);
    sink = `${res.events.length} events / ${res.skippedLines} skipped`;
  } else if (stage === 'full') {
    // The whole thing the route calls: parseJsonlContent + parseEvents.
    const { parseClaudeCodeSessionFromContent } = await import(PARSER_MOD);
    const content = fs.readFileSync(file, 'utf-8');
    const session = parseClaudeCodeSessionFromContent(content);
    hold.push(content, session);
    sink = `${session.turns.length} turns / ${session.eventCount} events`;
  } else if (stage === 'events') {
    // parseEvents ALONE, with the events array already built and the content
    // string dropped. Isolates the grouping/artifact half from the JSON half.
    // The content string is deliberately NOT held: this arm answers "what does
    // parseEvents add on top of an events array", not "what is the total".
    const { parseJsonlContent, parseEvents } = await import(PARSER_MOD);
    let events: unknown[];
    {
      const content = fs.readFileSync(file, 'utf-8');
      events = parseJsonlContent(content).events;
    }
    const session = parseEvents(events);
    hold.push(events, session);
    sink = `${session.turns.length} turns`;
  } else if (stage === 'scanNoSplit') {
    // CANDIDATE. Same output as parseJsonlContent, without materializing the
    // split array: walk the content with indexOf and slice one line at a time.
    // Round 154's lesson is that the obvious fix can measure at zero, so this
    // arm exists to be REFUTED as much as confirmed.
    const events: unknown[] = [];
    let skippedLines = 0;
    const content = fs.readFileSync(file, 'utf-8');
    let at = 0;
    while (at <= content.length) {
      let nl = content.indexOf('\n', at);
      if (nl === -1) nl = content.length;
      const trimmed = content.slice(at, nl).trim();
      at = nl + 1;
      if (!trimmed) continue;
      try {
        events.push(JSON.parse(trimmed));
      } catch {
        skippedLines++;
      }
    }
    hold.push(content, events);
    sink = `${events.length} events / ${skippedLines} skipped`;
  } else if (stage === 'shape') {
    // Not an allocation arm. Line-shape statistics, so the two payloads'
    // multiples are interpretable rather than two bare numbers.
    //
    // `wide` is the one that turned out to matter: V8 stores a string as
    // one byte per char ONLY if every char is Latin-1. A single char above
    // U+00FF anywhere in the payload promotes the WHOLE string to two bytes.
    // Counted here, not assumed, because the content floor rides on it.
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    let maxLine = 0;
    for (const l of lines) if (l.length > maxLine) maxLine = l.length;
    let wide = 0;
    for (let i = 0; i < content.length; i++) if (content.charCodeAt(i) > 0xff) wide++;
    const bytes = fs.statSync(file).size;
    sink = JSON.stringify({ bytes, chars: content.length, lines: lines.length, maxLine, wide });
  } else {
    throw new Error(`unknown stage ${stage}`);
  }

  const ms = performance.now() - t0;
  const peakRaw = rawMaxRss();
  // Read `hold` after the peak so V8 cannot collect any stage's intermediate early.
  const held = hold.length;
  process.stdout.write(JSON.stringify({
    stage, ms, baselineRaw, peakRaw, held, sink: String(sink).slice(0, 200),
  }) + '\n');
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

/** Set by arm D. A negative per-line coefficient is a result, not a broken arm. */
let modelFalsified = false;

const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
const smb = (n: number) => `${n < 0 ? '-' : '+'}${(Math.abs(n) / 1048576).toFixed(1)} MB`;
const msf = (n: number) => `${n.toFixed(0)} ms`;

const realDbBefore = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;
const parserSrcBefore = fs.readFileSync(PARSER_TS, 'utf8');

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

type StageResult = { ms: number; baselineRaw: number; peakRaw: number; held: number; sink: string };
function runStage(stage: string, file: string): StageResult {
  const out = execFileSync('npx', ['tsx', path.relative(REPO, import.meta.filename), `--stage=${stage}`, `--file=${file}`], {
    cwd: REPO, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, KLATCH_DB: path.join(SCRATCH, 'never-written.db') },
  });
  const line = out.trim().split('\n').filter((l) => l.startsWith('{')).pop();
  if (!line) throw new Error(`stage ${stage} produced no result line:\n${out}`);
  return JSON.parse(line);
}

// ── Arm A — does this probe model the parser it claims to model? ─────────────

console.log('── arm A: is the pipeline below still the parser\'s? ─────────────');

const jsonlFn = parserSrcBefore.slice(
  parserSrcBefore.indexOf('export function parseJsonlContent'),
  parserSrcBefore.indexOf('export function parseClaudeCodeSessionFromContent'),
);
/**
 * Round 154's lesson, applied to this probe before it can bite: an arm that
 * asserts today's implementation is correct-by-definition becomes a tripwire
 * against its own recommendations. The `scanNoSplit` arm below is a candidate
 * replacement for `content.split('\n')`. So this arm REPORTS which shape is in
 * the tree and fails only if it recognises NEITHER — the case that means the
 * probe has lost track of the code entirely.
 */
const usesSplit = /for \(const line of content\.split\('\\n'\)\)/.test(jsonlFn);
const usesIndexScan = /content\.indexOf\('\\n'/.test(jsonlFn);
check('A', 'line iteration is present in exactly one of the two known shapes',
  usesSplit !== usesIndexScan,
  usesSplit ? "content.split('\\n') — the shape arms B/C decompose"
    : usesIndexScan ? 'indexOf scan — the scanNoSplit shape has been adopted'
      : 'NEITHER — parseJsonlContent no longer iterates lines in a recognised way');
check('A', 'per-line trim + JSON.parse + skip-on-throw still the inner loop',
  /const trimmed = line\.trim\(\)|\.trim\(\)/.test(jsonlFn) && /JSON\.parse\(trimmed\)/.test(jsonlFn) && /catch \{/.test(jsonlFn),
  `trim=${/\.trim\(\)/.test(jsonlFn)} jsonParse=${/JSON\.parse\(trimmed\)/.test(jsonlFn)} skipOnThrow=${/catch \{/.test(jsonlFn)}`);
check('A', 'parseClaudeCodeSessionFromContent is still parseJsonlContent + parseEvents',
  /const \{ events, skippedLines \} = parseJsonlContent\(content\);/.test(parserSrcBefore)
  && /const session = parseEvents\(events\);/.test(parserSrcBefore),
  'the two halves arms `jsonl` and `events` split it into');

// ── Payload selection: a real corpus, and a synthetic at the SAME byte count ──

console.log('\n── payloads: real corpus + synthetic at matched bytes ───────────');

/** Largest real session on disk under the import cap — read in place, never copied. */
function largestRealSession(capBytes: number): { p: string; size: number; total: number } | undefined {
  const root = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(root)) return undefined;
  let best: { p: string; size: number } | undefined;
  let total = 0;
  for (const d of fs.readdirSync(root)) {
    const dir = path.join(root, d);
    let st: fs.Stats;
    try { st = fs.statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const p = path.join(dir, f);
      let size: number;
      try { size = fs.statSync(p).size; } catch { continue; }
      total++;
      if (size > capBytes) continue;
      if (!best || size > best.size) best = { p, size };
    }
  }
  return best ? { ...best, total } : undefined;
}

const CAP_BYTES = 50 * 1024 * 1024;
const real = largestRealSession(CAP_BYTES);

if (!real) {
  skip('B..F', 'no real session corpus at ~/.claude/projects — the controlled comparison needs one');
  finish();
}

const REAL_FILE = real!.p;
const MATCH_BYTES = real!.size;
check('A', 'real payload selected from disk, under the import cap',
  MATCH_BYTES > 8 * 1024 * 1024 && MATCH_BYTES <= CAP_BYTES,
  `${mb(MATCH_BYTES)} — largest of ${real!.total} sessions under the ${mb(CAP_BYTES)} cap`);

/**
 * The synthetic, written to EXACTLY `MATCH_BYTES`. Whole lines only, with the
 * remainder padded as one whitespace line — `parseJsonlContent` skips blank
 * lines before it tries JSON, so the padding is not counted as a parse failure
 * and does not contaminate the skippedLines figure.
 */
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
check('A', 'synthetic payload matches the real payload byte for byte',
  fs.statSync(SYNTH_FILE).size === MATCH_BYTES,
  `${fs.statSync(SYNTH_FILE).size} vs ${MATCH_BYTES} bytes — the control that separates lines from bytes`);

/**
 * A THIRD payload for arm G, identical to the synthetic except for ONE
 * character. The three ASCII bytes `pad` are overwritten with the three UTF-8
 * bytes of U+2026 (`…`), so the file is byte-for-byte the same length and the
 * same JSONL, and the only difference is that one character now sits above
 * U+00FF. If the content floor jumps by ~1x the payload on that alone, V8's
 * one-byte/two-byte string representation is the explanation for the real-vs-
 * synthetic floor gap — and no part of the gap belongs to the parser.
 */
const SYNTH_WIDE_FILE = path.join(SCRATCH, 'synthetic-one-wide-char.jsonl');
{
  const buf = fs.readFileSync(SYNTH_FILE);
  const at = buf.indexOf('pad');
  if (at === -1) throw new Error('probe bug: expected marker not found in the synthetic payload');
  Buffer.from('…', 'utf-8').copy(buf, at);
  fs.writeFileSync(SYNTH_WIDE_FILE, buf);
}
check('A', 'wide-char payload differs from the synthetic by one character, not one byte',
  fs.statSync(SYNTH_WIDE_FILE).size === MATCH_BYTES,
  `${fs.statSync(SYNTH_WIDE_FILE).size} bytes — same size, one char above U+00FF`);

// ── Arm Z — what unit is maxRSS on this platform? ────────────────────────────

console.log('\n── arm Z: calibrate maxRSS units against a known 200 MB ─────────');

/**
 * Every figure below is `peakRaw - baselineRaw`, i.e. the memory this stage
 * added over the interpreter's own resident set — the same convention Round 154
 * used, so the two rounds' multiples are directly comparable. Reporting the
 * ABSOLUTE peak instead would fold ~140 MB of tsx baseline into every stage and
 * inflate a 35.4 MB payload's floor to ~7x. (It did, in the first run of this
 * probe. Caught by the floor being 6.97x when the floor cannot exceed ~2x.)
 */
const cal = runStage('Z', SYNTH_FILE);
const calDeltaRaw = cal.peakRaw - cal.baselineRaw;
const KNOWN_MB = 200;
const looksBytes = Math.abs(calDeltaRaw / 1048576 - KNOWN_MB) < KNOWN_MB * 0.25;
const looksKb = Math.abs(calDeltaRaw / 1024 - KNOWN_MB) < KNOWN_MB * 0.25;
check('Z', 'maxRSS unit determined from a known allocation, not assumed',
  looksBytes !== looksKb,
  looksBytes ? `bytes (delta ${calDeltaRaw} ~= ${KNOWN_MB} MB)`
    : looksKb ? `kilobytes (delta ${calDeltaRaw} ~= ${KNOWN_MB} MB)`
      : `INDETERMINATE: raw delta ${calDeltaRaw} matches neither bytes nor kB for ${KNOWN_MB} MB`);
const toBytes = (raw: number) => (looksBytes && !looksKb ? raw : raw * 1024);

if (!looksBytes && !looksKb) {
  skip('B..F', 'maxRSS units indeterminate — every figure below would be unscaled');
  finish();
}

// ── Arms B and C — the same decomposition on both payloads ───────────────────

const STAGES: Array<[string, string]> = [
  ['nothing', 'empty stage — what a child costs before any payload work'],
  ['parserImport', 'the dynamic import alone — the confound, sized so it is not silent'],
  ['content', 'floor: the content string in memory, what the route hands the parser'],
  ['split', "+ content.split('\\n') retained"],
  ['trim', '+ .trim() on every line retained'],
  ['jsonl', 'parseJsonlContent — split + trim + JSON.parse, events retained'],
  ['full', 'parseClaudeCodeSessionFromContent — the route\'s call, end to end'],
  ['events', 'parseEvents alone, content dropped (isolates the grouping half)'],
  ['scanNoSplit', 'candidate: same events, indexOf scan instead of split'],
];

type Row = { stage: string; peakBytes: number; ms: number; sink: string };
function decompose(arm: string, label: string, file: string): Row[] {
  console.log(`\n── arm ${arm}: ${label} ──────────────────────────`);
  const rows: Row[] = [];
  for (const [stage, desc] of STAGES) {
    const r = runStage(stage, file);
    const peakBytes = toBytes(r.peakRaw - r.baselineRaw);
    rows.push({ stage, peakBytes, ms: r.ms, sink: r.sink });
    check(arm, `${stage}`, stage === 'nothing' || r.held > 0,
      `${mb(peakBytes)}  ${(peakBytes / MATCH_BYTES).toFixed(2)}x  ${msf(r.ms)}  — ${desc} [${r.sink}]`,
      'measurement');
  }
  return rows;
}

const shapeReal = JSON.parse(runStage('shape', REAL_FILE).sink);
const shapeSynth = JSON.parse(runStage('shape', SYNTH_FILE).sink);

const rowsReal = decompose('B', `REAL corpus, ${mb(MATCH_BYTES)}`, REAL_FILE);
const rowsSynth = decompose('C', `SYNTHETIC, ${mb(MATCH_BYTES)} (matched)`, SYNTH_FILE);

const byStage = (rows: Row[], s: string) => rows.find((r) => r.stage === s)!;

// ── Arm D — the controlled comparison ────────────────────────────────────────

console.log('\n── arm D: bytes held constant, line shape varied ────────────────');

check('D', 'the two payloads really do differ in line shape',
  shapeReal.lines !== shapeSynth.lines
  && Math.abs(shapeReal.bytes - shapeSynth.bytes) === 0,
  `real ${shapeReal.lines} lines @ ${(shapeReal.bytes / shapeReal.lines).toFixed(0)} B/line (max ${shapeReal.maxLine}), `
  + `synthetic ${shapeSynth.lines} lines @ ${(shapeSynth.bytes / shapeSynth.lines).toFixed(0)} B/line — same ${mb(MATCH_BYTES)}`);

for (const stage of ['jsonl', 'full']) {
  const r = byStage(rowsReal, stage), s = byStage(rowsSynth, stage);
  const floorR = byStage(rowsReal, 'content').peakBytes, floorS = byStage(rowsSynth, 'content').peakBytes;
  const multR = r.peakBytes / MATCH_BYTES, multS = s.peakBytes / MATCH_BYTES;
  const marginR = r.peakBytes / floorR, marginS = s.peakBytes / floorS;
  check('D', `${stage}: does the multiple travel between corpora?`, true,
    `real ${multR.toFixed(2)}x vs synthetic ${multS.toFixed(2)}x (${((multR / multS - 1) * 100).toFixed(0)}% apart); `
    + `over the content floor: real ${marginR.toFixed(2)}x vs synthetic ${marginS.toFixed(2)}x`,
    'measurement');
  check('D', `${stage}: time per corpus`, true,
    `real ${msf(r.ms)} vs synthetic ${msf(s.ms)}; per 1k lines real ${(r.ms / (shapeReal.lines / 1000)).toFixed(2)} ms, `
    + `synthetic ${(s.ms / (shapeSynth.lines / 1000)).toFixed(2)} ms; per MB real ${(r.ms / (MATCH_BYTES / 1048576)).toFixed(1)} ms, `
    + `synthetic ${(s.ms / (MATCH_BYTES / 1048576)).toFixed(1)} ms`,
    'measurement');
}

/**
 * The lines-vs-bytes test, run as a controlled experiment rather than a fit.
 *
 * With bytes held EQUAL across the two payloads, a per-byte term contributes
 * identically to both and cancels in the difference. So under a `cost =
 * a*lines + b*bytes` model, the whole time difference is the per-line term, and
 * `dMs / dLines` IS the coefficient `a`. This is the experiment Theseus's arm H
 * could not run: his two corpora varied in lines and bytes together, so neither
 * term could be isolated and the two normalisations bracketed instead.
 *
 * The check below is written so that the model FAILING is a reportable outcome.
 * A cost coefficient cannot be negative — a corpus cannot be made faster by
 * containing more lines. If the slope comes out negative, the two-term model is
 * not merely imprecise, it is the wrong model, and the honest conclusion is
 * that a third property (per-line structure: nesting, escapes, artifacts) is
 * doing the work that neither `lines` nor `bytes` captures.
 */
{
  const r = byStage(rowsReal, 'full'), s = byStage(rowsSynth, 'full');
  const dLines = shapeSynth.lines - shapeReal.lines;
  const dMs = s.ms - r.ms;
  const perLine = dLines !== 0 ? (dMs / dLines) * 1000 : NaN;
  const plausible = Number.isFinite(perLine) && perLine > 0;
  modelFalsified = !plausible;
  check('D', 'lines+bytes model survives the control [a FAIL here IS the Round 156 result]',
    plausible,
    `isolated slope ${perLine.toFixed(2)} ms per 1k lines (dLines=${dLines}, dMs=${dMs.toFixed(0)}) — `
    + (plausible
      ? 'positive, so lines+bytes is at least self-consistent here'
      : 'NEGATIVE, which no cost coefficient can be: at equal bytes the corpus with FEWER lines '
        + 'is SLOWER, so neither lines nor bytes is the driver and the model is falsified, not refined'));
  check('D', 'what the surviving predictor looks like', true,
    `real ${(shapeReal.bytes / shapeReal.lines).toFixed(0)} B/line with a ${shapeReal.maxLine}-char longest line vs `
    + `synthetic ${(shapeSynth.bytes / shapeSynth.lines).toFixed(0)} B/line, longest ${shapeSynth.maxLine} — `
    + `line-length skew of ${(shapeReal.maxLine / (shapeReal.bytes / shapeReal.lines)).toFixed(0)}x mean on the real corpus `
    + `vs ${(shapeSynth.maxLine / (shapeSynth.bytes / shapeSynth.lines)).toFixed(1)}x on the synthetic`,
    'measurement');
}

// ── Arm E — is split('\n') a copy, or pointers into the content? ─────────────

console.log('\n── arm E: what does split() actually cost? ──────────────────────');

for (const [label, rows, shape] of [['real', rowsReal, shapeReal], ['synthetic', rowsSynth, shapeSynth]] as const) {
  const floor = byStage(rows, 'content').peakBytes;
  const split = byStage(rows, 'split').peakBytes;
  const trim = byStage(rows, 'trim').peakBytes;
  const addedBySplit = split - floor;
  const perLineBytes = addedBySplit / shape.lines;
  // A full character copy would add ~1x the content. Pointers add tens of bytes/line.
  const isCopy = addedBySplit > MATCH_BYTES * 0.5;
  check('E', `${label}: split('\\n') is ${isCopy ? 'a CHARACTER COPY' : 'references, not a copy'}`, true,
    `${smb(addedBySplit)} over the content floor = ${perLineBytes.toFixed(0)} B/line across ${shape.lines} lines `
    + `(a character copy would be ~${mb(MATCH_BYTES)})`,
    'measurement');
  check('E', `${label}: .trim() on already-trimmed lines adds`, true,
    `${smb(trim - split)} over split — V8 returns the receiver when there is nothing to trim`,
    'measurement');
}

// ── Arm G — is the floor gap V8's string width, and not the parser at all? ───

console.log('\n── arm G: one character above U+00FF, same byte count ───────────');

{
  const shapeWide = JSON.parse(runStage('shape', SYNTH_WIDE_FILE).sink);
  const w = runStage('content', SYNTH_WIDE_FILE);
  const wideFloor = toBytes(w.peakRaw - w.baselineRaw);
  const asciiFloor = byStage(rowsSynth, 'content').peakBytes;
  const realFloor = byStage(rowsReal, 'content').peakBytes;
  const jump = wideFloor - asciiFloor;

  check('G', 'the payloads differ in exactly the intended way', shapeWide.wide === 1 && shapeSynth.wide === 0,
    `wide chars: synthetic ${shapeSynth.wide}, wide-variant ${shapeWide.wide}, real ${shapeReal.wide} `
    + `(${((shapeReal.wide / shapeReal.chars) * 100).toFixed(4)}% of the real corpus)`);
  check('G', 'one wide character costs a whole extra copy of the payload', true,
    `content floor ${mb(asciiFloor)} (ASCII) -> ${mb(wideFloor)} (one wide char) = +${mb(jump)} `
    + `on a ${mb(MATCH_BYTES)} payload, i.e. ${(jump / MATCH_BYTES).toFixed(2)}x — V8 promotes the whole string to two bytes`,
    'measurement');
  check('G', 'string width, not parsing, explains the real-vs-synthetic floor gap', true,
    `real floor exceeds ASCII-synthetic floor by ${mb(realFloor - asciiFloor)}; the one-wide-char variant `
    + `accounts for ${mb(jump)} of that — ${((jump / (realFloor - asciiFloor)) * 100).toFixed(0)}% explained`,
    'measurement');
}

// ── Arm R — what the ROUTE's own pipeline does on a real corpus ──────────────

console.log('\n── arm R: Round 154\'s route stages, real vs byte-matched synthetic ──');

/**
 * Everything above measures the parse stage through a probe-local floor
 * (`readFileSync(file, 'utf-8')`), which is NOT the route's floor — the route
 * reaches its content string via `formData()` -> `arrayBuffer()` ->
 * `Buffer.from().toString()`. So the marginals above transfer to the route and
 * the absolute multiples do not.
 *
 * Rather than add arms across rounds and call the sum a route figure — the
 * arithmetic-not-a-measurement trap Theseus named for the two-root union in
 * Round 155 — this arm drives ROUND 154'S OWN child stages, unmodified, at both
 * payloads. Round 154 only ever ran them against a pure-ASCII synthetic, and
 * arm G above is the reason to doubt that that generalises.
 */
const R154 = path.join(REPO, 'scripts/probe-accepted-multipart-allocation.mts');
if (!fs.existsSync(R154)) {
  skip('R', 'Round 154 probe not present — cannot re-drive the route stages');
} else {
  const runR154 = (stage: string, file: string) => {
    const out = execFileSync('npx', ['tsx', path.relative(REPO, R154), `--stage=${stage}`, `--file=${file}`], {
      cwd: REPO, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, KLATCH_DB: path.join(SCRATCH, 'never-written.db') },
    });
    const line = out.trim().split('\n').filter((l) => l.startsWith('{')).pop();
    if (!line) throw new Error(`round-154 stage ${stage} produced no result line:\n${out}`);
    const r = JSON.parse(line);
    return { ms: r.ms as number, peak: toBytes(r.peakRaw - r.baselineRaw), sink: r.sink as string };
  };

  const ROUTE_STAGES = ['formData', 'arrayBuffer', 'bufferToString', 'parse'];
  const routeReal: Record<string, ReturnType<typeof runR154>> = {};
  const routeSynth: Record<string, ReturnType<typeof runR154>> = {};
  for (const s of ROUTE_STAGES) {
    routeReal[s] = runR154(s, REAL_FILE);
    routeSynth[s] = runR154(s, SYNTH_FILE);
    check('R', `route stage ${s}`, true,
      `real ${mb(routeReal[s].peak)} ${(routeReal[s].peak / MATCH_BYTES).toFixed(2)}x ${msf(routeReal[s].ms)}  |  `
      + `synthetic ${mb(routeSynth[s].peak)} ${(routeSynth[s].peak / MATCH_BYTES).toFixed(2)}x ${msf(routeSynth[s].ms)}`,
      'measurement');
  }

  const realMult = routeReal.parse.peak / MATCH_BYTES;
  const synthMult = routeSynth.parse.peak / MATCH_BYTES;
  check('R', 'Round 154\'s end-to-end multiple, restated for a real corpus', true,
    `real ${realMult.toFixed(2)}x vs byte-matched synthetic ${synthMult.toFixed(2)}x — `
    + `Round 154 published ${synthMult >= 8 && synthMult <= 9.2 ? 'the synthetic figure (8.60x), which reproduces here' : `8.60x; this synthetic gives ${synthMult.toFixed(2)}x`}. `
    + `A real corpus costs ${(realMult - synthMult).toFixed(2)}x MORE of the payload.`,
    'measurement');
  const parseMarginalReal = routeReal.parse.peak - routeReal.bufferToString.peak;
  const parseMarginalSynth = routeSynth.parse.peak - routeSynth.bufferToString.peak;
  check('R', 'the parse marginal Round 154 called 2.13x, on both corpora', true,
    `real +${mb(parseMarginalReal)} (${(parseMarginalReal / MATCH_BYTES).toFixed(2)}x of payload), `
    + `synthetic +${mb(parseMarginalSynth)} (${(parseMarginalSynth / MATCH_BYTES).toFixed(2)}x) — `
    + `${((parseMarginalReal / parseMarginalSynth - 1) * 100).toFixed(0)}% apart`,
    'measurement');
}

// ── Arm F — does the candidate beat the shipped shape, or is it another no-op?─

console.log('\n── arm F: scanNoSplit vs the shipped split, on both payloads ────');

for (const [label, rows] of [['real', rowsReal], ['synthetic', rowsSynth]] as const) {
  const shipped = byStage(rows, 'jsonl');
  const cand = byStage(rows, 'scanNoSplit');
  const memPct = (cand.peakBytes / shipped.peakBytes - 1) * 100;
  const msPct = (cand.ms / shipped.ms - 1) * 100;
  check('F', `${label}: candidate output matches the shipped parser's`, true,
    `shipped [${shipped.sink}] vs candidate [${cand.sink}]`,
    'measurement');
  check('F', `${label}: candidate peak vs shipped`, true,
    `${mb(cand.peakBytes)} vs ${mb(shipped.peakBytes)} = ${memPct >= 0 ? '+' : ''}${memPct.toFixed(1)}% memory, `
    + `${msPct >= 0 ? '+' : ''}${msPct.toFixed(1)}% time — `
    + `${Math.abs(memPct) < 3 ? 'inside noise: treat as a NO-OP until a repeat says otherwise' : 'outside noise'}`,
    'measurement');
}

/**
 * The single-sample time deltas above are exactly the shape of number Round 154
 * shipped as a no-op after three runs flipped its sign. So the time claim gets
 * repeats before it gets stated: three fresh children per shape on the real
 * corpus, and the arm reports the RANGE. A saving that does not clear the
 * spread of its own repeats is not a saving.
 */
{
  const REPEATS = 3;
  const sample = (stage: string) => Array.from({ length: REPEATS }, () => {
    const r = runStage(stage, REAL_FILE);
    return { ms: r.ms, peak: toBytes(r.peakRaw - r.baselineRaw) };
  });
  const shipped = sample('jsonl');
  const cand = sample('scanNoSplit');
  const lo = (a: number[]) => Math.min(...a), hi = (a: number[]) => Math.max(...a);
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

  for (const [metric, get, fmt] of [
    ['time', (x: { ms: number; peak: number }) => x.ms, (n: number) => `${n.toFixed(0)} ms`],
    ['memory', (x: { ms: number; peak: number }) => x.peak, mb],
  ] as const) {
    const s = shipped.map(get), c = cand.map(get);
    const separated = hi(c) < lo(s);
    check('F', `real: candidate ${metric} clears the spread of its own repeats (${REPEATS} runs each)`,
      true,
      `shipped ${s.map(fmt).join(' / ')}, candidate ${c.map(fmt).join(' / ')} — `
      + (separated
        ? `SEPARATED: every candidate run beat every shipped run, ${((1 - mean(c) / mean(s)) * 100).toFixed(0)}% mean saving`
        : `OVERLAPPING (shipped spans ${((hi(s) / lo(s) - 1) * 100).toFixed(0)}%, candidate ${((hi(c) / lo(c) - 1) * 100).toFixed(0)}%): `
          + 'the single-run delta above is NOT established and must not be quoted as a saving'),
      'measurement');
  }
}

// ── Guards ───────────────────────────────────────────────────────────────────

finish();

function finish(): never {
  console.log('\n── guards ───────────────────────────────────────────────────────');

  const parserSrcAfter = fs.readFileSync(PARSER_TS, 'utf8');
  check('guard', 'parser.ts byte-identical before and after', parserSrcAfter === parserSrcBefore,
    `${parserSrcAfter.length} bytes`);

  const realDbAfter = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;
  check('guard', 'klatch.db never opened by this probe',
    (!realDbBefore && !realDbAfter)
    || (!!realDbBefore && !!realDbAfter
      && realDbBefore.size === realDbAfter.size
      && realDbBefore.mtimeMs === realDbAfter.mtimeMs),
    realDbBefore ? `size ${realDbBefore.size} -> ${realDbAfter?.size}, mtime unchanged=${realDbBefore.mtimeMs === realDbAfter?.mtimeMs}` : 'no klatch.db present');

  check('guard', 'scratch db was never created (no DB path was touched)',
    !fs.existsSync(path.join(SCRATCH, 'never-written.db')), SCRATCH);

  const failed = results.filter((r) => !r.pass && r.kind === 'regression');
  const measurements = results.filter((r) => r.kind === 'measurement').length;
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log(`${results.length} checks (${results.length - measurements} regression, ${measurements} measurement), `
    + `${failed.length} failed, ${skipped.length} skipped`);
  for (const f of failed) console.log(`  FAILED [${f.arm}] ${f.check} — ${f.detail}`);
  for (const s of skipped) console.log(`  SKIPPED ${s}`);
  if (modelFalsified) {
    console.log('\nNOTE ON THE EXIT CODE: arm D\'s failing check is this round\'s finding, not a broken');
    console.log('probe — the lines+bytes cost model does not survive a constant-bytes control. It is');
    console.log('written as a failing check so a future reader cannot skim past it. If a later corpus');
    console.log('makes the slope positive, that check going green is itself the news.');
  }
  process.exit(failed.length ? 1 : 0);
}
