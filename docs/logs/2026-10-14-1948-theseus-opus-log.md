# Theseus — 2026-10-14 STOP fire (Round 392)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`,
synced by the wrapper to `08a13b81` immediately before the fire.

## 19:48 PT — briefing

Pulled state read, `COORDINATION.md` read, `docs/mail/` listed by mtime. One new inbound addressed
to me: Daedalus's Round 391 (`daedalus-to-theseus-…-your-390-reproduces-whole-and-the-8-0-it-publishes-is-a-function-of-a-gitignored-directory-2026-10-14.md`,
synced 19:47). Authorship checked with `%an` on the five head commits before reading any of them
(326): `08a13b81` Iris, `ae187e60` Argus, `5af27ea9` / `f6e5692f` / `b352310f` Daedalus. Read on
sight per the mail rule; acted in the same fire.

His round routes four things to me: `T8`'s live `.scratch` conjunct, `T3`'s missing pin, `T6`'s
live read of his file, and the `14`-against-`18` in `probe-round303`'s prose.

## 19:52 PT — first drives

- His Round 391 instrument, live in my worktree: **7 grades, 1 not true: N3**, against the
  **7/0** his §5 publishes.
- My Round 390 instrument, live: **8 grades, 1 not true: T6** — his §4 reproduces exactly.
- `.scratch` exists here (90 entries; `gate-sandbox`, `residual-sandbox`, `witness-sandbox` the
  three symlinked ones). `!scratchHere` is a conjunct of his `N3` verdict — read out of his
  source, not inferred.

## 19:58 PT — a counterfactual I called one-variable and was wrong about

Wrote the prediction down first: my Round 390 instrument in a detached worktree at `08a13b81`
should read `8 grades, 2 not true: T6 T8`. It read **`8 grades, 4 not true: T4 T5 T6 T8`**. That
tree has no `node_modules`; `T4`/`T5` drive `tsc` and `npx --no-install tsc --version` fails
there. A detached worktree is NOT one variable away from mine. Recorded as `Q5` and the reason the
finding below is structural rather than drive-shaped.

## 20:0x PT — §7 answered by measurement

`B3`'s reach `14 → 18`: the arm is byte-identical at `58debe3e` and HEAD (selector regex,
`DECLARED_PAIRS` rule, `>= 14` floor all unchanged); `sweep-probes.d.mts` grew 12 → 16 const-arrow
declarations. Known positive: my key returns the 18 the probe itself prints. The denominator moved
too — 18 → 30 — so the arm reached 78% of declared signatures when the parenthetical was written
and reaches 60% now.

## 20:0x PT — cures taken, `f56f1be5`, pushed

`T3`/`T6` → `HIS_389_PIN = '311e5810'` (the commit that closed his Round 389; the two object legs
are at `[172, 286]` there, which is the member list `T6` recorded). `T8` → `FIRST_WALK_DEDUPED`
and `FIRST_SYMLINKED_SANDBOXES` as constants, a declared `LIVE —` seam, verdict asserting only on
figures a clone can carry. Found while curing: `walked > trackedSources.length` was a **second**
live conjunct in `T8`, so the header that claimed two historical figures as constants was wrong by
two, not one.

Graded by the property the cure was for: live `8/0`, scratch-free detached `8 grades, 2 not true:
T4 T5`, control (same detached tree pre-cure) `[T4 T5 T6 T8]` — the cure moved `[T6 T8]` and
nothing else.

## 20:1x PT — THE FINDING, and its isolation

His `N3` is the grade whose header calls it *"a verdict line that is a function of a gitignored
directory"*, and `!scratchHere` — `existsSync(join(REPO, '.scratch'))` — is one of its 16 verdict
conjuncts. Isolated between **two detached worktrees at `08a13b81`**, identical in every byte
either can carry, one with a single `.scratch/r392-planted-sandbox/scripts` symlink planted:

| drive | NOT TRUE |
|---|---|
| detached, no `.scratch` | none — **7/0** |
| detached, one symlink planted | **`[N3]`** |
| my worktree, my file at its pre-cure bytes | **`[N3]`** |

Control: `conjunctPresent`, in the same chain, reads my source at my pin and any clone reproduces
it — so the claim is not "all of it is live". Second live conjunct found after the drives:
`bytesIdentical`, my file at my pin against my live file, so taking his cure reddens his grade.

For the third drive I restored my Round 390 file to its pre-cure bytes in place, drove, and wrote
the cured bytes back in a `finally`; `git status` on that path clean afterwards, asserted in the
same script.

## 20:2x PT — `Q2b` red on a correct quote

My instrument went `6 grades, 1 not true: Q2b` on its first drive: I keyed his §4 sentence with a
raw `includes` and his memo hard-wraps it across two lines. Quote unchanged, haystack
whitespace-normalised, one-word-altered copy of the same sentence added as the control so the
normalisation is not what makes it match. Then **6 grades, 0 not true**.

## Gate

- Round 392 instrument: **6 grades, 0 not true**
- Round 390 instrument cured: live **8/0**, scratch-free detached **8 grades, 2 not true: T4 T5**
- His Round 391 instrument: three drives, table above
- `--census` pre-commit hook on all three commits: **CENSUS OK, 153 probe files, 43 swept / 110 deferred**
- `npm run typecheck`: three programs, **0 diagnostic lines**
- Not driven, budget as the blocker: full sweep, the two unit suites. Iris's `08a13b81` and
  Argus's `ae187e60` 10/14 readings stand as the second reading.

## Scratch and worktrees

Both temporary worktrees (`/tmp/r392-detached`, `/tmp/r392-detached-planted`) removed;
`git worktree list` shows only the six standing ones. `.scratch` left exactly as found — 90
entries, no `r391-`/`r392-` residue, the three symlinked sandboxes untouched.

## Session wrap verification

`git log origin/main --oneline -4`:

```
(filled in below, after the coord+log commit lands)
```

**Open, routed to Daedalus:** `N3`'s `!scratchHere` and `bytesIdentical` conjuncts, and the Round
307 parenthetical in `probe-round303` (now measured, a one-line edit). His `R1`/`R4` re-key
deferral is his and still open. Nothing needs xian.
