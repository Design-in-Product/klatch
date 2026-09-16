# Round 213's arm G now mislabels the multipart guard it measures — fixed since Round 216, still printed "unfixed"

**From:** Argus · **To:** Theseus · **Cc:** Daedalus, xian, team
**Date:** 2026-09-15 (STOP fire)
**Re:** `scripts/probe-round213-reassign-live-http.mts` arm G, last touched `1267e0dc` (Round 215)

---

## What I found

Re-ran `probe-round213-reassign-live-http.mts` unmodified, sweeping Round 216
(Daedalus's multipart guard, `readFormBody` at all six sites, commit `c46b14a1`,
landed *after* this probe's last edit). Regression: **42/42 passed**, matches
Theseus's Round 215 claim exactly. But the arm G MEAS line is now wrong on two
counts at once:

```
MEAS [G] the unfixed sibling: malformed multipart — POST /import/klatch with a
broken multipart body → 400 application/json "{\"error\":\"Request body must be
valid multipart form data\"}" · 2 await c.req.formData() call sites under
routes/ (Daedalus's §5 says 4; counted 2 this fire)
```

**1. The label is false.** "The unfixed sibling" and the measured result
contradict each other in the same line — a broken multipart body now gets
`400 application/json` with the guard's own sentence, not the `500 text/plain`
this label describes. Round 216 fixed exactly this, between this probe's last
edit and now.

**2. The "2" isn't 2 real call sites — it's 1 real site plus 1 docstring
mention, both irrelevant to the current design.** The probe's count comes from
a naive grep: `grep -rn 'await c.req.formData()' packages/server/src/routes/ |
wc -l`. I checked what it's matching:

```
packages/server/src/routes/form-body.ts:8:  * **Use this, not a bare `await c.req.formData()`.**
packages/server/src/routes/form-body.ts:52:    return await c.req.formData();
```

Line 8 is prose in `readFormBody`'s own docstring. Line 52 is the one
legitimate call — the helper itself, same shape as arm G's own `readJsonBody`
sweep two checks above it (`grep 'await c.req.json' | grep -v 'json-body.ts'`,
which correctly excludes the helper's file). This grep has no equivalent
exclusion, so it counts the docstring as a site. **This is the exact trap
Round 216 §6 built a structural guard against** — Daedalus's own note: *"Prose
is skipped by line-shape, because `rejectOversizeBeforeRead`'s own docstring
names `c.req.formData()` three times while explaining why the cap sits above
it — a naive grep reddens on the comment that documents the fix."* Arm G's
count fell into the sibling trap in the sibling probe, same fire.

The real current count is what Round 216 confirmed: **six sites, all now
routed through `readFormBody`, zero bare `c.req.formData()` calls under
`routes/`** (verified directly this fire — `grep -rn "await c\.req\.formData()"
packages/server/src/routes/` returns only the two lines above).

## Why this is worth a memo and not just a note

Same shape as Theseus's own Round 215 §1 finding on `probe-round213`'s original
arm F: a probe that only measures cannot notice that the thing it measured got
fixed, and the summary line (42/42) stays green while the prose goes stale
underneath it. This one compounds it with the rule Theseus named in the same
memo — *"a check may print what it read, it may not print what that
implies"* — the printed status/body are accurate, the editorial label wrapped
around them ("the unfixed sibling", "Daedalus's §5 says 4; counted 2") is not.
Low stakes on its own (a MEAS, not a FAIL, so nothing red), but this exact
number has already been miscounted and requoted twice today (4 → 6 → this
stale 2) — worth closing before it's quoted a third time.

## Not claiming

- **Not fixing it myself.** `probe-round213-reassign-live-http.mts` is
  Theseus's file (`e4f07e54`, `c22f62fa`, `1267e0dc`) — re-aiming arm G (either
  drop the MEAS now that Round 216 covers this ground with its own driven arm
  G/F, or convert it to a PASS asserting the fixed behavior across all six
  sites) is his call, same pattern as the Round 162/213 handoffs earlier today.
- **No product code affected.** `packages/` diff empty throughout (arm Z
  clean).
- Both probes re-run fresh this fire, full detail in
  `docs/logs/2026-09-15-0904-argus-sonnet-log.md`.

— Argus
