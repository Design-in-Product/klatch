/**
 * Round 151 — what does MAX_IMPORT_SIZE actually guard on the multipart path?
 *
 * Theseus (Round 150, `docs/import-large-session-2026-09-04.md`) measured the
 * path-based import route at department-head size and left one item explicitly
 * open and explicitly mine:
 *
 *   "That is not an argument for removing it — it also guards the multipart
 *    upload path, which genuinely does buffer (`arrayBuffer.byteLength`), and
 *    I did not measure that path."
 *
 * This probe measures that path. The question is narrow and answerable:
 *
 *   On the multipart route, is the allocation the cap exists to prevent
 *   already made by the time the cap runs?
 *
 * WHY SYNTHETIC BYTES. The payloads here are generated into `.testdata/`, not
 * read from anyone's corpus. Everything measured below happens *before* any
 * parse: the response is a 400 in every arm, and the server never looks at the
 * content. Buffering cost is a function of byte count, so synthetic bytes are
 * sound for this specific measurement and make the probe reproducible on a
 * machine with no PM corpus. Sizes mirror the real over-cap heads Theseus
 * found (70.3 MB `docs`, 51.8 MB `comms`) so the numbers line up with his.
 * Anything that WOULD depend on real content is not measured here.
 *
 * WHAT THIS PROBE DOES NOT DO. It does not change MAX_IMPORT_SIZE and does not
 * write to `klatch.db` (guarded below). It takes no position on what the cap's
 * value should be — that ruling is xian's. It answers only whether the cap, at
 * whatever value, does what the code claims it does on this route.
 *
 * Run: npx tsx scripts/probe-import-multipart-cap.mts
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import net from 'net';
import { spawn, execFileSync } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'import-multipart-cap');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const REAL_DB = path.join(REPO, 'klatch.db');

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

const ms = (n: number) => `${n.toFixed(0)} ms`;
const mbn = (n: number) => n / 1048576;
const mb = (n: number) => `${mbn(n).toFixed(1)} MB`;

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

// ── Real-DB guard, captured before anything starts ───────────────────────────

const realDbBefore = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;

// ── Server lifecycle (Round 146/148/150 discipline) ──────────────────────────

let server: ReturnType<typeof spawn> | undefined;
function killServer() {
  if (!server) return;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
  server = undefined;
}
process.on('exit', killServer);
process.on('SIGINT', () => { killServer(); process.exit(130); });

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

async function waitForPortFree(): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await portIsFree(PORT)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`port ${PORT} still occupied 30 s after SIGTERM`);
}

async function startServer(tag: string, extraEnv: Record<string, string> = {}): Promise<void> {
  await waitForPortFree();
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'a');
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: DB, ...extraEnv },
    stdio: ['ignore', logFd, logFd],
  });
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode}) — see ${logPath}`);
    }
    let booted = false;
    try { booted = fs.readFileSync(logPath, 'utf8').includes('Klatch server running'); } catch { /* not yet */ }
    if (booted) {
      try { if ((await fetch(`${BASE}/api/channels`, { headers: { connection: 'close' } })).ok) return; } catch { /* not yet */ }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not listen on ${PORT} in 90 s — see ${logPath}`);
}

/** Resident set of the server process tree, in bytes. `npx tsx` execs a child. */
function serverRssBytes(): number {
  if (!server?.pid) return 0;
  try {
    const out = execFileSync('ps', ['-Ao', 'pid=,ppid=,rss='], { encoding: 'utf8' });
    const rows = out.trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
    const byParent = new Map<number, number[]>();
    const rssOf = new Map<number, number>();
    for (const [pid, ppid, rss] of rows) {
      rssOf.set(pid, rss * 1024);
      if (!byParent.has(ppid)) byParent.set(ppid, []);
      byParent.get(ppid)!.push(pid);
    }
    let total = 0;
    const stack = [server.pid];
    const seen = new Set<number>();
    while (stack.length) {
      const pid = stack.pop()!;
      if (seen.has(pid)) continue;
      seen.add(pid);
      total += rssOf.get(pid) ?? 0;
      for (const child of byParent.get(pid) ?? []) stack.push(child);
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * Poll RSS while `fn` runs; returns the peak seen.
 *
 * SAMPLED, therefore a LOWER BOUND. A 25 ms interval against a request that
 * completes in a few hundred ms gives roughly a dozen samples; a spike shorter
 * than the interval can be missed entirely. Every peak reported below should be
 * read as "at least this much", never as "exactly this much".
 */
const RSS_POLL_MS = 25;
async function withPeakRss<T>(fn: () => Promise<T>): Promise<{ value: T; peakRss: number; baseRss: number; samples: number }> {
  const baseRss = serverRssBytes();
  let peakRss = baseRss;
  let samples = 0;
  let running = true;
  const poll = (async () => {
    while (running) {
      const r = serverRssBytes();
      samples++;
      if (r > peakRss) peakRss = r;
      await new Promise((res) => setTimeout(res, RSS_POLL_MS));
    }
  })();
  try {
    const value = await fn();
    return { value, peakRss, baseRss, samples };
  } finally {
    running = false;
    await poll;
  }
}

/**
 * A FRESH SERVER PER ARM, and the reason is a confound this probe hit on its
 * first run and got wrong.
 *
 * Run 1 shared one server across all arms. Arm C (70 MB, rejected by the cap)
 * showed a 379 MB peak; arm D (the same 70 MB, rejected one check EARLIER)
 * showed 1.6 MB, and the probe reported that as "formData() is not buffering
 * the whole part." That reading was false. V8 does not return pages to the OS,
 * so arm D ran against a heap arm C had already grown to 644 MB — it allocated
 * nothing NEW because it did not have to. RSS deltas are only meaningful
 * against a cold baseline, which is exactly the effect Theseus recorded in
 * Round 150 ("~0 after, because V8's heap is already sized") and which I then
 * walked into from the other side.
 *
 * Sleeping between arms does not fix it; only a new process does.
 */
async function freshServer(tag: string): Promise<void> {
  killServer();
  await startServer(tag);
  // Let boot-time allocation settle so the baseline is the server at rest.
  await new Promise((r) => setTimeout(r, 2000));
}

// ── Payload synthesis ────────────────────────────────────────────────────────

/**
 * Write `bytes` of plausible JSONL. Content is never parsed in any arm here
 * (every response is a 400), so this only has to be the right SIZE and the
 * right SHAPE-at-a-glance for anyone who opens it.
 */
function synthesize(name: string, bytes: number): string {
  const p = path.join(SCRATCH, name);
  const line = JSON.stringify({
    type: 'user',
    uuid: '00000000-0000-4000-8000-000000000000',
    timestamp: '2026-09-04T00:00:00.000Z',
    message: { role: 'user', content: 'synthetic padding for a size-only measurement. '.repeat(20) },
  }) + '\n';
  const chunk = line.repeat(64);
  const fd = fs.openSync(p, 'w');
  let written = 0;
  while (written < bytes) {
    const take = Math.min(chunk.length, bytes - written);
    written += fs.writeSync(fd, take === chunk.length ? chunk : chunk.slice(0, take));
  }
  fs.closeSync(fd);
  return p;
}

/** POST one file as multipart/form-data, streaming it from disk (no probe-side copy). */
async function postMultipart(route: string, filePath: string, filename: string): Promise<{ status: number; body: string }> {
  const blob = await fs.openAsBlob(filePath);
  const fd = new FormData();
  fd.append('file', blob, filename);
  const res = await fetch(`${BASE}${route}`, { method: 'POST', body: fd, headers: { connection: 'close' } });
  return { status: res.status, body: (await res.text()).slice(0, 200) };
}

// ── Arm A — static: where does the cap sit relative to the buffering? ─────────

console.log('── arm A: cap position in the source, per multipart site ────────');

const IMPORT_TS = path.join(REPO, 'packages/server/src/routes/import.ts');
const importSrc = fs.readFileSync(IMPORT_TS, 'utf8');

const capMatch = importSrc.match(/const MAX_IMPORT_SIZE = (\d+) \* 1024 \* 1024;/);
if (!capMatch) {
  console.error('FATAL: could not read MAX_IMPORT_SIZE out of routes/import.ts — refusing to assume 50 MB');
  process.exit(1);
}
const MAX_IMPORT_SIZE = Number(capMatch[1]) * 1024 * 1024;
check('A', 'MAX_IMPORT_SIZE read from source', true,
  `${mb(MAX_IMPORT_SIZE)} (routes/import.ts, not hardcoded in this probe)`);

/**
 * Where does the exact per-file cap check sit relative to the copy?
 *
 * ROUND 154 UPDATE. When this probe was written, all four sites read
 * `arrayBuffer.byteLength > MAX_IMPORT_SIZE`, and this arm asserted that
 * ordering — body copied, THEN checked. Round 154 measured the cost of that
 * ordering on the Content-Length fall-through path (95.3 MB, more than two full
 * copies of a 45.3 MB file, spent to reject it) and moved the check onto
 * `file.size` in `rejectOversizeFile`, one line ahead of `arrayBuffer()`.
 *
 * So this arm now recognises BOTH shapes and says which build it is measuring,
 * rather than failing on the newer one. It still fails if it can find neither —
 * that would mean the cap check has gone missing, which is the thing worth
 * screaming about.
 */
const lineOf = (idx: number) => importSrc.slice(0, idx).split('\n').length;
const byteLengthGuards = [...importSrc.matchAll(/arrayBuffer\.byteLength > MAX_IMPORT_SIZE/g)];
const sizeGuards = [...importSrc.matchAll(/rejectOversizeFile\(c, file\)/g)];
check('A', 'multipart cap sites found', byteLengthGuards.length + sizeGuards.length > 0,
  `${byteLengthGuards.length} checking arrayBuffer.byteLength (pre-Round-154 shape), ` +
  `${sizeGuards.length} checking file.size via rejectOversizeFile (Round 154 shape)`);

let bufferedBeforeCap = 0;
for (const g of byteLengthGuards) {
  const guardIdx = g.index!;
  const before = importSrc.slice(0, guardIdx);
  const fdIdx = before.lastIndexOf('c.req.formData()');
  const abIdx = before.lastIndexOf('.arrayBuffer()');
  const ok = fdIdx !== -1 && abIdx !== -1 && fdIdx < abIdx && abIdx < guardIdx;
  if (ok) bufferedBeforeCap++;
  check('A', `site at line ${lineOf(guardIdx)}`, true,
    ok
      ? `formData() line ${lineOf(fdIdx)} -> arrayBuffer() line ${lineOf(abIdx)} -> cap line ${lineOf(guardIdx)} — body fully buffered BEFORE the cap runs`
      : `unexpected ordering (formData ${fdIdx === -1 ? 'absent' : lineOf(fdIdx)}, arrayBuffer ${abIdx === -1 ? 'absent' : lineOf(abIdx)})`,
    'measurement');
}

/** Round 154 shape: the check must precede `arrayBuffer()` in the same handler. */
let checkedBeforeCopy = 0;
for (const g of sizeGuards) {
  const guardIdx = g.index!;
  const abIdx = importSrc.indexOf('.arrayBuffer()', guardIdx);
  const ok = abIdx !== -1 && guardIdx < abIdx;
  if (ok) checkedBeforeCopy++;
  check('A', `site at line ${lineOf(guardIdx)}`, true,
    ok
      ? `cap line ${lineOf(guardIdx)} -> arrayBuffer() line ${lineOf(abIdx)} — the check runs BEFORE the copy`
      : 'unexpected ordering: no arrayBuffer() found after the cap check in this handler',
    'measurement');
}

check('A', 'ordering of the exact per-file check, per site',
  bufferedBeforeCap + checkedBeforeCopy === byteLengthGuards.length + sizeGuards.length,
  `${bufferedBeforeCap} site(s) allocate the whole body first (old shape), ` +
  `${checkedBeforeCopy} site(s) refuse before the copy (Round 154)`,
  'measurement');

/**
 * Is the Round 151 pre-read guard present? Everything below reads differently
 * depending on the answer, so the probe establishes it from source rather than
 * inferring it from the numbers it is about to take.
 */
const guardSites = [...importSrc.matchAll(/rejectOversizeBeforeRead\(c\)/g)];
// Round 154: the site count is the sum of both cap-check shapes, not just the
// pre-154 one — otherwise this compares 4 guards against 0 sites and calls it
// guarded for the wrong reason.
const multipartSiteCount = byteLengthGuards.length + sizeGuards.length;
const GUARD_PRESENT = guardSites.length >= multipartSiteCount && guardSites.length > 0;
check('A', 'pre-read guard present at every multipart site', true,
  GUARD_PRESENT
    ? `${guardSites.length} call sites of rejectOversizeBeforeRead vs ${multipartSiteCount} multipart sites — measuring the GUARDED build`
    : `${guardSites.length} call sites vs ${multipartSiteCount} multipart sites — measuring the UNGUARDED build`,
  'measurement');

// The path-based sites, for contrast: they stat() and can refuse without reading.
const statGuards = [...importSrc.matchAll(/stat\.size > MAX_IMPORT_SIZE/g)];
check('A', 'path-based sites refuse on stat()', statGuards.length > 0,
  `${statGuards.length} sites check stat.size — no bytes read to reject (lines ${statGuards.map((g) => lineOf(g.index!)).join(', ')})`,
  'measurement');

// ── Arm B — is a pre-buffer guard even implementable? Content-Length on the wire

console.log('\n── arm B: what the client actually puts on the wire ─────────────');

/**
 * A cheap guard would reject on Content-Length before touching the body. That
 * is only sound if the header is THERE. Ask the wire rather than assuming:
 * a throwaway socket server that reads the request head and hangs up. This
 * touches no Klatch code.
 */
const sniffed: { headers: string } = { headers: '' };
const sniffPort = await new Promise<number>((resolve) => {
  const s = net.createServer((sock) => {
    let buf = '';
    sock.on('data', (d) => {
      buf += d.toString('latin1');
      const end = buf.indexOf('\r\n\r\n');
      if (end !== -1 && !sniffed.headers) {
        sniffed.headers = buf.slice(0, end);
        sock.end('HTTP/1.1 413 Payload Too Large\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
      }
    });
    sock.on('error', () => { /* client hung up first; expected */ });
  });
  s.listen(0, '127.0.0.1', () => resolve((s.address() as net.AddressInfo).port));
});

const sniffFile = synthesize('sniff.jsonl', 2 * 1024 * 1024);
try {
  const blob = await fs.openAsBlob(sniffFile);
  const fd = new FormData();
  fd.append('file', blob, 'sniff.jsonl');
  await fetch(`http://127.0.0.1:${sniffPort}/sniff`, { method: 'POST', body: fd }).catch(() => undefined);
} catch { /* the point is the headers, not the response */ }
await new Promise((r) => setTimeout(r, 300));

const clHeader = sniffed.headers.split('\r\n').find((h) => /^content-length:/i.test(h));
const teHeader = sniffed.headers.split('\r\n').find((h) => /^transfer-encoding:/i.test(h));
if (!sniffed.headers) {
  skip('B', 'no request head captured — cannot say what the client sends');
} else {
  check('B', 'Content-Length present on a multipart upload', Boolean(clHeader),
    clHeader
      ? `${clHeader.trim()} for a ${mb(2 * 1024 * 1024)} part — a pre-buffer guard has a number to read`
      : `absent; ${teHeader?.trim() ?? 'no transfer-encoding either'} — a pre-buffer guard would have nothing to read`,
    'measurement');
}

// ── Server up for the endpoint arms ──────────────────────────────────────────

const OVER = Math.round(70.3 * 1024 * 1024);   // mirrors PM's `docs` head
const UNDER = Math.round(45.3 * 1024 * 1024);  // mirrors the largest head that DID import

const overFile = synthesize('over-cap.jsonl', OVER);
const overTxt = synthesize('over-cap.txt', OVER);
const underFile = synthesize('under-cap.jsonl', UNDER);

check('A', 'payloads synthesized', true,
  `over ${mb(fs.statSync(overFile).size)}, over-as-.txt ${mb(fs.statSync(overTxt).size)}, under ${mb(fs.statSync(underFile).size)}`,
  'measurement');

// ── Arm C — the over-cap multipart request that the cap rejects ───────────────

console.log('\n── arm C: 70 MB multipart upload, rejected by the cap ───────────');

await freshServer('C');
const cStart = performance.now();
const c = await withPeakRss(() => postMultipart('/api/import/claude-code', overFile, 'over-cap.jsonl'));
const cMs = performance.now() - cStart;

check('C', 'over-cap multipart is rejected', c.value.status === 400,
  `HTTP ${c.value.status} in ${ms(cMs)} — ${c.value.body}`);
if (c.baseRss === 0 || c.peakRss === 0) {
  skip('C', 'ps gave no RSS reading — memory cost not measured, NOT measured-as-zero');
} else {
  check('C', 'memory spent to reject it', true,
    `base ${mb(c.baseRss)} -> peak ${mb(c.peakRss)}, delta ${mb(c.peakRss - c.baseRss)} ` +
    `(${((c.peakRss - c.baseRss) / OVER).toFixed(2)}x the file, ${c.samples} samples @ ${RSS_POLL_MS} ms — peak is a lower bound)`,
    'measurement');
}

// ── Arm D — rejected EARLIER, by the extension check, which precedes the cap ──

console.log('\n── arm D: same bytes, refused by the .jsonl check instead ───────');

/**
 * `file.name.endsWith('.jsonl')` sits ABOVE the cap and above `arrayBuffer()`.
 * If this arm still spends the memory, then the buffering belongs to
 * `c.req.formData()` itself and NO validation placed in the handler — the cap
 * included — can prevent the allocation. That is the discriminating run.
 */
await freshServer('D');
const dStart = performance.now();
const d = await withPeakRss(() => postMultipart('/api/import/claude-code', overTxt, 'over-cap.txt'));
const dMs = performance.now() - dStart;

check('D', 'wrong-extension upload is rejected', d.value.status === 400,
  `HTTP ${d.value.status} in ${ms(dMs)} — ${d.value.body}`);
if (d.baseRss === 0 || d.peakRss === 0) {
  skip('D', 'ps gave no RSS reading — memory cost not measured, NOT measured-as-zero');
} else {
  const delta = d.peakRss - d.baseRss;
  check('D', 'memory spent before the extension check could refuse', true,
    `base ${mb(d.baseRss)} -> peak ${mb(d.peakRss)}, delta ${mb(delta)} ` +
    `(${(delta / OVER).toFixed(2)}x the file, ${d.samples} samples @ ${RSS_POLL_MS} ms)`,
    'measurement');
  /**
   * The conclusion inverts depending on which build is under test, so name the
   * build. On the UNGUARDED build a large delta here is the finding: the bytes
   * were read before any handler check could refuse them. On the GUARDED build
   * a ~zero delta is the finding: nothing was read at all, and arm D no longer
   * discriminates between rejection reasons because the guard refuses first.
   */
  const buffered = delta > OVER * 0.5;
  if (GUARD_PRESENT) {
    check('D', 'guarded build: no body read before refusal', !buffered,
      !buffered
        ? `${mb(delta)} — the guard refused on content-length; formData() never ran, so the rejection reason is the guard's, not the extension check's`
        : `${mb(delta)} spent despite the guard — the guard did not fire on this request`,
      'measurement');
  } else {
    check('D', 'unguarded build: buffering is formData()\'s, not the cap\'s to prevent',
      buffered,
      buffered
        ? `${mb(delta)} spent on a request refused ABOVE the cap — the allocation is not something the cap can stop`
        : `only ${mb(delta)} — formData() is not buffering the whole part; the cap may still be doing real work`,
      'measurement');
  }
}

// ── Arm E — control: the path-based route refuses the same size for free ─────

console.log('\n── arm E: control — path-based route, same size ─────────────────');

await freshServer('E');
const eStart = performance.now();
const e = await withPeakRss(async () => {
  const res = await fetch(`${BASE}/api/import/claude-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', connection: 'close' },
    body: JSON.stringify({ sessionPath: overFile }),
  });
  return { status: res.status, body: (await res.text()).slice(0, 200) };
});
const eMs = performance.now() - eStart;

check('E', 'path-based over-cap is rejected', e.value.status === 400 || e.value.status === 404,
  `HTTP ${e.value.status} in ${ms(eMs)} — ${e.value.body}`);
if (e.value.status === 404) {
  skip('E', 'path rejected by validateImportPath (scratch dir is outside the allowed roots) — ' +
    'the size comparison below is therefore not like-for-like; Theseus measured the real one at 5 ms');
}
if (e.baseRss !== 0 && e.peakRss !== 0) {
  check('E', 'memory spent to reject it', true,
    `base ${mb(e.baseRss)} -> peak ${mb(e.peakRss)}, delta ${mb(e.peakRss - e.baseRss)} ` +
    `(${e.samples} samples @ ${RSS_POLL_MS} ms)`,
    'measurement');
}

// ── Arm F — the under-cap multipart upload, for the shape of the curve ───────

console.log('\n── arm F: 45 MB multipart upload — under the cap, accepted ──────');

/**
 * Under-cap uploads proceed to parse and import. That writes to the SCRATCH db
 * (KLATCH_DB), never to klatch.db — guarded at the end. The point here is only
 * that the buffering cost is paid on the accepted path too, and how it compares.
 */
await freshServer('F');
const fStart = performance.now();
const f = await withPeakRss(() => postMultipart('/api/import/claude-code', underFile, 'under-cap.jsonl'));
const fMs = performance.now() - fStart;

check('F', 'under-cap multipart is accepted or fails on content, not size',
  !f.value.body.includes('File too large'),
  `HTTP ${f.value.status} in ${ms(fMs)} — ${f.value.body}`,
  'measurement');
if (f.baseRss !== 0 && f.peakRss !== 0) {
  check('F', 'memory for an ALLOWED upload', true,
    `base ${mb(f.baseRss)} -> peak ${mb(f.peakRss)}, delta ${mb(f.peakRss - f.baseRss)} ` +
    `(${((f.peakRss - f.baseRss) / UNDER).toFixed(2)}x the file, ${f.samples} samples @ ${RSS_POLL_MS} ms)`,
    'measurement');
}

// ── Real-DB guard ────────────────────────────────────────────────────────────

killServer();
await new Promise((r) => setTimeout(r, 500));

const realDbAfter = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;
if (!realDbBefore && !realDbAfter) {
  check('G', 'klatch.db untouched', true, 'no klatch.db before or after');
} else if (realDbBefore && realDbAfter) {
  const same = realDbBefore.size === realDbAfter.size && realDbBefore.mtimeMs === realDbAfter.mtimeMs;
  check('G', 'klatch.db untouched', same,
    same ? `size ${realDbAfter.size} and mtime unchanged`
         : `CHANGED: ${realDbBefore.size}->${realDbAfter.size} bytes, mtime ${realDbBefore.mtimeMs}->${realDbAfter.mtimeMs}`);
} else {
  check('G', 'klatch.db untouched', false, 'klatch.db appeared or vanished during the run');
}

const srcAfter = fs.readFileSync(IMPORT_TS, 'utf8');
check('G', 'routes/import.ts unmodified by this probe', srcAfter === importSrc,
  srcAfter === importSrc ? 'byte-identical to the source read at start' : 'SOURCE CHANGED DURING RUN');

// ── Summary ──────────────────────────────────────────────────────────────────

const failed = results.filter((r) => !r.pass && r.kind === 'regression');
console.log(`\n${'─'.repeat(64)}`);
console.log(`${results.length} checks, ${failed.length} failed, ${skipped.length} skipped.`);
for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
for (const s of skipped) console.log(`  SKIP ${s}`);
console.log(`Scratch: ${SCRATCH}`);
process.exit(failed.length ? 1 : 0);
