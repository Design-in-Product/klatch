# The server AAXT pipeline still reports "nothing was measured" as a legitimate reading

**Author:** Theseus · **Date:** 2026-08-10 (19:47 STOP fire) · **Status:** verified, routed to Argus
**Follows:** `docs/research/aaxt-liveness-gap-2026-08-10.md` (the client half, 14:47 fire)
**Concerns:** `packages/server/src/aaxt/{scorer,runner,probe-generator}.ts`

## Summary

Argus's `Unscored` taxonomy fix (8/10 STOP, `5e9effb`) is correct and lands where he says it
lands. The residual is one layer up: **the aggregate gate that consumes `Unscored` is still open
on the two likeliest instrument faults.** Only route 3 — a *reachable* judge returning an
unparseable classification — actually reaches `Unscored`. The two failure modes that happen in
production (auxiliary unreachable at generation time; judge unreachable at scoring time) both
still land in buckets that read as real results.

This is the same "measured zero vs. measured nothing" defect I found on the client side this
morning, in the shared server pipeline, after the taxonomy fix.

Both holes are reproduced below with a decoy key — no real credentials needed.

## Hole A — auxiliary down at probe generation ⇒ `overallFidelity: 'low'`

`probe-generator.ts:227-236` catches a failed `queryAuxiliary` and records the layer with
`probes: []` and a status string prefixed `ERROR — `. It does not throw. So every layer comes
back empty, and in `runner.ts`:

- `totalProbes` = 0, `totalScored` = 0, `unscoredCount` = 0
- the new guard at `runner.ts:202` requires `totalScored > 0` — skipped
- falls to `runner.ts:206-207`: `totalScored === 0` ⇒ **`'low'`**

`'low'` is the same bucket as "this surface genuinely conveys badly." A run in which zero probes
were ever generated is reported identically to a real, poor result.

**Measured** (decoy key, layers forced active so generation is genuinely attempted):

```
totalProbes: 0   totalScored: 0   unscoredCount: 0   overallFidelity: low
  L2 | ERROR — Anthropic API error (401): {"type":"error","error":{"type":"auth
  L5 | ERROR — Anthropic API error (401): {"type":"error","error":{"type":"auth
```

The `ERROR —` strings confirm generation was attempted and rejected — not skipped as inactive.

## Hole B — judge down at scoring time ⇒ `Absent`, never `Unscored`

`scorer.ts:80-86`'s outer `catch` still returns `classification: 'Absent'`. This is **route 2**
from my 14:47 memo — the judge outage — and it is the route I flagged as most dangerous, because
the probe responses themselves are fine; only the scoring of them failed.

Consequence in `runner.ts:147` (`counts[score.classification]++`): `counts.Absent` increments,
`unscoredCount` stays 0, the `unscoredCount === totalScored` guard never fires, and fidelity falls
through to `correctCount / totalScored === 0` ⇒ **`'low'`**.

**Measured** (decoy key, a response that should plainly score `Correct`):

```
classification : Absent
reasoning      : Scoring error: Anthropic API error (401): {"type":"error","error":{...
```

The `Scoring error:` prefix is present and useful — but nothing in the aggregate consumes it.
On the client side my liveness gate reads that prefix; the server pipeline has no equivalent.

## The comment asserts coverage that does not exist

`runner.ts:203-204`:

```ts
// Every probe hit an instrument fault (probe/judge error, or an
// unparseable judge classification) — not a behavioral reading at all.
```

The guard covers **only** the unparseable classification. Probe error (`runner.ts:149-161`)
increments `Absent`; judge error (`scorer.ts:80-86`) increments `Absent`. Neither reaches this
branch.

Worth naming plainly because it is the same shape as the two defects that bit us today: Round 34's
header claimed MCP coverage that was never exercised (Daedalus found the live crash underneath it),
and 12 AAXT rounds claimed green while the instrument was dead. A comment asserting a property
nobody exercised is how all three survived.

## Reproduction

Requires no real credentials — a decoy key produces a genuine 401, which is a real outage.

```js
// packages/server/, after `npm run build`
process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-DECOY-NOT-A-REAL-KEY-0000000000';
delete process.env.OPENAI_API_KEY;
const { runAAXT } = await import('./dist/aaxt/runner.js');
const run = await runAAXT('c', 'prompt', 'claude-opus-5', undefined,
  { '5_entityPrompt': 'ACTIVE', '2_projectInstructions': 'ACTIVE' });
console.log(run.summary);   // overallFidelity: 'low'  — expected 'failed'
```

A status of exactly `'ACTIVE'` (no parseable char count) is what forces generation: it passes
`extractLayerContent`'s `startsWith('ACTIVE')` test at `probe-generator.ts:111` and returns `null`
from `parseStatusContentLength`, skipping the trivial-content guard at `:189`.

## What I did not do, and why

**I did not change the taxonomy or the gate.** Recasting routes 1 and 2 as `Unscored` changes what
`Absent` has meant in every AAXT report on file — the exact reason Argus flagged route 1 rather
than deciding it inside the same fire. Route 2 belongs to that same decision, and Hole A's
`totalScored === 0 ⇒ 'low'` line is gating policy in his doc. Editing production source under the
taxonomy owner from an unattended fire is how we'd manufacture a merge conflict and a policy
change nobody agreed to. Same call I made this morning on the red build; it was right then.

**Suggested shape, for Argus to accept or reject:**

1. `totalScored === 0` ⇒ `'failed'`, not `'low'`. No taxonomy implication — zero probes scored
   means no reading exists. Cheapest and closes Hole A entirely.
2. Route 2 (`scorer.ts:80-86`) ⇒ `'Unscored'`. It is a scoring failure, not a behavioral reading;
   it is the *same category* as route 3, which he already moved.
3. Route 1 (probe-call failure) ⇒ his existing flagged decision, unchanged by this doc.

(1) and (2) together would make `unscoredCount` mean what `runner.ts:203-204` already claims.

## Status of the fix I shipped this morning

Unchanged and still true: the client-side liveness gate is verified in the **failing** direction
only. Nobody has run the 12 rounds green since the change. Credentials remain unreachable from
this seat — re-verified this fire, `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are both **absent from
the process environment**, not merely unreadable from the symlinked `.env`. So the credentialed
sweep is genuinely blocked here, not untried.
