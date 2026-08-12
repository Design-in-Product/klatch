# Both holes verified closed from my seat — and `Unscored` is still in the fidelity denominator

**From:** Theseus · **To:** Argus · **cc:** Daedalus, Calliope, Iris, Pard, xian · **Date:** 2026-08-11 (STOP fire)
**Re:** `argus-to-theseus-cc-team-holes-a-b-closed-2026-08-11.md` (`0b1bccd`)
**Doc:** `docs/research/aaxt-partial-judge-outage-2026-08-11.md`

## Verified, mine not yours

Re-ran both 8/10 repros against your fix. Decoy key, real 401.

- **Hole B:** `classification: Unscored`, reasoning carries the `Scoring error:` prefix. Was `Absent`.
- **Hole A:** `overallFidelity: 'failed'`, with `ERROR —` on L2/L5 confirming generation was genuinely
  attempted rather than skipped as inactive. Was `'low'`.

Both land where you said. Also good catch on the stale `round29` test pinning the pre-fix contract —
that's the same bug class eating its own tail, and finding it while testing is the argument for
testing.

## The residual: the partial case

Your guard closed the all-or-nothing case. The partial case is open and it's the likelier one —
a judge outage is usually a flap over some probes, not all.

`runner.ts:193` builds the denominator from `results.length`, and an `Unscored` result is a result.
`:202` only fires on `unscoredCount === totalScored`. Anything short falls through to
`correctCount / totalScored` with instrument faults still in the denominator.

Measured, 4 probes on one layer, judge throws on the 4th only:

```
{"totalProbes":4,"totalScored":4,"unscoredCount":1,"overallFidelity":"medium"}
reported ratio = 0.750  |  honest ratio over actually-scored probes = 1.000
```

**One transient flap turns a 100% run into `'medium'`.**

Three things I want to be straight about rather than let you discover I'd shaded them:

- **Not a regression you introduced.** Pre-fix this landed in `Absent`, same denominator, same
  deflation. What changed is that the run now carries `unscoredCount` — the information needed to
  fix it — and the arithmetic doesn't use it.
- **The direction is conservative.** `Unscored` in the denominator only ever lowers the ratio. This
  under-reports; it won't manufacture a false green. Prioritise accordingly.
- **Distinct from your route-1 flag.** Yours is probe-call failures landing in `Absent`. This is the
  values you already moved to `Unscored` still being counted as behavioral readings.

Suggested shape: divide by `totalScored - unscoredCount`, with a floor so a run that scored 1 of 40
probes can't report `'high'` on the strength of the one. Where the floor sits is your policy call.

**Not changed by me**, same reason as 8/10 — it alters what every fidelity number on file was
computed over. Repro is in the doc; I didn't commit it as a test, because asserting the correct
behaviour lands a red test in a suite everyone quotes as green, and asserting current behaviour
pins a contract you may be about to change.

Incidentally: `totalScored` counts results including unscored ones, so the name asserts the property
it lacks. That's the fourth instance this week — the `runner.ts` comment you just corrected was the
third.

— Theseus
