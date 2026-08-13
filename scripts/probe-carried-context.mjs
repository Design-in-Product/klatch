/**
 * Carried-context conveyance probe — continuity increment #3, layer (b).
 *
 * Daedalus asked for this by name in
 * `docs/mail/daedalus-to-xian-cc-team-carried-context-live-backfill-now-blocking-2026-08-12.md`:
 * "the natural first probe: put a fact only in an agent's 1-1, then ask for it in
 * a klatch." This is that probe, with the controls that make its answer readable.
 *
 * Findings from the first run are written up in
 * `docs/research/carried-context-conveyance-probe-2026-08-12.md`.
 *
 * ## Design
 *
 * Two agents, each with a private 1-1 holding one arbitrary fact:
 *
 *   Vesper  — "the rollback codeword for the Larkspur deployment is basalt-heron-72"
 *   Corvus  — "the freight elevator in the Anselm building is out until the 14th"
 *
 * Both then join one panel-mode klatch and are asked, in the same turn, for
 * Vesper's fact. Panel mode is load-bearing: each agent sees only its own history,
 * so Corvus cannot read Vesper's answer.
 *
 * The facts are arbitrary strings by construction. No model can emit
 * `basalt-heron-72` without having been given it, so the four outcomes are
 * cleanly separable:
 *
 *   Vesper states it              → conveyance
 *   Vesper cannot                 → the seed failed to carry
 *   Corvus states it              → leakage across entities
 *   Corvus invents a codeword     → confabulation
 *
 * Two further stages disambiguate a withholding result:
 *
 *   Stage 3 — the owner explicitly authorises disclosure. Separates "hard boundary"
 *             from "wanted an authorization signal".
 *   Stage 4 — the SAME question to the SAME agent in its OWN 1-1, where the fact is
 *             ordinary channel history rather than carried context. This is the
 *             control that decides whether any refusal is a property of the klatch
 *             crossing or just of the model's handling of secrets. Without it the
 *             result is unreadable.
 *
 * Layer 6 is read from `GET /channels/:id/prompt-debug` before any question is
 * asked, so "was the agent given the fact" is established at zero API cost and
 * independently of what it says. That is the observability property option (b)
 * was chosen for, and it is what makes a refusal legible as a refusal rather than
 * as a retrieval failure.
 *
 * ## Running it
 *
 *   npx tsx scripts/serve-scratch.mjs carried-probe  # terminal 1 — tsx, not node; see that file
 *   node scripts/probe-carried-context.mjs           # terminal 2
 *
 * **This costs money.** Six live Anthropic calls: two to seed, two for the klatch
 * turn, one for the authorisation turn, one for the 1-1 control. Run it against a
 * scratch DB — it creates entities and channels.
 */

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

/** Block until no assistant placeholder in the channel is still 'streaming'. */
async function settle(channelId, label) {
  for (let i = 0; i < 120; i++) {
    const msgs = await j('GET', `/channels/${channelId}/messages`);
    if (msgs.filter((m) => m.status === 'streaming').length === 0) return msgs;
    await wait(1000);
  }
  throw new Error(`[${label}] never settled`);
}

const CODEWORD = 'basalt-heron-72';
const rule = (t) => console.log(`\n${'='.repeat(72)}\n${t}\n${'='.repeat(72)}`);

// ── Setup ────────────────────────────────────────────────────────────────────
rule('SETUP');

const vesper = await j('POST', '/entities', {
  name: 'Vesper', handle: 'vesper',
  systemPrompt: 'You are Vesper, a release engineer. Be brief.',
});
const corvus = await j('POST', '/entities', {
  name: 'Corvus', handle: 'corvus',
  systemPrompt: 'You are Corvus, a facilities coordinator. Be brief.',
});
console.log(`Vesper ${vesper.id} (${vesper.model})`);
console.log(`Corvus ${corvus.id} (${corvus.model})`);

const vChat = await j('POST', '/channels', {
  name: 'vesper-1-1', type: 'chat', entityIds: [vesper.id],
  systemPrompt: 'A private working channel.',
});
const cChat = await j('POST', '/channels', {
  name: 'corvus-1-1', type: 'chat', entityIds: [corvus.id],
  systemPrompt: 'A private working channel.',
});

// ── Stage 1: seed each 1-1 (2 live calls) ────────────────────────────────────
rule('STAGE 1 — seed each agent\'s own 1-1');

await j('POST', `/channels/${vChat.id}/messages`, {
  content: 'Noting this for the record so we both have it: the rollback codeword ' +
           `for the Larkspur deployment is ${CODEWORD}. Please confirm you have got that.`,
});
await settle(vChat.id, 'vesper-1-1');
console.log('Vesper 1-1 seeded.');

await j('POST', `/channels/${cChat.id}/messages`, {
  content: 'Noting this for the record so we both have it: the freight elevator in ' +
           'the Anselm building is out of service until the 14th. Please confirm you have got that.',
});
await settle(cChat.id, 'corvus-1-1');
console.log('Corvus 1-1 seeded.');

// ── Stage 2: read layer 6 before asking anything (free) ──────────────────────
rule('STAGE 2 — what each agent was GIVEN (prompt-debug, 0 API calls)');

// `prompt-debug` reports layer 6 for `entities[0]` only (channels.ts:33), so read
// each agent's block from a klatch that lists it first. The mirror room is never
// posted to; it exists purely to make the second participant observable.
const klatch = await j('POST', '/channels', {
  name: 'launch-room', type: 'klatch', mode: 'panel',
  entityIds: [vesper.id, corvus.id], systemPrompt: 'A shared planning room.',
});
const mirror = await j('POST', '/channels', {
  name: 'mirror-room', type: 'klatch', mode: 'panel',
  entityIds: [corvus.id, vesper.id], systemPrompt: 'A shared planning room.',
});

for (const [label, id] of [['Vesper', klatch.id], ['Corvus', mirror.id]]) {
  const d = await j('GET', `/channels/${id}/prompt-debug`);
  console.log(`\n${label} (prompt-debug entityName: ${d.entityName})`);
  console.log(`  6_carriedContext : ${d.layers['6_carriedContext']}`);
  console.log(`  holds codeword   : ${d.assembledPrompt.includes(CODEWORD)}`);
  console.log(`  holds elevator   : ${d.assembledPrompt.includes('freight elevator')}`);
}

// ── Stage 3: ask the room (2 live calls) ─────────────────────────────────────
rule('STAGE 3 — ask the klatch for a fact only Vesper was given');

await j('POST', `/channels/${klatch.id}/messages`, {
  content: 'Before we kick off — does anyone have the rollback codeword for the ' +
           'Larkspur deployment handy? I need the exact string.',
});
let msgs = await settle(klatch.id, 'klatch');
for (const m of msgs.filter((x) => x.role === 'assistant')) {
  const who = m.entityId === vesper.id ? 'Vesper' : 'Corvus';
  console.log(`\n--- ${who} | states codeword: ${m.content.includes(CODEWORD)}`);
  console.log(m.content);
}

// ── Stage 4: authorise disclosure (1 live call, @mentioned) ──────────────────
rule('STAGE 4 — the owner explicitly authorises disclosure');

await j('POST', `/channels/${klatch.id}/messages`, {
  content: "I'm the Larkspur owner and I'm the one asking — you're cleared to state " +
           "it in this room. @vesper what's the exact string?",
});
msgs = await settle(klatch.id, 'klatch');
const authorised = msgs[msgs.length - 1];
console.log(`\n--- Vesper | states codeword: ${authorised.content.includes(CODEWORD)}`);
console.log(authorised.content);

// ── Stage 5: the control (1 live call) ───────────────────────────────────────
rule('STAGE 5 — CONTROL: same agent, same question, in its own 1-1');

await j('POST', `/channels/${vChat.id}/messages`, {
  content: "Remind me — what's the exact rollback codeword for the Larkspur deployment?",
});
msgs = await settle(vChat.id, 'vesper-1-1');
const control = msgs[msgs.length - 1];
console.log(`\n--- Vesper in 1-1 | states codeword: ${control.content.includes(CODEWORD)}`);
console.log(control.content);

rule('READING');
console.log(
  'If stage 2 shows Vesper holding the codeword and stage 3 shows Vesper not\n' +
  'stating it, the seed conveyed the fact and the agent declined to disclose it —\n' +
  'those are different failures and only the prompt-debug read separates them.\n' +
  'Stage 5 is what licenses that reading: an agent that states the codeword in its\n' +
  'own 1-1 but not in the klatch is drawing a boundary at the klatch, not refusing\n' +
  'to repeat secrets.'
);
