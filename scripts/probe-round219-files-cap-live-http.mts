/**
 * Round 219 — Daedalus's Round 218 pre-read cap, driven at the wire.
 *
 * ## Why this probe exists
 *
 * Daedalus closed both of my Round 217 items in `dd4bba07` / `27889176` and then wrote
 * (memo §5, "Not claiming"):
 *
 *   > **I did not drive this over a socket.** Everything above is `app.request()`. Your arm L
 *   > is the only thing that has ever shown this defect from the outside and the fix deserves
 *   > the same treatment — offering it rather than assuming it.
 *
 * This is that treatment. Every claim below is a real TCP connection to a real
 * `npx tsx src/index.ts`, most of them written onto a raw `net.Socket` because the property
 * under test is a `Content-Length` check and `fetch` computes `Content-Length` from the bytes
 * you hand it — there is no way to make it lie. A lying header is the only instrument that
 * can tell "refused at the header" apart from "refused after buffering 200 MB", and on
 * 2026-09-15 it was the instrument that showed these two routes did not answer *at all*.
 *
 * ## The 9/15 baseline this is measured against
 *
 * Round 217 arm L, same two paths, same request (`Content-Length: 209715200`, ~45 bytes sent):
 *
 *   MEAS [L] uncapped: files-channel   — no response in 4004ms
 *   MEAS [L] uncapped: files-project   — no response in 4004ms
 *
 * An uncapped route does not merely spend the memory. It stops answering, because it is still
 * waiting for bytes the client promised and never sent. Arm A re-drives exactly that request.
 *
 * ## Arms
 *
 *   A  the two `files.ts` upload sites answer the 9/15 request — status, sentence, latency
 *   B  the two route families' refusals differ at the wire, each read out of a real response
 *   C  the cap's sentence and the EXACT check's sentence, both driven from the product, and
 *      the one word between them — plus what makes them agree, which is not what it looks like
 *   D  placement: the project 404 still outranks the cap; the channel site has nothing above it
 *   E  the three fall-through rules, at the wire, including the boundary pair
 *   F  acceptance controls — the cap refuses nothing that was accepted on 9/15
 *   G  all nine routers are reachable on the live server (`mountApiRoutes` in production)
 *
 * Constants are read out of the source at probe start, never typed here, so a re-sizing of
 * either limit does not silently turn a check into a tautology. That failure mode is Daedalus's
 * own Round 218 §3 finding and it is the reason arm E computes its request sizes rather than
 * naming them.
 *
 * Run: `npx tsx scripts/probe-round219-files-cap-live-http.mts`  (needs port 3001 free)
 */

import { spawn, execFileSync } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round219-files-cap');
const DB = path.join(SCRATCH, 'scratch.db');
const FILES_DIR = path.join(SCRATCH, 'klatch-files');
const PORT = 3001;
const HOST = '127.0.0.1';
const BASE = `http://${HOST}:${PORT}/api`;

type Kind = 'regression' | 'measurement' | 'open' | 'note';

// ── Constants, read out of the product ───────────────────────────────────────

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(REPO, 'packages/server/src', rel), 'utf8');
}
function readNumberConst(rel: string, name: string): number {
  const src = readSrc(rel);
  const m = src.match(new RegExp(`export const ${name}\\s*=\\s*([^;]+);`));
  if (!m) throw new Error(`could not read ${name} from ${rel}`);
  // Only arithmetic on numeric literals — deliberately not a general evaluator.
  const expr = m[1].trim();
  if (!/^[\d\s*+/()-]+$/.test(expr)) throw new Error(`${name} in ${rel} is not a numeric expression: ${expr}`);
  // eslint-disable-next-line no-new-func
  return Number(new Function(`return (${expr});`)());
}

const MAX_FILE_SIZE_BYTES = readNumberConst('files/storage.ts', 'MAX_FILE_SIZE_BYTES');
const MULTIPART_ENVELOPE_ALLOWANCE = readNumberConst('routes/size-cap.ts', 'MULTIPART_ENVELOPE_ALLOWANCE');
/** The declared size arm L used on 9/15. Kept verbatim so arm A re-drives the same request. */
const R217_DECLARED = 209_715_200;

/** The exact check's sentence, as a literal in `storage.ts` — arm C has something to say about this. */
const VALIDATE_FILE_SENTENCE_LITERAL = (() => {
  const m = readSrc('files/storage.ts').match(/reason:\s*`(File too large[^`]*)`/);
  return m ? m[1] : null;
})();

// ── Bookkeeping ──────────────────────────────────────────────────────────────

const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'regression' ? 'FAIL' : kind === 'open' ? 'OPEN' : 'NOTE';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
function measure(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, detail, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name} — ${detail}`);
}

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, HOST);
  });
}

function packagesDiff(): string {
  return execFileSync('git', ['diff', '--stat', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}
const diffBefore = packagesDiff();

// ── Server ───────────────────────────────────────────────────────────────────

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(FILES_DIR, { recursive: true });

if (!(await portIsFree(PORT))) {
  console.error(`port ${PORT} is occupied — this probe needs to own the server. Stop the dev server and re-run.`);
  process.exit(2);
}

const serverLog = path.join(SCRATCH, 'server.log');
const logFd = fs.openSync(serverLog, 'a');
const server = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: path.join(REPO, 'packages/server'),
  env: { ...process.env, KLATCH_DB: DB, KLATCH_FILES_DIR: FILES_DIR },
  stdio: ['ignore', logFd, logFd],
});

async function shutdown(code: number): Promise<never> {
  server.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 400));
  if (server.exitCode === null) server.kill('SIGKILL');
  process.exit(code);
}

{
  const deadline = Date.now() + 45_000;
  let up = false;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      console.error(`server exited early (code ${server.exitCode}). Log:\n${fs.readFileSync(serverLog, 'utf8')}`);
      process.exit(1);
    }
    try { if ((await fetch(`${BASE}/channels`)).ok) { up = true; break; } } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!up) {
    console.error(`server did not come up. Log:\n${fs.readFileSync(serverLog, 'utf8')}`);
    await shutdown(1);
  }
}

// ── Wire helpers ─────────────────────────────────────────────────────────────

type Wire = { status: number; contentType: string | null; text: string; error: string | null; parsed: boolean };

async function wire(method: string, pathname: string, body: BodyInit | undefined, headers: Record<string, string> = {}): Promise<Wire> {
  const res = await fetch(`${BASE}${pathname}`, { method, headers, body });
  const text = (await res.text()).slice(0, 600);
  let error: string | null = null;
  let parsed = false;
  try {
    const j = JSON.parse(text);
    parsed = true;
    error = typeof j?.error === 'string' ? j.error : null;
  } catch { /* parsed stays false */ }
  return { status: res.status, contentType: res.headers.get('content-type'), text, error, parsed };
}

type RawAnswer = { raw: string | null; ms: number };

/**
 * A request whose `Content-Length` LIES — larger than the bytes that follow, which is the only
 * way to separate "refused at the header" from "refused after buffering the body". `fetch`
 * cannot do this; it computes the header from the body you give it.
 *
 * Returns the response bytes and how long they took, or `raw: null` if the server never
 * answered within `timeoutMs` — which on 9/15 was the observation, not the failure.
 */
function lyingContentLength(
  rawPath: string, declaredBytes: number, contentType: string, chunk: string, timeoutMs = 4000
): Promise<RawAnswer> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const sock = net.connect(PORT, HOST);
    let buf = '';
    let done = false;
    const finish = (v: string | null) => {
      if (!done) { done = true; sock.destroy(); resolve({ raw: v, ms: Date.now() - t0 }); }
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    sock.on('connect', () => {
      sock.write(
        `POST /api${rawPath} HTTP/1.1\r\n` +
        `Host: ${HOST}:${PORT}\r\n` +
        `Content-Type: ${contentType}\r\n` +
        `Content-Length: ${declaredBytes}\r\n` +
        `Connection: close\r\n\r\n` +
        chunk
      );
    });
    sock.on('data', (d) => {
      buf += d.toString();
      if (buf.includes('\r\n\r\n') && buf.length > buf.indexOf('\r\n\r\n') + 4) {
        clearTimeout(timer);
        finish(buf);
      }
    });
    sock.on('error', () => { clearTimeout(timer); finish(null); });
    sock.on('close', () => { clearTimeout(timer); finish(buf === '' ? null : buf); });
  });
}

/** A request with NO `Content-Length` at all — chunked transfer-encoding. Fall-through rule 1. */
function chunkedNoContentLength(rawPath: string, contentType: string, body: string, timeoutMs = 8000): Promise<RawAnswer> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const sock = net.connect(PORT, HOST);
    let buf = '';
    let done = false;
    const finish = (v: string | null) => {
      if (!done) { done = true; sock.destroy(); resolve({ raw: v, ms: Date.now() - t0 }); }
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    sock.on('connect', () => {
      const bytes = Buffer.from(body, 'binary');
      sock.write(
        `POST /api${rawPath} HTTP/1.1\r\n` +
        `Host: ${HOST}:${PORT}\r\n` +
        `Content-Type: ${contentType}\r\n` +
        `Transfer-Encoding: chunked\r\n` +
        `Connection: close\r\n\r\n`
      );
      // Two chunks, so the body genuinely arrives in pieces with no declared total.
      const half = Math.floor(bytes.length / 2);
      sock.write(`${half.toString(16)}\r\n`); sock.write(bytes.subarray(0, half)); sock.write('\r\n');
      const rest = bytes.length - half;
      sock.write(`${rest.toString(16)}\r\n`); sock.write(bytes.subarray(half)); sock.write('\r\n');
      sock.write('0\r\n\r\n');
    });
    sock.on('data', (d) => {
      buf += d.toString();
      if (buf.includes('\r\n\r\n') && buf.length > buf.indexOf('\r\n\r\n') + 4) { clearTimeout(timer); finish(buf); }
    });
    sock.on('error', () => { clearTimeout(timer); finish(null); });
    sock.on('close', () => { clearTimeout(timer); finish(buf === '' ? null : buf); });
  });
}

/** A `Content-Length` that is not a number. Fall-through rule 2 — if node lets it through at all. */
function malformedContentLength(rawPath: string, rawValue: string, contentType: string, chunk: string, timeoutMs = 4000): Promise<RawAnswer> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const sock = net.connect(PORT, HOST);
    let buf = '';
    let done = false;
    const finish = (v: string | null) => {
      if (!done) { done = true; sock.destroy(); resolve({ raw: v, ms: Date.now() - t0 }); }
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    sock.on('connect', () => {
      sock.write(
        `POST /api${rawPath} HTTP/1.1\r\n` +
        `Host: ${HOST}:${PORT}\r\n` +
        `Content-Type: ${contentType}\r\n` +
        `Content-Length: ${rawValue}\r\n` +
        `Connection: close\r\n\r\n` +
        chunk
      );
    });
    sock.on('data', (d) => {
      buf += d.toString();
      if (buf.includes('\r\n\r\n') && buf.length > buf.indexOf('\r\n\r\n') + 4) { clearTimeout(timer); finish(buf); }
    });
    sock.on('error', () => { clearTimeout(timer); finish(null); });
    sock.on('close', () => { clearTimeout(timer); finish(buf === '' ? null : buf); });
  });
}

function statusOf(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.match(/^HTTP\/1\.\d (\d{3})/);
  return m ? Number(m[1]) : null;
}
function sentenceOf(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/\{"error":"((?:[^"\\]|\\.)*)"\}/);
  if (!m) return null;
  try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
}

const BOUNDARY = '----klatchround219';
/** A small, well-formed multipart body with one file part. */
function multipart(fileName: string, mime: string, content: string, extra?: { name: string; value: string }): string {
  let b = `--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
          `Content-Type: ${mime}\r\n\r\n${content}\r\n`;
  if (extra) b += `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${extra.name}"\r\n\r\n${extra.value}\r\n`;
  return b + `--${BOUNDARY}--\r\n`;
}
const MULTIPART_CT = `multipart/form-data; boundary=${BOUNDARY}`;

// ── Fixtures ─────────────────────────────────────────────────────────────────

const created = await wire('POST', '/projects', JSON.stringify({ name: 'r219 cap probe' }), { 'Content-Type': 'application/json' });
let PROJECT_ID: string | null = null;
try { PROJECT_ID = JSON.parse(created.text)?.id ?? null; } catch { /* reported below */ }
if (!PROJECT_ID) {
  console.error(`could not create a project fixture: ${created.status} ${created.text}`);
  await shutdown(1);
}

const chanRes = await wire('POST', '/channels', JSON.stringify({ name: 'r219-cap-probe' }), { 'Content-Type': 'application/json' });
let CHANNEL_ID: string | null = null;
try { CHANNEL_ID = JSON.parse(chanRes.text)?.id ?? null; } catch { /* reported below */ }
if (!CHANNEL_ID) {
  console.error(`could not create a channel fixture: ${chanRes.status} ${chanRes.text}`);
  await shutdown(1);
}
// Arm F needs a channel with NO entities on it. The upload handler's last gate before it
// starts streaming is `No entities assigned to this channel` (files.ts:120), so an empty
// channel is what lets arm F prove the body was read, parsed and validated without spending
// an Anthropic call to prove it.
//
// Getting one is not what it looks like, and the first run of this probe found that out the
// expensive way — the upload returned 200 and dispatched a real stream, because:
//
//   1. `POST /channels` NEVER makes an empty channel. `createChannel` (queries.ts:177) falls
//      back to `[DEFAULT_ENTITY_ID]` when no roster is given.
//   2. `DELETE /channels/:id/entities/:eid` REFUSES to make one: `count <= 1` →
//      `Cannot remove the last entity from a channel` (entities.ts:229).
//
// The way through is a third route that has no such floor — `DELETE /entities/:id` calls
// `deleteEntity`, which runs `DELETE FROM channel_entities WHERE entity_id = ?` with no
// check on what that leaves behind (queries.ts:483). So: seat a channel on one purpose-made
// entity, delete the ENTITY, and the channel is empty. Arm F reports that asymmetry, since
// it is the only reason `files.ts:120` is reachable at all.
let entityCount = -1;
let emptiedBy = 'not emptied';
let lastEntityRefusal: string | null = null;
{
  const seeded = await wire('POST', '/entities', JSON.stringify({ name: 'r219-doomed-agent' }), { 'Content-Type': 'application/json' });
  let seededId: string | null = null;
  try { seededId = JSON.parse(seeded.text)?.id ?? null; } catch { /* reported below */ }
  if (!seededId) { console.error(`could not create the arm F entity: ${seeded.status} ${seeded.text}`); await shutdown(1); }

  const seatedChan = await wire('POST', '/channels', JSON.stringify({ name: 'r219-empty-channel', entityIds: [seededId] }), { 'Content-Type': 'application/json' });
  let seatedId: string | null = null;
  try { seatedId = JSON.parse(seatedChan.text)?.id ?? null; } catch { /* reported below */ }
  if (!seatedId) { console.error(`could not create the arm F channel: ${seatedChan.status} ${seatedChan.text}`); await shutdown(1); }

  // Route 2, driven so the refusal is measured and not quoted from source.
  const refuse = await wire('DELETE', `/channels/${seatedId}/entities/${seededId}`, undefined);
  lastEntityRefusal = `${refuse.status} ${JSON.stringify(refuse.error)}`;

  // Route 3, which has no floor.
  const nuked = await wire('DELETE', `/entities/${seededId}`, undefined);
  emptiedBy = `DELETE /entities/:id → ${nuked.status}`;

  const after = await wire('GET', `/channels/${seatedId}/entities`, undefined);
  try { entityCount = JSON.parse(after.text)?.length ?? -1; } catch { /* left at -1 */ }
  if (entityCount !== 0) {
    console.error(`fixture: channel still has ${entityCount} entities — arm F would dispatch a live model call. Refusing to continue.`);
    await shutdown(2);
  }
  CHANNEL_ID = seatedId;
}

const CHANNEL_SITE = `/channels/${CHANNEL_ID}/files`;
const PROJECT_SITE = `/projects/${PROJECT_ID}/files`;
const IMPORT_SITE = '/import/claude-code';

try {

// ── Arm A — the 9/15 request, re-driven ──────────────────────────────────────

{
  console.log(`\n=== Arm A — the two files.ts upload sites, same request that got no answer on 9/15 ===`);
  const sites = [
    { key: 'files-channel', p: CHANNEL_SITE, src: 'files.ts:85' },
    { key: 'files-project', p: PROJECT_SITE, src: 'files.ts:420' },
  ];
  const answers: Record<string, RawAnswer> = {};
  for (const s of sites) {
    const a = await lyingContentLength(s.p, R217_DECLARED, MULTIPART_CT, `--${BOUNDARY}\r\nContent-Dispo`);
    answers[s.key] = a;
    measure('A', `${s.key} (${s.src})`,
      a.raw === null
        ? `NO RESPONSE in ${a.ms}ms — unchanged from 9/15`
        : `${statusOf(a.raw)} in ${a.ms}ms · ${JSON.stringify(sentenceOf(a.raw))}`);
  }

  check('A', 'both files.ts upload sites now ANSWER a lying oversize Content-Length (9/15: neither did)',
    sites.every((s) => answers[s.key].raw !== null),
    sites.map((s) => `${s.key}=${answers[s.key].raw === null ? 'no answer' : `answered in ${answers[s.key].ms}ms`}`).join(' · '));

  check('A', 'both refuse with 400',
    sites.every((s) => statusOf(answers[s.key].raw) === 400),
    sites.map((s) => `${s.key}=${statusOf(answers[s.key].raw)}`).join(' · '));

  // The 9/15 failure was a 4-second non-answer. "Fast" here means the body was never read;
  // 200 MB off a loopback socket could not be consumed in this time even if it had been sent.
  check('A', 'both answer before a 200 MB body could have been read (< 500ms)',
    sites.every((s) => answers[s.key].ms < 500),
    sites.map((s) => `${s.key}=${answers[s.key].ms}ms`).join(' · ') + ` (9/15 baseline: 4004ms, no answer)`);

  const declaredMB = (R217_DECLARED / (1024 * 1024)).toFixed(1);
  check('A', `the sentence names the DECLARED size (${declaredMB} MB), which is the number only a header check can know`,
    sites.every((s) => (sentenceOf(answers[s.key].raw) ?? '').includes(`${declaredMB} MB uploaded`)),
    sites.map((s) => `${s.key}=${JSON.stringify(sentenceOf(answers[s.key].raw))}`).join(' · '));

  check('A', 'the sentence names the cap read out of storage.ts, not a number typed into this probe',
    sites.every((s) => (sentenceOf(answers[s.key].raw) ?? '').includes(`Maximum is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`)),
    `MAX_FILE_SIZE_BYTES=${MAX_FILE_SIZE_BYTES} → "Maximum is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB."`);
}

// ── Arm B — two families, two sentences, both off the wire ───────────────────

let capSentence: string | null = null;
let importSentence: string | null = null;
{
  console.log(`\n=== Arm B — the two route families word the same refusal differently, on purpose ===`);
  const filesAnswer = await lyingContentLength(PROJECT_SITE, R217_DECLARED, MULTIPART_CT, `--${BOUNDARY}\r\n`);
  const importAnswer = await lyingContentLength(IMPORT_SITE, R217_DECLARED, MULTIPART_CT, `--${BOUNDARY}\r\n`);
  capSentence = sentenceOf(filesAnswer.raw);
  importSentence = sentenceOf(importAnswer.raw);

  measure('B', 'files.ts family', JSON.stringify(capSentence));
  measure('B', 'import.ts family', JSON.stringify(importSentence));

  check('B', 'both families refuse the identical request, and both do it at the header',
    statusOf(filesAnswer.raw) === 400 && statusOf(importAnswer.raw) === 400,
    `files=${statusOf(filesAnswer.raw)} in ${filesAnswer.ms}ms · import=${statusOf(importAnswer.raw)} in ${importAnswer.ms}ms`);

  check('B', 'the two sentences DIFFER — read from two responses, not compared against a literal in this file',
    capSentence !== null && importSentence !== null && capSentence !== importSentence,
    `${JSON.stringify(capSentence)} vs ${JSON.stringify(importSentence)}`);

  check('B', 'both carry "uploaded" — the word marking a declared envelope size rather than a measured file',
    (capSentence ?? '').includes('uploaded') && (importSentence ?? '').includes('uploaded'),
    `files=${(capSentence ?? '').includes('uploaded')} · import=${(importSentence ?? '').includes('uploaded')}`);

  check('B', 'each names its own family\'s limit, not the other\'s',
    (capSentence ?? '').includes(`Maximum is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`) &&
    (importSentence ?? '').includes('50MB') && !(importSentence ?? '').includes('10 MB'),
    `files→${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB · import→50MB`);
}

// ── Arm C — the cap's sentence and the exact check's, both from the product ──

{
  console.log(`\n=== Arm C — the pre-read cap and the exact check, side by side, both driven ===`);
  // A file over the cap but whose declared envelope is still INSIDE the allowance, so the
  // header check must fall through and `validateFile` must be the one that answers. This is
  // the only way to get both sentences out of the running product in one arm.
  const overCapButUnderDeclaredCeiling = MAX_FILE_SIZE_BYTES + Math.floor(MULTIPART_ENVELOPE_ALLOWANCE / 2);
  const blob = new Blob(['x'.repeat(overCapButUnderDeclaredCeiling)], { type: 'text/plain' });
  const fd = new FormData();
  fd.append('file', blob, 'over-cap.txt');
  const exact = await wire('POST', PROJECT_SITE, fd);
  const exactSentence = exact.error;

  measure('C', `exact check, ${(overCapButUnderDeclaredCeiling / (1024 * 1024)).toFixed(1)} MB really sent`,
    `${exact.status} · ${JSON.stringify(exactSentence)}`);
  measure('C', 'pre-read cap, from arm B', JSON.stringify(capSentence));

  check('C', 'a body over the cap but inside the envelope allowance falls through to the exact check',
    exact.status === 400 && (exactSentence ?? '').startsWith('File too large') && !(exactSentence ?? '').includes('uploaded'),
    `${exact.status} · ${JSON.stringify(exactSentence)} — no "uploaded", so this is validateFile() answering, not the header check`);

  check('C', 'the two sentences agree on the limit — the user meets one number whichever check catches them',
    exactSentence !== null && capSentence !== null &&
    exactSentence.endsWith(`Maximum is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`) &&
    capSentence.endsWith(`Maximum is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`),
    `exact=${JSON.stringify(exactSentence)} · cap=${JSON.stringify(capSentence)}`);

  // …and the reason they agree is worth naming, because it is not the reason it looks like.
  // The cap DERIVES its number from MAX_FILE_SIZE_BYTES; validateFile HARDCODES "10 MB" in a
  // template literal. They agree today because the constant happens to be 10 MB. Re-size the
  // constant and only one of the two sentences follows it.
  const literalIsDerived = VALIDATE_FILE_SENTENCE_LITERAL !== null &&
    /Maximum is \$\{/.test(VALIDATE_FILE_SENTENCE_LITERAL);
  check('C',
    'FINDING: validateFile() hardcodes the limit in its sentence while the cap derives it — they agree only while the constant is unchanged',
    literalIsDerived,
    `storage.ts reason template = ${JSON.stringify(VALIDATE_FILE_SENTENCE_LITERAL)} · ` +
    `size-cap caller derives "${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB" from MAX_FILE_SIZE_BYTES. ` +
    `Change the constant to 20 MB and validateFile still says "10 MB".`,
    'open');
}

// ── Arm D — placement, which is only observable from outside ─────────────────

{
  console.log(`\n=== Arm D — what outranks the cap at each site ===`);
  const ghostProject = await lyingContentLength('/projects/does-not-exist-r219/files', R217_DECLARED, MULTIPART_CT, `--${BOUNDARY}\r\n`);
  const ghostChannel = await lyingContentLength('/channels/does-not-exist-r219/files', R217_DECLARED, MULTIPART_CT, `--${BOUNDARY}\r\n`);

  measure('D', 'nonexistent project + oversize declaration', `${statusOf(ghostProject.raw)} in ${ghostProject.ms}ms · ${JSON.stringify(sentenceOf(ghostProject.raw))}`);
  measure('D', 'nonexistent channel + oversize declaration', `${statusOf(ghostChannel.raw)} in ${ghostChannel.ms}ms · ${JSON.stringify(sentenceOf(ghostChannel.raw))}`);

  check('D', 'the project 404 still outranks the cap — the answer that was already correct did not move',
    statusOf(ghostProject.raw) === 404 && sentenceOf(ghostProject.raw) === 'Project not found',
    `${statusOf(ghostProject.raw)} · ${JSON.stringify(sentenceOf(ghostProject.raw))} (files.ts:409-413 above files.ts:420)`);

  check('D', 'the channel site has nothing above the cap, so an oversize declaration is refused before the channel is looked up',
    statusOf(ghostChannel.raw) === 400 && (sentenceOf(ghostChannel.raw) ?? '').includes('uploaded'),
    `${statusOf(ghostChannel.raw)} · ${JSON.stringify(sentenceOf(ghostChannel.raw))} — the channel check is at files.ts:113, after the body read`);

  check('D', 'the project 404 answers without reading the body either (it is a DB lookup, so hoisting the cap above it would buy nothing)',
    ghostProject.ms < 500,
    `${ghostProject.ms}ms for a request declaring ${(R217_DECLARED / (1024 * 1024)).toFixed(0)} MB and sending ~${`--${BOUNDARY}\r\n`.length} bytes`);

  // The contrast that shows the 404 is a real lookup and not a fallback: same ghost channel,
  // a small honest body, and the channel check answers instead of the cap.
  const honest = await wire('POST', '/channels/does-not-exist-r219/files',
    (() => { const fd = new FormData(); fd.append('file', new Blob(['hi'], { type: 'text/plain' }), 'a.txt'); return fd; })());
  check('D', 'the same ghost channel with an honest small body reaches the channel check',
    honest.status === 404 && honest.error === 'Channel not found',
    `${honest.status} · ${JSON.stringify(honest.error)}`);
}

// ── Arm E — the three fall-through rules, at the wire ────────────────────────

{
  console.log(`\n=== Arm E — the guard can only ever reject earlier, so every ambiguous case must fall through ===`);
  const ceiling = MAX_FILE_SIZE_BYTES + MULTIPART_ENVELOPE_ALLOWANCE;

  // E1/E2 — the boundary pair. One byte apart, and the two outcomes differ in KIND: the
  // request at the ceiling is not refused, so the server waits for a body that never comes;
  // one byte past it is refused without reading. Neither request's size is typed here — both
  // are computed from the two constants, which is what stops this from being Daedalus's
  // mutation-4 tautology in a different costume.
  const atCeiling = await lyingContentLength(PROJECT_SITE, ceiling, MULTIPART_CT, `--${BOUNDARY}\r\n`, 3000);
  const overCeiling = await lyingContentLength(PROJECT_SITE, ceiling + 1, MULTIPART_CT, `--${BOUNDARY}\r\n`, 3000);

  measure('E', `declared == cap + allowance (${ceiling})`, atCeiling.raw === null ? `no answer in ${atCeiling.ms}ms (fell through, waiting for the body)` : `${statusOf(atCeiling.raw)} · ${JSON.stringify(sentenceOf(atCeiling.raw))}`);
  measure('E', `declared == cap + allowance + 1 (${ceiling + 1})`, overCeiling.raw === null ? `no answer in ${overCeiling.ms}ms` : `${statusOf(overCeiling.raw)} in ${overCeiling.ms}ms · ${JSON.stringify(sentenceOf(overCeiling.raw))}`);

  check('E', 'AT the ceiling: not refused by the cap — falls through to the read, exactly as the envelope rule requires',
    atCeiling.raw === null || !(sentenceOf(atCeiling.raw) ?? '').includes('uploaded'),
    atCeiling.raw === null ? `no answer in ${atCeiling.ms}ms — the fall-through is the observation` : `answered ${JSON.stringify(sentenceOf(atCeiling.raw))}`);

  check('E', 'ONE BYTE over the ceiling: refused at the header',
    statusOf(overCeiling.raw) === 400 && (sentenceOf(overCeiling.raw) ?? '').includes('uploaded'),
    `${statusOf(overCeiling.raw)} in ${overCeiling.ms}ms · ${JSON.stringify(sentenceOf(overCeiling.raw))}`);

  check('E', 'the boundary is where the two constants put it, not where this probe put it',
    (atCeiling.raw === null || !(sentenceOf(atCeiling.raw) ?? '').includes('uploaded')) && statusOf(overCeiling.raw) === 400,
    `MAX_FILE_SIZE_BYTES=${MAX_FILE_SIZE_BYTES} + MULTIPART_ENVELOPE_ALLOWANCE=${MULTIPART_ENVELOPE_ALLOWANCE} = ${ceiling}; ${ceiling} falls through, ${ceiling + 1} is refused`);

  // E3 — no Content-Length at all. A real, honest, small body sent chunked.
  const chunked = await chunkedNoContentLength(PROJECT_SITE, MULTIPART_CT, multipart('chunked.txt', 'text/plain', 'hello from a chunked body'));
  measure('E', 'no Content-Length (chunked)', chunked.raw === null ? `no answer in ${chunked.ms}ms` : `${statusOf(chunked.raw)} in ${chunked.ms}ms · ${(chunked.raw.split('\r\n\r\n')[1] ?? '').slice(0, 120)}`);
  check('E', 'absent Content-Length falls through and the upload is handled normally',
    statusOf(chunked.raw) === 201,
    chunked.raw === null ? `no answer in ${chunked.ms}ms` : `${statusOf(chunked.raw)} · ${JSON.stringify(sentenceOf(chunked.raw))}`);

  // E4 — an unparseable Content-Length. The guard's rule 2 says fall through; whether the
  // request ever reaches the guard is node's HTTP parser's call, so this is reported as
  // measured rather than asserted either way.
  const bad = await malformedContentLength(PROJECT_SITE, 'banana', MULTIPART_CT, `--${BOUNDARY}\r\n`, 3000);
  measure('E', 'Content-Length: banana', bad.raw === null ? `no answer in ${bad.ms}ms (connection dropped or held)` : `${statusOf(bad.raw)} · ${(bad.raw.split('\r\n')[0] ?? '')}`);
  check('E', 'an unparseable Content-Length never produces the cap\'s sentence (it either falls through or node rejects the frame)',
    !(sentenceOf(bad.raw) ?? '').includes('uploaded'),
    bad.raw === null ? 'no answer — node closed the connection on the malformed frame' : `answered ${statusOf(bad.raw)} · ${JSON.stringify(sentenceOf(bad.raw))}`);
}

// ── Arm F — acceptance controls ──────────────────────────────────────────────

{
  console.log(`\n=== Arm F — the cap refuses nothing that was accepted before it existed ===`);
  const smallProject = await wire('POST', PROJECT_SITE,
    (() => { const fd = new FormData(); fd.append('file', new Blob(['small and fine'], { type: 'text/plain' }), 'ok.txt'); return fd; })());
  check('F', 'a small valid upload at the project site still succeeds',
    smallProject.status === 201,
    `${smallProject.status} · ${smallProject.text.slice(0, 120)}`);

  const smallChannel = await wire('POST', CHANNEL_SITE,
    (() => { const fd = new FormData(); fd.append('file', new Blob(['small and fine'], { type: 'text/plain' }), 'ok.txt'); return fd; })());
  // This channel has had its entities stripped on purpose: reaching that message proves the
  // body was read, parsed, and passed validateFile — without dispatching a model call to
  // prove it. `entityCount` is read back from the server after the strip, not assumed.
  check('F', 'a small valid upload at the channel site is read, parsed and validated (it reaches the last gate before streaming)',
    smallChannel.status === 400 && smallChannel.error === 'No entities assigned to this channel',
    `${smallChannel.status} · ${JSON.stringify(smallChannel.error)} · channel has ${entityCount} entities`);

  // Not a cap finding, but arm F could not be built without noticing it, so it gets said.
  // Two routes disagree about whether a channel may be left with no entities, and only one
  // of them was ever asked the question.
  check('F',
    'FINDING: "cannot remove the last entity" is enforced at DELETE /channels/:id/entities/:eid and not at DELETE /entities/:id',
    false,
    `per-channel route refused: ${lastEntityRefusal} (entities.ts:229) · global route emptied the channel anyway: ${emptiedBy} ` +
    `(queries.ts:483 deletes every channel_entities row for the entity with no floor) → channel now has ${entityCount} entities. ` +
    `This is the only path that reaches files.ts:120, so the branch is reachable — but by the route that was not guarded, not by the one that was.`,
    'open');

  const exactlyAtCap = new Blob(['y'.repeat(MAX_FILE_SIZE_BYTES)], { type: 'text/plain' });
  const fd = new FormData();
  fd.append('file', exactlyAtCap, 'exactly-at-cap.txt');
  const atCap = await wire('POST', PROJECT_SITE, fd);
  check('F', 'a file of EXACTLY the cap is accepted — the envelope allowance is doing its job over a real socket',
    atCap.status === 201,
    `${MAX_FILE_SIZE_BYTES} bytes → ${atCap.status} · ${(atCap.error ?? atCap.text).slice(0, 140)}`);
}

// ── Arm G — all nine routers, on the live server ─────────────────────────────

{
  console.log(`\n=== Arm G — mountApiRoutes in production: every router reachable at the wire ===`);
  // Hono's unrouted 404 is `404 Not Found` as text/plain. A handler's own 404 is JSON.
  // That difference is what separates "not mounted" from "mounted and said no".
  const routers: Array<{ router: string; method: string; p: string }> = [
    { router: 'channelRoutes', method: 'GET', p: '/channels' },
    { router: 'messageRoutes', method: 'GET', p: `/channels/${CHANNEL_ID}/messages` },
    { router: 'entityRoutes', method: 'GET', p: '/entities' },
    { router: 'importRoutes', method: 'POST', p: '/import/claude-code' },
    { router: 'projectRoutes', method: 'GET', p: '/projects' },
    { router: 'modelRoutes', method: 'GET', p: '/models' },
    { router: 'fileRoutes', method: 'GET', p: `/channels/${CHANNEL_ID}/files` },
    { router: 'aaxtRoutes', method: 'GET', p: '/aaxt/status' },
    { router: 'exportRoutes', method: 'GET', p: `/channels/${CHANNEL_ID}/export` },
  ];
  const reached: string[] = [];
  const missing: string[] = [];
  for (const r of routers) {
    const res = await wire(r.method, r.p, undefined);
    const honoDefault404 = res.status === 404 && !res.parsed && res.text.trim() === '404 Not Found';
    (honoDefault404 ? missing : reached).push(`${r.router}=${res.status}`);
  }
  check('G', `all ${routers.length} routers mounted by mountApiRoutes() answer on the running server`,
    missing.length === 0,
    `reached: ${reached.join(', ')}${missing.length ? ` · UNROUTED: ${missing.join(', ')}` : ''}`);

  // The four that createTestApp() omitted until Round 218, called out by name, since the
  // whole point of the fix is that these are no longer a separate list.
  const theFour = ['modelRoutes', 'fileRoutes', 'aaxtRoutes', 'exportRoutes'];
  check('G', 'the four routers the old test harness omitted are among them',
    theFour.every((n) => reached.some((r) => r.startsWith(n))),
    theFour.map((n) => reached.find((r) => r.startsWith(n)) ?? `${n}=UNROUTED`).join(' · '));

  // The invariant behind the fix: neither entry point keeps a list of its own.
  const indexSrc = readSrc('index.ts');
  const appSrc = readSrc('__tests__/app.ts');
  check('G', 'neither index.ts nor __tests__/app.ts mounts a router of its own — there is one list',
    !/app\.route\(/.test(indexSrc) && !/app\.route\(/.test(appSrc),
    `index.ts app.route( occurrences=${(indexSrc.match(/app\.route\(/g) ?? []).length} · app.ts=${(appSrc.match(/app\.route\(/g) ?? []).length}`);
}

// ── Probe hygiene ────────────────────────────────────────────────────────────

{
  console.log(`\n=== Probe hygiene ===`);
  const diffAfter = packagesDiff();
  check('hygiene', 'the probe modified nothing under packages/',
    diffAfter === diffBefore,
    diffAfter === diffBefore ? `unchanged (${diffBefore === '' ? 'clean' : diffBefore.split('\n').length + ' entries'})` : `BEFORE:\n${diffBefore}\nAFTER:\n${diffAfter}`);

  const log = fs.readFileSync(serverLog, 'utf8');
  const modelFailures = (log.match(/Models API fetch failed/g) ?? []).length;
  measure('hygiene', 'outbound model-fetch failures in this run\'s server log', `${modelFailures} (arm G drives GET /models once)`);
  const stacks = (log.match(/^\s+at /gm) ?? []).length;
  measure('hygiene', 'stack-trace lines in the server log', `${stacks}`);
}

} finally {
  // ── Summary ────────────────────────────────────────────────────────────────
  const regressions = results.filter((r) => r.kind === 'regression');
  const failed = regressions.filter((r) => !r.pass);
  const opens = results.filter((r) => r.kind === 'open' && !r.pass);
  console.log(`\n${'='.repeat(78)}`);
  console.log(`Round 219 — ${regressions.length - failed.length}/${regressions.length} checks pass · ${results.filter((r) => r.kind === 'measurement').length} measurements · ${opens.length} open`);
  if (failed.length) {
    console.log(`\nFAILED:`);
    for (const f of failed) console.log(`  [${f.arm}] ${f.check}\n      ${f.detail}`);
  }
  if (opens.length) {
    console.log(`\nOPEN:`);
    for (const o of opens) console.log(`  [${o.arm}] ${o.check}\n      ${o.detail}`);
  }
  console.log(`${'='.repeat(78)}`);
  await shutdown(failed.length ? 1 : 0);
}
