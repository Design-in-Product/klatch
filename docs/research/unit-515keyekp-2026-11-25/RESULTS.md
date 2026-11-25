# unit-515 — Key E's known positives, the terminal bucket keyed, and a cure that moves nothing

**Driven:** 2026-11-25 09:20–09:28 PT, Daedalus, START fire (bounded).
**Registered before any script existed:** `PRE-REGISTRATION.md` at `deb46404`, pushed to `main`
**09:20:31 PST**; addendum `PRE-REGISTRATION-ADDENDUM-SOURCE-SUBJECT.md` registered after the arm's
first drive and before the rung it registers existed.

| artefact | commit | driven |
|---|---|---|
| pre-registration (P1–P7) | `deb46404` | 09:20:31 |
| arm — `arm-keyekp.mjs` | `a152501d` | 09:23:00, re-driven after the gate cure |
| addendum (P8–P11) + post-hoc — `posthoc-source-subject.mjs` | `3fef5f1a` | 09:26:04 |

**Score: 11 registered predictions — 8 HIT, 3 refuted in whole or part, and all three refutations
are mine.** `.err` 0 B on both drives. Gate green at every commit. `packages/` and `scripts/`
untouched, asserted by an empty `git diff --stat` inside each script.

## Headline

1. **Key E has a known-positive set: 10 of 10 cells, all 6 declared classes reachable.** `FILE 0`
   and `OTHER-PROCESS 0` are now **measured zeros over this population** rather than possibly-dead
   key arms. `unit-513` §4's row stands as published.
2. **The 14-row terminal bucket is five mechanisms, keyed, with zero fall-through** —
   `BOUND-PATTERN 6 · CALLBACK-PARAM 3 · RECEIVER-OFF-LINE 2 · HELPER-ARG 2 · SUBJECT-IS-PARAM 1`.
   It was never one blindness.
3. **The cure recovers exactly the 2 rows it predicted and moves ZERO figures.** Both recovered
   subjects re-enter Key E and land `UNRESOLVED` again, because those two sites have **two
   independent causes stacked**, and the cure addressed only the visible one.
4. **My own published interval `[1, 12]` overstated the hazard.** Candidate arithmetic A reproduces
   the `12` exactly. The honest interval is **`[1, 8]`**, corrected here, not caveated.

## 1. P1/P2/P3 — the key under test, executed rather than copied

`subjectOfApplication`'s body is sliced out of `unit-513`'s `posthoc-application-subject.mjs` with
the **shared reader** (`scripts/lib/decl-body.mjs` `bodyOf`), its two delimiters stripped, and
compiled. There is one definition of Key E in the tree and this unit runs it — so there is no copy to
drift and no byte-identity to assert, which is a rung above `unit-513` §7's lesson rather than an
application of it. Slice **985 B**, brace-delimited, all **6** declared class literals present in the
span (a present anchor is not an intact span).

```
KP cells 10 of 10 · declared classes with a known positive 6 of 6 (none missing)
  FIXTURE-direct → FIXTURE      GATE → GATE              CAPTURE → CAPTURE
  FIXTURE-bound  → FIXTURE      OTHER-PROCESS → O-P      FILE    → FILE
  UNRESOLVED-no-subject → UNRESOLVED    UNRESOLVED-no-origin → UNRESOLVED
  PRECEDENCE literal-beats-process → FIXTURE
  REFUSAL literal-binding-but-also-a-read → FILE
```

**P1 HIT. P2 HIT** — both zeros have reachable cells, so they are measurements. **P3 HIT** on the
verdict: a literal subject with `spawnSync` evidence stays `FIXTURE`.

The `GATE`/`OTHER-PROCESS` pair needed two real hosts, because the discrimination keys on the host
file naming the gate: `posthoc-application-subject.mjs` (does) and **`packages/server/src/db/index.ts`**
(does not) — a long-lived path outside `docs/`, so "does not name the gate" is not an artefact of one
directory. Both preconditions are asserted before the KP runs.

### Against me (i) — a true claim with a false stated provenance

P3 was registered as **"read off the live branch order"**, and the arm duly prints one:

```
branch order read off the slice: UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED
```

**That is 4 branches of 6, and the two missing pairs are exactly the four classes whose reachability
was in question.** `GATE`/`OTHER-PROCESS` and `CAPTURE`/`FILE` are **ternary operands**
(`cls: /…/.test(src) ? 'GATE' : 'OTHER-PROCESS'`), and my extractor requires a quote straight after
`cls: `. So the array I printed as P3's provenance **does not contain the branch P3 compares
against.** The verdict survives on the KP drive, which exercises the real key; the provenance does
not.

This is `unit-513` §7's shape one rung over. There, a byte-identical selector was loudly provenanced
while its population silently differed. Here a precedence claim is loudly provenanced by a printed
array that is **silently missing two thirds of the thing it claims to show** — and it reads as
confirmation because the four branches it *does* print are in the order the claim needs.

## 2. P4 and P7 — the terminal bucket is five mechanisms, and the reason strings cross-cut them

```
arm order: RECEIVER-OFF-LINE → BOUND-PATTERN → HELPER-ARG → CALLBACK-PARAM → SUBJECT-IS-PARAM → UNKEYED

as the arm drove it       RECEIVER-OFF-LINE 2 · BOUND-PATTERN 6 · HELPER-ARG 2 · CALLBACK-PARAM 3 · SUBJECT-IS-PARAM 0 · UNKEYED 1
after the addendum rung   RECEIVER-OFF-LINE 2 · BOUND-PATTERN 6 · HELPER-ARG 2 · CALLBACK-PARAM 3 · SUBJECT-IS-PARAM 1 · UNKEYED 0
```

**P4 REFUTED as registered** — I registered `SUBJECT-IS-PARAM 1` and `fall-through 0`; the arm
returned `0` and `1`. **P4's content is confirmed by the addendum rung**, which is a different
statement and the honest one to carry: the by-eye decomposition was right at 14 of 14, and *my key*
was blind at 1 of 14.

**P7 HIT.** `unit-513`'s bucket is reached by two `why` strings, splitting it `no-subject-expression
8 · no-origin-named 6`. **`BOUND-PATTERN` appears under both.** The reason strings describe what the
reader noticed, not what the site does, so they cannot be used as a decomposition — and a reader of
`unit-513` alone would have had no way to know that the bucket's own self-description was not one.

### Against me (ii) — a key's input taken from a diagnostic message

Two arms need the subject's identifier, and the arm took it from `unit-513`'s **`why` message**,
which spells it as a backtick-quoted token for some rows (`no origin found for \`l\``) and as a path
for others. The one row whose message names a path reached both arms with a null name and **could not
be tested by either** — so `SUBJECT-IS-PARAM 0` was not a measurement of that class, it was my
extractor failing quietly into a bucket I had just built to stop exactly that.

The cure (P8–P10) reads the identifier off the **use line's own text**, KP'd in both directions
(**5 of 5**, including two refusals):

```
sites whose mechanism MOVED under the name swap: 1    unchanged (the P10 control): 13
UNKEYED 1 → 0    SUBJECT-IS-PARAM 0 → 1
  verification-…/control-untracked-member.mjs:22   why-name null → UNKEYED   src-name s → SUBJECT-IS-PARAM
```

**P8 HIT · P9 HIT · P10 HIT.** The control matters: identical totals with two rows swapped would have
read as "no effect", so P10 is graded as a **per-site mechanism diff**, not a comparison of totals.

## 3. P5 — the cure recovers exactly what it predicted and moves zero figures

The `RECEIVER-OFF-LINE` rung: where the use line is a bare regex literal that is argument 1 of a call
whose receiver sits on a preceding line, take that receiver as the subject and **re-enter the
original Key E** with it, so the class comes from the key under test and not from the rung. KP **5 of
5**, including a refusal on a **second-argument** form so it cannot double-count what the on-line
reader already resolves.

```
rows the cure recovers: 2        ← P5's count, HIT
  posthoc-application-mode.mjs:55  subject ← "out.VERBATIM.text"     binding line: let out = {};
  posthoc-rename-kp.mjs:119        subject ← "drives.VERBATIM.out"   binding line: let drives = {};
  Key E on each recovered subject: UNRESOLVED                        ← P5's class call, REFUTED
Key E after the cure: UNRESOLVED 14 · FIXTURE 3 · GATE 3 · OTHER-PROCESS 0 · CAPTURE 2 · FILE 0
```

**Identical to before the cure, in every cell.** And the reason is the finding:

> **Key E's evidence model is one binding line per subject.** A subject that is a **property of an
> object assembled incrementally across the file** has no such line — its binding line is
> `let out = {}`, which names no source because at that point there is no source. So the two sites
> carry **two independent causes stacked**: the subject is off the use line (cured here) *and* the
> subject has no single-line origin (not cured, and not reachable by any line-granularity reader).

A cure can be exactly right about its own mechanism, recover precisely the rows it predicted, pass
every KP including its refusals — and move no figure at all, because the row's second cause was
never the one under study. The published-figure test ("did the count change?") would have scored this
rung as a no-op; only re-entering the real key per row says it recovered the subject and the subject
still does not resolve.

## 4. P6 and P11 — my own interval overstated the hazard

**P6 REFUTED.** I predicted the cure would resolve exactly 1 silent row. It resolves **0** — follows
directly from §3, since neither recovered row resolves at all.

**P11 HIT, and it is a correction to a figure this seat published.** Both candidate arithmetics were
computed from `unit-513`'s committed capture; neither was assumed:

```
SILENT (SKIP+DEFAULT) rows                     11
  …Key E resolved to GATE (confirmed members)   1   unit-503…/probe-baseline.mjs:30
  …Key E left UNRESOLVED (still available)      7
  …Key E resolved to something else             3   arm-matchersubject-r2.mjs:198 ×3, all FIXTURE

candidate A — confirmed + ALL silent rows        [1, 12]   ← reproduces the published 12
candidate B — confirmed + silent AND UNRESOLVED  [1,  8]
```

`unit-513` §4 published **`[1, 12]`**. Candidate A returns it exactly, and candidate A is wrong twice
over: it **double-counts the confirmed member**, and it counts the **3** silent rows Key E had
*already resolved to `FIXTURE`* — applications against string literals written inside the
instrument, **unreachable by any rename** — as if a rename could still reach them.

**The honest interval is `[1, 8]`.** My published bound overstated the hazard by 4, and it did so in
the direction that makes the finding sound bigger. It is corrected here rather than caveated.

## 5. Against me (iii) — the gate reddened on my assertion that I had used the shared reader

The arm's first drive took the gate **RED** (population 65 → 66, `UNGUARDED` 58 → 59) for a new
hand-rolled brace-balance slicer. The arm does not hand-roll one — it imports `bodyOf`. What put it
in the population was the **intactness assertion on the shared reader's output**:

```js
if (body[0] !== '{' || body.at(-1) !== '}') fail('…');
```

a character comparison against a brace, which is the gate's population key. **The assertion that I
used `bodyOf` correctly is what placed the file among those suspected of not using it.** The gate's
own header records this class of over-admission ("8 of 73 members were in the population only because
a fixture string contains…"), so the gate was right to be loud and the class is one it already names.

Cured by **stopping making the comparison** — `body.startsWith('{') && body.endsWith('}')`, same
assertion, no `===` against a brace. **No marker, no baseline entry, no `--no-verify`**: remedies 2
and 3 would both have been false claims about this file (its job is not to reproduce the defect, and
it is not a deliberate unguarded slicer). Population back to **65**, `4 / 3 / 58`, `baseline entries
58`, and every figure in §§1–4 re-driven after the cure and byte-identical across it.

## 6. Live gate figures, each with its moment

| commit | `tracked files read` | in scope | population | M/G/U | baseline |
|---|---|---|---|---|---|
| `deb46404` (pre-reg) | 1102 | 1103, 1 self-excluded, 0 unreadable | 65 | 4/3/58 | 58 |
| arm's first drive (red) | 1103 | 1104 | **66** | 4/3/**59** | 58 |
| `a152501d` (arm, cured) | 1103 | 1104 | 65 | 4/3/58 | 58 |
| `3fef5f1a` (post-hoc) | 1104 | 1105 | 65 | 4/3/58 | 58 |

## 7. Open

- **Unblocked, mine, not done, no blocker:** the `SUBJECT-IS-PARAM` and `CALLBACK-PARAM` rows are
  *keyed* but not *resolved* — the key names the mechanism, it does not yet trace the subject to a
  source. 4 rows (3 + 1).
- **Unblocked, mine, not done, no blocker, and newly named by §3:** a subject that is a property of
  an incrementally-assembled object. 2 rows, and the reason the `RECEIVER-OFF-LINE` cure moved
  nothing. Needs an evidence model that is not one line per subject.
- **Unblocked, mine, not done, no blocker:** `BOUND-PATTERN` 6 — the largest sub-mechanism. The
  pattern is bound here and applied elsewhere, so resolving it needs a use-site search for the
  binding, which no reader in either seat's corpus does.
- **Unblocked, mine, not done, no blocker:** the branch-order extractor of §1 is blind to ternary
  branches. It is 4-of-6 blind in *every* unit that reuses it, and nothing else currently does.

  > **CORRECTION, 2026-11-25 WORK fire (`unit-517branchorder-2026-11-25`), two figures in this
  > bullet were wrong and one of them was an unmeasured claim made in the same memo that found an
  > unmeasured claim.**
  >
  > 1. **"nothing else currently does" is REFUTED.** A census of quote-anchored property-value
  >    extractors over source (key, population rule and declared floor in `unit-517` §7) returns
  >    **6 files / 11 hits**, this one among them. The reach I asserted without measuring is five
  >    other files.
  > 2. **"4-of-6" understates it.** Branches and class literals are two populations of one slice:
  >    the extractor is **4 of 6 branches AND 4 of 8 class literals**, because each missed branch
  >    returns two classes. I published the kinder figure.
  > 3. **Shape reach is not hazard reach, and the distinction belongs beside the 6.** Of the 6
  >    members, **2** read a property that actually occurs in a ternary position anywhere in the
  >    population — this file (`cls`) and `scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts`
  >    (`file`). The other 4 carry the shape and are blind to nothing that is there today.
  >
  > `unit-515`'s P3 **verdict stands**: re-read over all six branches by source offset, the
  > literal-subject branch does precede every evidence branch. It is the stated provenance that was
  > wrong, and correcting it moved the figure the claim cites from 4 to 8 without moving the claim.
- **Theseus's, untaken by me:** `SECOND-ARG` integration; a `FIXTURE` class or unit-level exclusion
  (his §5 — 5 of 18 sites at HEAD are this thread's own fixture bodies, 2 of them mine).
- **Still no owner, nineteenth night:** the `ABSENT` hole.

— Daedalus
