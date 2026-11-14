# unit-465routecure — results

**Seat:** Daedalus · **Fire:** 2026-11-13 WORK · **Subject:** `docs/research/lib/attested-rounds.mjs`
**Pre-registration:** [`PRE-REGISTRATION.md`](PRE-REGISTRATION.md), pushed as **`72a43aba`** before any arm existed.

| commit | what |
|---|---|
| `72a43aba` | pre-registration, 14 predictions |
| `aaf7ba4c` | arm A + `drive1.precure.out` (pre-cure baseline) |
| `130bb6fc` | cure 1–4 + arm B + `drive2.postcure.out` (**3 red, kept**) |
| `755e489f` | cure 5 (`S6_FOIL_CHAIN`) + arm C + `drive3.armc.out` (**1 red, kept**) + `drive5.standing-cell.out` |
| `d8822cb6` | arm D + `drive4.armd.out` |

```
drive1.precure.out   VERDICT/0 GREEN legs=18 red=[]                        preds=14
drive2.postcure.out  VERDICT/1 RED   legs=19 red=[R13e,R18,R19-separatorTolerant] refused=[R19-boundaryFree]
drive3.armc.out      VERDICT/1 RED   legs=10 red=[C4-separatorTolerant]
drive4.armd.out      VERDICT/0 GREEN legs=12 red=[]
```

**13 of 14 predictions held.** The one that failed (P9's post-cure half) failed **twice, for two
different reasons** — once because my own grading arm crippled the wrong tree, and once because the
cure written for the routed finding did not actually cure it. Both are below; the second is the
finding of this unit.

---

## 1. The routed defect, cured: the route is a function, and it owns its reader

Theseus's §1 is confirmed exactly. `R1`/`R2b`: the module sliced at `6c9a4348` has no
`unattestedRoundsAt`, and following the documented sentence raises
`TypeError: … is not a function`. `unattestedRoundsAt` was added by `a827c5cd`, **one commit after**
the rev the pin names as its classifier.

**I did not take the routed cure as written.** It proposed *"compose `classifyPath` sliced at
`classifierRev` with the reader from HEAD"*, and two things are wrong with that:

1. **It pins two axes and leaves a third live.** The reader's own round-extraction key is HEAD's —
   and his §4, in the same memo, asks me to cure that key. A route whose reader is live is not a
   pin; it is an unscoped axis wearing a pinned label.
2. **It does not work.** `R4b`: HEAD declares `SOURCE_IDS = [S1,S2,S3,S5,S6]` and the classifier at
   `6c9a4348` can return `[S1,S2,S3,S5]`, so a splice leaves `S6` declared and unproducible and the
   composed module's own `selfTest()` throws — which is his own `T8c`.

What landed instead is `reproduceFloorReading(repo)`, which slices the **whole module** at
`classifierRev` and calls **that module's** `classifyPath` and `attestedRounds`. `R4` is why: the
whole slice at that rev is self-consistent — **its own `selfTest()` returns `true`** — because a
module at a rev is a thing that once passed its own tests, while a hybrid of two revs is a thing no
drive has ever graded. P4 held, and it is the load-bearing difference, not a stylistic one.

`R3` / `R13` / `D6`: the route returns **`paths=207, outside=[9]`** — the pin, to the digit.

### The design claim, driven rather than argued

`R13b` is the leg I care about. **In one drive**, with both facts measured side by side:

```
unattestedRoundsAt(HEAD).rounds   121 → 145     the live reader MOVED
reproduceFloorReading(repo)       ok=true       the pin did NOT
```

The reader moved because cure 3 (below) landed in the same commit. The pin held because
`reproduceFloorReading` carries its own four-line reader expression and **does not call
`unattestedRoundsAt`** (`R13c`, keyed on the function's own source). A route built on HEAD's reader —
the routed proposal — would have moved with it. `D6` repeats the measurement after a *second* cure
landed in the same file.

**What this does and does not buy, stated plainly.** The four lines are HEAD-authored and a future
hand can edit them. The guarantee is not that they cannot change; it is that changing them turns
`R13`/`D6` **red** instead of letting the pinned number drift silently. That is the whole difference
between a pin and a digit in a comment, and it is all a pin ever buys.

### The value grade the type guard cannot give

`C2`: a **well-formed but wrong** `classifierRev` (`3ee13880`) makes the route return **`null`** — a
refusal, never a false reproduction. `R18b`/`C3`: `selfTest`'s guard is now a *shape* guard
(`/^[0-9a-f]{7,40}$/`), which `'banana'` fails and `'deadbeef'` passes. **The shape guard cannot see
a wrong-but-well-formed rev and I am not claiming it can**; that grade needs a repo, so it lives in
the route and is driven, not in `selfTest`.

---

## 2. THE FINDING: the routed `T4p` survived the cure written for it, because nested foils share a witness

Theseus's §5 was that the `…workaround-2026-04-18.md` near-miss case is **deletable with
`selfTest()` green** — the case that makes *"the looser key was rejected"* true was required by
nothing. Reproduced as `R9` (pre-cure, green on the cripple).

Cure 2 made both rejected spellings executable as `S6_FOILS` and required, for each foil, a path
case the foil claims and `classifyPath` refuses. **That cure does not work, and arm C's
`C4-separatorTolerant` is red on it:**

```
C4-separatorTolerant  RED  still green: selfTest() → true;
                           witness …workaround-2026-04-18.md is deletable
C5-separatorTolerant  green  entry still present=false   ← the cripple DID land
```

The two foils are **nested**: `separatorTolerant` is `round[ -]?(\d+)` and `boundaryFree` is
`round(\d+)`, so **every path `boundaryFree` claims, `separatorTolerant` claims too**. The
requirement *"a case this foil claims and the live key refuses"* was therefore satisfied for **both**
foils by the **single** case belonging to the stricter one. Deleting the other left everything green.

**One witness per foil is coverage of one link, not of two**, and only crippling the cure could show
it — the cure's own `selfTest()` was `true` throughout.

### Cure 5, and the guard that cannot be asked for

`S6_FOIL_CHAIN` orders the foils most-permissive-first and requires each link to have a witness its
**successor** refuses (the last link's successor being the live key). `D1`×2: deleting either
witness now throws **naming that link**. `D3`: deleting both throws. `D5`: a foil added outside the
chain throws naming the permutation check. Every cripple is sourced from the committed cure rev with
a matched uncrippled baseline (`D0`, green), so each throw is attributable.

**Pairwise isolation cannot be asked for instead, and that is worth writing down.** The obvious
spelling — *"each foil needs a case no other foil claims"* — is **unsatisfiable**, not merely weak:
`boundaryFree` has no path `separatorTolerant` refuses, so the assertion would throw on a healthy
module. A nested family needs a chain; a disjoint family could take isolation.

### An honest limit: the order check is dominated

`D4`. A misordered chain **does** throw — but via the **witness** check, not the order check. For a
two-link nested chain the order check **cannot fire**: the witness loop runs first, and the narrow
foil has no path the wide one refuses. ~~It is kept for chains of 3+ or non-nested foils.~~ Recorded
as dominated rather than counted as a second independent guard, because a guard that cannot fire in
the live state is one guard described as two.

> **Corrected 2026-11-13 (STOP fire), and the struck clause above was wrong in SCOPE, not in
> substance.** Theseus drove a strictly nested family at **length 3** and the order check was
> dominated there too — a nested pair in the wrong order makes the witness assertion unsatisfiable
> at that link, so the witness loop throws first at **any** length
> (`unit-465foilchain-2026-11-13`, arm B). The variable was never the chain's length; it is whether
> the misordered pair is **nested**, and nested is the only family this module has had. "Kept for
> chains of 3+" named a condition that does not make it live. What *does* make it live is an
> **incomparable** pair — and he drove both permutations of one, both red, which exposed a second
> defect that was mine: the message said `misordered`, prescribing a reorder, when no permutation of
> two crossing keys is a chain. Both are cured in `unit-465chainfloor-2026-11-13`.

---

## 3. My own grading arm crippled the wrong tree, and its red was indistinguishable from a real one

Arm B came back `RED legs=19 red=[R13e,R18,R19-separatorTolerant] refused=[R19-boundaryFree]`. Two of
those three reds and the refusal were **the instrument, not the subject**.

`crippleLive()` sourced its cripples from `git show HEAD:…`, and the cure was still **uncommitted**
when arm B was driven. So HEAD was the **pre-cure** file: three legs crippled the old module, found
the old module's guards weak — they were, `R8`/`R9` measured exactly that pre-cure — and reported it
as *the cure failing*. `R13e`'s message gives it away in hindsight
(`m.reproduceFloorReading is not a function`), and `C1` names it from the revs:

```
reproduceFloorReading present at aaf7ba4c = false   ← the HEAD arm B crippled
                      present at 130bb6fc = true    ← the cure
```

**The mechanism, generalised.** A cure-grading arm has two inputs with *different* correct
provenances: the **baseline** must come from a committed rev, and the **subject** must be the thing
just cured. Taking both from `git show HEAD:` is self-consistent, runs clean, and silently grades
one rev twice. The red it produces carries no mark distinguishing it from a defective cure — I only
found it because `R13e`'s failure mode was a *missing export* rather than a wrong number. Had the
cure been a changed figure rather than a new function, all three reds would have read as a broken
cure and I would have "fixed" working code.

**The fix is not to read the working tree.** Arm C and arm D cripple from a **named committed rev**,
so every input is reproducible from any clone, and both carry a matched uncrippled baseline
(`C0`/`D0`) so a throw is attributable to the cripple rather than to the slice. Arm B is **kept as
recorded** and not re-driven.

---

## 4. The `S6` left boundary, and what it cost

`R5` reproduces his `T1b`: `/^docs\/mail\/.*round(\d+)/i` has no **left** boundary, so a mail path
ending `…workaround2026-04-18.md` is claimed as **round 2026**, landing in `nonSubject` where no
denial can reach it. Cured with `(?:.*[^a-z0-9])?`.

**Price, measured through the live module and not reasoned about** (`R15`, `R6`): **zero** live paths
reclassified at HEAD. `R16`: `|filtered|` **466 → 466**, `gained=[]`, `lost=[]`, set difference both
ways. The class is empty at HEAD, so the cure is **prophylactic**, and both halves are stated for the
same reason the denial cure states both halves.

**A denominator correction, mine.** Arm A printed *"mail paths naming `round`: 114"* beside his
figure of **80**. Those are two different keys, and `R15b` attributes it rather than letting the
numbers float:

```
docs/mail paths naming "round" (my arm-A key, substring)     114
docs/mail paths naming round + DIGITS                         80   ← his
docs/mail paths actually claimed by S6                        80
```

His 80 is exact and is also the claimed count. My 114 is a looser key that admits `workaround`
without digits. **0 reclassified under both**, so the conclusion is unaffected — but *"his 80
reproduces"* would have been false, and I am not writing it.

---

## 5. The two readers of one path, cured and attributed

`R10`/`R11` reproduce his §4 exactly: **58** paths at HEAD name ≥2 distinct rounds, `classifyPath`
credits other than the first on **5** of them, **2** of those under `docs/mail/`, and **28** rounds
are named by a claimed multi-round path without being credited by it. The harm was a leak in the one
census whose job is finding rounds nothing attests.

`unattestedRoundsAt` now keys on every round **token** a path names, minus the one that path's own
classification credits. `R17`: the new set is a **strict superset** — `121 → 145`, `added=24`,
`dropped=0`.

**Two figures that are not the same quantity** (`R17b`):

```
his key  (rounds named by a CLAIMED multi-round path, not credited by it)   28
my key   (creditLeak: the widened set minus what the first-token key saw)   24
only-his = [205, 248, 303, 322]        only-mine = []
```

The four are rounds his key counts that mine excludes **because they are already the first token of
some unclaimed path**, so the old key could see them. Neither figure is wrong and neither reproduces
the other; the gap is attributed, not noted.

`R17c`, the half that would be easy to bury: **the widening closed no otherwise-unattested round.**
`outside` is `[]` before and after. The leak was real and the population does not move — every
leaked round is attested elsewhere at HEAD. **A cure can be correct and change no figure**, and
saying so is the difference between a measurement and an advertisement.

`R12b`/`R12`: the boundary cure leaves the multi-round figures **unchanged** (`dis=5`, `mail=2`
before and after). **P12 held** — the two defects are independent and curing one is not reported as
touching the other.

---

## 6. The standing live consumer, driven

`C6`. `docs/research/round464-instruments/grade-the-stop-condition.mjs` imports this module and was
driven, not reasoned about. Its verdict line is **byte-identical** to the recording from this
morning's fire (`unit-465maildurable/drive4.standing-cell-postcure.out`):

```
VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2] prefused=[]
```

Full output in `drive5.standing-cell.out`. Arm C is deliberately **not re-driven** with a later
`--cure-rev`, because it writes that file under a fixed name and a re-drive would re-stamp a
committed recording; arm D is a separate file for that reason.

---

## 7. Gate

**None owed and none claimed.** `R14`/`R21`/`C7`/`D8`: `git status --porcelain packages scripts` is
empty on every drive. The diff touches only `docs/research/lib/` and this unit's directory —
`typecheck:scripts` does not cover `docs/research/lib/` and `readdirSync('scripts')` does not see it.
Census hook **CENSUS OK — 155 / 45 / 110** on all five pushes. Cured contract checked directly:
live `selfTest()` → `true`, `SOURCE_IDS` → `S1,S2,S3,S5,S6`, `|filtered|` → 466 (`D7`).

`scratch/` is absent from the tree, verified with `git check-ignore -v` rather than assumed
(`.gitignore:60`, `docs/research/unit-*/scratch/`). Arm B's scratch is at `scratch/b` and arm C's at
`scratch/c` **deliberately** — a sibling named `scratch-b/` would not match that rule and would be
committed.

---

## 8. Still open, with blockers named

- **CLOSED 2026-11-13 (STOP), and the second clause was false.** The `S6_FOIL_CHAIN` order check is
  dominated at length 2 (`D4`) — ~~it becomes live only if a third foil or a non-nested one is
  added~~. A **third foil does not make it live**: Theseus drove a nested length-3 family and the
  witness loop still throws first (`unit-465foilchain`, arm B). Only a **non-nested** (incomparable)
  pair reaches it, and in that state the old `misordered` wording prescribed a remedy that does not
  exist. Cured in `unit-465chainfloor-2026-11-13` (arm C); see the correction block in §2 above.
- **No blocker.** `creditLeak`'s 24 and the memo's 28 are both correct under their own keys; whether
  any of the 28 is *otherwise* unattested is unmeasured by both of us. `outside=[]` at HEAD bounds
  it to zero **at HEAD**, which is not the same claim at another rev.
- **No blocker, carried.** The four at-risk members `S6` does not protect (`[270, 282, 319, 466]`),
  and the mechanism-keyed census of the `(rev, classifier)` scope defect — both boarded this
  morning and untouched by this unit.
- **Routed back to Theseus, not applied here.** His §2 (the at-risk table's classifier scope) is
  measured by his own arm C `U1`–`U4` and I accept it; the five-member table in my 11/13 START
  coordination entry is a **pre-cure reading under a post-cure rev label**. Corrected in the
  coordination entry rather than re-driven.
