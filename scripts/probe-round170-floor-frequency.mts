/**
 * Round 170 probe — how often the layer-7 floor actually fires in a real database.
 *
 * Theseus, 2026-09-07 STOP fire. This instrument exists to settle one question that
 * three rounds of argument could not, because the deciding evidence is data neither
 * Daedalus nor I can reach from a worktree.
 *
 * The question, in his words (Round 169 memo, "The one thing I can't do from here"):
 *
 *   > how often a blank-prompt imported agent actually ends up in a fresh native 1:1,
 *   > which is the only room where layer 6's scope leaves it with nothing.
 *
 * He asked me to write the query. This is it. **It is not run yet** — it needs a path to
 * a real `klatch.db`, and the only databases inside this worktree are synthetic scaling
 * corpora from earlier probes. Running it against those and reporting the number would be
 * exactly the failure CLAUDE.md's verify-before-asserting rule exists to prevent, so the
 * probe *refuses* to run against an unnamed database (exit 2) and loudly labels the
 * synthetic case when invoked with `--self-test`.
 *
 * Run:
 *   npx tsx scripts/probe-round170-floor-frequency.mts /path/to/your/klatch.db
 *   npx tsx scripts/probe-round170-floor-frequency.mts --self-test     # synthetic, proves the instrument runs
 *
 * ZERO MODEL CALLS.
 *
 * ── Why it is safe to point at a live database ────────────────────────────────
 *
 * `getDb()` (`packages/server/src/db/index.ts:30-38`) runs `initSchema()` and
 * `runMigrations()` on first open, and sets `journal_mode = WAL`. All three write. So the
 * source database is **never handed to the server code**. Instead:
 *
 *   1. the source is opened `{ readonly: true, fileMustExist: true }`;
 *   2. `.backup()` snapshots it (the SQLite backup API — consistent across an open WAL,
 *      unlike `cp`, which can miss uncommitted `-wal` content);
 *   3. the source is closed, and its size + mtime are re-checked at exit (arm Z). If the
 *      file moved at all, the probe exits 1 and says so;
 *   4. `KLATCH_DB` is pointed at the **snapshot**, and only then are the server modules
 *      imported. Migrations run against the copy.
 *
 * ── What is measured, and by what ─────────────────────────────────────────────
 *
 * The floor verdict is not reimplemented. Every room is run through the shipped
 * `assembleSystemPrompt` and the reported number is its own `floorApplied`. The six lines
 * that gather that function's inputs mirror `routes/channels.ts:40-66` (the prompt-debug
 * route) and are cited there so a future reader can diff them.
 *
 * Mirroring the route is still a copy, so arm D does not trust it: a sample of rooms from
 * every cell of the cross-tab is re-driven through the real HTTP `/prompt-debug` endpoint
 * against the same snapshot, and any disagreement is a regression. That is the same
 * source-compared-vs-endpoint-verified line I held Daedalus to in Round 168, applied here
 * to my own work.
 *
 * ── Arms ──────────────────────────────────────────────────────────────────────
 *   P  provenance — is this a real database or a synthetic corpus?        [measurement]
 *   A  the agent population: blank / boilerplate / authored prompts       [measurement]
 *   B  the floor cross-tab over every room, by type and freshness         [measurement]
 *   C  THE HEADLINE — fresh native 1:1 chats whose agent has no prompt    [measurement]
 *   D  a sample of every cell re-driven through real HTTP prompt-debug    [regression]
 *   Z  the source database was not modified; packages/ diff clean         [regression]
 *
 * Regression arms exit 1 on failure. Same convention as Rounds 142/161/163/165/167/168.
 */

import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawn, execFileSync } from 'child_process';
import Database from 'better-sqlite3';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round170-floor-frequency');
// `packages/server/src/index.ts:47` hardcodes `const port = 3001` and does not read
// `process.env.PORT` (checked this session). So arm D cannot pick a quiet port to hide on;
// it must use 3001 and therefore must *prove* the server on it is the one it started. See
// the two guards in arm D — an occupied-port skip and a row-count identity check. Querying
// a dev server already on 3001 would answer from a different database and look like
// agreement, which is the worst available failure.
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}/api`;

let failures = 0;
function fail(arm: string, msg: string) {
  failures++;
  console.log(`  ✗ [${arm}] ${msg}`);
}
function pass(arm: string, msg: string) {
  console.log(`  ✓ [${arm}] ${msg}`);
}

// ── Arguments ────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const selfTest = argv.includes('--self-test');
const positional = argv.filter((a) => !a.startsWith('--'));
const httpCheck = !argv.includes('--no-http');

// ── Fixture mode ─────────────────────────────────────────────────────────────
//
// `--self-test` proves the probe *runs*; it does not prove arm C *works*, because the
// worktree corpus contains no blank-prompt agent and so arm C's zero is printed by a code
// path that has never been shown to be able to print anything else. That is not a
// hypothetical worry: if arm C were broken, a real database would also print zero, and
// item 1 would be closed on a stuck instrument.
//
// `--fixture` plants a database whose answer is known — including both sides of Round
// 168's pair, which assemble byte-identical prompts and must land on opposite sides of
// this count — and asserts the numbers come back. Planted with the real writers, in a
// child process, because KLATCH_DB is read once at module load.

const FIXTURE = path.join(SCRATCH, 'fixture.db');
const PLANTED = { headline: 2, fresh: 1, used: 1 };

if (argv.includes('--build-fixture-only')) {
  const target = path.resolve(positional[0]);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  process.env.KLATCH_DB = target;
  const fq = await import('../packages/server/src/db/queries.js');
  const { getDb: fgetDb } = await import('../packages/server/src/db/index.js');
  const { DEFAULT_CHANNEL_PREAMBLE: PRE, DEFAULT_MODEL: MODEL } = await import('../packages/shared/src/types.js');

  // '' is what import/entity-resolve.ts:93 mints. The boilerplate is what
  // routes/entities.ts:87 substitutes. Both are real, and they are the pair.
  const blank = fq.createEntity('Imported Agent', MODEL, '', '#888888');
  const boiler = fq.createEntity('Boilerplate Agent', MODEL, PRE, '#889988');
  const real = fq.createEntity('Authored Agent', MODEL, 'You are a careful archivist.', '#998888');

  // 1 — the headline, fresh: native 1:1, boilerplate channel prompt (layer 4 skips it),
  //     blank agent (layer 5 empty), chat (layer 6 out of scope) → floor fires.
  fq.createChannel('floored-fresh', PRE, MODEL, undefined, 'chat', [blank.id]);
  // 2 — the headline, used: same shape with a conversation in it.
  const used = fq.createChannel('floored-used', PRE, MODEL, undefined, 'chat', [blank.id]);
  fq.insertMessage(used.id, 'user', 'hello');
  fq.insertMessage(used.id, 'assistant', 'hi');
  // 3 — the other side of the pair: identical 28-byte output, floor silent.
  fq.createChannel('boilerplate-identity', '', MODEL, undefined, 'chat', [boiler.id]);
  // 4 — a real identity at layer 5.
  fq.createChannel('authored', '', MODEL, undefined, 'chat', [real.id]);
  // 5 — the same blank agent in an imported room: layer 1's kit briefing assembles, so
  //     the floor stays silent. This is the room that must NOT be counted.
  const imported = fq.createChannel('imported-room', PRE, MODEL, undefined, 'chat', [blank.id]);
  fgetDb().prepare("UPDATE channels SET source = 'claude-code', source_metadata = '{}' WHERE id = ?").run(imported.id);

  process.exit(0);
}

let sourcePath: string;
if (argv.includes('--fixture')) {
  fs.mkdirSync(SCRATCH, { recursive: true });
  for (const f of [FIXTURE, FIXTURE + '-wal', FIXTURE + '-shm']) if (fs.existsSync(f)) fs.rmSync(f);
  execFileSync('npx', ['tsx', 'scripts/probe-round170-floor-frequency.mts', '--build-fixture-only', FIXTURE], {
    cwd: REPO,
    stdio: 'inherit',
  });
  sourcePath = FIXTURE;
} else if (positional.length > 0) {
  sourcePath = path.resolve(positional[0]);
} else if (selfTest) {
  sourcePath = path.join(REPO, 'klatch.db');
} else {
  console.error(`
Round 170 — floor frequency in a real database.

  npx tsx scripts/probe-round170-floor-frequency.mts /path/to/klatch.db

This probe deliberately has no default. The only databases reachable from an agent
worktree are synthetic scaling corpora, and a frequency measured over synthetic data is
worse than no measurement — it looks like an answer. Pass the path to the database you
actually use, or --self-test to run against the worktree corpus with every number
labelled SYNTHETIC.

The source database is snapshotted read-only and never written. See the header.
`);
  process.exit(2);
}

if (!fs.existsSync(sourcePath)) {
  console.error(`No database at ${sourcePath}`);
  process.exit(2);
}

// ── Snapshot ─────────────────────────────────────────────────────────────────

fs.mkdirSync(SCRATCH, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const snapPath = path.join(SCRATCH, `snapshot-${stamp}.db`);

const before = fs.statSync(sourcePath);

const src = new Database(sourcePath, { readonly: true, fileMustExist: true });
await src.backup(snapPath);
src.close();

// ── P — provenance ───────────────────────────────────────────────────────────

console.log('\n══ P — provenance ═══════════════════════════════════════════════════');
console.log(`  source     ${sourcePath}`);
console.log(`  size       ${before.size.toLocaleString()} bytes`);
console.log(`  mtime      ${before.mtime.toISOString()}`);
console.log(`  snapshot   ${path.relative(REPO, snapPath)}`);
if (selfTest) {
  console.log('\n  *** --self-test: this is a SYNTHETIC corpus. Every number below describes');
  console.log('  *** a probe fixture, not a person\'s usage. Do not quote them as frequency. ***');
}

const snap = new Database(snapPath, { readonly: true });
const one = <T>(sql: string): T => (snap.prepare(sql).get() as Record<string, unknown>)?.value as T;

const totals = {
  channels: one<number>('SELECT COUNT(*) AS value FROM channels'),
  entities: one<number>('SELECT COUNT(*) AS value FROM entities'),
  messages: one<number>('SELECT COUNT(*) AS value FROM messages'),
};
console.log(`\n  channels ${totals.channels}   entities ${totals.entities}   messages ${totals.messages}`);

const bySource = snap
  .prepare(
    `SELECT COALESCE(NULLIF(source, ''), 'native') AS source, type, COUNT(*) AS n
     FROM channels GROUP BY 1, 2 ORDER BY n DESC`,
  )
  .all() as { source: string; type: string; n: number }[];
console.log('\n  rooms by (source, type):');
for (const r of bySource) console.log(`    ${r.source.padEnd(14)} ${String(r.type).padEnd(8)} ${r.n}`);

// A corpus with thousands of channels and no messages is a scaling fixture. Say so
// rather than letting a reader mistake it for usage — this is the exact confusion the
// synthetic worktree database caused in Round 168.
const looksSynthetic = totals.messages === 0 && totals.channels > 50;
if (looksSynthetic && !selfTest) {
  console.log('\n  ⚠ This database has 0 messages across ' + totals.channels + ' channels.');
  console.log('  ⚠ That is the signature of a scaling fixture, not a record of use.');
  console.log('  ⚠ Treat arm C\'s number as describing the fixture until that is ruled out.');
}

// ── Load the shipped assembly against the snapshot ───────────────────────────
// KLATCH_DB is read at module-load time (db/index.ts:24), so it must be set before the
// first import of anything that reaches getDb().

process.env.KLATCH_DB = snapPath;

const { assembleSystemPrompt } = await import('../packages/server/src/claude/client.js');
const { buildCarriedContextBlock } = await import('../packages/server/src/claude/carried-context.js');
const q = await import('../packages/server/src/db/queries.js');
const { DEFAULT_CHANNEL_PREAMBLE, isDefaultChannelPreamble } = await import('../packages/shared/src/types.js');

// ── A — the agent population ─────────────────────────────────────────────────

console.log('\n══ A — the agent population ═════════════════════════════════════════');

const entities = q.getAllEntities();
type PromptClass = 'blank' | 'boilerplate' | 'authored';
function classify(p: string | undefined | null): PromptClass {
  if (!p || !p.trim()) return 'blank';
  if (isDefaultChannelPreamble(p)) return 'boilerplate';
  return 'authored';
}

const popn: Record<PromptClass, number> = { blank: 0, boilerplate: 0, authored: 0 };
for (const e of entities) popn[classify(e.systemPrompt)]++;

console.log(`  blank        ${popn.blank}\t— layer 5 contributes nothing; only the import writer mints these`);
console.log(`  boilerplate  ${popn.boilerplate}\t— "${DEFAULT_CHANNEL_PREAMBLE}"; layer 5 sends it, floor stays silent`);
console.log(`  authored     ${popn.authored}\t— a real identity at layer 5`);

// "Imported" is not a column — `entities` has no source field (verified this session
// against db/index.ts: id, name, handle, model, system_prompt, color, created_at, effort,
// reflections). The import signature is used instead, and named as a proxy rather than
// asserted as provenance: entity-resolve.ts:93 mints '' while routes/entities.ts:87
// substitutes the boilerplate, so a blank prompt is *already* strong evidence of import.
// Room binding is reported alongside it so the reader can see both.
if (popn.blank > 0) {
  console.log('\n  blank-prompt agents, and where they are bound:');
  for (const e of entities.filter((x) => classify(x.systemPrompt) === 'blank')) {
    const rooms = q.getEntityChannels(e.id);
    const imported = rooms.filter((r) => r.source && r.source !== 'native').length;
    const native = rooms.length - imported;
    console.log(
      `    ${(e.name || '(unnamed)').slice(0, 32).padEnd(34)} ${rooms.length} rooms  ` +
        `(${imported} imported, ${native} native)${imported > 0 ? '  ← import signature' : ''}`,
    );
  }
}

// ── B — the floor cross-tab ──────────────────────────────────────────────────

console.log('\n══ B — the floor, over every room ═══════════════════════════════════');

const msgCount = snap.prepare('SELECT COUNT(*) AS value FROM messages WHERE channel_id = ?');

interface Row {
  channelId: string;
  channelName: string;
  entityId: string;
  entityName: string;
  type: string;
  source: string;
  members: number;
  messages: number;
  floorApplied: boolean;
  assembledLength: number;
}

const rows: Row[] = [];
let noEntityRooms = 0;

for (const channel of q.getAllChannels()) {
  const members = q.getChannelEntities(channel.id);
  if (members.length === 0) {
    noEntityRooms++;
    continue;
  }
  // Mirrors routes/channels.ts:40-66 — the prompt-debug route's input gathering.
  // Arm D re-drives a sample of these through that route to check the mirror.
  const project = channel.projectId ? q.getProjectForChannel(channel.id) ?? null : null;
  const channelFileNames = q.getChannelFiles(channel.id).map((f) => `- ${f.name} (${f.mimeType})`);
  const projectFileNames = project ? q.getProjectFiles(project.id).map((f) => `- ${f.name} (${f.mimeType})`) : [];
  const n = (msgCount.get(channel.id) as { value: number }).value;

  for (const entity of members) {
    const carried = buildCarriedContextBlock(entity, channel);
    const { prompt, floorApplied } = assembleSystemPrompt(
      entity,
      channel.systemPrompt,
      channel,
      project,
      channelFileNames,
      projectFileNames,
      { carriedContext: carried?.text },
    );
    rows.push({
      channelId: channel.id,
      channelName: channel.name,
      entityId: entity.id,
      entityName: entity.name,
      type: channel.type,
      source: channel.source && channel.source !== 'native' ? channel.source : 'native',
      members: members.length,
      messages: n,
      floorApplied,
      assembledLength: prompt.length,
    });
  }
}

const floored = rows.filter((r) => r.floorApplied);
console.log(`  ${rows.length} (room, agent) pairs over ${totals.channels} rooms` +
  (noEntityRooms ? `  [${noEntityRooms} rooms have no agent and cannot assemble]` : ''));
console.log(`  floor fires in ${floored.length} of them` +
  (rows.length ? ` (${((100 * floored.length) / rows.length).toFixed(2)}%)` : ''));

// The cross-tab is by (source, type, freshness) because those are exactly the three
// dimensions of the argument: layer 1 keys on source, layer 6 keys on type, and "fresh"
// is the state in which a klatch room's layer 6 would also have nothing to carry.
const cells = new Map<string, { total: number; floored: number }>();
for (const r of rows) {
  const key = `${r.source === 'native' ? 'native' : 'imported'}|${r.type}|${r.messages === 0 ? 'fresh' : 'has-history'}`;
  const c = cells.get(key) ?? { total: 0, floored: 0 };
  c.total++;
  if (r.floorApplied) c.floored++;
  cells.set(key, c);
}
console.log('\n  origin    type    freshness      pairs   floored');
for (const [key, c] of [...cells.entries()].sort()) {
  const [origin, type, fresh] = key.split('|');
  console.log(
    `  ${origin.padEnd(9)} ${type.padEnd(7)} ${fresh.padEnd(13)} ${String(c.total).padStart(6)}  ${String(c.floored).padStart(8)}`,
  );
}

// ── C — the headline ─────────────────────────────────────────────────────────

console.log('\n══ C — the configuration item 1 is about ════════════════════════════');
console.log('  a native 1:1 chat, one agent, no prompt anywhere, no history:');
console.log('  the room where layer 6\'s klatch-only scope leaves the agent with nothing.\n');

const headline = floored.filter((r) => r.source === 'native' && r.type === 'chat' && r.members === 1);
const headlineFresh = headline.filter((r) => r.messages === 0);
const headlineUsed = headline.filter((r) => r.messages > 0);

console.log(`  floored native 1:1 chats            ${headline.length}`);
console.log(`    of which fresh (0 messages)       ${headlineFresh.length}`);
console.log(`    of which have been talked in      ${headlineUsed.length}   ← a person used this room`);

// The distinction matters more than the raw count. A floored room with zero messages may
// have been created and abandoned; a floored room with messages in it is a conversation
// that actually happened on top of a 28-character prompt. Daedalus's ruling turns on
// frequency, and *used* is the stronger form of the evidence.
if (headlineUsed.length > 0) {
  console.log('\n  rooms with history, floored:');
  for (const r of headlineUsed.slice(0, 25)) {
    console.log(`    ${r.channelName.slice(0, 40).padEnd(42)} agent "${r.entityName}"  ${r.messages} messages`);
  }
  if (headlineUsed.length > 25) console.log(`    … and ${headlineUsed.length - 25} more`);
}

if (headline.length === 0 && popn.blank === 0) {
  // Distinguish "measured, and it never happens" from "there was nothing here to
  // measure". Both print zero, and only the first is an answer to Daedalus's question.
  console.log('\n  → Zero, but this database contains NO blank-prompt agents at all (arm A).');
  console.log('    So this is not evidence that the configuration is rare — it is evidence');
  console.log('    that the population it needs is absent here. Item 1 stays open, and this');
  console.log('    run should not be cited as its frequency.');
} else if (headline.length === 0) {
  console.log(`\n  → Zero, over a real population of ${popn.blank} blank-prompt agent(s). On this`);
  console.log('    database, item 1 is a documented asymmetry rather than a live defect.');
  console.log('    That closes it on evidence, which is what was asked for.');
} else if (headlineUsed.length === 0) {
  console.log('\n  → Reached but never used. Weaker than "routinely"; stronger than "never".');
} else {
  console.log('\n  → Real conversations are running on the floor. Item 1 has its frequency.');
}

// In fixture mode the answer is known, so arm C becomes a regression on itself.
if (argv.includes('--fixture')) {
  console.log('\n  ── fixture assertions (the planted answer) ──');
  const checks: [string, number, number][] = [
    ['floored native 1:1 chats', headline.length, PLANTED.headline],
    ['of which fresh', headlineFresh.length, PLANTED.fresh],
    ['of which used', headlineUsed.length, PLANTED.used],
  ];
  for (const [label, got, want] of checks) {
    if (got === want) pass('C', `${label}: ${got}`);
    else fail('C', `${label}: got ${got}, planted ${want}`);
  }
  // The pair, restated as the thing that would break silently: room 3 assembles the
  // same 28 bytes as room 1 and must not appear in the count.
  const boilerRoom = rows.find((r) => r.channelName === 'boilerplate-identity');
  const flooredRoom = rows.find((r) => r.channelName === 'floored-fresh');
  if (!boilerRoom || !flooredRoom) {
    fail('C', 'fixture rooms missing — the builder did not plant what arm C reads');
  } else if (boilerRoom.assembledLength !== flooredRoom.assembledLength) {
    fail('C', `the pair no longer assembles identical output (${flooredRoom.assembledLength} vs ${boilerRoom.assembledLength}) — the fixture has stopped testing what it was built to test`);
  } else if (boilerRoom.floorApplied) {
    fail('C', 'boilerplate-as-identity counted as floored — arm C is deriving the floor from the output string');
  } else {
    pass('C', `the pair: both assemble ${flooredRoom.assembledLength} bytes, only one is counted`);
  }
  // And the imported room, which layer 1 rescues.
  const importedRoom = rows.find((r) => r.channelName === 'imported-room');
  if (importedRoom?.floorApplied) fail('C', 'imported room counted as floored — layer 1 should have assembled a kit briefing');
  else if (importedRoom) pass('C', 'the imported room with the same blank agent is not floored (layer 1 assembled)');
}

// ── D — the mirror, checked at the endpoint ──────────────────────────────────

if (!httpCheck) {
  console.log('\n══ D — SKIPPED (--no-http) ══════════════════════════════════════════');
  console.log('  The in-process numbers above are unverified against the real route.');
} else {
  console.log('\n══ D — a sample of every cell, re-driven through real HTTP ══════════');

  // One floored and one unfloored room per cell, capped — enough to catch a mirror that
  // diverges from the route, without thousands of requests on a large database.
  const sample: Row[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const key = `${r.source === 'native' ? 'native' : 'imported'}|${r.type}|${r.floorApplied}`;
    const n = [...seen].filter((s) => s === key).length;
    if (n < 3) {
      sample.push(r);
      seen.add(key);
    }
  }
  const capped = sample.slice(0, 40);

  // Guard 1 — refuse to reuse a server we did not start. Whatever is on 3001 is pointed
  // at some other database, and its answers would be about rooms that are not these.
  const occupied = await waitForPort(PORT, 300);
  if (occupied) {
    console.log(`  ⚠ SKIPPED: something is already listening on ${PORT}.`);
    console.log('  ⚠ That server is pointed at a different database, so its answers would');
    console.log('  ⚠ not be about the rooms measured above. Stop the dev server and re-run.');
    console.log('  ⚠ Arm B/C are in-process only until this passes.');
  } else {
  const server = spawn('npx', ['tsx', 'packages/server/src/index.ts'], {
    cwd: REPO,
    env: { ...process.env, KLATCH_DB: snapPath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const serverLog: string[] = [];
  server.stdout.on('data', (d) => serverLog.push(String(d)));
  server.stderr.on('data', (d) => serverLog.push(String(d)));

  const up = await waitForPort(PORT, 30_000);
  if (!up) {
    fail('D', `server did not come up on ${PORT} in 30s. Log:\n${serverLog.join('')}`);
  } else {
    // Guard 2 — the server answering must be reading the snapshot. A row-count identity
    // is enough to catch "it fell back to the repo-root klatch.db", which is the failure
    // that would otherwise pass silently.
    let onSnapshot = false;
    try {
      const listed = (await (await fetch(`${BASE}/channels`)).json()) as unknown[];
      if (!Array.isArray(listed) || listed.length !== totals.channels) {
        fail('D', `the server on ${PORT} lists ${Array.isArray(listed) ? listed.length : '?'} channels but the snapshot has ${totals.channels} — it is not reading the snapshot. Refusing to compare.`);
      } else {
        onSnapshot = true;
        pass('D', `server confirmed on the snapshot (${totals.channels} channels)`);
      }
    } catch (err) {
      fail('D', `could not confirm the server's database: ${(err as Error).message}`);
    }

    let agreed = 0;
    for (const r of onSnapshot ? capped : []) {
      const url = `${BASE}/channels/${encodeURIComponent(r.channelId)}/prompt-debug?entityId=${encodeURIComponent(r.entityId)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          fail('D', `${r.channelName}: prompt-debug returned ${res.status}`);
          continue;
        }
        const body = (await res.json()) as { layers: Record<string, string>; assembled?: string };
        const report = body.layers?.['7_floor'] ?? '';
        // Round 169's ruling: the leading verdict token is the contract, the prose is
        // not. Keying on the prefix rather than the sentence, and startsWith rather than
        // includes — 'INACTIVE' contains 'ACTIVE'.
        const endpointFloored = report.startsWith('ACTIVE');
        if (endpointFloored !== r.floorApplied) {
          fail('D', `${r.channelName} / ${r.entityName}: in-process floorApplied=${r.floorApplied}, endpoint said "${report.slice(0, 24)}…"`);
        } else {
          agreed++;
        }
      } catch (err) {
        fail('D', `${r.channelName}: ${(err as Error).message}`);
      }
    }
    if (onSnapshot && agreed === capped.length) {
      pass('D', `${agreed}/${capped.length} sampled rooms: the mirror agrees with /prompt-debug`);
    } else if (onSnapshot) {
      console.log(`  ${agreed}/${capped.length} agreed`);
    }
  }
  server.kill('SIGTERM');
  }
}

// ── Z — hygiene ──────────────────────────────────────────────────────────────

console.log('\n══ Z — the probe changed nothing ════════════════════════════════════');

snap.close();

const after = fs.statSync(sourcePath);
if (after.size !== before.size || after.mtimeMs !== before.mtimeMs) {
  fail('Z', `SOURCE DATABASE CHANGED — size ${before.size}→${after.size}, mtime ${before.mtime.toISOString()}→${after.mtime.toISOString()}`);
} else {
  pass('Z', 'source database untouched (size and mtime identical)');
}

for (const sidecar of ['-wal', '-shm']) {
  if (fs.existsSync(sourcePath + sidecar)) {
    console.log(`  note: ${path.basename(sourcePath) + sidecar} exists — the snapshot used the SQLite backup API, which reads it consistently.`);
  }
}

try {
  const diff = execFileSync('git', ['status', '--porcelain', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
  if (diff) fail('Z', `packages/ is dirty after the run:\n${diff}`);
  else pass('Z', 'packages/ diff clean — shipped code measured, not modified');
} catch (err) {
  console.log(`  (git check skipped: ${(err as Error).message})`);
}

console.log(`\n${failures === 0 ? '✓ no regressions' : `✗ ${failures} regression(s)`}`);
console.log(`snapshot retained at ${path.relative(REPO, snapPath)} — delete it when done; it is a copy of real data.\n`);
process.exit(failures === 0 ? 0 : 1);

// ── helpers ──────────────────────────────────────────────────────────────────

async function waitForPort(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise<boolean>((resolve) => {
      const sock = net.connect(port, '127.0.0.1');
      sock.on('connect', () => {
        sock.destroy();
        resolve(true);
      });
      sock.on('error', () => resolve(false));
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}
