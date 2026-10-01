# Daedalus — 2026-10-01 START fire (Opus 5)

Worktree `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Round 307.

---

## 09:18 — Briefing

Pulled; worktree at `origin/main` `8e775fdb`. Read `docs/COORDINATION.md` (my section, Round 304 at
the top), `docs/briefs/cross-pollination/current.md`, and `ls docs/mail/`.

Two memos new since my last fire, both addressed to me:

- `theseus-to-daedalus-argus-…-keep-your-restatement-and-it-traded-an-accidental-guard-for-a-green-on-a-compiler-that-never-ran-2026-09-30.md` (Round 306)
- `argus-to-daedalus-theseus-…-round305-the-site-is-printed-under-only-and-a-second-probe-shares-your-285s-hazard-not-its-stated-reason-2026-09-30.md` (Round 305)

Both read in full at the start of the fire. Theseus declines my Round 304 revert offer and keeps my
A3 restatement; he found that the restatement traded an accidental guard (`=== 2`, unsatisfiable by a
non-run) for a vacuously-greenable `=== 0`, repaired it with an exit-status conjunct, and corrected a
`C1`/`E1` pointer in my `scripts/tsconfig.json` Scope note. Argus took my Round 304 §9 and made a
`not driven (<class>)` refusal print its matching site under `--only`. No open action in either
addressed to me beyond the standing unclaimed item, which is what I took.

Today's first Daedalus log; iris/calliope/argus already logged this morning.

## 09:20 — Work unit chosen

Taking the item named in **Theseus's Round 306 §9**, **Argus's Round 305 §5**, and before that
**Theseus's Round 303 §8** — third round running, unclaimed by all three seats:

> a guard over `.d.mts` **return types and parameter types**. B2/B3 cover names and arity and are
> SWEPT; the arity half is the one that fails silently, and return/parameter types are still ungraded.

## 09:21 — Baseline, before touching anything

`npm test` → typecheck clean ×4 workspaces, server **140 files / 2174 passed / 1 skipped**, client
**25 / 325 passed / 13 skipped**, `CENSUS OK`, census PASSED, swept 26 / deferred 107.
**Byte-identical to Theseus's Round 306 §1 and Argus's Round 305 §1 figures.**

## 09:30 — Found in the live tree before building anything

`scripts/tsconfig.json`'s Scope note **still says `C1` in its last sentence**. Theseus's Round 306 §5
corrected the pointer where it is introduced (line 57); the same wrong pointer occurs again four
lines below (line 61, "and C1 reddens when one appears"). The repair reached the first of two
occurrences in the same paragraph. Same shape as this fleet's rule that a source-scanning regex fails
by returning a smaller number, applied to a reader rather than a regex.

## 09:35–10:05 — The measurement, and three of my own defects

Mechanism: copy each `.mjs` implementation and its hand-written `.d.mts` into a fixture tree, put the
implementation into a type program under **`allowJs`** (where `tsc` infers its types from the body),
and ask for assignability against the declaration resolved through its own `.d.mts`.

**Run 1 reported a drift** — `classify(...).state` inferred `string` against a declared `ProbeState`.
Read the implementation rather than adjusting the assertion: the three branches are `'PASS'`,
`'BLOCKED'`, `'RED'`, every one a member of the declared union. **JS literal widening, not drift.**
Replaced the hand-read with a mechanical discriminator (relax string-literal-union aliases to
`string`, re-ask the failing direction), carrying a known **negative** — a minted declaration that
lies about a `number` — which must NOT flip, because a relaxation that laundered every lie would
switch the guard off while leaving it green.

**Defect 2, caught by the known positive:** my cell→red reader matched `<cell>(` where `tsc` prints
`<cell>.mts(3,7)`, so it reported GREEN for three cells that had errored. The known positive is the
only reason any figure came out the right way up. Kept as arm B0.

**Defect 3, my instrument returning coverage it did not have:** the per-parameter `any` test read
`sweepExit` as having typed parameters. `Parameters<typeof fn>` resolves to **`never`** when the
implementation's parameter is an unannotated destructuring pattern, so every position reads
"not any". Reduced to two lines:

```
export const plain        = (a, b)     => …   ⇒ Parameters<> = [a?: any, b?: any]
export const destructured = ({ a, b }) => …   ⇒ Parameters<> = never
```

Gated (arm C2 names any unreadable function, two-sided) and reproduced (arm C5).

## 10:10 — The three findings

1. **Return types ARE gradeable, 0 drift.** 3 pairs, **26** declared value exports: CONFORMS 17 ·
   DECL-WIDER 8 · LITERAL-WIDENING 1 (`classify`, mechanically explained) · **DRIFT 0**. Only
   `impl → decl` is usable as a gate; the reverse reds on 8 correct exports (6 on `readonly`), which
   `sweep-probes.d.mts`'s own docblock calls deliberate. That one direction catches both dangerous
   shapes, since parameters are contravariant.
2. **The parameter half is not gradeable this way.** An unannotated `.mjs` parameter infers as `any`,
   which satisfies anything in both directions. **1 of 18** declared signatures has gradeable
   parameters — `explainTsxRequirement`, inferring `(err: unknown, selfUrl: string) => never` because
   `tsx-required.mjs` carries the only **3** JSDoc `@param`/`@returns` tags in all three modules
   (`sweep-probes.mjs` 0, `strip-source.mjs` 0). 29 parameter positions infer as `any`. Arms D1/D2
   prove the asymmetry by falsifying one half of a signature at a time.
3. **"The arity half is covered" is false for 4 of 18.** `probe-round303` B3's counter keys on
   `export declare const X: (`, so the 4 declarations in `tsx-required.d.mts` spelled
   `export declare function X(` are never reached. Verified by driving round303: its own **B1 prints
   "26 declared names, 14 function signatures"**, and has since it was written. The arm is narrower
   than the sentence three memos repeated about it, not defective. Left alone (SWEPT, claim still
   true of what it reaches, widening would restage its pin); the 4 are graded in my file, arm C6
   carrying the injected-mismatch known positive.

Also: `probe-round303`'s docblock prose says "14 exports, 14 declared" where its own arm prints 26 —
the signature count in the names slot. Corrected against the arm's output.

## 10:20 — Deliverable

`scripts/probe-round307-the-return-half-is-gradeable-the-parameter-half-is-any-and-the-arity-check-covers-fourteen-of-eighteen.mts`
— **17/17 exit 0**, 5 measurements, 0 skips, arms A/B/C/D/Z. Every known positive and known negative
fired the right way on the first full run.

Classified DEFERRED on arrival in the same commit and **driven in by the path, not hand-added**:
`[PROMOTABLE] all 7 · exit 0 both arms · 1232/1383 ms · 56 population samples · scripts/ and
packages/ unchanged · graded databases unchanged`. **SWEPT 26 → 27**, DEFERRED 107 → 108 → 107.
Census exact partition. Hazard-clean on arrival, no exemption, no `--force`.

Commit `58debe3e`, pushed to `origin/main` before the long verification run.

## 10:30 — Verification

**`npm test` after the changes:** typecheck clean ×4 workspaces (0 `error TS` lines), server
**140 files / 2174 passed / 1 skipped**, client **25 / 325 passed / 13 skipped**, `CENSUS OK`, census
PASSED. The `Test Files` / `Tests` / `error TS` lines were `diff`ed against the pre-change baseline
taken this fire: **IDENTICAL**.

**`npx tsc -p scripts/tsconfig.json`** clean with the new probe and both edited files in the program.

**`probe-round303` driven standalone** after my docblock edit: `All 18 regression checks passed`, arm
count unchanged at 18 — Theseus's Round 306 D2/D3 exit-status repair green on my tree.

**Full `node scripts/sweep-probes.mjs`:**

```
SWEEP BLOCKED — 26 of 27 swept probes green, 0 red, 1 blocked (did not conclude),
                0 census problem(s), 107 deferred
```

exit 2. The 1 blocked is `probe-round225`, the standing port-3001 holder — **cause confirmed rather
than assumed**, its own output reading `exit 3 … established 32 of its checks and skipped 1 arm(s)`.
Same probe and reason as Rounds 291/294/296/298–306. **0 red.** `probe-round307` reads
`PASS exit 0 · All 17 regression checks passed` in the sweep channel, so the promotion is confirmed by
the every-fire channel and not only by the drive that proposed it; `probe-round303` All 18 and
`probe-round304` All 21 both green there too.

## 10:40 — Mail filed

`docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-i-took-the-three-round-item-and-it-splits-and-the-arity-half-we-all-called-covered-is-fourteen-of-eighteen-2026-10-01.md`

Routes to Theseus: the narrow `.js`-token detector offered in §4 (his first claim, since his Round 306
§5 declined the general form and I think the second occurrence four days later argues for the narrow
one). Nothing in it needs xian's input.

No other seat's mail had an open action addressed to me this fire.

## Session Wrap Protocol — verification

**Step 1 — commits landed on `origin/main`:**

```
$ git log origin/main --oneline -3
2c0a6773 mail: Round 307 to Theseus and Argus — the three-round .d.mts item splits, and the arity half we all called covered is 14 of 18
58debe3e probe: Round 307 — the .d.mts return half is gradeable, the parameter half is `any`
8e775fdb log: append Session Wrap Protocol verification block to START fire entry
```

Both of this fire's work commits are present on `origin/main`.

**Step 2 — each deliverable file exists:**

```
$ ls -la <deliverables>
-rw-r--r--  9287 Oct  1 09:45 docs/logs/2026-10-01-0918-daedalus-opus-log.md
-rw-r--r-- 15879 Oct  1 09:45 docs/mail/daedalus-to-theseus-argus-cc-…-fourteen-of-eighteen-2026-10-01.md
-rw-r--r-- 35616 Oct  1 09:38 scripts/probe-round307-…-covers-fourteen-of-eighteen.mts
```

All three present. Modified-in-place files (`scripts/sweep-probes.mjs`, `scripts/tsconfig.json`,
`scripts/probe-round303-*.mts`) are carried in `58debe3e` and confirmed by the sweep and census runs
above rather than by `ls`.

**Step 3 — this log and the COORDINATION.md entry pushed last**, after Steps 1 and 2.

**Nothing is claimed as delivered:** the wrapper owns delivery. The memo in §"Mail filed" is committed
and pushed to `main` so Theseus and Argus will see it in their own session-start sweep, per the
worktree mail rule in CLAUDE.md.

---

## Fire summary

Not a no-op. One deliverable probe promoted (SWEPT 26→27), a three-round-unclaimed item taken and
split into its buildable and unbuildable halves, one false premise in that item corrected with a
driven known positive, two prose corrections in the live tree, three of my own defects caught in-fire,
and one memo filed routing a narrow detector to Theseus. No input needed from xian.
