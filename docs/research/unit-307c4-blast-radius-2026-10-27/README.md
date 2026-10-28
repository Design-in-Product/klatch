# Unit — the blast radius of the `scripts/lib/*.mjs` gate over the DEFERRED probes

**Seat:** Theseus · **Fire:** 2026-10-27 STOP · **REV:** `b630db7a` · **Not a round.**

This is not Round 465. Under this seat's own stop condition (`consecutive=10`, last gated-curing
round `454`, `N=5` → already fired) a self-directed round queues behind routed and gated work. This
unit is gated work: it closes a gap another seat named explicitly and left unclaimed in writing.

## What it answers

Argus's 10-27 STOP memo routed one RED to Daedalus — `probe-round307`'s `C4`, falsified by
Daedalus's `lib/**/*.mjs` gate — and closed with a non-claim:

> **Not claimed:** I did not check whether any of the other 110 deferred probes reference these two
> files' signatures in a way that would also move — out of scope for a sweep that only drives the 43
> swept probes.

Nobody owned that. It is a census and a static read, so deferring it would have been indefensible.
This unit measures it. It does **not** repair `C4` — that is routed to Daedalus and is a question
about what his probe should mean, not a mechanical patch.

## Findings

**1. 19 of the 110 deferred probes reference a cured lib file — and the first measurement said 0.**
`recon.mjs` stage 1. The `0` was a false zero: `SWEPT` is an array of `{file,expect,why}` objects
and `DEFERRED` is an array of plain **strings**, so reading `e.file` over both built the path
`scripts/undefined` 110 times and every deferred source came back unreadable. A leg that refuses on
an unreadable source (`T3`) is the only reason the 0 was not published — it reads identically to the
answer "none of them reference lib." Crippled as `entry-shape-dot-file`.

**2. 0 of the 110 can move under `C4`'s mechanism.** `cell-mechanism.mjs`. Two probe-side keys, each
with a known positive:

| key | what it is | over the 19 | KP `probe-round307` |
|---|---|---|---|
| `M1` | a JSDoc **block**-tag regex (`@param`/`@returns`) — `C4`'s own key | **0/19** | `true` |
| `M3` | `Parameters<typeof …>` / `ReturnType<typeof …>` | 2/19 | `true` |

`M3`'s 2 are `probe-browse-latency-end-to-end.mts` and `probe-turncount-live-http.mts`, and **both
are false candidates**: their queries are `ReturnType<typeof spawn>` and
`Awaited<ReturnType<typeof timeBrowse>>` — `node:child_process` and a local function — and their only
lib imports are three `.mts` files, none of the 9 cured `.mjs`. Their stage-1 hit was the bare
`scripts/lib` directory needle, i.e. a path mentioned in a comment. `M3T` resolves the **target** of
each query and reports `0/2`.

`M3T` needs two target shapes, not one, and the KP is what forced it: 307 reaches the cured libs
**dynamically** — it resolves every `scripts/**/*.mjs` from disk and generates
`import * as impl from './<resolved>.mjs'` cells. A static-import-only key reports 307 as not
targeting a cured lib, which is the opposite of the measured truth. Crippled as `m3t-static-only`,
which reddens `M3T-KP`.

**This zero means the deferred set is not hiding a second victim by this mechanism. It is not a
claim that no deferred probe is red** — none of the 110 was driven, and the 2 live-HTTP members
would need a server. The scope of the zero is the mechanism, stated here because the two are easy to
read as one.

**3. The two files `C4` cannot see are *exactly* the two in Argus's memo — his diff was the complete
set, not a sample.** `S3`. Of the 9 cured libs, those carrying inline `@type` but **no** block tag
are `characterisation-markers.mjs` and `strip-source.mjs`, and the set is identical to the two he
shows diffs for. Checked as set equality, not as "both of his appear."

**4. The cure used two annotation styles, and "it added inline `@type`" is true of 8 of 9.** `S4`,
a positively-keyed 2×2 with a sum gate: `both=6 typeOnly=2 tagsOnly=1 neither=0, sum=9`.
`opaque-container.mjs` was cured with block **`@param`** tags, not inline `@type` (three hunks,
`git diff d5205b76~1 87270c6f -- scripts/lib/opaque-container.mjs`). So for that one file the cure
moved `C4`'s own key in the same direction `C4` reads it. Not a defect — `opaque-container` is not in
`C4`'s pinned module set — but it is why this cell's `S1` reddened at 8/9 before being re-aimed from
"carries `@type`" to "carries an annotation in either style."

**5. Argus's `13` is exact and his attribution of it is off by 3 — and this breaks one of his two
proposed repairs.** `cell-attribution.mjs`, read off this seat's own re-drive of his probe
(`drive16`, `C4 FAIL`, `1 of 17 regression check(s) FAILED`, exit 1 — his RED reproduces
byte-for-byte) rather than off his prose. The pre-gate baseline is sliced from `C4`'s own
`gradeable[0] === '…'` pin, not retyped.

```
GAINED 13
  G characterisation-markers 8
  G strip-source 2
  G tsx-required 3
```

His sentence puts all 13 "across those two zero-`@param`-tag modules". **3 of the 13 are in
`tsx-required`, which carries 8 block tags** — the probe's own printed `jsdocTags` line says so.
Consequence, and it is the part worth his and Daedalus's attention: his second suggested repair —
*"scope the pin to the three original modules by name"* — **would not fix `C4`**. `tsx-required` is
one of the original modules, and its own gradeable count went `1 → 4` without gaining a single block
tag. `C4`'s correlation is falsified *within* a block-tag-carrying module, not only by two zero-tag
ones. The first suggested repair (re-key off "has a typed parameter signature") is untouched by this.

## Instruments

| file | what |
|---|---|
| `recon.mjs` | stage 1 — the selector over the live `SWEPT`/`DEFERRED` exports. 6 legs, 4 cripples. |
| `cell-mechanism.mjs` | stage 2a — probe-side `M1`/`M3`, target resolution `M3T`, subject-side `S1`/`S3`/`S4`. 10 legs, 5 cripples. |
| `cell-attribution.mjs` | stage 2b — Argus's 13, by member and per module. 6 legs, 2 cripples. |

Populations and revs are derived, never hand-typed: the cured file list from
`git diff --name-only d5205b76~1 87270c6f`, the probe population from `git ls-tree` at `REV` keyed on
**both** `.mts` and `.mjs` (all 13 `probe-*.mjs` are DEFERRED; an `.mts`-only key reddens `T1`), and
the gradeable sets from the probe's own recording and its own source pin.

## Grading — every repair made to fail, and three defects no reading caught

| cripple | instrument | reddens |
|---|---|---|
| `entry-shape-dot-file` | recon | `T3` |
| `needles-dir-only` | recon | `S1` (307 present, not found; reports **14**, not 19) |
| `drop-307` | recon | `S1` (307 absent; still reports 19) |
| `touched-from-memo` | recon | `T2` |
| `kp-drop-m1` | mechanism | `G3` |
| `kp-wrong-spelling` | mechanism | `K1` |
| `neg-use-307` | mechanism | `K2` |
| `s2-probe-side` | mechanism | `G3`, `K1` |
| `m3t-static-only` | mechanism | `M3T-KP` |
| `baseline-hand-typed` | attribution | `G3`, `A1` (delta 14, not 13) |
| `count-not-members` | attribution | **did not isolate — see below** |

Clean arms: `drive14` → `VERDICT/1 ok legs=10`, `drive4` → `ok legs=6`, `drive17` → `RED red=[A2]`
(the RED is the finding). All `.err` empty, `grep -c .` = 0 on each.

**Three defects in these instruments, each caught by a leg or by a cripple exiting 0 — none by
reading the code:**

1. **The false zero** (finding 1), caught by `T3` refusing.
2. **`drop-307` was declared in the usage docblock and no hook read it.** It exited **0**, which
   reads exactly like "the repair is sound." Occurrence count in the file: 1. Implemented, and `C0`
   now gates that every cripple named in the docblock occurs more than once in the file's own
   source.
3. **`kp-drop-m1` exited 0 — a vacuous green.** With `M1` dropped from the key set, `K1` was green on
   `M3` alone, `COUNT M1` simply vanished from the output, and the verdict still read `ok`. The cell
   had stopped measuring the figure it exists to publish. `G3` now gates that `M1` and `M3` are both
   live. Following the reds would never have found this; only driving the cripple did.

Two assertions of mine were also wrong and were reddened by their own controls rather than by
re-reading: `K1` (I asserted 307 carries `@type`; it does not — `@type` is a property of the
subject, not the probe) and `S1` (8/9, not 9/9 — finding 4). Both were **re-aimed, not loosened**:
`K1`'s key moved to the subject side with its own KP, rather than `K1` being relaxed to "every key
except M2."

**`count-not-members` did not separate and is reported as such.** Its intent was that collapsing the
per-module split to a bare total would hide the attribution error. It does not: `A2` reddens anyway,
so the verdict stays RED. The honest reading is that `A2` is the gate and `A3` is descriptive — one
leg is load-bearing for finding 5, not two. Left in place and labelled rather than deleted or
counted as a clean cripple.

## Not run / not claimed

- **None of the 110 deferred probes was driven.** Finding 2 is static, on two keys each with a KP.
  Two of the 19 are live-HTTP/port probes; driving them needs a server and a window where a leaked
  one costs nothing, which a fire is not. **Named blocker.**
- `npm test`, `npm run typecheck`, the driving sweep — nothing under `packages/` or `scripts/` was
  touched by this unit. Everything here is new files under `docs/research/`.
- **`C4` is still RED and still Daedalus's.** Reproduced here (`drive16`), not repaired. Argus's
  routing stands; finding 5 narrows which of his two suggested repairs can work.
- Whether any of the 110 reference these files in a way that moves under a *different* mechanism
  than `C4`'s — unmeasured. The keys here are `C4`'s own and the type-resolution one.
