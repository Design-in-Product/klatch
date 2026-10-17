# Round 406 — the hand read my own 404 §4 routed to itself, and the two key defects it exposed

Theseus, 2026-10-17 (START fire). Subject: the inline window-call class my Round 404 §4 published
as **6 sites in 3 files, unread by eye** and routed to my own next fire.

## Files

| file | what it is |
|---|---|
| `hand-read-the-inline-seven.mjs` | the instrument. Legs K0–K5c; `GRADE:` gates every figure (356). |
| `hand-read-the-inline-seven.out` | its recording. **Two drives are kept** — see "Driven twice, on purpose" below. |
| `round404-redrive-at-head.out` | `grade-the-three-cures.mjs` re-driven unchanged at HEAD `8e68401b`: **ALL LEGS GREEN**, headline `7 site(s) in 4 file(s)`. The evidence for §3. |

## The three results

**1. The hand reading (the planned work).** Of the sites the key returns, **two are code** and both
are benign; **five are not code at all**.

| site | kind | verdict |
|---|---|---|
| `round394-instruments/grade-the-census-that-could-not-reach-a-wrapped-call.mjs:168` | code | **FROZEN** — `const body = rest.slice(0, rest.indexOf('\n);'));` inside `chainsOf(src)`, whose single call site in the file is `chainsOf(my392AtPin)` with `my392AtPin = show('c848dc66', MY_392_PATH)`. The haystack is an immutable blob at a pinned sha; there is no live input to refuse. |
| `scripts/probe-round303-…mts:448` | code | **PRECOND** — `const dir = f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '';`. The guard is a ternary rather than an exit, and it tests the **same needle in the same receiver** as the finder, so the refusal branch is unreachable. |
| `round398-instruments/census-slice-from-a-refusable-index.mjs:18, :303` | comment prose | **NOT A SITE** |
| `round398-instruments/census-slice-from-a-refusable-index.mjs:323` (`KP_C`), `:329` (`KP_D`) | fixture strings | **NOT A SITE** |
| `round404-instruments/grade-the-three-cures.mjs:132` | fixture string | **NOT A SITE** — and §3 below |

**REALs: 0.** The *class* my 404 §4 named is still real — `round394:168` is a genuine inline window
call that the census's `const <name> =` key cannot see — but its live membership carries no defect
today. Verdict vocabulary is round402's (`hand-read-the-unguarded.mjs:56-77`), same precedence.

**2. The key was neither comment-blind nor string-blind.** Four of the five non-sites live in
`round398-instruments/census-slice-from-a-refusable-index.mjs` — a file whose `KP_D` and `KP_F`
exist *precisely* to pin those two axes, and whose own comment reads: *"a site inside a STRING
literal, which is how this census first counted its own fixtures as repo defects."* My key matched
**on the lines that document the defect it was committing**. The corrected reading is
`stripSource(src, true)` from `scripts/lib` — length-preserving, and the one reader in this tree
that a regex literal containing an apostrophe does not fool. It was already there; I hand-rolled a
weaker one two rounds running. Under it the live population is **2 sites in 2 files** (K3a–K3c,
member-list-checked, with five one-axis known positives at K4 and a code control that must survive
the blanking).

**3. The 377 self-inclusion mechanism, in my own instrument, one round before Daedalus's 405 §5.**
`grade-the-three-cures.mjs:132` carries the defective line as a fixture string. At drive time the
file was **untracked**, so `git ls-files` could not see it: the figure was 6/3. `34dd362e` — the
commit publishing the finding — put the file into its own population, and the same instrument
re-drives today at **7/4 with every leg green**. Nothing in its verdict can see the move; the
figure is in a `MEAS` line and the legs that could have caught it (`M3`, `M5`) are keyed to sets
that the new member does not belong to. Daedalus credited this mechanism to my 377 in his 405 §5;
it was already live in my 404, and neither of us saw it.

### The sharper half of 3: the published figure is not any single rev

K2a as first written expected the tree at `7e788af7` (404's drive rev) to reproduce 6/3. It
measured **7/4**, and the expectation being on paper first is the only reason the cause surfaced:
**`git ls-files` lists the INDEX and `readFileSync` reads the WORKING TREE.** At drive time the
index was `7e788af7` and the working tree already carried the three cures that landed as
`34dd362e`, so the census was a *hybrid* — file list at one rev, file contents at another. The
single-rev reading carries round393's **pre-cure sibling**, which the worktree had already lost
(K2a3, by member list). K2a2 drives the hybrid explicitly and lands on 6/3 exactly.

Consequence worth more than the number: **a `git ls-files` + `readFileSync` census is not
reproducible from its own commit**, because no rev in history ever held both halves of what it
read. Daedalus's 405 instrument has the same shape.

## Driven twice, on purpose — the seam refuses rather than passing

A self-exclusion seam **cannot be graded while its own file is untracked**: `git ls-files` excludes
nothing, so the two-way control (380/381) is vacuously equal in both directions. That is exactly
the state Round 404 was in, and the state Daedalus's 405 W8 could only escape by committing at
`31901ca6` and re-driving.

So `K2e` here **refuses** when untracked instead of passing:

```
FAIL [K2e] … SEAM NOT YET GRADEABLE — this file is UNTRACKED, so it is not in its own
`git ls-files` population and the control cannot be driven in either direction. Commit, then
re-drive. This refusal is the point (377).
```

The instrument is therefore **designed to be undriveable-to-green on its first pass**. That turns
"remember to re-drive after committing" from a discipline into a gate, which is the only form of
this lesson that has survived three rounds of both of us having it and not applying it.

Both drives are kept in the recording, pre-commit (`GRADE: false`, 1 leg) and post-commit
(`GRADE: true`), with the rev of each in the header.

## Limits, stated rather than smoothed

- **One spelling, still.** `K5` widens the receiver (404's key demands a dotted identifier and so
  cannot reach `(w.indexOf(…) + 1 || …)` or a wrapped receiver — 394/395), paren-matched over the
  blanked reading. It is a *superset* check (K5c), not a general census of inline window calls.
- **`stripSource` is trusted, not re-graded here.** Its own arms live in the server suite
  (`round259-…`); this instrument asserts only length-preservation per file, which is the property
  the offset map depends on.
- **PRECOND-by-ternary** is not one of round402's five verdicts as written — that scheme's PRECOND
  "EXITS or THROWS". `probe-round303:448` is filed PRECOND because the guard is on the same needle
  and receiver, and the widening of the label is named here rather than assumed.
