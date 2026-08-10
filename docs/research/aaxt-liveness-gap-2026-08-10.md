# AAXT liveness gap: every round passes green when 100% of its API calls fail

**Author:** Theseus · **Date:** 2026-08-10 (14:47 fire) · **Status:** found, fixed, fix verified in the failing direction
**Affects:** all 12 AAXT rounds (`round36`–`round47`), every AAXT result on file before today

## Summary

The AAXT instrument could not distinguish **"the surface conveyed nothing"** from **"the
instrument never ran."** Both were recorded as `Absent`, and the assertion each round gates on
is trivially satisfied by a run in which every single API call failed.

Demonstrated, not reasoned about: with a syntactically-valid but invalid API key, `round42`
reported **9 probes, 9 Absent, 0 Correct, 0.0% semantic conveyance — and passed green**.

```
Total:            9
Correct:          0
Absent:           9 (2 expected diagnostic, 7 unexpected)
Phantom:          0
Semantic conveyance (C+R / total):    0.0%
 ✓ src/__tests__/round42-entity-manager-aaxt.test.tsx (1 test) 1107ms
 Test Files  1 passed (1)
```

Every call returned `Anthropic 401: API key is invalid`. The round reported success.

## Why the existing gates don't catch it

Two assertion families across the 12 rounds, both satisfied by a total-failure run:

| Assertion | Rounds | Why an all-error run passes |
|---|---|---|
| `expect(summary.phantom).toBe(0)` | 36, 37, 41, 42, 43, 44, 45, 46, 47 | A run that produces no answers produces no Phantoms. Zero output ⇒ zero false claims. |
| `expect(summary.total).toBeGreaterThan(0)` + sum-equals-total | 38, 39, 40 | `total` counts probes *attempted*, not probes *answered*. Errors still push a result. |

The DOM assertions some rounds carry (`expect(container.textContent).toContain('Settings')`
and similar) are real and would still catch a UI regression — but they don't guard the
conveyance measurement, which is the thing the round exists to produce.

## Three distinct routes from instrument failure to `Absent`

All three are live, and none is distinguishable in the summary:

1. **Probe call fails** — the per-probe `try/catch` (28 sites across the 12 files) records
   `classification: 'Absent', confidence: 0, reasoning: 'Error: …'`.
2. **Judge call fails** — `scoreResponse`'s own `catch` returns
   `classification: 'Absent', confidence: 0, reasoning: 'Scoring error: …'`. This one does not
   even reach the outer catch, so a judge outage silently converts every probe to Absent while
   the probe responses themselves were fine.
3. **Judge returns an unparseable classification** — the `valid.find(...) || 'Absent'` fallback
   (e.g. `round42:252–255`) defaults garbage to `Absent`. See residual below.

Routes 1 and 2 stamp a recognisable prefix into `reasoning`. Route 3 does not.

## What this retroactively means

It does **not** invalidate results already on file that reported non-zero conveyance — a run
scoring R36 at 73.3% and R46 at 100% (my 8/09 sweep) demonstrably made real calls. Those
numbers stand.

What it invalidates is the **gate property**. "12/12 green" was never evidence the instrument
ran. Any future run with an expired, rotated, rate-limited or misconfigured key would have
reported "12/12 green, AAXT gates clear" and been believed. This is the same class of defect as
the three findings Argus raised on 8/05 that I dispositioned as instrument defects
(`docs/research/aaxt-c7-ground-truth-2026-08-09.md`) — it is the meta-version: the instrument
could not tell *measured zero* from *measured nothing*.

It is also directly load-bearing on the open `.env` decision. Whatever route xian picks for
credential access in unattended fires, a wrong or stale key must fail loudly rather than
produce a green sweep. Before today it produced a green sweep.

## The fix

A liveness gate added ahead of the existing assertion in all 12 rounds:

```ts
const instrumentErrors = allResults
  .map((r) => r.reasoning ?? '')
  .filter((why) => /^(Error|Scoring error):/.test(why));
expect(instrumentErrors).toEqual([]);
```

`toEqual([])` rather than a count, deliberately: the failure output then *names* the cause
instead of asserting `0 !== 9`.

Chosen over a conveyance floor (`expect(conveyancePct).toBeGreaterThan(N)`) on purpose. A floor
requires picking a threshold, and it would conflate an instrument fault with a genuine finding
that a surface conveys badly — which is a legitimate result AAXT must stay able to report. The
error path is the thing being asserted, so assert on the error path.

## Verification

- **Failing direction — verified this fire.** Re-ran `round42` with the same invalid key. It now
  fails, and names the cause:
  ```
  + "Error: Anthropic 401: {"type":"error","error":{"type":"authentication_error",
     "message":"API key is invalid."},"request_id":null}",
  ❯ src/__tests__/round42-entity-manager-aaxt.test.tsx:641:30
  ```
- **Main suite unaffected — verified.** `npm test` → **1151 server (67 files) / 212 client, 13
  client skips, exit 0.** The rounds remain `describe.skip` without `RUN_UI_AAXT=1`.
  (1151 is +12 over the 1139 Argus verified at 13:30 today, consistent with `f1380d8`
  "continuity #2, +12 tests" landing between the two runs.)
- **No new type errors — verified.** `tsc --noEmit` on the client emits **83 lines both with and
  without this change** (stash/compare). Those 83 are pre-existing and are a separate finding —
  see `docs/research/client-build-broken-2026-08-10.md`.
- **Passing direction — NOT verified this fire.** Confirming a *real* key still passes all 12
  rounds requires credentials this seat cannot reach (see the `.env` gate note below). The
  assertion is a pure addition ahead of existing gates and a successful run produces no
  `Error:`/`Scoring error:` reasoning strings, so it should be a no-op on a healthy run — but
  that is reasoning, not measurement, and the next attended session should confirm it.

## Reproduction (2 commands, no real credentials)

```bash
printf 'ANTHROPIC_API_KEY=sk-ant-api03-DECOY-NOT-A-REAL-KEY\nRUN_UI_AAXT=1\n' > .gate-probe.env
node --env-file=.gate-probe.env node_modules/.bin/vitest run \
  packages/client/src/__tests__/round42-entity-manager-aaxt.test.tsx
rm .gate-probe.env
```

Before the fix: passes. After the fix: fails, naming the 401. Worth keeping as the standing
self-test for the instrument — it is the only check that the gate is a gate.

## Residuals — routed, not fixed here

1. **Route 3 (unparseable classification defaults to `Absent`)** is untouched. Fixing it properly
   means giving the taxonomy a distinct non-outcome value (`Unscored`) rather than folding a
   scoring failure into a behavioural category, and the taxonomy is gating policy — Argus's,
   per `docs/plans/AAXT-SCAFFOLDED-PROBING.md`. Flagged to him, not decided here.
2. **Rounds still disagree on what a Phantom means** (R38 doesn't hard-fail on Phantoms while
   R36/R42/R46 assert `phantom === 0`) — my 8/09 open item for Argus, unchanged.
3. **Borderline probes are non-deterministic run-to-run** — also unchanged. The liveness gate
   makes a *dead* instrument loud; it does nothing about a *noisy* one.

## Side note: `test.poolOptions` deprecation

The AAXT runs emit `` `test.poolOptions` was removed in Vitest 4. All previous `poolOptions` are
now top-level options. `` Config drift from the Vitest 4 upgrade — harmless today, will stop
being honoured. Not fixed here; noted for whoever owns the vitest config next.

— Theseus
