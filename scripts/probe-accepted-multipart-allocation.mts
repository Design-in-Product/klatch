/**
 * Round 154 — where does the 9.25x go on an ACCEPTED multipart upload?
 *
 * Round 151 (`docs/import-multipart-cap-2026-09-04.md`) shipped a pre-read
 * guard for REJECTED oversize uploads (2.41x -> 0.0x) and left one number on
 * the record, unexplained and explicitly mine:
 *
 *   "an accepted 45.3 MB upload peaks at 419.2 MB (9.25x the file)"
 *
 * Theseus re-flagged it in his Round 153 memo as still open ("yours, and you
 * flagged it yourself — the 9x accepted-multipart cost"). This probe does not
 * fix it. It answers the prior question, which nobody has answered:
 *
 *   WHICH STAGE owns the multiple, and does the obvious one-line alternative
 *   (`file.size` + `file.text()` instead of `arrayBuffer()` + `byteLength` +
 *   `Buffer.from().toString()`) actually reduce it?
 *
 * WHY IN-PROCESS AND NOT THROUGH THE SERVER. Round 151 measured the whole
 * request from outside via RSS sampling, which cannot attribute a peak to a
 * stage — one number, five candidate causes. Here each stage runs to a
 * different stopping point in a FRESH CHILD PROCESS, so its peak is its own.
 * The pipeline is the route's, line for line (`packages/server/src/routes/
 * import.ts`, multipart branch of POST /import/claude-code), not a paraphrase:
 * the stage bodies are transcribed below and arm A diffs them against the live
 * source so this file cannot silently drift from the route it claims to model.
 *
 * WHY maxRSS AND NOT SAMPLED RSS. Round 151's peaks were sampled at 25 ms and
 * were therefore lower bounds. `process.resourceUsage().maxRSS` is the kernel's
 * own high-water mark — exact, no sampling window. Arm Z calibrates its units
 * against a known allocation before any stage number is believed, because
 * maxRSS is bytes on some platforms and kilobytes on others and getting that
 * wrong would scale every number here by 1024.
 *
 * WHAT THIS PROBE DOES NOT DO. It does not modify any file in `packages/`, does
 * not start a server, and never opens `klatch.db` (all three guarded at exit).
 * It takes no position on MAX_IMPORT_SIZE's value — that ruling is xian's.
 *
 * Run: npx tsx scripts/probe-accepted-multipart-allocation.mts
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'accepted-multipart-allocation');
const REAL_DB = path.join(REPO, 'klatch.db');
const IMPORT_TS = path.join(REPO, 'packages/server/src/routes/import.ts');
const PARSER_TS = path.join(REPO, 'packages/server/src/import/parser.ts');

/** 45.3 MB — the same size Round 151 measured the 9.25x at, so numbers line up. */
const PAYLOAD_BYTES = Math.round(45.3 * 1024 * 1024);

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

  // Each stage stops one step further along the route's multipart branch.
  // `sink` exists only so V8 cannot prove the value dead and elide the work.
  let sink: unknown;

  /** The probe-side send: a disk-backed blob, so the sender does not buffer. */
  async function multipartRequest(): Promise<Request> {
    const blob = await fs.openAsBlob(file);
    const fd = new FormData();
    fd.append('file', blob, 'accepted.jsonl');
    return new Request('http://127.0.0.1/api/import/claude-code', { method: 'POST', body: fd });
  }

  if (stage === 'Z') {
    // Calibration: allocate a known, touched, non-elidable 200 MB.
    const KNOWN = 200 * 1024 * 1024;
    const b = Buffer.allocUnsafe(KNOWN);
    b.fill(7);
    sink = b[KNOWN - 1];
  } else if (stage === 'formData') {
    const req = await multipartRequest();
    const fdParsed = await req.formData();
    sink = (fdParsed.get('file') as File).size;
  } else if (stage === 'arrayBuffer') {
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    const ab = await f.arrayBuffer();
    sink = ab.byteLength;
  } else if (stage === 'bufferToString') {
    // The route, verbatim: arrayBuffer -> byteLength check -> Buffer.from().toString()
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    const ab = await f.arrayBuffer();
    if (ab.byteLength > 50 * 1024 * 1024) throw new Error('unexpected: over cap');
    const content = Buffer.from(ab).toString('utf-8');
    sink = content.length;
  } else if (stage === 'fileText') {
    // The candidate: file.size for the check, file.text() for the content.
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    if (f.size > 50 * 1024 * 1024) throw new Error('unexpected: over cap');
    const content = await f.text();
    sink = content.length;
  } else if (stage === 'parse') {
    const { parseClaudeCodeSessionFromContent } = await import(
      path.join(REPO, 'packages/server/src/import/parser.ts')
    );
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    const ab = await f.arrayBuffer();
    const content = Buffer.from(ab).toString('utf-8');
    const session = parseClaudeCodeSessionFromContent(content);
    sink = `${session.turns.length} turns / ${session.eventCount} events`;
  } else if (stage === 'parseFromText') {
    const { parseClaudeCodeSessionFromContent } = await import(
      path.join(REPO, 'packages/server/src/import/parser.ts')
    );
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    const content = await f.text();
    const session = parseClaudeCodeSessionFromContent(content);
    sink = `${session.turns.length} turns / ${session.eventCount} events`;
  } else if (stage === 'sizeVsByteLength') {
    // Is `file.size` the same authority as `arrayBuffer.byteLength`? If it is,
    // the cap check can move ahead of the copy for free. Compared here rather
    // than assumed from the spec, because the route's correctness rides on it.
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    const declared = f.size;
    const actual = (await f.arrayBuffer()).byteLength;
    sink = `eq=${declared === actual} ${declared}/${actual}`;
  } else if (stage === 'sizePreCheck') {
    // The candidate change: check f.size and refuse BEFORE arrayBuffer().
    // Measured against a payload that is over the cap, so the check fires.
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    if (f.size > 40 * 1024 * 1024) { sink = `refused at ${f.size} without arrayBuffer()`; }
    else { throw new Error('unexpected: payload did not trip the test threshold'); }
  } else if (stage === 'byteLengthPostCheck') {
    // The route today: copy first, then refuse. Same threshold, same payload.
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    const ab = await f.arrayBuffer();
    if (ab.byteLength > 40 * 1024 * 1024) { sink = `refused at ${ab.byteLength} after arrayBuffer()`; }
    else { throw new Error('unexpected: payload did not trip the test threshold'); }
  } else if (stage === 'streamLines') {
    // The structural alternative: after formData(), never materialize the file
    // as one Buffer or one string. Decode the File's stream incrementally and
    // hand the parser one line at a time. This is NOT what the route does; it
    // measures the FLOOR that a streaming rewrite could reach while `formData()`
    // still owns the request body.
    const req = await multipartRequest();
    const f = (await req.formData()).get('file') as File;
    const decoder = new TextDecoder('utf-8');
    let tail = '';
    let lines = 0;
    let bytes = 0;
    // Chunk count decides how to read this arm: if the whole file arrives as a
    // single chunk, `stream()` is a copy wearing a stream's interface and the
    // saving here is the string and parse allocations, not the buffer copy.
    let chunks = 0;
    for await (const chunk of f.stream() as unknown as AsyncIterable<Uint8Array>) {
      chunks++;
      bytes += chunk.byteLength;
      const text = tail + decoder.decode(chunk, { stream: true });
      const parts = text.split('\n');
      tail = parts.pop()!;
      lines += parts.length;
    }
    if (tail.length) lines++;
    sink = `${lines} lines / ${bytes} B / ${chunks} chunks`;
  } else if (stage === 'readFileSync') {
    // Floor: the cheapest way to get these bytes into this process at all.
    sink = fs.readFileSync(file).length;
  } else {
    throw new Error(`unknown stage ${stage}`);
  }

  const ms = performance.now() - t0;
  process.stdout.write(JSON.stringify({
    stage, ms, baselineRaw, peakRaw: rawMaxRss(), sink: String(sink).slice(0, 120),
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

const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
const ms = (n: number) => `${n.toFixed(0)} ms`;

const realDbBefore = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;
const importSrcBefore = fs.readFileSync(IMPORT_TS, 'utf8');
const parserSrcBefore = fs.readFileSync(PARSER_TS, 'utf8');

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

/** Run one stage in a fresh child and return its self-reported peak. */
function runStage(stage: string, file: string): { ms: number; baselineRaw: number; peakRaw: number; sink: string } {
  const out = execFileSync('npx', ['tsx', path.relative(REPO, import.meta.filename), `--stage=${stage}`, `--file=${file}`], {
    cwd: REPO, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, KLATCH_DB: path.join(SCRATCH, 'never-written.db') },
  });
  const line = out.trim().split('\n').filter((l) => l.startsWith('{')).pop();
  if (!line) throw new Error(`stage ${stage} produced no result line:\n${out}`);
  return JSON.parse(line);
}

// ── Arm A — the stages above are the route's, not a paraphrase ───────────────

console.log('── arm A: does this probe model the code it claims to model? ────');

const multipartBranch = importSrcBefore.slice(
  importSrcBefore.indexOf("app.post('/import/claude-code'"),
  importSrcBefore.indexOf('// ── Path-based import'),
);
/**
 * Two shapes to distinguish, and this arm must not conflate them.
 *
 * The CONTENT pipeline — `arrayBuffer()` then `Buffer.from().toString()` — is
 * what arms B/C/D/E decompose, and it is unchanged by anything this probe led
 * to. The CAP CHECK moved: arm F measured that refusing on `arrayBuffer
 * .byteLength` costs ~90 MB more than refusing on `file.size`, and Round 154
 * shipped `rejectOversizeFile` ahead of the copy on the strength of it.
 *
 * So arm A pins the content pipeline (a real regression if it drifts) and
 * merely REPORTS which cap-check shape is in the tree — because this probe is
 * the reason that one changed, and failing on its own recommendation would be
 * the probe marking its own success as a defect.
 */
const routeHasArrayBuffer = /const arrayBuffer = await file\.arrayBuffer\(\);/.test(multipartBranch);
const routeHasBufferToString = /Buffer\.from\(arrayBuffer\)\.toString\('utf-8'\)/.test(multipartBranch);
check('A', 'content pipeline modelled by arms B-E is still the route\'s',
  routeHasArrayBuffer && routeHasBufferToString,
  `arrayBuffer=${routeHasArrayBuffer} bufferToString=${routeHasBufferToString}`);

const capViaByteLength = /arrayBuffer\.byteLength > MAX_IMPORT_SIZE/.test(multipartBranch);
const capViaFileSize = /rejectOversizeFile\(c, file\)/.test(multipartBranch);
check('A', 'cap check is present in exactly one of the two known shapes',
  capViaByteLength !== capViaFileSize,
  capViaFileSize ? 'file.size via rejectOversizeFile, ahead of the copy (Round 154 shape)'
    : capViaByteLength ? 'arrayBuffer.byteLength, after the copy (pre-Round-154 shape)'
      : 'NEITHER — the per-file cap check is missing from the multipart branch');

const capMatch = importSrcBefore.match(/const MAX_IMPORT_SIZE = (\d+) \* 1024 \* 1024;/);
check('A', 'cap read from source, not assumed', !!capMatch,
  capMatch ? `MAX_IMPORT_SIZE = ${capMatch[1]} MB` : 'could not read MAX_IMPORT_SIZE');
const capBytes = capMatch ? Number(capMatch[1]) * 1024 * 1024 : 50 * 1024 * 1024;
check('A', 'payload is under the cap, so the accepted path is what runs',
  PAYLOAD_BYTES < capBytes, `${mb(PAYLOAD_BYTES)} payload vs ${mb(capBytes)} cap`);

// ── Arm Z — what unit is maxRSS on this platform? ────────────────────────────

console.log('\n── arm Z: calibrate maxRSS units against a known 200 MB ─────────');

const payload = path.join(SCRATCH, 'accepted.jsonl');
{
  const line = JSON.stringify({
    type: 'user',
    uuid: '00000000-0000-4000-8000-000000000000',
    timestamp: '2026-09-05T00:00:00.000Z',
    message: { role: 'user', content: 'synthetic padding for an allocation measurement. '.repeat(20) },
  }) + '\n';
  const chunk = line.repeat(64);
  const fd = fs.openSync(payload, 'w');
  let written = 0;
  while (written < PAYLOAD_BYTES) {
    const take = Math.min(chunk.length, PAYLOAD_BYTES - written);
    written += fs.writeSync(fd, take === chunk.length ? chunk : chunk.slice(0, take));
  }
  fs.closeSync(fd);
}
check('Z', 'payload written at the intended size',
  fs.statSync(payload).size === PAYLOAD_BYTES,
  `${fs.statSync(payload).size} bytes (${mb(fs.statSync(payload).size)})`);

const cal = runStage('Z', payload);
const calDeltaRaw = cal.peakRaw - cal.baselineRaw;
const KNOWN_MB = 200;
// If raw is bytes, delta ~= 209_715_200. If kilobytes, delta ~= 204_800.
const looksBytes = Math.abs(calDeltaRaw / 1048576 - KNOWN_MB) < KNOWN_MB * 0.25;
const looksKb = Math.abs(calDeltaRaw / 1024 - KNOWN_MB) < KNOWN_MB * 0.25;
check('Z', 'maxRSS unit determined from a known allocation, not assumed',
  looksBytes !== looksKb,
  looksBytes ? `bytes (delta ${calDeltaRaw} ~= ${KNOWN_MB} MB)`
    : looksKb ? `kilobytes (delta ${calDeltaRaw} ~= ${KNOWN_MB} MB)`
      : `INDETERMINATE: raw delta ${calDeltaRaw} matches neither bytes nor kB for a ${KNOWN_MB} MB allocation`);
const toBytes = (raw: number) => (looksBytes && !looksKb ? raw : raw * 1024);

if (!looksBytes && !looksKb) {
  skip('B..E', 'maxRSS units indeterminate — every stage number below would be unscaled');
  finish();
}

// ── Arm B — the floor, and each stage of the route's own pipeline ───────────

console.log('\n── arm B: stage-by-stage peak, fresh process each ───────────────');

const STAGES = [
  ['readFileSync', 'floor: bytes into the process, nothing else'],
  ['formData', 'req.formData() only — the body is buffered here'],
  ['arrayBuffer', '+ file.arrayBuffer()'],
  ['bufferToString', '+ Buffer.from(ab).toString() — the route, verbatim'],
  ['fileText', 'candidate: file.size + file.text() instead'],
  ['parse', '+ parseClaudeCodeSessionFromContent (route pipeline, end to end)'],
  ['parseFromText', 'candidate pipeline, end to end'],
  ['streamLines', 'floor: stream the File, never hold it whole'],
] as const;

const peaks = new Map<string, { deltaBytes: number; ms: number; multiple: number }>();
for (const [stage, label] of STAGES) {
  const r = runStage(stage, payload);
  const deltaBytes = toBytes(r.peakRaw - r.baselineRaw);
  const multiple = deltaBytes / PAYLOAD_BYTES;
  peaks.set(stage, { deltaBytes, ms: r.ms, multiple });
  check('B', `${stage} — ${label}`, true,
    `peak over baseline ${mb(deltaBytes)} = ${multiple.toFixed(2)}x the file, ${ms(r.ms)} [${r.sink}]`,
    'measurement');
}

// ── Arm C — attribution: what does each additional step cost? ───────────────

console.log('\n── arm C: marginal cost of each step ────────────────────────────');

function marginal(from: string, to: string) {
  const a = peaks.get(from)!, b = peaks.get(to)!;
  check('C', `${from} -> ${to}`, true,
    `${mb(b.deltaBytes - a.deltaBytes)} (${(b.multiple - a.multiple).toFixed(2)}x), ` +
    `${(b.ms - a.ms).toFixed(0)} ms`,
    'measurement');
}
marginal('readFileSync', 'formData');
marginal('formData', 'arrayBuffer');
marginal('arrayBuffer', 'bufferToString');
marginal('bufferToString', 'parse');

// ── Arm D — does the one-line candidate actually help? ──────────────────────

console.log('\n── arm D: file.size + file.text() vs arrayBuffer + toString ─────');

const route = peaks.get('bufferToString')!;
const cand = peaks.get('fileText')!;
const savedBytes = route.deltaBytes - cand.deltaBytes;
const savedPct = (savedBytes / route.deltaBytes) * 100;
check('D', 'candidate vs route, content-in-hand', true,
  `route ${mb(route.deltaBytes)} (${route.multiple.toFixed(2)}x) vs candidate ${mb(cand.deltaBytes)} ` +
  `(${cand.multiple.toFixed(2)}x) — ${savedBytes >= 0 ? 'saves' : 'COSTS'} ${mb(Math.abs(savedBytes))} ` +
  `(${savedPct.toFixed(0)}%)`,
  'measurement');

const routeEnd = peaks.get('parse')!;
const candEnd = peaks.get('parseFromText')!;
check('D', 'candidate vs route, end of pipeline', true,
  `route ${mb(routeEnd.deltaBytes)} (${routeEnd.multiple.toFixed(2)}x) vs candidate ` +
  `${mb(candEnd.deltaBytes)} (${candEnd.multiple.toFixed(2)}x) — ` +
  `${routeEnd.deltaBytes - candEnd.deltaBytes >= 0 ? 'saves' : 'COSTS'} ` +
  `${mb(Math.abs(routeEnd.deltaBytes - candEnd.deltaBytes))}`,
  'measurement');

/**
 * The claim worth stating precisely: a one-line swap is only worth shipping if
 * it moves the number materially. 5% is noise dressed as a fix.
 */
const MATERIAL = 0.15;
check('D', 'is the one-line swap worth shipping on these numbers?', true,
  savedPct / 100 >= MATERIAL
    ? `YES — ${savedPct.toFixed(0)}% >= ${MATERIAL * 100}% threshold`
    : `NO — ${savedPct.toFixed(0)}% is below the ${MATERIAL * 100}% threshold; the multiple lives elsewhere`,
  'measurement');

// ── Arm E — what IS on the table, if the one-liner is not ───────────────────

console.log('\n── arm E: the floor a streaming rewrite could reach ─────────────');

const stream = peaks.get('streamLines')!;
const fd = peaks.get('formData')!;
check('E', 'streaming after formData() vs the route pipeline', true,
  `route end-to-end ${mb(routeEnd.deltaBytes)} (${routeEnd.multiple.toFixed(2)}x) vs streamed ` +
  `${mb(stream.deltaBytes)} (${stream.multiple.toFixed(2)}x) — ` +
  `${mb(routeEnd.deltaBytes - stream.deltaBytes)} available ` +
  `(${((1 - stream.deltaBytes / routeEnd.deltaBytes) * 100).toFixed(0)}% of the peak)`,
  'measurement');
check('E', 'formData() is the floor a File-level rewrite cannot go below', true,
  `formData() alone is ${mb(fd.deltaBytes)} (${fd.multiple.toFixed(2)}x); streaming reached ` +
  `${stream.multiple.toFixed(2)}x, i.e. ${(stream.multiple - fd.multiple).toFixed(2)}x above it. ` +
  `Removing the remaining ${fd.multiple.toFixed(2)}x needs a request-level change, not a File-level one.`,
  'measurement');

// ── Arm F — the one change these numbers DO support ─────────────────────────

console.log('\n── arm F: move the cap check ahead of the copy ──────────────────');

/**
 * Round 151's pre-read guard handles the common case (Content-Length present).
 * It deliberately falls through when the header is absent or malformed, and on
 * that fall-through the route copies the whole file BEFORE the cap check runs,
 * because the check reads `arrayBuffer.byteLength`. `file.size` is available
 * one line earlier. Arms F1-F3 test whether that swap is (1) sound and (2)
 * worth anything.
 */
const eq = runStage('sizeVsByteLength', payload);
check('F', 'file.size equals arrayBuffer.byteLength for a multipart File',
  eq.sink.startsWith('eq=true'), eq.sink);

const pre = runStage('sizePreCheck', payload);
const post = runStage('byteLengthPostCheck', payload);
const preB = toBytes(pre.peakRaw - pre.baselineRaw);
const postB = toBytes(post.peakRaw - post.baselineRaw);
check('F', 'refusing on file.size costs less than refusing on byteLength', true,
  `pre-copy check ${mb(preB)} (${(preB / PAYLOAD_BYTES).toFixed(2)}x) vs post-copy check ` +
  `${mb(postB)} (${(postB / PAYLOAD_BYTES).toFixed(2)}x) — saves ${mb(postB - preB)} ` +
  `on the Content-Length fall-through path`,
  'measurement');
check('F', 'the saving is real, not noise', postB - preB > PAYLOAD_BYTES,
  `${mb(postB - preB)} saved vs ${mb(PAYLOAD_BYTES)} file — ` +
  `${postB - preB > PAYLOAD_BYTES ? 'exceeds one full copy' : 'under one full copy; treat as noise'}`);

finish();

// ── Guards + summary ─────────────────────────────────────────────────────────

function finish(): never {
  console.log('\n── guards ──────────────────────────────────────────────────────');

  const realDbAfter = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;
  if (!realDbBefore && !realDbAfter) {
    check('G', 'klatch.db untouched', true, 'no klatch.db before or after');
  } else if (realDbBefore && realDbAfter) {
    const same = realDbBefore.size === realDbAfter.size && realDbBefore.mtimeMs === realDbAfter.mtimeMs;
    check('G', 'klatch.db untouched', same,
      same ? `size ${realDbAfter.size} and mtime unchanged` : 'CHANGED during the run');
  } else {
    check('G', 'klatch.db untouched', false, 'klatch.db appeared or vanished during the run');
  }

  check('G', 'routes/import.ts unmodified by this probe',
    fs.readFileSync(IMPORT_TS, 'utf8') === importSrcBefore, 'byte-compared against the read at start');
  check('G', 'import/parser.ts unmodified by this probe',
    fs.readFileSync(PARSER_TS, 'utf8') === parserSrcBefore, 'byte-compared against the read at start');

  const failed = results.filter((r) => !r.pass && r.kind === 'regression');
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`${results.length} checks, ${failed.length} failed, ${skipped.length} skipped.`);
  for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
  for (const s of skipped) console.log(`  SKIP ${s}`);
  console.log(`Scratch: ${SCRATCH}`);
  process.exit(failed.length ? 1 : 0);
}
