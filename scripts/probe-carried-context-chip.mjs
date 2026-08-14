/**
 * Carried-context CHIP probe — does Round 48's `🧵 Carried context from N other
 * conversations` reach a human looking at a live klatch turn?
 *
 * Round 48 (Iris, 2026-08-13 STOP) renders the chip in `MessageList.tsx`'s
 * `ArtifactList` off `artifact.inputSummary`, and is covered by five component
 * tests that hand the component an artifact directly. Those tests establish that
 * the component renders correctly given an artifact. They cannot establish that a
 * real turn produces one, that the count is right, or that the artifact reaches
 * the client at the moment the human is reading the reply. This probe measures
 * those three things against the running server.
 *
 * ## What it measures
 *
 *   1. **Production** — does a live klatch turn actually write a `carried_context`
 *      artifact, and *when*? Read while the message is still `streaming`, so the
 *      answer distinguishes "written at stream start" from "written on completion".
 *   2. **Count fidelity** — the chip's whole text is `inputSummary`. Wren is seeded
 *      in TWO 1-1s, so ground truth is "2 other conversations" and a wrong count is
 *      visible rather than plausible. Thorne has none, so its assistant message must
 *      carry NO artifact — that is the negative control that makes a positive read
 *      meaningful (an artifact on every message would also pass check 1).
 *   3. **Delivery to the live turn** — every SSE event for both assistant messages
 *      is captured and its keys recorded. The client updates its in-memory message
 *      from those events (`App.tsx` `handleStreamComplete`) and does not refetch, so
 *      if no event carries artifact data the chip cannot appear until something else
 *      triggers `fetchMessages` — channel switch or reload. The same file's
 *      `StreamEvent.stopReason` docstring says this is why *that* field rides the
 *      event, which is the precedent this checks against.
 *
 * The `?include=artifacts` read at the end is the same URL the client uses
 * (`api/client.ts:256-259`), so a passing read means the reload path works.
 *
 * Stage 6 is a **zero-API-cost** second count check. `buildCarriedContextBlock`
 * derives `roomCount` from `new Set(kept.map(k => k.room))` where `room` is the
 * channel *name* (`carried-context.ts:311`), and `channels.name` has no UNIQUE
 * constraint (`db/index.ts:44-45`) — imports name channels from the source
 * conversation's title, which collides easily. Stage 6 writes two same-named 1-1s
 * directly to the DB and reads the resulting count out of the block's own footer
 * via `prompt-debug`, so it costs nothing and needs no live turn.
 *
 * ## Running it
 *
 *   npx tsx scripts/serve-scratch.mjs chip-probe   # terminal 1 — tsx, not node
 *   node scripts/probe-carried-context-chip.mjs    # terminal 2
 *
 * **Costs money.** Four live Anthropic calls: two to seed Wren's 1-1s, two for the
 * klatch turn (Wren + Thorne, panel mode). Stage 6 adds none. Creates entities and
 * channels — point it at a scratch DB.
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.KLATCH_DB || path.join(__dirname, '..', '.testdata', 'chip-probe.db');
const API = process.env.KLATCH_API || 'http://localhost:3001/api';

const j = async (method, path, body) => {
  const r = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${text}`);
  return JSON.parse(text);
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rule = (t) => console.log(`\n${'='.repeat(72)}\n${t}\n${'='.repeat(72)}`);

async function settle(channelId, label) {
  for (let i = 0; i < 120; i++) {
    const msgs = await j('GET', `/channels/${channelId}/messages`);
    if (msgs.filter((m) => m.status === 'streaming').length === 0) return msgs;
    await wait(1000);
  }
  throw new Error(`[${label}] never settled`);
}

/**
 * Consume `GET /messages/:id/stream` to completion, recording every event.
 * Returns the events with their `content` replaced by a length, so the log shows
 * the event SHAPE (which is the thing under test) rather than the prose.
 */
async function captureStream(messageId, label) {
  const res = await fetch(`${API}/messages/${messageId}/stream`);
  if (!res.ok) throw new Error(`stream ${label} → ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      try {
        const ev = JSON.parse(line.slice(5).trim());
        events.push(ev);
      } catch { /* partial frame; ignore */ }
    }
    if (events.some((e) => e.type === 'message_complete' || e.type === 'error')) break;
  }
  reader.cancel().catch(() => {});
  return events;
}

const TAG = (process.argv[2] || 'C1').replace(/[^a-zA-Z0-9._-]/g, '-');
const n = (s) => `${s}-${TAG}`;

// ── Setup ────────────────────────────────────────────────────────────────────
rule('SETUP');

const wren = await j('POST', '/entities', {
  name: n('Wren'), handle: n('wren'),
  systemPrompt: 'You are Wren, a release engineer. Be brief.',
});
const thorne = await j('POST', '/entities', {
  name: n('Thorne'), handle: n('thorne'),
  systemPrompt: 'You are Thorne, a facilities coordinator. Be brief.',
});
console.log(`Wren   ${wren.id}`);
console.log(`Thorne ${thorne.id} (no 1-1s — negative control)`);

const wOps = await j('POST', '/channels', {
  name: n('wren-ops'), type: 'chat', entityIds: [wren.id],
  systemPrompt: 'A private working channel.',
});
const wPlanning = await j('POST', '/channels', {
  name: n('wren-planning'), type: 'chat', entityIds: [wren.id],
  systemPrompt: 'A private working channel.',
});

// ── Stage 1: seed BOTH of Wren's 1-1s (2 live calls) ─────────────────────────
rule('STAGE 1 — seed two separate 1-1s for Wren, so ground truth is N=2');

await j('POST', `/channels/${wOps.id}/messages`, {
  content: 'For the record: the Larkspur rollback window is 02:00–04:00 UTC. Confirm you have that.',
});
await settle(wOps.id, 'wren-ops');
await j('POST', `/channels/${wPlanning.id}/messages`, {
  content: 'For the record: the Q3 planning offsite moved to the Marigold Annex. Confirm you have that.',
});
await settle(wPlanning.id, 'wren-planning');
console.log('Both Wren 1-1s seeded. Ground truth for the chip: "2 other conversations".');

const klatch = await j('POST', '/channels', {
  name: n('chip-room'), type: 'klatch', mode: 'panel',
  entityIds: [wren.id, thorne.id], systemPrompt: 'A shared planning room.',
});

// ── Stage 2: preconditions off the assembled prompt (free) ───────────────────
rule('STAGE 2 — layer 6 per seat, before anything is asked (0 API calls)');

for (const [label, id] of [['Wren', wren.id], ['Thorne', thorne.id]]) {
  const d = await j('GET', `/channels/${klatch.id}/prompt-debug?entityId=${id}`);
  console.log(`${label.padEnd(7)} 6_carriedContext: ${d.layers['6_carriedContext']}`);
}

// ── Stage 3: the live turn, with the SSE stream captured (2 live calls) ──────
rule('STAGE 3 — one live klatch turn; capture every SSE event both seats emit');

const posted = await j('POST', `/channels/${klatch.id}/messages`, {
  content: 'Quick round before we start — anything either of you is carrying in from elsewhere that bears on the launch?',
});

// Subscribe immediately, the way the client does, and read the artifact table
// WHILE the messages are still streaming.
const streamCaptures = Promise.all(
  posted.assistants.map((a) =>
    captureStream(a.assistantMessageId, a.entityId === wren.id ? 'Wren' : 'Thorne')
      .then((events) => ({ entityId: a.entityId, messageId: a.assistantMessageId, events }))
  )
);

await wait(1500);
const midFlight = await j('GET', `/channels/${klatch.id}/messages?include=artifacts`);
const midStreaming = midFlight.filter((m) => m.status === 'streaming');
console.log(`\nMID-FLIGHT read (${midStreaming.length} message(s) still streaming):`);
for (const m of midFlight.filter((x) => x.role === 'assistant')) {
  const who = m.entityId === wren.id ? 'Wren' : 'Thorne';
  const cc = (m.artifacts || []).filter((a) => a.type === 'carried_context');
  console.log(`  ${who.padEnd(7)} status=${m.status.padEnd(10)} carried_context artifacts: ${cc.length}` +
    (cc.length ? ` → inputSummary: "${cc[0].inputSummary}"` : ''));
}

const captures = await streamCaptures;
await settle(klatch.id, 'klatch');

rule('STAGE 4 — what the SSE stream actually carried');

let anyArtifactInStream = false;
for (const cap of captures) {
  const who = cap.entityId === wren.id ? 'Wren' : 'Thorne';
  const keys = new Set();
  const types = {};
  for (const ev of cap.events) {
    Object.keys(ev).forEach((k) => keys.add(k));
    types[ev.type] = (types[ev.type] || 0) + 1;
  }
  const mentionsArtifact = [...keys].some((k) => /artifact|carried/i.test(k));
  if (mentionsArtifact) anyArtifactInStream = true;
  console.log(`\n${who}: ${cap.events.length} events  ${JSON.stringify(types)}`);
  console.log(`  union of keys across all events: ${JSON.stringify([...keys])}`);
  console.log(`  any key mentioning artifact/carried: ${mentionsArtifact}`);
}

// ── Stage 5: the reload path — the URL the client actually fetches ───────────
rule('STAGE 5 — GET …/messages?include=artifacts (the reload path)');

const final = await j('GET', `/channels/${klatch.id}/messages?include=artifacts`);
const results = {};
for (const m of final.filter((x) => x.role === 'assistant')) {
  const who = m.entityId === wren.id ? 'Wren' : 'Thorne';
  const cc = (m.artifacts || []).filter((a) => a.type === 'carried_context');
  results[who] = { count: cc.length, inputSummary: cc[0]?.inputSummary ?? null, content: cc[0]?.content ?? null };
  console.log(`\n${who}: ${cc.length} carried_context artifact(s)`);
  if (cc.length) {
    console.log(`  chip would read: 🧵 Carried context from ${cc[0].inputSummary}`);
    console.log(`  server-side content (never rendered): ${cc[0].content}`);
  }
}

// ── Stage 6: count fidelity when two rooms share a name (0 live calls) ──────
rule('STAGE 6 — two DIFFERENT conversations with the SAME name (0 API calls)');

const twin = await j('POST', '/entities', {
  name: n('Larkin'), handle: n('larkin'),
  systemPrompt: 'You are Larkin. Be brief.',
});
const twinA = await j('POST', '/channels', {
  name: n('Untitled'), type: 'chat', entityIds: [twin.id], systemPrompt: 'A private working channel.',
});
const twinB = await j('POST', '/channels', {
  name: n('Untitled'), type: 'chat', entityIds: [twin.id], systemPrompt: 'A private working channel.',
});
console.log(`two distinct channels, same name "${n('Untitled')}": ${twinA.id} / ${twinB.id}`);

const db = new Database(DB_PATH);
const ins = db.prepare(
  'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
);
const base = Date.parse('2026-08-13T08:00:00.000Z');
let seq = 0;
const put = (channelId, role, content) => {
  ins.run(randomUUID(), channelId, role, content, 'complete',
    role === 'assistant' ? twin.model : null,
    role === 'assistant' ? twin.id : null,
    new Date(base + seq++ * 60_000).toISOString());
};
put(twinA.id, 'user', 'In this thread: the freight lift is out until the 14th.');
put(twinA.id, 'assistant', 'Noted — freight lift out until the 14th.');
put(twinB.id, 'user', 'In this thread: the badge reader on the south door is being replaced.');
put(twinB.id, 'assistant', 'Noted — south door badge reader replacement.');
db.close();

const twinKlatch = await j('POST', '/channels', {
  name: n('twin-room'), type: 'klatch', mode: 'panel',
  entityIds: [twin.id, thorne.id], systemPrompt: 'A shared planning room.',
});
const twinDebug = await j('GET', `/channels/${twinKlatch.id}/prompt-debug?entityId=${twin.id}`);
const footerMatch = twinDebug.assembledPrompt.match(/the (\d+) most recent message\(s\) from (\d+) other conversation\(s\)/);
console.log(`block footer says: ${footerMatch ? `${footerMatch[1]} message(s) from ${footerMatch[2]} other conversation(s)` : 'FOOTER NOT FOUND'}`);
console.log(`ground truth      : 4 message(s) from 2 other conversation(s)`);
const twinRoomCount = footerMatch ? Number(footerMatch[2]) : null;
console.log(`carries both facts: lift=${twinDebug.assembledPrompt.includes('freight lift')} badge=${twinDebug.assembledPrompt.includes('badge reader')}`);

rule('READING');
const wrenSummary = results.Wren?.inputSummary;
console.log(`Production            : ${results.Wren?.count === 1 ? 'PASS — live turn wrote an artifact' : 'FAIL'}`);
console.log(`Count fidelity        : ${wrenSummary === '2 other conversations' ? 'PASS' : `FAIL — expected "2 other conversations", got ${JSON.stringify(wrenSummary)}`}`);
console.log(`Negative control      : ${results.Thorne?.count === 0 ? 'PASS — no artifact for the seat that carried nothing' : 'FAIL — chip would appear on a seat with no carried context'}`);
console.log(`Artifact before finish: ${midStreaming.length > 0 ? 'measured mid-flight above' : 'INCONCLUSIVE — both messages completed before the mid-flight read'}`);
console.log(`Delivered to live turn: ${anyArtifactInStream ? 'YES — an SSE event carries it' : 'NO — no SSE event carries artifact data; the chip cannot appear until a refetch'}`);
console.log(`Same-name room count  : ${twinRoomCount === 2 ? 'PASS — 2 rooms counted as 2' : `UNDERCOUNT — two conversations reported as ${twinRoomCount}`}`);
