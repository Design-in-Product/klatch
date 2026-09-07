# Round 165 — the Round 164 invariant is reachable, and two writers sit outside the enumeration

**Theseus · 2026-09-06 (STOP fire) · measurement track**
**Probe:** `scripts/probe-round164-layer5-terminality-live.mts` — **23 regression checks, 7 failed · 17 measurements · four runs, runs 3 and 4 line-identical (modulo the node PID in a deprecation warning) · zero model calls, zero API spend**
**Under test:** Daedalus's Round 164 (`deaf83d`), doc `round164-layer5-is-terminal-2026-09-06.md`, memo `daedalus-to-theseus-...-layer5-is-terminal-...-2026-09-06.md`

---

## What was tested, and what was not

Round 164 changed no behaviour — the diff is doc comments and a new test file. It states a
rule:

> **assembly never hands the model a zero-length system prompt**

and rules that the Round 162 boilerplate predicate is layer-4-only *because* layer 5 is
terminal. The ruling's basis is an enumeration, quoted from the memo:

> "Layer 4 can be dropped because layer 5 is *guaranteed* to hold something — every channel
> has at least one entity, and all three writers of an entity row substitute a non-empty
> prompt (`entities.ts:81`, plus the two seeds at `db/index.ts:84,351`)."

**I agree with the ruling.** This probe does not test it. It tests the enumeration the
ruling rests on — because an enumeration of writers is exactly the claim shape I got wrong
myself one round ago (Round 163: "two channel-insert paths," off a grep scoped to `db/` and
`routes/`; there were three). The method was to try to reach a zero-length assembled prompt
through ordinary routes, and see whether the guarantee holds at the endpoint.

It does not. The invariant is reachable, through two writers not in the list, one of which
needs no user gesture at all.

---

## 1. The ruling itself holds — arm A

Driven at the endpoint rather than through `buildSystemPrompt` directly:

| check | result |
|---|---|
| `POST /entities` with no prompt → stored | `"You are a helpful assistant."` (28 chars) |
| seeded default entity → stored | 28 chars |
| a 1:1 bound to a blank-prompt agent → `assembledLength` | **28** |
| its layer report | `L4="EMPTY — default purpose, not sent"` · `L5="\"Blank Agent\" — 28 chars"` |

Round 162's layer-4 drop is also unregressed (arm F): boilerplate purpose dropped, a real
identity at layer 5 is the whole prompt at char 0, `assembledLength` equal to the fixture's
own length. So the shipped state is what Round 164 says it is. Everything below is about
states Round 164 did not enumerate.

---

## 2. Writer four — `PATCH /entities/:id`. Arm B

`packages/server/src/db/queries.ts:413` is `UPDATE entities SET ... system_prompt = ?`. It
is a writer of the same column as the three named ones, and it has no substitution:

- `routes/entities.ts:125` passes `systemPrompt: body.systemPrompt?.trim()` — **no `|| ...`
  fallback**, unlike the create route twelve lines above it at `:87`.
- `queries.ts:409` coalesces with `??`, which treats `''` as a value rather than an absence.

Measured at the endpoint:

```
PATCH /entities/:id {"systemPrompt": ""}      → 200
what the update path stored                   → "" (0 chars)
a 1:1 bound to that agent, assembledLength    → 0
its layers   L4="EMPTY — default purpose, not sent"   L5="\"Blank Agent\" — 0 chars"
```

**And it works on the seeded default entity** — the exact population the Round 164 ruling
names as the reason to keep the boilerplate ("the default 1:1, the most-travelled path in
the product"):

```
PATCH /entities/<DEFAULT_ENTITY_ID> {"systemPrompt": ""}   → 200, stored "" (0 chars)
the default 1:1 after that, assembledLength                → 0
```

The server guards the default entity against `DELETE` (`entities.ts:139`) and does not guard
it against being emptied.

**It is reachable from the UI in two gestures, on the default agent.** Verified in the
client source, not inferred:

- `EntityManager.tsx:139` — the `isDefault` gate hides the **delete** button only. The
  **edit** button is rendered for the default agent like any other.
- `EntityManager.tsx:207` — on save, `if (systemPrompt.trim() !== entity.systemPrompt)
  updates.systemPrompt = systemPrompt.trim();`. Clearing the textarea sends `""`.

So: open the default agent, select-all-delete in the prompt field, save. Every subsequent
1:1 with the default agent is sent with no system prompt.

**Control, run because I could have been reading the coalescing wrong** — a PATCH that
*omits* `systemPrompt` leaves the stored prompt intact (`"You are Rename Me."` survives a
rename). The bug is specific to sending an empty string, not to updates generally.

**Whitespace too** (arm C): `PATCH {"systemPrompt": "   \n  "}` stores `""` — the route's
`.trim()` produces the empty string, which then wins the `??`.

---

## 3. Writer five — klatch import. Arm D

`packages/server/src/import/klatch-import.ts:305` writes `e.prompt || ''` for a manifest
entity. A package built by another Klatch instance whose agent had no prompt carries an
empty prompt across, with **no user gesture at the receiving end**.

Driven through the real route (`POST /api/import/klatch`, a hand-built
`klatch.context.v1` zip under `.testdata/`):

```
import                                            → 201
what the import path stored for the entity        → "" (0 chars)
the imported channel, assembledLength             → 1009   ← not zero, see below
its layers  L1="ACTIVE — imported channel gets kit briefing"  L5="\"Promptless\" — 0 chars"
a NATIVE 1:1 seating the same imported agent      → 0 chars
```

The imported channel is not exposed, and the reason matters: layer 1 fires on
`source !== 'native'`, so the kit briefing covers it. The agent it minted is still carrying
an empty prompt into every native room it is later seated in.

---

## 4. Blast radius — arm I, and a correction to my own expectation

I wrote arm I expecting to *bound* the exposure to the native 1:1, on the reasoning that a
klatch would carry a briefing above layer 5. It measured `0 chars` for the klatch seat too.
The kit briefing is layer 1 and fires on imported channels only; a native klatch has nothing
above layer 5 either.

Corrected, and the arm kept with the wrong expectation written down rather than deleted,
because its value turned out to be that it widened the radius rather than narrowing it:

**Exposed:** every *native* room — 1:1 and klatch alike — with no project, no pinned files,
and a default or empty purpose, seating an agent whose prompt is empty.
**Not exposed:** imported channels, and only by their layer-1 kit briefing.

---

## 5. What the API actually receives — arm G

Source identity, not a model call. `claude/client.ts` has **two** send sites, both
`system: systemPrompt || undefined`. So a zero-length assembly is not a zero-length `system`
field; it is **no `system` field at all**. Layer 5 is `if (entity.systemPrompt?.trim())
parts.push(...)` — an empty prompt is skipped, never pushed as a blank.

This is worth stating precisely because the invariant is written as "never a zero-length
system prompt," and the literal reading of that is satisfied — the string is never sent
empty. What is actually reachable is the state the invariant exists to prevent: a model call
with no identity. Same consequence, different mechanism than the wording implies.

---

## 6. `export.ts:249`, and a loose word — arm H

Daedalus named `routes/export.ts:249` as "the last bare literal on the server" and left it
deliberately, with a reason I think is right (a constant named for layer 4 would imply the
predicate applies at layer 5).

Two measurements:

- The fallback is still there, and it is doing real work: `entity.systemPrompt ||
  'You are a helpful assistant.'` means the **session-notes call is protected against exactly
  the empty-prompt state assembly is not**. The export path defends itself; the send path
  doesn't. That asymmetry is the strongest single argument for fixing this.
- "Last" is loose. Counting non-comment occurrences of the literal across the server:
  **five** — `routes/export.ts:249`, `routes/entities.ts:87`, `db/index.ts:81`,
  `db/index.ts:84`, `db/index.ts:351`. The seeds are bare literals too. Not a correction to
  the ruling, just to the count, and only worth a line.

---

## 7. Where I think this lands — routed, not decided

This is Daedalus's call and it is architecture, not testing. My read:

**The defect is at the writer, not at assembly.** The Round 164 rule is the right rule and
the fix that preserves it is to make the enumeration true rather than to add a fallback at
layer 5 — because a fallback at layer 5 is the thing Round 164 correctly refused. Two
one-line substitutions restore the guarantee at exactly the places it leaks:

- `routes/entities.ts:125` — `systemPrompt: body.systemPrompt?.trim()` →
  `body.systemPrompt === undefined ? undefined : (body.systemPrompt.trim() || DEFAULT_CHANNEL_PREAMBLE)`,
  which keeps the omitted-field control passing (arm C) while closing the empty-string case.
- `import/klatch-import.ts:305` — `e.prompt || ''` → `e.prompt?.trim() || DEFAULT_CHANNEL_PREAMBLE`.

I have **not** made either change — no `packages/` file was touched this round, asserted
in-probe at exit (arm Z, `git diff --stat -- packages/` unchanged before and after). The
choice between substituting at the writer, rejecting the empty prompt at the route with a
400, and accepting an empty prompt as a legitimate user intent is his.

One thing I'd flag against the 400 option: an empty prompt may be a *reasonable* thing for a
user to want — "no persona, just the model" — in which case the right answer is that
`buildSystemPrompt` returning nothing is correct and the Round 164 invariant should be
narrowed to "never a zero-length prompt *unless the user asked for one*." I don't think
that's the read, because nothing in the UI expresses it as a choice: the field is prefilled
with the boilerplate (`EntityManager.tsx:191`), so an empty field looks like erasure, not
selection. But it is a design question, not a bug report, and it connects to Iris's open
prefill item.

---

## Probe hygiene

- Zero model calls, zero API spend. Every assembly reading is `GET
  /channels/:id/prompt-debug`, which assembles what would be sent and returns it without
  sending. `/aaxt-probe` and `/aaxt-run` deliberately not called (both spend the auxiliary
  model); `export.ts` checked by source identity for the same reason.
- Scratch DB under `.testdata/round164-layer5-terminality/` via `KLATCH_DB`; `klatch.db`
  never opened.
- `git diff --stat -- packages/` captured before and after, asserted equal in-probe — empty
  both times.
- Four runs. Run 1 caught one error of mine (a hand-counted 57 against a measured 58 —
  the assertion now computes from the fixture rather than carrying a magic number). Run 2
  caught the arm I expectation error above. Runs 3 and 4 are line-identical.

## One correction to myself

Two, and both were caught by the instrument rather than by re-reading: the arithmetic in
arm F, and the blast-radius expectation in arm I. The second is the same species as the
enumeration error this whole round is about — I reasoned about which rooms carry a layer
above 5 instead of asking the server, and I was wrong about it in the direction that made
the finding look smaller.
