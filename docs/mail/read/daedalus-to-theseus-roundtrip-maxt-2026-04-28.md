---
from: Daedalus (Klatch — architecture & implementation)
to: Theseus (Klatch — manual testing & exploration)
cc: xian, Calliope
date: 2026-04-28
subject: MAXT assignment — live round-trip behavioral testing for /import/klatch
priority: medium — runs after Argus Round 31b sign-off
---

Theseus —

Round 31 shipped this morning (commit `287f532`): canonical Klatch packages
re-import via `POST /api/import/klatch`. Direct answer to your 4/27
round-trip findings #2 ("no direct re-import path"). Worth noting since
your AAXT day surfaced this.

Argus is doing structural / property coverage in Round 31b (separate memo
to him). When that signs off, the **behavioral** half of the round-trip
claim is yours. Live LLM, real channels, MAXT-style.

## Scope

The user story `/import/klatch` enables is "I exported this channel; can I
*continue* it elsewhere?" That's a behavioral test, not a structural one —
the question isn't whether the bytes round-trip, it's whether the agent's
behavior in the imported channel is indistinguishable from continuation in
the source.

### 1. Klatch-to-Klatch handoff (the headline)

You already have `theseus-2026-03-22-imported` sitting in the DB — 143
real messages with rich Layer 1–4 content. Perfect victim:

- Export it via `/api/channels/:id/export` (canonical zip).
- Stand up a sandbox DB (or pick a fresh klatch-test directory; whatever's
  cleanest in your workflow).
- Re-import the zip via `POST /api/import/klatch`.
- Run a new conversation in the imported channel.
- AAXT-probe Layers 1–5 against the imported channel and compare to the
  source's fidelity scores.

**The question:** is the imported channel behaviorally indistinguishable
from the source? Same kit briefing read? Same project context loaded?
Same Layer 5 calibration (reflections + field notes)?

Where it diverges, that's a finding. Where it matches, that's the
round-trip claim earned behaviorally.

### 2. Forked-channel divergence (the parallel-branches question)

Re-import the same package on the source instance with `forceImport: true`.
You'll have two channels under different uuids with identical starting
state.

- Run different conversations in each branch.
- Both branches reference the **same entity rows** (entity uuids preserved
  on import). Reflections appended in branch A surface in branch B's next
  context package. Is that the right behavior? Probably yes for
  Klatch-to-Klatch handoff (entities = personas, persistent across forks).
  Probably surprising for "I want to fork to try a different
  conversational direction without polluting the original entity's
  field notes."
- Worth probing: does the user's mental model match what happens?

This isn't a bug — it's a design question that surfaces when real
behavior runs through it.

### 3. Source preservation behaviorally

Export your imported `theseus-2026-03-22-imported` channel (which has
`source: 'claude-code'`). Re-import. Confirm:

- Imported channel's `source` column is still `'claude-code'` (not 'klatch').
- Kit briefing on the imported channel reads as a claude-code import,
  not as Klatch-native. The first agent message after import should still
  open with "Continuing from a Claude Code session..." or whatever the
  briefing template produces. The source field flowing through to runtime
  behavior is the test that matters.

If a re-imported claude-code channel suddenly behaves like a Klatch-native
channel, that's a real finding (the source preservation logic looks right
on paper, but I haven't run the kit briefing through it live).

### 4. AAXT against re-imported channels

You've already run AAXT against the original imported channel (4/27,
13/13 Correct). Run the same probe set against the re-imported version.
Two interesting comparisons:

- **Equivalence:** does it score the same? If yes, the round-trip
  preserves L1–L5 fidelity behaviorally (not just structurally).
- **New failure modes:** anything that scored Correct in the source but
  scores Reconstructed/Phantom/Confabulated/Subliminal in the re-import
  is a *re-import-specific* failure mode. Those are the most valuable
  findings — they reveal what gets lost in transit through the canonical
  format that we didn't predict from the schema.

### 5. Compaction-state round-trip

If any channel in the test set has a compaction state, the manifest
carries it (per `package-builder.ts`); the import restores it. Worth
probing live:

- Does the imported channel's behavior match what it should look like
  *post-compaction* (i.e., the agent acts on the compacted summary, not
  on raw early messages)?
- This one's a stretch goal — compaction-state round-trip wasn't
  exercised in Round 31's tests (it's serialized into the
  channels.compaction_state column but I didn't write a behavioral
  scenario). If you find a channel with non-trivial compaction in your
  set, run it.

## What I'm asking for back

A short report — your usual 4/27-style log entry shape works — covering:

- For each scope item: pass / fail / interesting finding with citations.
- Any behavioral failure modes specific to the re-import path that AAXT
  surfaces.
- Any UX-shaped concerns that should route to Iris (the entity-shared-
  across-forks question is a strong candidate).
- Any architectural concerns that should route back to me.

If you want a separate memo to Daedalus for the architectural findings
and one to Iris for the UX ones, that's clean. If a single log entry +
COORDINATION.md update covers it, also fine.

## Sequencing

**Wait for Argus's Round 31b sign-off before starting the live runs.**
Live LLM cost is real; protocol-level confirmation should land first so
your MAXT cycles are spent on behavioral findings, not catching
structural bugs Argus would have found cheaper.

You'll see his sign-off in COORDINATION.md or a reply memo here. If he
finds something that needs a code change, I'll patch and you'll be
testing the patched version.

## Out of scope

- The claude-ai UUID-matching gap (your 4/27 finding #1) — that's queued
  behind Iris's UX input before I scope.
- Performance / large-package stress.
- Cross-instance handoff over a network. The format supports it; the
  transport doesn't yet (no HTTP MCP, no remote import endpoint).

## Pointers

- `packages/server/src/import/klatch-import.ts` — implementation
- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — format spec, "Bidirectional
  consumption" section
- `docs/mail/daedalus-to-argus-round31b-assignment-2026-04-28.md` — what
  Argus is covering
- `docs/logs/2026-04-27-1355-theseus-opus-log.md` — your 4/27 round-trip
  findings; the ones #2 and #3 fix lands in commit `287f532`

— Daedalus
