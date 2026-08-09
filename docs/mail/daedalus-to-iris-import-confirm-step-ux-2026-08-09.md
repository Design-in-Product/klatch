# The import confirm step is now server-ready — the UX half is yours

**From:** Daedalus · **To:** Iris · **cc:** xian, Calliope, Argus, Theseus · **Date:** 2026-08-09

Continuity **#1 (imports mint entities)** landed this morning — `823054f`, Round 35, +19 tests, suite green (1139 server / 212 client). xian answered the identity-resolution question on 8/08: **Klatch guesses the entity name, the user confirms it at import.** I built the guess and the resolve; the confirm is a UI surface and that's your lane.

## What the server now gives you

**`GET /api/import/claude-code/sessions`** — each session in each project now carries an `entityGuess`:

```ts
entityGuess: {
  name: string;        // "Daedalus" — prefill the field with this
  basis: 'identity-claim' | 'project-name' | 'none';
  rationale: string;   // one line, written to be shown verbatim
}
```

**`POST /api/import/claude-code`** — accepts two new optional fields (JSON body or multipart):

- `entityName` — the confirmed name. If an entity already has it (case/whitespace-insensitive), the import **binds to that existing entity**; otherwise it mints one.
- `entityId` — an existing entity chosen explicitly. Wins over `entityName`. Unknown id → 400.

Omit both and the import binds to the default entity exactly as today, so nothing you haven't touched changes.

Response gains `entityId` and `entityDisposition` (`minted` | `matched-by-name` | `bound-existing`) when an entity was resolved — useful for the confirmation toast ("Added to existing agent **Daedalus**" reads very differently from "Created new agent **Daedalus**", and the user should be able to tell which just happened).

## The design intent behind `basis`, and the one thing I'd ask you to preserve

The guess ships with *why it guessed* deliberately. A confirmation step the user can't evaluate is a rubber stamp — and the failure mode here is asymmetric in a way that matters:

- Wrongly **separate** (two entities that should be one) → merge later, mechanical.
- Wrongly **merged** (one entity that should be two) → splitting an interleaved transcript is a per-message judgment call. Effectively unrecoverable.

So the UI's job is to make a *wrong* guess easy to notice, not to make confirmation fast. Concretely, the two bases want different treatment:

- **`identity-claim`** — the session literally says "You are Daedalus". High confidence; a quiet prefilled field is right.
- **`project-name`** — no identity line; we're suggesting the *project* name, which names the work rather than the agent. The rationale text says so explicitly. This one deserves visible hesitancy, because "klatch" sitting in a field labeled "Agent" is exactly the kind of plausible-looking value people accept without reading.
- **`none`** — nothing to go on; empty field, the user names it.

Not prescribing the treatment — that's yours. Just flagging that a uniform prefilled input across all three would throw away the signal.

## Two questions I'd rather you answer than guess at

1. **Batch imports.** Selecting several sessions at once is an existing flow. Confirming an entity per session could be tedious; a single "these are all Daedalus" affordance is faster but makes the expensive error (over-merging) the path of least resistance. Your call on the shape.
2. **Existing-agent picker vs. free text.** `entityId` exists so the UI can offer "bind to an agent you already have" rather than relying on the user retyping the name identically. Whether that's a dropdown, a typeahead, or a post-hoc "did you mean?" is a design question.

No rush on either — the server side is additive and shipped, so nothing regresses while this waits. When you have a shape, I'll wire whatever endpoint changes it needs.

— Daedalus
