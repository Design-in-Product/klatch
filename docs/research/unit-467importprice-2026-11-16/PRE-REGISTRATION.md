# unit-467importprice — PRE-REGISTRATION (arm A)

**Seat:** Theseus · **Fire:** 2026-11-16 STOP · **Pushed before `arm-importprice-a.mts` exists.**

## Why this unit

`unit-467importroute` (this seat, 2026-11-16 WORK) found the **import route**: a probe that does

```ts
import { streamClaude } from '../packages/server/src/claude/client.js';
const emitter = await streamClaude(…);
```

reads `hazards(…) = [(none)]` through `promote-probes.mts`'s own exported function, so
`promote-probes` admits it and drives it **unattended, with a real model call**. Argus took the
free half of that finding the same day (`cfb3a9f5`: `DETECTORS.model` widened to
`messages\s*\.\s*(create|stream)`, verified live in this fire at `scripts/promote-probes.mts:170`)
and said explicitly that it **does not close the import route**, because the scan reads the probe's
own source, not its callee's — *"that's your B1 latent gap, and this change does not close it."*

The reason the `stream` widening could be taken in one fire is that it came with a **measured
price**: `grep -l "messages\.stream"` over the 155 probes was 0, so the cure moved nothing today.
The import route has no such number. This unit produces it.

**What this unit does NOT do:** it does not edit `scripts/promote-probes.mts`. That file is Argus's,
and a detector widening on a hunch is what the measured-price discipline exists to replace. Leg `A9`
asserts `git status --porcelain packages scripts` empty on the drive.

## The candidate cure, stated as a shape

Key on the **call**, not the import. An import line is the one occurrence that proves nothing about
behaviour (this seat's own standing lesson: `grep <name>` matches the import line). So the candidate
is an alternation of **model-reaching product export names followed by `(`**, and the names are
**derived from source in the arm**, never hand-typed — `unit-467importroute`'s `B1` hand-typed
`streamClaude|streamClaudeRoundtable` and this unit's `P3` exists to find out whether that was the
whole surface.

Two granularities, because the price differs:

- **S1** — exports of `packages/server/src/claude/client.ts` that reach `messages.stream` directly,
  or via one hop inside that same file.
- **S2** — exports of any other module under `packages/server/src/` that call an S1 member (one
  cross-file hop).

**Declared limit, up front:** one hop at each level. A two-hop route (probe → module X → module Y →
S1) is outside this unit and will be named in RESULTS as not measured, not as absent.

## Price is a bucket count, not a grep count

A file that matches the candidate key but already carries a **non-exemptible** hazard
(`EXEMPTIBLE = {db, homedir}` — read from the subject, not typed) is already `not driven`, so
flagging it costs nothing. The **price** is the count of files that would move **driven → not
driven**: match the candidate key **and** carry no non-exemptible hazard today **and** be in the
drivable pool (`DEFERRED`, not already swept, per the subject's own lists).

## Predictions (predicate · expected direction)

- **`P1` — KNOWN POSITIVE, runs before anything rests on a zero.** The candidate key fires on an
  in-memory fixture that imports *and calls* `streamClaude`. Predicate: `fires === true`.
  **Expected: LANDED.** A zero price is uninterpretable until the key is shown to fire on a case
  minted to be caught (`unit-467rawjson`'s `Q4` defect, two units old).
- **`P2` — two-sided negative control.** The same key does **not** fire on a fixture that imports
  `streamClaude` and never calls it. Predicate: `fires === false`. **Expected: LANDED.** This is
  "an import is not a call site" written as a leg rather than as a resolution.
- **`P3` — the surface is wider than the two names `B1` typed.** Predicate: `|S1| >= 3`.
  **Expected: LANDED.** If REFUTED (`|S1| === 2`), `B1`'s hand-typed pair was in fact the whole
  surface and that is worth knowing too.
- **`P4` — at S1 granularity the price is zero.** Predicate: `movers_S1.length === 0`.
  **Expected: LANDED.** `unit-467importroute`'s `B3` measured zero live instances over direct
  `client.ts` importers on this same 155; this re-derives it under a call-shape key rather than an
  import key, so agreement is expected and disagreement would mean one of the two keys is wrong.
- **`P5` — at S2 granularity the price is NOT zero.** Predicate: `matches_S2.length > 0`.
  **Expected: LANDED.** This is the prediction this unit is for: I expect that once the surface is
  widened past the two names, at least one of the 155 calls a product export that reaches the model
  and that no current detector sees. REFUTED (zero) is the same answer shape as the `stream`
  widening — the gap stays latent and the cure is free — and is a usable result, not a null one.
- **`P6` — at least one match is literal-only.** Predicate: `literalOnly` true for ≥1 member of
  `matches_S1 ∪ matches_S2`. **Expected: LANDED** if there are matches at all. **`P6` is REFUSED,
  not refuted, when the match set is empty** — an unsatisfiable predicate over an empty population
  is a floor, not a finding. Registered that way deliberately.

## Legs

- `A0a` population is 155 `probe-*` files under `scripts/`, counted with `readdirSync`.
- `A0b` the minted fixtures never enter the census: population re-counted after minting.
- `A1` S1 is derived from `client.ts` source in this run and printed in full.
- `A2` the candidate regex is **assembled** from the derived names (asserted by rebuilding it from
  the array and comparing, so a hand-typed drift would redden).
- `A3` `EXEMPTIBLE` and the drivable pool come from `await import` of the subject, not from a copy.
- `A4` the two-sided control pair (`P1`/`P2`) share one key — the same `RegExp` object grades both.
- `A5` every match is printed with its file, its line, and its literal-only status.
- `A9` `git status --porcelain packages scripts` is empty at the end of the drive.

**Recording discipline:** the drive's stdout/stderr are captured to `drive1.arma.{out,err}`, the
verdict line is appended by `docs/research/lib/verdict.mjs` after the run exits, and RESULTS.md is
written from the captured file, not from the terminal.
