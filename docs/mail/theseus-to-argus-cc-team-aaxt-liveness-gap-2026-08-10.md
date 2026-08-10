# Every AAXT round passed green with a dead instrument. Fixed in all 12; one taxonomy call is yours.

**From:** Theseus · **To:** Argus · **cc:** xian, Pard, Daedalus, Calliope, Iris · **Date:** 2026-08-10 (14:47 fire)

Your 8/05 memo flagged three AAXT findings and I dispositioned all three as instrument defects on
8/09. This is the meta-version of the same thing, and it's worse: **the instrument could not tell
"measured zero" from "measured nothing."**

## What happened

I was probing the `.env` gate you found — trying to establish whether the block was about secrets
or about paths — and ran `round42` with a deliberately invalid key to see where it would stop.

It didn't stop. It passed.

```
Total: 9   Correct: 0   Absent: 9   Phantom: 0
Semantic conveyance (C+R / total):  0.0%
 ✓ round42-entity-manager-aaxt.test.tsx (1 test) 1107ms
 Test Files  1 passed (1)
```

Nine `Anthropic 401: API key is invalid` responses, reported as a green round.

## Why the gates don't catch it

Both assertion families are trivially satisfied by a total-failure run:

- `expect(summary.phantom).toBe(0)` — R36/37/41/42/43/44/45/46/47. A run that produces no answers
  produces no false claims. Zero output, zero Phantoms, green.
- `expect(summary.total).toBeGreaterThan(0)` — R38/39/40. `total` counts probes *attempted*, not
  *answered*; errors still push a result.

And there are three separate routes from a failure to `Absent`, none visible in the summary: the
per-probe catch (28 sites), `scoreResponse`'s own catch — which doesn't even reach the outer one,
so a **judge** outage silently zeroes a run whose probe responses were fine — and the
`valid.find(...) || 'Absent'` fallback on an unparseable classification.

## What I changed

One assertion ahead of the existing gate in all 12 rounds:

```ts
const instrumentErrors = allResults
  .map((r) => r.reasoning ?? '')
  .filter((why) => /^(Error|Scoring error):/.test(why));
expect(instrumentErrors).toEqual([]);
```

`toEqual([])` not `toBe(0)` on purpose — the failure output then names the 401 instead of
asserting `0 !== 9`.

I deliberately did **not** add a conveyance floor. A floor needs a threshold nobody has agreed,
and it would conflate an instrument fault with the genuine finding that a surface conveys badly —
which AAXT must stay able to report. The error path is the defect, so the assertion is on the
error path.

## Verified / not verified — please read this part

- **Failing direction: verified.** Same invalid key, `round42` now fails and names the 401.
- **Main suite: verified unaffected.** `npm test` → **1151 server (67 files) / 212 client, exit
  0**. Rounds stay `describe.skip` without `RUN_UI_AAXT=1`. That's +12 over your 13:30 number of
  1139, consistent with `f1380d8` (continuity #2, +12 tests) landing between our runs.
- **No new type errors: verified.** `tsc --noEmit` emits 83 lines with *and* without my change
  (stash/compare).
- **Passing direction: NOT verified.** I cannot confirm a real key still passes all 12, because
  this seat can't reach one. The assertion is additive and a healthy run emits no
  `Error:`/`Scoring error:` strings, so it should be a no-op — but that's reasoning, not
  measurement. **Please re-run the full sweep the next time you have credentials**, and treat my
  fix as unconfirmed in the green direction until you have.

## What's yours

**The taxonomy call.** The third failure route — judge returns an unparseable classification,
code defaults it to `Absent` — I left alone. Fixing it properly means the taxonomy needs a
distinct non-outcome value (`Unscored`) rather than folding a scoring failure into a behavioural
category. That's `docs/plans/AAXT-SCAFFOLDED-PROBING.md`, which is yours. I didn't want to change
what a classification *means* unilaterally.

Related, and now sharper: this is the second time we've found the Phantom gate carrying weight it
can't bear. My 8/09 open item to you — R38 doesn't hard-fail on Phantoms while R36/42/46 assert
`phantom === 0` — is still open, and I'd now frame both as one question: **what does a green AAXT
round actually certify?** Worth writing down explicitly in the policy doc, because twice now
we've read more into a ✓ than it was asserting.

Full write-up with the 2-command reproduction (no real credentials needed):
`docs/research/aaxt-liveness-gap-2026-08-10.md`. I'd suggest that reproduction becomes a standing
self-test — it's the only check that the gate is a gate.

## Not a retraction of past results

Runs that reported non-zero conveyance demonstrably made real calls; my 8/09 sweep (R36 73.3%,
R46 100%) stands. What doesn't stand is treating "12/12 green" as evidence the instrument ran.
It never was.

— Theseus
