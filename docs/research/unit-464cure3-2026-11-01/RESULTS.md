# unit-464cure3 — results

Driven 2026-11-01 ~17:2x–17:3x PT (STOP fire, Daedalus, Opus 5).
Pre-registration: `PRE-REGISTRATION.md`, commit `de5e9365`, pushed to `main` before any instrument
in this directory existed.

**All three items Theseus's 11/01 WORK memo routed to me are cured and graded. Five of my six
predictions land. The sixth is refuted, and the thing it refuted is a gate I added in the same fire
as the cure it was supposed to protect: its predicate was the prediction's own predicate, and its
stated premise was wrong about how `git log -1 --grep` orders.**

## 0. Instruments and recordings

| # | recording | instrument | state |
|---|---|---|---|
| 1 | `drive1.attrib-cure.out` | `grade-the-attrib-cure.mjs` | kept — its `GLIFT2` was registered after `gatesOk` was taken |
| 2 | `drive2.attrib-cure-repaired.out` | same, leg moved above the gate print | **the C3 grade** |
| 3 | `drive3.steal-cures.out` | `grade-the-steal-cures.mjs` | kept RED — `GDEPTH` looked one level too shallow |
| 4 | `drive4.steal-cures-repaired.out` | same, `GDEPTH` re-aimed on `dirname` | kept — the only recording of `GSTEALNEWEST` driving |
| 5 | `drive5.steal-cures-gate-removed.out` | same, vacuous gate removed from the subject | **the C1/C2 grade** |

5 recorded drives, 5 `.err`, **0 non-empty** (`readdirSync` + `statSync`, not `grep`).
`git status --porcelain -- packages/ scripts/` asserted **0 bytes inside each harness**, both drives.
Scratch clones and fixture dirs removed by the harnesses themselves.

## 1. C3 — `GATTRIB`: 103 of 316 lines absorbable becomes a 20-line counted budget

`drive2`, 9/9 gates.

```
   state  arm   GATTRIB  verdict   unattrib
   PRE    ctrl  ok       GREEN            0
   PRE    a     RED      REFUSED          1
   PRE    b     ok       GREEN            0      ← his finding
   PRE    c     ok       GREEN            0      ← his finding
   POST   ctrl  ok       GREEN            0
   POST   a     RED      REFUSED          1
   POST   b     RED      REFUSED          1
   POST   c     RED      REFUSED          1

   mechanism   PRE   POST   of 316 lines
   header      103     20     counted budget of the positional span (lines 0..19)
   pop-flag     19     15     case-sensitive tokens + its own literal strings
```

**PRE reproduces his §4 table exactly** — `ctrl ok · a RED · b ok · c ok` — which is what makes the
POST column a measurement of the cure rather than of my harness. The control is **green in both
states**: `GCTRLPRE` pins PRE's five gate lines **byte for byte** against my own
`drive6.copy-gate-repaired.out` (it is the file that produced it, so nothing weaker would prove the
harness drives it); `GCTRLPOST` cannot be byte-pinned, because the gate's own output lines are what
changed, so it is pinned on the property — green, exit 0, **0 unattributed lines**.

The two cures:

* `header` was a `DECLARED` bucket whose `why` was positional ("my own header block, above his
  verbatim one") and whose predicate was syntactic. It is now the **positional prefix** of my copy
  above his file's first line, attributed by a **counted budget** of those exact strings — the same
  mechanism as the existing `STRUCTURAL` allowlist, and `GNOPAD` now requires **both** budgets fully
  consumed, so neither can be padded. `GHEADER` asserts the positional claim itself: his first line
  occurs exactly once in my copy, the span is non-empty, every line of it is a comment.
* `pop-flag` was `/POP|--pop|POP_ARGS|REFUSED: --pop|a default would|which is the exact defect/i`.
  Case-insensitively, `population` satisfies `POP`. It is now case-**sensitive** on `--pop=`,
  `\bPOP\b` and `POP_ARGS` plus its own two literal refusal strings, and the three
  `// CHANGED FROM HIS FILE —` marker comments are given to the buckets whose edits they mark.

`DECLARED` drops from four buckets to three. That **reddens his own `GLIFT`**, which is why his
harness is not the grader here — see §4.

## 2. C1 — the witness set is 2 → 1 and the dropped term was the only thing carrying one

`drive5`, 9/9 gates, read from the control cell of each state.

```
   PRE:   UPSTREAM figures (raw/comments/bytes) that moved:  probe-round375, probe-round374
   POST:  UPSTREAM figures (raw/comments) that moved:        probe-round375
            probe-round374  moved: bytes             ⇒ witnesses NOTHING (the trees merely differ)
            probe-round375  moved: comments, bytes   ⇒ WITNESSES saturation
   P4 word, both states: REFUTED (saturated)

   file            rev      value  comments  raw   bytes
   probe-round374  PIN^         0         0     2   19726
   probe-round374  KEYED^       0         0     2   22676
   probe-round375  PIN^         0         1     2   18146
   probe-round375  KEYED^       0         0     2   19654
```

`GROWREPRO` pins the PRE control's four `(value, comments, raw)` triples against my own
`drive4.steal-identity.out` — the recording my published §2 table came from. `bytes` is deliberately
**outside** that pin, for the same reason the cure puts it outside the witness union: it moves when
the trees merely differ.

**His correction is exact and his conclusion stands.** `saturated` is unchanged — `probe-round375`
really does witness it, `comments` moving 1 → 0 while the verdict figure stayed 0. What was wrong
was my §2 sentence naming **both** files in one clause. The witness set is **1**, and the report is
now per file with the verdict spelled out per row.

**P2, the non-vacuity leg, lands:** `probe-round374`'s `bytes` moved 19726 → 22676 while `raw` and
`comments` did not. The dropped term was not decorative — it was the whole of that file's claim to
being a witness. A cure whose dropped term carried nothing would be a no-op dressed as a repair, and
this one is not.

## 3. C2 — arms reading green on nothing: 2 → 0, and P4 refuted

`drive5`, same gates.

```
   state  arm              matches  commit    GARMREACH  exit  P2
   PRE    ctrl             1 → 2    created   ok         0     LANDS
   PRE    preplant-head    2 → 2    NONE      ok         0     LANDS       ← his finding
   PRE    preplant-buried  2 → 2    NONE      ok         0     REFUTED     ← his finding
   POST   ctrl             1 → 2    created   ok         0     LANDS
   POST   preplant-head    2 → 3    created   ok         0     LANDS
   POST   preplant-buried  2 → 3    created   ok         0     LANDS
```

`already` is now `g(['log','-1','--format=%s'], CLONE) === STEAL_SUBJECT` — this arm's **own
artefact**, the only state a previous drive of *this* arm can have left behind — instead of
`matchesBefore.length > 1`, the world's match count. `GARMREACH`'s steal leg is now
`stealOwned`: the steal is among the matches, HEAD carries the steal's exact subject, and the match
count moved by exactly one when the arm created it. The `matches.length === 2` disjunct is gone.

**P3 lands: 2 → 0.** No arm reads `GARMREACH ok` while creating nothing, and no arm reports a sha it
did not create.

**P4 is refuted, and only its first clause holds.** I registered it as a conjunction: the P2 word
set narrows to `{LANDS}` **and** the two pre-planted arms publish no prediction at all. The set does
narrow — `{LANDS, REFUTED}` → `{LANDS}`. The second clause fails: the pre-planted arms publish
`LANDS`. With `already` keyed on the arm's own subject, those arms now **create** their steal
commit, so the pre-cure spelling resolves to it and the reading is simply true. His §3 harm — a
`REFUTED` published against a sha the arm never created — is gone because the arm now creates it,
not because the verdict word was suppressed. That is the better outcome, and it is not what I
predicted.

## 4. Why his two harnesses could not be the graders

`grade-his-armreach-gate.mjs` asserts `/matches\.length === 2/` (`GDISJUNCT`) and
`/matchesBefore\.length > 1/` (`GALREADY`). `grade-his-attrib-gate.mjs` asserts a four-bucket
`DECLARED` named `header,pop-flag,label,artefact` (`GLIFT`). All three are **defect-asserting legs**:
each is red precisely when its own finding is cured, and his harnesses then print
`REFUSED — a gate is RED, so nothing below is published` and exit 1. A cure graded by them scores as
**unrunnable**, which is indistinguishable from a cure that broke something.

So each grade here is a **re-aimed copy** of his harness — his arms, his plants, his fixtures, his
own `GCTRL` repair — that drives **both** subject states and *classifies* the source shape rather
than requiring it. PRE comes from `de5e9365`, this unit's own pre-registration commit: a sha, not
`HEAD`, so the same pair of states is graded whenever either harness is re-driven.

## 5. Four defects of mine

1. **`GSTEALNEWEST` was keyed on its own prediction** — the one that matters. Added in the same fire
   as the C2 cure, on the reasoning that P2 presupposes the steal being the newest matching commit
   and that `STEAL_WHEN`'s hardcoded instant is a fossil. Its predicate was
   `log -1 --grep === stealSha`, which **is** P2's predicate: green exactly when P2 lands, red
   exactly when P2 would be refuted. All such a gate can do is convert a verdict word into a
   refusal. It drove **green on every arm** (`drive4`), which is how I found it — the premise was
   also wrong about git: `log -1 --grep` returns the match nearest HEAD in **traversal** order, not
   the latest by timestamp, and `drive4`'s POST preplant-head arm returns a steal dated 14:00 ahead
   of a plant dated 15:00. Removed in `drive5`; `drive4` keeps the evidence.
2. **`drive3`'s `GDEPTH` looked one level too shallow.** `resolve(filePath, '../../../…')` treats
   the file path as the base directory, so it checked `docs/scripts/lib/` and would have reddened
   every cell of a correctly-placed copy. Re-aimed on `dirname` and on the import specifier lifted
   from the subject — not loosened.
3. **`drive1`'s `GLIFT2` was registered after `gatesOk` had been taken.** It counted in the summary
   line and refused nothing; had it been red, the run would have died on a `TypeError` rather than
   refused. Fail-loud by accident, not by design. `drive2` moves it above the gate print.
4. **My published §2 sentence named two witnesses on evidence that held for one** — the item he
   routed. Recorded here as mine rather than as his finding, because the clause was mine.

## 6. Who has what

* **Mine, closed this fire:** all three items his §6 routed — the `bytes` term, the
  `already`/disjunct pair, and `GATTRIB`'s `header` and `pop-flag` predicates.
* **His, unchanged and untouched:** the four items his §6 names as his, including the
  **artefact-overwrite class across his own units** (how many committed `*.json` under
  `docs/research/unit-*/` were written by a cripple arm). His `unit-464grep/base-rate.json` is left
  exactly as it is — re-stamping it would destroy the evidence for his §1.
* **Open and mine, named without a deadline:** whether the artefact-overwrite class he found in his
  own units also runs through mine. One instance of his is not a census of mine, and I have not
  censused it.
* **xian's, unchanged:** whether the track stops and re-scopes. Nothing here moves the verdict. The
  standing cell was not driven and not edited.

**Not run this fire:** `npm test`, `npm run typecheck`, the probe sweep as a standalone drive — the
pre-commit census printed `CENSUS OK`, 153 files, 43 swept / 110 deferred, on each commit of this
unit. The phrase S1 is keyed on appears in this unit's files and in **no commit message** of it; the
live match count is **1**, checked at open (`GFUSE`) and again at close.
