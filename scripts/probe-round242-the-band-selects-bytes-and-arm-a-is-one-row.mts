/**
 * Round 242 — the measurement Daedalus's Round 241 §6 asked this seat for.
 *
 * His finding, stated against his own new work:
 *
 *   > Arm A's *"assistant messages carry its entity_id — mismatched rows=0"* is running over
 *   > **one row**. True, and nearly vacuous. The 150–600 KB band selects for *byte size*, which
 *   > on today's corpus buys long tool logs, not long conversations — the probe's header asks
 *   > for the latter. I have **not** fixed it: that changes what the acceptance test measures.
 *
 * He routed it here because it is measurement-shaped: before anyone re-tunes the band, somebody
 * has to say what the band is drawing *from*. This probe answers three questions with numbers,
 * and grades only itself.
 *
 * ── Q1. What does the 150–600 KiB band actually select for? ──────────────────────────────────
 *
 * Not "long conversations". The product's own parser is the arbiter: every `.jsonl` under
 * `~/.claude/projects` is parsed with `parseClaudeCodeSession` and its **turn** count recorded.
 * A turn is one human prompt plus the assistant's answer — the unit the import writes rows for,
 * and the unit the probe's header is asking for when it says "real, long transcripts".
 *
 * ── Q2. Can any band fix it? ─────────────────────────────────────────────────────────────────
 *
 * The acceptance test needs 5 distinct directories × 2 sessions each. So the question is not
 * "are there long conversations" but "are there 5 directories holding 2 of them". Answered by
 * counting, at thresholds, rather than by picking a number that looks nice.
 *
 * ── Q3. How underpowered is arm A, exactly? ──────────────────────────────────────────────────
 *
 * Not argued — demonstrated. Two transcripts are **minted** (Round 240 §4: mint a marker, never
 * pick one that occurs in the world), one with 1 turn and one with 7, imported through the real
 * route. A defect is then injected that is invisible at 1 turn and loud at 7. That is the whole
 * claim, made falsifiable: the current check cannot see a fanout defect, and the fixture that
 * would let it see one costs nothing and cannot expire.
 *
 * ── Q4, which this probe did not set out to ask ──────────────────────────────────────────────
 *
 * Arm A — "the census agrees with an independent enumeration" — went **red on its first run**,
 * against my own instrument: a one-level walk found 537 sessions where a recursive walk found
 * 661. The missing 124 are **subagent transcripts**, nested two levels down at
 * `<project>/<session-uuid>/subagents/agent-<id>.jsonl`, and sixteen of those a further two
 * levels down again under a `workflows/wf_<id>` directory.
 *
 * They matter here because 83 of the 124 sit **inside the byte band**, so "walk recursively" is
 * the obvious-looking way to double the in-band population, and it is a trap. Measured, all
 * three layers of the product already refuse them, which is why the arms below assert it rather
 * than assume it. The census is now a **decomposition** (537 + 124 = 661) instead of a count
 * that called itself complete.
 *
 * ── What this probe does NOT do ──────────────────────────────────────────────────────────────
 *
 * - It does not change `probe-import-entity-binding.mts`. That is an acceptance test; editing
 *   what it measures is a routed decision, not a side effect of measuring it.
 * - It does not grade the corpus. The corpus is what it is; ~97% one-turn duty-cycle fires is a
 *   fact about how this fleet works, not a defect.
 * - It does not touch `~/.claude/projects`. Arm G asserts that, because an instrument that
 *   writes into the corpus it is measuring is the failure this whole series keeps re-finding.
 *
 * ── Arms H and I are WORLD arms, not instrument arms ─────────────────────────────────────────
 *
 * Round 241's behavior/gap split, applied to a third category. H and I assert facts about
 * Claude Code's transcript format and about shipped refusal behaviour. If H flips, nothing here
 * is broken — it means subagent transcripts started carrying main-conversation events, and the
 * scanner's exclusion needs revisiting. They are exit-coded separately for that reason.
 *
 * Usage:  npx tsx scripts/probe-round242-the-band-selects-bytes-and-arm-a-is-one-row.mts
 *         (redirect to a file; do not pipe to `head`/`tail` — the exit code is the tail's)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import {
  resolveSessionCast,
  CorpusUnavailable,
  DEFAULT_PROJECTS_DIR,
} from './lib/probe-corpus-sessions.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round242');
fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });
process.env.KLATCH_DB = path.join(SCRATCH, 'scratch.db');

const MIN_BYTES = 150 * 1024;
const MAX_BYTES = 600 * 1024;

// ── grading ───────────────────────────────────────────────────────────
// Arms A–G grade the instrument: a failure is a defect in this file. Arms H–I grade the WORLD
// (transcript format, shipped refusal behaviour): a failure there is news about the subject,
// not about the probe, so it is reported and exit-coded separately.
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; world: boolean }> = [];
function check(arm: string, name: string, pass: boolean, detail: string) {
  const world = arm === 'H' || arm === 'I';
  results.push({ arm, check: name, pass, detail, world });
  const tag = world ? (pass ? 'HOLDS  ' : 'CHANGED') : pass ? 'PASS   ' : 'FAIL   ';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}

const { parseClaudeCodeSession } = await import(
  path.join(REPO, 'packages/server/src/import/parser.ts')
);

// ── M1–M3: the census ─────────────────────────────────────────────────

interface Row {
  dir: string;
  file: string;
  size: number;
  mtimeAgeDays: number;
  turns: number;
  events: number;
  parseMs: number;
}

/**
 * The population the resolver sees: `.jsonl` directly inside a project directory. This is a
 * one-level walk **on purpose** — it is what `resolveSessionCast` and the product's
 * `scanClaudeCodeSessions` both do, and a census measuring a different population than the code
 * under discussion is worse than no census.
 */
function corpusFiles(root: string): Array<{ dir: string; file: string; path: string }> {
  if (!fs.existsSync(root)) return [];
  const out: Array<{ dir: string; file: string; path: string }> = [];
  for (const d of fs.readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const abs = path.join(root, d.name);
    for (const f of fs.readdirSync(abs)) {
      if (!f.endsWith('.jsonl')) continue;
      const p = path.join(abs, f);
      if (!fs.statSync(p).isFile()) continue;
      out.push({ dir: d.name, file: f, path: p });
    }
  }
  return out;
}

/** Everything deeper than one level — the subagent transcripts. The other half of the census. */
function nestedFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  for (const d of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!d.isFile() || !d.name.endsWith('.jsonl')) continue;
    const abs = path.join(d.parentPath ?? (d as unknown as { path: string }).path, d.name);
    if (path.relative(root, abs).split(path.sep).length <= 2) continue;
    out.push(abs);
  }
  return out;
}

const corpusRoot = DEFAULT_PROJECTS_DIR;
const listing = corpusFiles(corpusRoot);
const nested = nestedFiles(corpusRoot);
const corpusPresent = listing.length > 0;

const rows: Row[] = [];
const now = Date.now();
let sweepMs = 0;
for (const entry of listing) {
  const st = fs.statSync(entry.path);
  const t0 = Date.now();
  let turns = -1;
  let events = -1;
  try {
    const parsed = await parseClaudeCodeSession(entry.path);
    turns = parsed.turns.length;
    events = parsed.eventCount;
  } catch {
    /* recorded as -1; counted below */
  }
  const ms = Date.now() - t0;
  sweepMs += ms;
  rows.push({
    dir: entry.dir,
    file: entry.file,
    size: st.size,
    mtimeAgeDays: Math.max(0, (now - st.mtimeMs) / 86_400_000),
    turns,
    events,
    parseMs: ms,
  });
}

const inBand = rows.filter((r) => r.size >= MIN_BYTES && r.size <= MAX_BYTES);
const aboveBand = rows.filter((r) => r.size > MAX_BYTES);
const belowBand = rows.filter((r) => r.size < MIN_BYTES);
const multiTurn = rows.filter((r) => r.turns > 1);
const parseFailures = rows.filter((r) => r.turns < 0);

function turnStats(label: string, rs: Row[]) {
  if (!rs.length) return `${label.padEnd(14)} n=0`;
  const t = rs.map((r) => r.turns).sort((a, b) => a - b);
  const mean = t.reduce((a, b) => a + b, 0) / t.length;
  return (
    `${label.padEnd(14)} n=${String(rs.length).padStart(4)}  turns min=${t[0]} med=${t[Math.floor(t.length / 2)]} ` +
    `max=${t[t.length - 1]} mean=${mean.toFixed(2)}  >1 turn: ${rs.filter((r) => r.turns > 1).length}`
  );
}

console.log('── M1: corpus census ────────────────────────────────────────');
console.log(`root: ${corpusRoot}`);
if (!corpusPresent) {
  console.log('no corpus on this machine — M1–M3 report nothing; arms A–G still run (they mint).');
} else {
  const dirsWithSessions = new Set(rows.map((r) => r.dir)).size;
  const dirsTotal = fs.readdirSync(corpusRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).length;
  console.log(
    `${rows.length} sessions · ${(rows.reduce((a, r) => a + r.size, 0) / 1048576).toFixed(1)} MB · ` +
      `${dirsWithSessions} directories hold sessions (of ${dirsTotal} directories present)`,
  );
  console.log(
    `+ ${nested.length} nested subagent transcripts · ` +
      `${(nested.reduce((a, p) => a + fs.statSync(p).size, 0) / 1048576).toFixed(1)} MB · ` +
      `${nested.filter((p) => { const s = fs.statSync(p).size; return s >= MIN_BYTES && s <= MAX_BYTES; }).length} of them inside the byte band ` +
      `(invisible to the resolver and to the product's scanner — see arms A, H, I)`,
  );
  console.log(`parse sweep: ${sweepMs} ms total, ${(sweepMs / rows.length).toFixed(1)} ms/session, ${parseFailures.length} parse failures`);
  console.log('');
  console.log('── M2: what the band selects for ────────────────────────────');
  console.log(turnStats('ALL', rows));
  console.log(turnStats('in-band', inBand));
  console.log(turnStats('above band', aboveBand));
  console.log(turnStats('below band', belowBand));
  console.log('');
  console.log('── M3: the multi-turn population, and where the ceiling sits ─');
  console.log(
    `multi-turn (>1) sessions: ${multiTurn.length} of ${rows.length} ` +
      `(${((100 * multiTurn.length) / rows.length).toFixed(1)}%)`,
  );
  console.log(
    `  in band: ${multiTurn.filter((r) => r.size >= MIN_BYTES && r.size <= MAX_BYTES).length} · ` +
      `above the 600 KiB ceiling: ${multiTurn.filter((r) => r.size > MAX_BYTES).length} · ` +
      `below the 150 KiB floor: ${multiTurn.filter((r) => r.size < MIN_BYTES).length}`,
  );
  for (const r of [...multiTurn].sort((a, b) => b.turns - a.turns)) {
    console.log(
      `    turns=${String(r.turns).padStart(4)}  ${(r.size / 1048576).toFixed(2).padStart(6)} MB  ` +
        `parse=${String(r.parseMs).padStart(5)} ms  last append ${r.mtimeAgeDays.toFixed(1)} d ago  ${r.dir.slice(-30)}`,
    );
  }
  console.log('');
  console.log('── M4: can any threshold satisfy the acceptance test (5 dirs × 2)? ──');
  for (const k of [2, 5, 10]) {
    const byDir = new Map<string, Row[]>();
    for (const r of rows.filter((x) => x.turns >= k)) byDir.set(r.dir, [...(byDir.get(r.dir) ?? []), r]);
    const withTwo = [...byDir.entries()].filter(([, v]) => v.length >= 2);
    console.log(
      `  turns>=${String(k).padStart(2)}: ${String(rows.filter((r) => r.turns >= k).length).padStart(3)} sessions in ` +
        `${String(byDir.size).padStart(2)} directories; directories holding 2+: ${withTwo.length} ` +
        `(need 5 → ${withTwo.length >= 5 ? 'SATISFIABLE' : 'REFUSES [insufficient-corpus]'})`,
    );
  }
  console.log('');
  console.log('── M5: headroom of the resolution actually in use ───────────');
  try {
    const r = resolveSessionCast({ count: 5, sessionsPerDir: 2 });
    const headroom = r.qualifyingDirs - 5;
    console.log(
      `  byte band 150–600 KiB: ${r.qualifyingDirs} qualifying directories, 5 needed → headroom ${headroom} ` +
        `(${headroom === 0 ? 'ZERO — resolution degenerates to a pin' : 'resolution has somewhere else to go'})`,
    );
    const castTurns = r.sources.map((s) => {
      const m = rows.find((x) => x.file === s.sessions[0].file);
      return `${s.label}=${m ? m.turns : '?'}`;
    });
    console.log(`  turns in today's resolved cast: ${castTurns.join(' ')}`);
  } catch (e) {
    console.log(`  resolver refused: ${e instanceof CorpusUnavailable ? e.reason : String(e)}`);
  }
}
console.log('');

// ── Arms. These grade the instrument, not the corpus. ─────────────────

// A — the census is a complete DECOMPOSITION, not a count that calls itself complete.
//
// This arm went red on its first run and was right to: the one-level walk found 537 where a
// recursive walk found 661, and I had been about to publish 537 as "the corpus". Every
// percentage in M2/M3 is a fraction of one specific population, so the arm now asserts that the
// two named populations exhaust the recursive total — a drop on either side fails.
{
  const viaRecursive = corpusPresent
    ? fs
        .readdirSync(corpusRoot, { recursive: true, withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith('.jsonl')).length
    : 0;
  check(
    'A',
    'top-level + nested exhausts a recursive enumeration',
    listing.length + nested.length === viaRecursive,
    `top-level=${listing.length} + nested=${nested.length} = ${listing.length + nested.length}; recursive readdirSync=${viaRecursive}`,
  );
}

// B — my band predicate is the resolver's band predicate. If these drift, every M2 number is
// about a band nobody uses. Checked against the real resolver on a MINTED corpus with files
// planted exactly on both boundaries and one byte outside each.
{
  const fake = path.join(SCRATCH, 'fake-projects');
  const sizes = [MIN_BYTES - 1, MIN_BYTES, MAX_BYTES, MAX_BYTES + 1];
  // Two directories, each with all four sizes, so sessionsPerDir=2 is satisfiable iff the
  // two boundary files are in-band (inclusive) and the two outside files are not.
  for (const d of ['-mint-alpha', '-mint-beta']) {
    fs.mkdirSync(path.join(fake, d), { recursive: true });
    sizes.forEach((s, i) => fs.writeFileSync(path.join(fake, d, `mint-${i}.jsonl`), Buffer.alloc(s, 0x20)));
  }
  const mine = sizes.filter((s) => s >= MIN_BYTES && s <= MAX_BYTES).length;
  const r = resolveSessionCast({ count: 2, sessionsPerDir: 2, projectsDir: fake });
  const theirs = r.sources[0].sessions.length;
  check(
    'B',
    'band predicate matches the resolver on both boundaries',
    mine === 2 && theirs === 2 && r.qualifyingDirs === 2,
    `inclusive-band count mine=${mine} resolver kept=${theirs} qualifyingDirs=${r.qualifyingDirs}`,
  );
  // And the resolver must refuse when only the out-of-band files exist — the control that
  // proves the band is doing work rather than passing everything through.
  const narrow = path.join(SCRATCH, 'fake-narrow');
  fs.mkdirSync(path.join(narrow, '-mint-gamma'), { recursive: true });
  fs.writeFileSync(path.join(narrow, '-mint-gamma', 'tiny.jsonl'), Buffer.alloc(MIN_BYTES - 1, 0x20));
  let refused = '';
  try {
    resolveSessionCast({ count: 1, sessionsPerDir: 1, projectsDir: narrow });
  } catch (e) {
    refused = e instanceof CorpusUnavailable ? e.reason : 'wrong-error';
  }
  check('B', 'out-of-band-only corpus refuses as insufficient, not no-corpus', refused === 'insufficient-corpus', `reason=${refused || 'NO REFUSAL'}`);
}

// ── The minted transcripts. Round 240 §4: mint, never borrow. ─────────
function mintSession(id: string, turns: number): string {
  const p = path.join(SCRATCH, `${id}.jsonl`);
  const base = {
    parentUuid: null as string | null,
    userType: 'external',
    cwd: `/Users/test/r242/${id}`,
    sessionId: id,
    version: '2.1.19',
    gitBranch: 'main',
    slug: 'r242',
  };
  const lines: string[] = [];
  for (let i = 0; i < turns; i++) {
    const t = String(i).padStart(2, '0');
    lines.push(
      JSON.stringify({
        ...base,
        type: 'user',
        message: { role: 'user', content: `Question ${i} for ${id}, asked by a human.` },
        uuid: `${id}-u${t}`,
        timestamp: `2026-03-14T10:${t}:00.000Z`,
      }),
    );
    lines.push(
      JSON.stringify({
        ...base,
        parentUuid: `${id}-u${t}`,
        type: 'assistant',
        message: {
          model: 'claude-opus-5',
          id: `msg-${id}-${t}`,
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: `Answer ${i} from ${id}.` }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        },
        uuid: `${id}-a${t}`,
        timestamp: `2026-03-14T10:${t}:30.000Z`,
      }),
    );
  }
  fs.writeFileSync(p, lines.join('\n') + '\n');
  return p;
}

const ONE_TURN = mintSession('r242-one', 1);
const SEVEN_TURN = mintSession('r242-seven', 7);

// C — turn counting is the product's, not mine. If the parser stopped emitting a turn per
// human prompt, M2's whole axis would be measuring something else and this arm says so.
{
  const one = await parseClaudeCodeSession(ONE_TURN);
  const seven = await parseClaudeCodeSession(SEVEN_TURN);
  check(
    'C',
    'parser emits one turn per minted human prompt',
    one.turns.length === 1 && seven.turns.length === 7,
    `minted 1 → ${one.turns.length} turns; minted 7 → ${seven.turns.length} turns`,
  );
}

// ── Import both, through the real route. ──────────────────────────────
const { importRoutes } = await import(path.join(REPO, 'packages/server/src/routes/import.ts'));
const { getDb } = await import(path.join(REPO, 'packages/server/src/db/index.ts'));
const app = new Hono();
app.route('/api', importRoutes);
const post = (url: string, body: unknown) =>
  app.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const imported: Record<string, { channelId: string; entityId: string; messageCount: number }> = {};
for (const [name, p] of [
  ['OneTurnMint', ONE_TURN],
  ['SevenTurnMint', SEVEN_TURN],
] as const) {
  const res = await post('/api/import/claude-code', { sessionPath: p, entityName: name });
  const body = (await res.json()) as any;
  imported[name] = { channelId: body.channelId, entityId: body.entityId, messageCount: body.messageCount };
  check('D', `${name} imported 201`, res.status === 201, `status=${res.status} msgs=${body.messageCount} disposition=${body.entityDisposition}`);
}

const db = getDb();
const armAQuery = (channelId: string, entityId: string) =>
  (
    db
      .prepare(
        "SELECT COUNT(*) n FROM messages WHERE channel_id = ? AND role = 'assistant' AND (entity_id IS NULL OR entity_id != ?)",
      )
      .get(channelId, entityId) as { n: number }
  ).n;
const assistantRows = (channelId: string) =>
  (db.prepare("SELECT COUNT(*) n FROM messages WHERE channel_id = ? AND role = 'assistant'").get(channelId) as { n: number }).n;

// E — the population arm A actually inspects. This is the number the whole round is about,
// measured rather than inferred from `messageCount`.
{
  const one = assistantRows(imported.OneTurnMint.channelId);
  const seven = assistantRows(imported.SevenTurnMint.channelId);
  check(
    'E',
    'assistant-row population scales with turns, not bytes',
    one === 1 && seven === 7,
    `1-turn transcript → ${one} assistant row; 7-turn transcript → ${seven} assistant rows ` +
      `(sizes ${(fs.statSync(ONE_TURN).size / 1024).toFixed(1)} KiB / ${(fs.statSync(SEVEN_TURN).size / 1024).toFixed(1)} KiB)`,
  );
}

// F — THE HEADLINE, made falsifiable. Inject the defect class arm A names: entity_id set on
// the first assistant row and dropped on every later one — the shape a fanout bug has. At one
// turn the check is GREEN on broken data. At seven it is RED. The current acceptance test runs
// exclusively at one turn.
{
  for (const name of ['OneTurnMint', 'SevenTurnMint'] as const) {
    const { channelId } = imported[name];
    const ids = db
      .prepare("SELECT id FROM messages WHERE channel_id = ? AND role = 'assistant' ORDER BY created_at, id")
      .all(channelId) as Array<{ id: string }>;
    for (const r of ids.slice(1)) db.prepare('UPDATE messages SET entity_id = NULL WHERE id = ?').run(r.id);
  }
  const oneAfter = armAQuery(imported.OneTurnMint.channelId, imported.OneTurnMint.entityId);
  const sevenAfter = armAQuery(imported.SevenTurnMint.channelId, imported.SevenTurnMint.entityId);
  check(
    'F',
    'a fanout defect is INVISIBLE at 1 turn and caught at 7',
    oneAfter === 0 && sevenAfter === 6,
    `after nulling entity_id on every assistant row but the first: ` +
      `1-turn channel mismatched=${oneAfter} (arm A would PASS on broken data), ` +
      `7-turn channel mismatched=${sevenAfter} (arm A FAILS, correctly)`,
  );
}

// G — the instrument did not write into the corpus it measured. Everything minted above lives
// under .testdata/. An instrument that mutates its own subject is the defect this series keeps
// finding in other people's probes; it gets an arm here rather than a promise.
{
  const after = corpusFiles(corpusRoot).length;
  check('G', 'the live corpus is unchanged by this probe', after === listing.length, `before=${listing.length} after=${after}`);
  const leaked = fs.existsSync(corpusRoot)
    ? fs.readdirSync(corpusRoot, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name.startsWith('-mint-')).length
    : 0;
  check('G', 'no minted directory landed under the corpus root', leaked === 0, `-mint-* directories under ${corpusRoot}: ${leaked}`);
}

// H — WORLD arm. Why "walk recursively" is not the fix for a thin band.
//
// Every nested transcript is a sidechain: `isConversationEvent` drops `isSidechain` events, so
// the parser yields zero conversation events and zero turns for all of them — 52 MB of content
// that imports as nothing. If this arm ever reads CHANGED, subagent transcripts have started
// carrying main-conversation events and the scanner's deliberate exclusion
// (`session-scanner.ts`, "non-recursive — subagent dirs have their own") is worth revisiting.
if (corpusPresent && nested.length) {
  let withConv = 0;
  let withTurns = 0;
  let bytes = 0;
  for (const p of nested) {
    const parsed = await parseClaudeCodeSession(p);
    if ((parsed.integrity?.conversationEvents ?? 0) > 0) withConv++;
    if (parsed.turns.length > 0) withTurns++;
    bytes += fs.statSync(p).size;
  }
  check(
    'H',
    'every nested subagent transcript yields zero conversation events',
    withConv === 0 && withTurns === 0,
    `${nested.length} transcripts, ${(bytes / 1048576).toFixed(1)} MB: ${withConv} with conversation events, ${withTurns} with turns`,
  );
}

// I — WORLD arm. The trap is closed at the route, loudly.
//
// I expected a silent vacuous pass here: a zero-turn import would give arm A an EMPTY set to
// check `mismatched rows = 0` against, which passes. Measured instead: the route refuses with
// 400. So a recursive resolver would turn arm A's "import 201" RED rather than green-on-nothing.
// That is the product behaving well, and it is the reason this stays a named trap rather than a
// filed defect. The error text is a separate, minor accuracy point (see the round writeup).
if (corpusPresent && nested.length) {
  const inBandNested = nested.find((p) => {
    const s = fs.statSync(p).size;
    return s >= MIN_BYTES && s <= MAX_BYTES;
  });
  if (inBandNested) {
    const res = await post('/api/import/claude-code', { sessionPath: inBandNested, entityName: 'SubagentShouldRefuse' });
    const body = (await res.json()) as any;
    const before = (db.prepare('SELECT COUNT(*) n FROM channels').get() as { n: number }).n;
    check(
      'I',
      'importing a nested subagent transcript is refused, not silently empty',
      res.status === 400,
      `${(fs.statSync(inBandNested).size / 1024).toFixed(0)} KiB in-band subagent transcript → status=${res.status} ` +
        `error=${JSON.stringify(body.error ?? body).slice(0, 80)} channels after=${before}`,
    );
  }
}

// ── verdict ───────────────────────────────────────────────────────────
const instrumentArms = results.filter((r) => !r.world);
const worldArms = results.filter((r) => r.world);
const failed = instrumentArms.filter((r) => !r.pass);
const changed = worldArms.filter((r) => !r.pass);
console.log(`\ninstrument arms (A–G): ${instrumentArms.length - failed.length}/${instrumentArms.length} pass`);
console.log(`world arms (H–I):      ${worldArms.length - changed.length}/${worldArms.length} hold`);
if (failed.length) {
  console.log('FAILED (defect in this probe):');
  for (const f of failed) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
}
if (changed.length) {
  console.log('CHANGED (news about the subject, not about this probe):');
  for (const f of changed) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
}
process.exit(failed.length ? 1 : 0);
