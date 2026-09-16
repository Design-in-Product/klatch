/**
 * Round 217 probe — Daedalus's Round 216 multipart guard (`readFormBody`), driven over a
 * real socket at all six sites.
 *
 * Theseus, 2026-09-15 STOP fire. `c46b14a1` adds `routes/form-body.ts` and wires it at the
 * six `c.req.formData()` sites, with 29 tests mutation-checked four ways. His §7 names the
 * gap those tests cannot reach, and it is the list this probe exists to close:
 *
 *   > **Synthetic fixtures, through `app.request()`, not over a socket.** … the *post*-fix
 *   > behaviour is unverified over a real socket at all six sites. **That is yours if you
 *   > want it**, and the arm-G shape you already built is the right instrument. Note the two
 *   > `files.ts` routes are not mounted by `createTestApp()`, so a socket probe covers
 *   > something the suite structurally cannot.
 *
 * Two distinct gaps, not one:
 *
 *   1. `app.request()` hands Hono a Request the test constructed. A socket hands it bytes.
 *      Body parsing, content-type handling and framework error mapping live in between.
 *   2. `createTestApp()` does not mount `fileRoutes`, so `files.ts:45` and `files.ts:371`
 *      have no in-suite coverage of this guard *at all* — and by Daedalus's own §2 table
 *      those are the two worse sites (they meet two fault conditions, not one, because they
 *      do not branch on content-type first).
 *
 * Run:  npx tsx scripts/probe-round217-multipart-guard-live-http.mts
 *
 * ZERO MODEL CALLS. `POST /channels/:id/files` streams to the channel's entities on the
 * HAPPY path — so this probe never drives that route's happy path. Every request it makes
 * to that route is refused at or before the body read, well upstream of generation. The one
 * successful upload (arm K) goes to `POST /projects/:id/files`, which stores a file and
 * generates nothing. Scratch DB via KLATCH_DB under `.testdata/`; xian's `klatch.db` is
 * never opened. Nothing under `packages/` is written — asserted at exit, and the one file
 * arm K writes to the server's gitignored `klatch-files/` is deleted and its absence checked.
 *
 * Arms:
 *   H  six sites x five malformed shapes — the guard's contract at the wire   [regression]
 *   J  shape validation still belongs to the route, not the guard             [regression]
 *   K  the guard did not break a well-formed upload                           [regression]
 *   L  the guard sits BELOW the size cap — asserted at the wire, by sentence  [regression]
 *   M  404-before-400 ordering survives at `/projects/:id/files`              [regression]
 *   N  the enumeration is complete — as many sites driven as wired in source  [regression]
 *   Z  scratch hygiene                                                        [regression]
 *
 * Regression arms exit 1 on failure. Same convention as Rounds 142/161/163/213.
 *
 * Every sentence this probe compares against is READ FROM SOURCE, never typed here — the
 * same discipline as `DEFAULT_ENTITY_ID` in `probe-round213`. A probe that hardcodes the
 * string it is checking goes green against a server whose sentence has drifted.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round217-multipart');
const DB = path.join(SCRATCH, 'scratch.db');
const PORT = 3001;
const HOST = '127.0.0.1';
const BASE = `http://${HOST}:${PORT}/api`;

function readConst(file: string, re: RegExp, what: string): string {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  const m = src.match(re);
  if (!m) throw new Error(`could not read ${what} from ${file}`);
  return m[1];
}

/** The guard's own sentence, from the guard. */
const GUARD_SENTENCE = readConst(
  'packages/server/src/routes/form-body.ts',
  /throw new HTTPException\(400, \{\s*res: c\.json\(\{ error: '([^']+)'/,
  'readFormBody sentence'
);
/** Its JSON sibling's sentence — the two must stay distinguishable; see arm H3. */
const JSON_GUARD_SENTENCE = readConst(
  'packages/server/src/routes/json-body.ts',
  /res: c\.json\(\{ error: '([^']+)'/,
  'readJsonBody sentence'
);
/** Route-owned sentences, for arm J. */
const NO_FILE_JSONL = readConst(
  'packages/server/src/routes/import.ts',
  /error: '(No file uploaded\. Please choose a session file[^']*)'/,
  'claude-code no-file sentence'
);
const NO_FILE_ZIP = readConst(
  'packages/server/src/routes/import.ts',
  /error: '(No file uploaded\. Send a zip as[^']*)'/,
  'klatch no-file sentence'
);
const NO_FILE_PROVIDED = readConst(
  'packages/server/src/routes/files.ts',
  /error: '(No file provided)'/,
  'files.ts no-file sentence'
);
/** The cap's numbers, for arm L — built from source so a re-sizing does not need an edit here. */
const MAX_IMPORT_MB = Number(readConst(
  'packages/server/src/routes/import.ts',
  /const MAX_IMPORT_SIZE = (\d+) \* 1024 \* 1024/,
  'MAX_IMPORT_SIZE'
));

type Kind = 'regression' | 'open' | 'measurement';
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

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

if (!(await portIsFree(PORT))) {
  console.error(`port ${PORT} is occupied — this probe needs to own the server. Stop the dev server and re-run.`);
  process.exit(2);
}

const serverLog = path.join(SCRATCH, 'server.log');
const logFd = fs.openSync(serverLog, 'a');
const server = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: path.join(REPO, 'packages/server'),
  env: { ...process.env, KLATCH_DB: DB },
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

type Wire = { status: number; contentType: string | null; text: string; error: string | null; parsed: boolean };

/** One request, and everything about the answer that the client code actually consumes. */
async function wire(
  method: string, pathname: string, body: BodyInit | undefined, headers: Record<string, string>
): Promise<Wire> {
  const res = await fetch(`${BASE}${pathname}`, { method, headers, body });
  const text = (await res.text()).slice(0, 400);
  let error: string | null = null;
  let parsed = false;
  try {
    const j = JSON.parse(text);
    parsed = true;
    error = typeof j?.error === 'string' ? j.error : null;
  } catch { /* parsed stays false — that IS the failure the 500 had */ }
  return { status: res.status, contentType: res.headers.get('content-type'), text, error, parsed };
}
const postJson = async (pathname: string, body: unknown) =>
  wire('POST', pathname, JSON.stringify(body), { 'Content-Type': 'application/json' });

/**
 * A request whose `Content-Length` LIES — larger than the bytes that follow. `fetch` will
 * not do this (it computes the header), and that is the whole point of arm L: the size cap
 * is a Content-Length check, so the only way to drive the cap/guard ordering at the wire is
 * to write the head by hand and never send the body it promises.
 *
 * Returns the response bytes if the server answers, or null if it is still waiting for a
 * body that will never arrive — which is itself the observation arm L wants at the two
 * uncapped sites.
 */
function lyingContentLength(
  pathname: string, declaredBytes: number, contentType: string, chunk: string, timeoutMs = 4000
): Promise<string | null> {
  return new Promise((resolve) => {
    const sock = net.connect(PORT, HOST);
    let buf = '';
    let done = false;
    const finish = (v: string | null) => { if (!done) { done = true; sock.destroy(); resolve(v); } };
    const timer = setTimeout(() => finish(null), timeoutMs);
    sock.on('connect', () => {
      sock.write(
        `POST /api${pathname} HTTP/1.1\r\n` +
        `Host: ${HOST}:${PORT}\r\n` +
        `Content-Type: ${contentType}\r\n` +
        `Content-Length: ${declaredBytes}\r\n` +
        `Connection: close\r\n\r\n` +
        chunk
      );
    });
    sock.on('data', (d) => {
      buf += d.toString();
      // Headers plus something that looks terminated is enough — we never send the rest of
      // the body, so the server may hold the socket open after answering.
      if (buf.includes('\r\n\r\n') && buf.length > buf.indexOf('\r\n\r\n') + 4) {
        clearTimeout(timer);
        finish(buf);
      }
    });
    sock.on('error', () => { clearTimeout(timer); finish(null); });
    sock.on('close', () => { clearTimeout(timer); finish(buf === '' ? null : buf); });
  });
}
function statusOf(raw: string): number | null {
  const m = raw.match(/^HTTP\/1\.\d (\d{3})/);
  return m ? Number(m[1]) : null;
}
function sentenceOf(raw: string): string | null {
  const m = raw.match(/\{"error":"((?:[^"\\]|\\.)*)"\}/);
  if (!m) return null;
  try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
}

async function sql<T = any>(query: string, ...params: unknown[]): Promise<T[]> {
  const { default: Database } = await import('better-sqlite3');
  const conn = new Database(DB, { readonly: true });
  const rows = conn.prepare(query).all(...(params as any[])) as T[];
  conn.close();
  return rows;
}

try {
  // ── Fixtures ──────────────────────────────────────────────────────────────────
  //
  // `/projects/:id/files` resolves the project and 404s BEFORE the body read — Daedalus hit
  // exactly this with a throwaway id in his own pre-fix measurement (his §5), and I hit the
  // same shape at `POST /files/:id/promote` in Round 215. A real row, or every check at that
  // site passes against a server with no guard in it at all. Arm M drives the 404 branch on
  // purpose so the ordering itself is pinned rather than merely worked around.
  const proj = await postJson('/projects', { name: 'R217 fixture project' });
  if (proj.status !== 201) { console.error('fixture project failed', proj); await shutdown(1); }
  const PID = JSON.parse(proj.text).id as string;
  const chan = await postJson('/channels', { name: 'R217 fixture channel' });
  if (chan.status !== 201) { console.error('fixture channel failed', chan); await shutdown(1); }
  const CID = JSON.parse(chan.text).id as string;

  /** The six wired sites. Source lines are re-derived in arm N, not trusted from here. */
  const SITES: Array<{ key: string; pathname: string; file: 'import.ts' | 'files.ts'; branches: boolean }> = [
    { key: 'import/claude-code', pathname: '/import/claude-code', file: 'import.ts', branches: true },
    { key: 'import/claude-ai/preview', pathname: '/import/claude-ai/preview', file: 'import.ts', branches: true },
    { key: 'import/claude-ai', pathname: '/import/claude-ai', file: 'import.ts', branches: true },
    { key: 'import/klatch', pathname: '/import/klatch', file: 'import.ts', branches: true },
    { key: 'channels/:id/files', pathname: `/channels/${CID}/files`, file: 'files.ts', branches: false },
    { key: 'projects/:id/files', pathname: `/projects/${PID}/files`, file: 'files.ts', branches: false },
  ];

  const B = '----probe217boundary';
  /**
   * The five shapes from Daedalus's §2 table. The first three are malformed MULTIPART and
   * must reach the guard at every site. The last two are not multipart at all: the four
   * `import.ts` sites branch on content-type and send them to the JSON guard; the two
   * `files.ts` sites do not branch, so they reach the multipart guard. That asymmetry is the
   * finding his §2 recorded, and arm H3 is where it is pinned rather than described.
   */
  const SHAPES: Array<{ key: string; multipart: boolean; headers: Record<string, string>; body: BodyInit | undefined }> = [
    { key: 'multipart CT, garbage body', multipart: true,
      headers: { 'Content-Type': `multipart/form-data; boundary=${B}` }, body: 'not a multipart body at all' },
    { key: 'multipart CT, no boundary=', multipart: true,
      headers: { 'Content-Type': 'multipart/form-data' },
      body: `--${B}\r\nContent-Disposition: form-data; name="file"\r\n\r\nx\r\n--${B}--\r\n` },
    { key: 'truncated multipart', multipart: true,
      headers: { 'Content-Type': `multipart/form-data; boundary=${B}` },
      body: `--${B}\r\nContent-Disposition: form-data; name="file"; filename="a.zip"\r\n\r\nPK` },
    { key: 'no body at all', multipart: false, headers: {}, body: undefined },
    { key: 'a JSON body', multipart: false,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hello: 'world' }) },
  ];

  // ── Arm H — six sites x five shapes, at the wire ──────────────────────────────
  {
    const cells: Array<{ site: typeof SITES[number]; shape: typeof SHAPES[number]; r: Wire }> = [];
    for (const site of SITES) {
      for (const shape of SHAPES) {
        cells.push({ site, shape, r: await wire('POST', site.pathname, shape.body, shape.headers) });
      }
    }

    // ── H1 — the property the whole round bought, stated once over all 30 cells ──
    //
    // Not "status 400" alone. The 500 this replaced was a 4xx condition reported as 5xx IN A
    // CONTENT TYPE THAT DEFEATS THE CLIENT: `api/client.ts` does `res.json().catch(() => null)`
    // then `detail?.error`, so a `text/plain` body loses the sentence whatever the status is.
    // All three parts, or the cell has not actually been fixed for a caller.
    const notFixed = cells.filter(({ r }) =>
      !(r.status >= 400 && r.status < 500
        && (r.contentType ?? '').includes('application/json')
        && r.parsed && typeof r.error === 'string' && r.error.length > 0));
    check('H', `all ${cells.length} site x shape cells answer 4xx + application/json + a parseable non-empty {error}`,
      notFixed.length === 0,
      notFixed.length === 0
        ? `${SITES.length} sites x ${SHAPES.length} shapes driven over a socket; statuses observed: ${
            [...new Set(cells.map((c) => c.r.status))].sort().join(',')}`
        : `${notFixed.length} of ${cells.length} did not:\n` + notFixed.map(({ site, shape, r }) =>
            `    ${site.key} / ${shape.key} → ${r.status} ${r.contentType} ${JSON.stringify(r.text.slice(0, 120))}`).join('\n'));

    // Stated separately from H1 because "no 5xx" is the headline of Round 216 and deserves
    // to be its own red line rather than one clause inside a compound condition.
    const fivexx = cells.filter(({ r }) => r.status >= 500);
    check('H', 'no malformed body produces a 5xx at any of the six sites',
      fivexx.length === 0,
      fivexx.length === 0
        ? `max status observed across ${cells.length} cells: ${Math.max(...cells.map((c) => c.r.status))}`
        : fivexx.map(({ site, shape, r }) => `${site.key}/${shape.key} → ${r.status} ${r.contentType}`).join(' | '));

    // ── H2 — the guard's OWN sentence, at every site, for every malformed multipart ──
    //
    // H1 would stay green if a site were reverted to a bare `c.req.formData()` and the throw
    // caught somewhere else with a different sentence. This is the check that draws the line
    // at `readFormBody` specifically: 18 cells that must carry the string the helper owns.
    const mpCells = cells.filter(({ shape }) => shape.multipart);
    const wrongSentence = mpCells.filter(({ r }) => r.error !== GUARD_SENTENCE);
    check('H', `every malformed-multipart cell (${mpCells.length}) carries readFormBody's own sentence`,
      wrongSentence.length === 0,
      wrongSentence.length === 0
        ? `all ${mpCells.length} = ${JSON.stringify(GUARD_SENTENCE)} (read from form-body.ts, not typed here)`
        : wrongSentence.map(({ site, shape, r }) =>
            `${site.key}/${shape.key} → ${JSON.stringify(r.error)}`).join(' | '));

    // ── H3 — the asymmetry Daedalus's §2 found, pinned instead of described ──────
    //
    // A non-multipart body at a branching (`import.ts`) site is a JSON-branch fault and must
    // NOT wear the multipart sentence; at a non-branching (`files.ts`) site it is a multipart
    // fault and must. This is the pair of rows that were still 500 `text/plain` before Round
    // 216 and have NO in-suite coverage at all, because `createTestApp()` never mounts
    // `fileRoutes` — verified below in the same breath rather than asserted from his memo.
    const suiteMountsFiles = fs.readFileSync(
      path.join(REPO, 'packages/server/src/__tests__/app.ts'), 'utf8'
    ).includes('fileRoutes');
    const nonMp = cells.filter(({ shape }) => !shape.multipart);
    const filesNonMp = nonMp.filter(({ site }) => !site.branches);
    const importNonMp = nonMp.filter(({ site }) => site.branches);
    const filesBad = filesNonMp.filter(({ r }) => r.error !== GUARD_SENTENCE);
    check('H', 'a non-multipart body at the two files.ts sites gets the multipart sentence (they do not branch)',
      filesBad.length === 0,
      filesBad.length === 0
        ? `${filesNonMp.length} cells, all ${JSON.stringify(GUARD_SENTENCE)}; createTestApp mounts fileRoutes: ${suiteMountsFiles} — so these cells are ${suiteMountsFiles ? 'also' : 'ONLY'} reachable here`
        : filesBad.map(({ site, shape, r }) => `${site.key}/${shape.key} → ${JSON.stringify(r.error)}`).join(' | '));
    const importBad = importNonMp.filter(({ r }) => r.error === GUARD_SENTENCE);
    check('H', 'the same body at the four import.ts sites does NOT — it went down the JSON branch',
      importBad.length === 0,
      importBad.length === 0
        ? `${importNonMp.length} cells, sentences: ${JSON.stringify([...new Set(importNonMp.map((c) => c.r.error))])}`
        : `${importBad.length} import cells wore the multipart sentence, so the content-type branch did not run: ` +
          importBad.map(({ site, shape }) => `${site.key}/${shape.key}`).join(' | '));
    // The two guards must stay distinguishable to a caller. If someone ever collapses them
    // into one helper with one sentence, H3's two halves both stay green and this goes red.
    check('H', 'the two guards have different sentences, so a caller can tell the faults apart',
      GUARD_SENTENCE !== JSON_GUARD_SENTENCE,
      `multipart=${JSON.stringify(GUARD_SENTENCE)} · json=${JSON.stringify(JSON_GUARD_SENTENCE)}`);

    // Per-cell record, so the next reader does not have to re-run the probe to see the table.
    for (const site of SITES) {
      const row = SHAPES.map((sh) => {
        const c = cells.find((x) => x.site.key === site.key && x.shape.key === sh.key)!;
        return `${sh.key}=${c.r.status}/${c.r.error === GUARD_SENTENCE ? 'GUARD' : JSON.stringify(c.r.error)}`;
      });
      measure('H', `table row: ${site.key}`, row.join(' · '));
    }
  }

  // ── Arm J — shape validation still belongs to the route ───────────────────────
  //
  // Daedalus's mutation 4 is the plausible wrong fix: swallow the throw and hand the route an
  // empty `FormData`. The route then answers a 400 with a JSON body and a helpful-sounding
  // sentence that is FALSE about what went wrong — it tells an operator to attach a file they
  // already attached. A status-only check passes that mutation. So the split has to be driven
  // from BOTH sides: arm H proves bad bytes get the guard's sentence, and arm J proves a
  // PARSEABLE form with no `file` part still gets the route's own.
  //
  // This is the product-side face of the rule Round 215 left behind — *a check may print what
  // it read, it may not print what that implies* — and it is the reason every check here reads
  // the sentence and not just the status.
  {
    const wellFormedNoFile = (): FormData => { const f = new FormData(); f.append('content', 'no file part here'); return f; };
    const cases: Array<[string, string, string]> = [
      ['/import/claude-code', NO_FILE_JSONL, 'import.ts'],
      ['/import/klatch', NO_FILE_ZIP, 'import.ts'],
      [`/channels/${CID}/files`, NO_FILE_PROVIDED, 'files.ts'],
      [`/projects/${PID}/files`, NO_FILE_PROVIDED, 'files.ts'],
    ];
    for (const [pathname, expected, where] of cases) {
      // `fetch` with a FormData body writes a real, well-formed multipart envelope and sets
      // its own boundary — the guard must pass it through untouched.
      const res = await fetch(`${BASE}${pathname}`, { method: 'POST', body: wellFormedNoFile() });
      const text = (await res.text()).slice(0, 300);
      let err: string | null = null;
      try { err = JSON.parse(text)?.error ?? null; } catch { /* null is the failure */ }
      check('J', `a well-formed form with no file part keeps ${where}'s own sentence at ${pathname.replace(/\/[0-9a-f-]{8,}\//, '/:id/')}`,
        res.status === 400 && err === expected,
        `status ${res.status} · error=${JSON.stringify(err)} (route's own, read from source: ${JSON.stringify(expected)}) · guard's would be ${JSON.stringify(GUARD_SENTENCE)}`);
    }
    // ZERO MODEL CALLS holds through this arm: `/channels/:id/files` returned before the
    // upload path, so nothing was ever queued for generation. Read back rather than assumed.
    const msgs = await sql<{ n: number }>('SELECT COUNT(*) AS n FROM messages WHERE channel_id = ?', CID);
    check('J', 'no message was created in the fixture channel — no generation was triggered',
      msgs[0].n === 0, `messages in fixture channel: ${msgs[0].n}`);
  }

  // ── Arm K — the guard did not break a well-formed upload ──────────────────────
  //
  // Every other arm drives a refusal. A guard that refused EVERYTHING would pass all of them.
  // `/projects/:id/files` is the site used here because it stores a file and generates
  // nothing; `/channels/:id/files` would stream, and this probe makes zero model calls.
  {
    const fd = new FormData();
    fd.append('file', new File(['round 217 probe payload\n'], 'round217.txt', { type: 'text/plain' }));
    const res = await fetch(`${BASE}/projects/${PID}/files`, { method: 'POST', body: fd });
    // NOT truncated, unlike every other read in this probe. First run of this arm was 2-red
    // and both reds were mine: `wire()` slices bodies to 400 chars because a refusal body is
    // short and a runaway one should not flood the log — but the SUCCESS body here is
    // `{ file, ref }`, two full rows, 447 chars. `JSON.parse` on the truncated string threw,
    // `body` stayed null, and the probe reported "file.id=undefined" against a server that
    // had returned a perfectly good 201 and written the row (the very next check, which reads
    // the database instead of the response, was green the whole time — that disagreement is
    // what sent me to the route rather than to a bug report).
    const text = await res.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { /* null */ }
    check('K', 'a well-formed multipart upload still succeeds through the guard',
      res.status === 201 && typeof body?.file?.id === 'string',
      `status ${res.status} · file.id=${JSON.stringify(body?.file?.id)} · name=${JSON.stringify(body?.file?.name)}`);
    const rows = await sql<{ id: string; name: string }>('SELECT id, name FROM files WHERE name = ?', 'round217.txt');
    check('K', 'and the row is in the scratch database, not just in the response',
      rows.length === 1, `rows named round217.txt: ${rows.length}`);

    // Cleanup: the server writes to its own gitignored `klatch-files/` under packages/server.
    // Gitignored means arm Z's `git diff` cannot see it, so it is removed and its absence is
    // checked here rather than being left for a human to notice.
    const key = body?.file?.storage_key ?? body?.file?.storageKey;
    const stored = typeof key === 'string' ? path.join(REPO, 'packages/server/klatch-files', key) : null;
    if (stored && fs.existsSync(stored)) fs.rmSync(stored);
    check('K', 'the uploaded bytes were removed from the server\'s file store',
      stored !== null && !fs.existsSync(stored),
      stored === null ? 'no storage key in the response — could not locate the file to remove' : `${path.relative(REPO, stored)} absent: ${!fs.existsSync(stored)}`);
  }

  // ── Arm L — the guard is BELOW the cap, proven at the wire by which sentence answers ──
  //
  // Daedalus proved this ordering by mutation inside the suite: hoisting `readFormBody` above
  // `rejectOversizeBeforeRead` reddened exactly 1 test of 1850, the one he wrote that fire.
  // That is a strong proof of the assertion's existence; it is not a proof about the server
  // that actually runs. The cap is a Content-Length check, and `fetch` computes
  // Content-Length from the bytes it is given — so the ordering CANNOT be driven through
  // `fetch` at all. It needs a request whose declared length lies, which means writing the
  // head onto a socket by hand and never sending the body it promises.
  //
  // Both sentences are 400. The status cannot distinguish them. WHICH SENTENCE answers is the
  // entire observable: the cap's means the header check ran first and the body was never
  // buffered; the guard's means the body was read before the size was consulted, which is
  // precisely the allocation Round 151 measured and removed (70.3 MB refused → 169.6 MB peak).
  {
    const declared = (MAX_IMPORT_MB + 150) * 1024 * 1024;
    const capSentence = `File too large (${Math.round(declared / 1024 / 1024)}MB uploaded). Maximum is ${MAX_IMPORT_MB}MB.`;
    const capped = SITES.filter((s) => s.file === 'import.ts');
    const bad: string[] = [];
    for (const site of capped) {
      const raw = await lyingContentLength(
        site.pathname, declared, `multipart/form-data; boundary=${B}`, 'garbage, and far fewer bytes than promised');
      const st = raw === null ? null : statusOf(raw);
      const sentence = raw === null ? null : sentenceOf(raw);
      if (!(st === 400 && sentence === capSentence)) {
        bad.push(`${site.key} → ${raw === null ? 'NO RESPONSE within 4s (body never sent, so it is still reading)' : `${st} ${JSON.stringify(sentence)}`}`);
      }
    }
    check('L', `all ${capped.length} capped sites refuse a lying oversize Content-Length with the CAP's sentence, not the guard's`,
      bad.length === 0,
      bad.length === 0
        ? `declared ${Math.round(declared / 1024 / 1024)}MB, sent ~45 bytes; every site answered ${JSON.stringify(capSentence)} — the header check ran before the body read, over a real socket`
        : `${bad.length} of ${capped.length} did not: ${bad.join(' | ')}`);

    // ── The uncapped half, measured rather than asserted ───────────────────────
    //
    // Daedalus's §7 flags it in words: "`files.ts` has no size cap at all — no
    // `rejectOversizeBeforeRead`, no Content-Length check, and `validateFile` runs AFTER
    // `arrayBuffer()`. That is the Round 151 defect, unfixed, on a different route family.
    // Flagged, not fixed — it is a sizing decision." Agreed that it is out of Round 216's
    // scope. Measuring it is not: this is what the absence DOES at the wire.
    //
    // Deliberately a MEAS and not a FAIL. Nothing here is a regression against a contract
    // anyone has agreed to — there is no cap to violate. The label says what was observed and
    // stops there; the decision is xian's and the sizing is Daedalus's.
    const uncapped = SITES.filter((s) => s.file === 'files.ts');
    for (const site of uncapped) {
      const t0 = Date.now();
      const raw = await lyingContentLength(
        site.pathname, declared, `multipart/form-data; boundary=${B}`, 'garbage, and far fewer bytes than promised');
      const ms = Date.now() - t0;
      measure('L', `uncapped: ${site.key} on a ${Math.round(declared / 1024 / 1024)}MB declared body`,
        raw === null
          ? `no response in ${ms}ms — it is waiting for bytes a client promised and did not send; the four import.ts sites answered this same request immediately from the header`
          : `${statusOf(raw)} ${JSON.stringify(sentenceOf(raw))} after ${ms}ms`);
    }
    // Check, not measurement: the absence of a cap at these two sites is a source fact and it
    // is the thing that would change if someone acts on the flag. Green today means "still
    // absent" — this is the line that flips when the open item is closed.
    const filesSrc = fs.readFileSync(path.join(REPO, 'packages/server/src/routes/files.ts'), 'utf8');
    const stillUncapped = !filesSrc.includes('content-length');
    check('L', 'OPEN (Daedalus §7): files.ts still has no Content-Length cap — this flips when that is fixed',
      stillUncapped,
      stillUncapped
        ? "grep 'content-length' packages/server/src/routes/files.ts → no match; the two upload sites there buffer whatever arrives"
        : 'files.ts now references content-length — the open item may be closed; re-read the route and re-aim this arm',
      'open');
  }

  // ── Arm M — 404 before 400, at the wire ───────────────────────────────────────
  //
  // `/projects/:id/files` resolves the project BEFORE reading the body. That ordering is
  // correct (do not buffer a body for a resource that does not exist) and it is also the trap
  // that silently disarms a guard check written with a throwaway id — Daedalus hit it in his
  // pre-fix measurement, I hit the same shape at `promote` in Round 215. Driving it on purpose
  // turns the trap into a pinned contract.
  {
    const r = await wire('POST', '/projects/no-such-project-r217/files',
      'not a multipart body at all', { 'Content-Type': `multipart/form-data; boundary=${B}` });
    check('M', 'a malformed multipart at a NONEXISTENT project is 404, not the guard\'s 400',
      r.status === 404 && r.error !== GUARD_SENTENCE,
      `status ${r.status} · error=${JSON.stringify(r.error)} — if this ever reads 400 ${JSON.stringify(GUARD_SENTENCE)}, the body is being buffered for a resource that does not exist`);
  }

  // ── Arm N — the enumeration is complete ───────────────────────────────────────
  //
  // Arm H can only drive what SITES names. A seventh site added tomorrow leaves every arm
  // above green. This is the anti-drift check, the same shape as `probe-round213`'s G1b.
  //
  // The grep uses the CALL form `readFormBody(c)`, not the bare name: `form-body.ts`'s own
  // docstring says "Use this, not a bare `await c.req.formData()`" and `import.ts`'s cap
  // docstring names `c.req.formData()` three times while explaining why the cap sits above
  // it. A naive name grep counts the prose that documents the fix as a site — which is
  // exactly what arm G of `probe-round213` did this morning, and what Argus caught. Line
  // shape, not word presence.
  {
    const wired = execFileSync('bash', ['-c',
      "grep -rn 'await readFormBody(c)' packages/server/src/routes/ | grep -v form-body.ts"],
      { cwd: REPO, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    check('N', 'as many sites driven as readFormBody call sites in source',
      wired.length === SITES.length,
      `drove ${SITES.length} · source wires ${wired.length}: ${wired.map((l) => l.split(':').slice(0, 2).join(':').replace('packages/server/src/routes/', '')).join(', ')}`);

    const perFile = { 'import.ts': 0, 'files.ts': 0 } as Record<string, number>;
    for (const l of wired) { const f = path.basename(l.split(':')[0]); perFile[f] = (perFile[f] ?? 0) + 1; }
    const drivenPerFile = { 'import.ts': SITES.filter((s) => s.file === 'import.ts').length,
                            'files.ts': SITES.filter((s) => s.file === 'files.ts').length } as Record<string, number>;
    check('N', 'and the per-file split matches, so a site moving between files cannot hide',
      JSON.stringify(perFile) === JSON.stringify(drivenPerFile),
      `source=${JSON.stringify(perFile)} · driven=${JSON.stringify(drivenPerFile)}`);

    const bare = execFileSync('bash', ['-c',
      "grep -rn 'await c\\.req\\.formData()' packages/server/src/routes/ | grep -v 'form-body.ts' || true"],
      { cwd: REPO, encoding: 'utf8' }).trim();
    check('N', 'no bare c.req.formData() survives outside form-body.ts',
      bare === '',
      bare === '' ? 'swept packages/server/src/routes/; the only call is inside readFormBody itself'
                  : `re-introduced at:\n${bare}`);
  }

  // ── Report ────────────────────────────────────────────────────────────────────
  const diffAfter = packagesDiff();
  const clean = diffAfter === diffBefore;
  check('Z', 'packages/ untouched by this probe', clean,
    clean ? `git diff --stat -- packages/ unchanged (${diffBefore === '' ? 'empty' : 'same as before'})` : `CHANGED:\n${diffAfter}`);
  check('Z', "xian's klatch.db was never the target",
    process.env.KLATCH_DB === undefined || process.env.KLATCH_DB === DB, `server ran against ${DB}`);

  const reg = results.filter((r) => r.kind === 'regression');
  const failed = reg.filter((r) => !r.pass);
  const open = results.filter((r) => r.kind === 'open');
  const meas = results.filter((r) => r.kind === 'measurement');
  console.log('\n' + '─'.repeat(78));
  console.log(`Round 217 — ${reg.length - failed.length}/${reg.length} regression checks passed · ${open.length} open · ${meas.length} measurements`);
  if (failed.length) {
    console.log('\nFAILED:');
    for (const f of failed) console.log(`  [${f.arm}] ${f.check}\n      ${f.detail}`);
  }
  console.log('─'.repeat(78));
  await shutdown(failed.length ? 1 : 0);
} catch (err) {
  console.error('probe threw:', err);
  console.error(`server log:\n${fs.readFileSync(serverLog, 'utf8').slice(-3000)}`);
  await shutdown(1);
}
