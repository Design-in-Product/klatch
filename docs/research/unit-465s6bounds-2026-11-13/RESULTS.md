# Results — `unit-465s6bounds-2026-11-13`

**Seat:** Theseus, 2026-11-13 START fire. **Subject:** `docs/research/lib/attested-rounds.mjs` at
HEAD (Daedalus's 11/13 cure) and the three claims his memo makes about it.

Pre-registration `c2d9ffe3`, pushed to `origin/main` **before any arm in this unit existed**.
Arm A + drive1 `15be3f48`. Arms B and C + drives `68bb84f9`. Hashes read back off
`git log origin/main --oneline -1` after each push.

```
drive1.out  CRASH — no VERDICT line. TypeError at T8. stderr 403 bytes (the trace).
drive2.out  VERDICT/1 RED   legs=9  red=[T10]  refused=[]  preds=5  refuted=[P8,P10]
drive3.out  VERDICT/0 GREEN legs=4  red=[]     refused=[]  preds=0
```

**Leg polarity:** a leg here is a *prediction*, so `ok` means the prediction held — including the
predictions that a defect is present. It does not mean the subject is healthy. The health checks are
separate legs (`T1a`, `T7b`, `T7c`, `T11`, `T12`), never conjoined with a claim.

## What drive1 is

Arm A's `T8` sliced the module at `classifierRev` and called `unattestedRoundsAt` on it, which is
**what the pin's own docblock instructs a reader to do**. It threw:

```
TypeError: sliced.unattestedRoundsAt is not a function
```

The arm is kept exactly as driven and the crash is kept as the recording, because the crash **is**
the finding. Arm B is additive; neither A's script nor its outputs were edited afterwards.

## F1 (headline) — the pin's reproduction route names a rev at which its reader does not exist

`SOURCE_RECALL_FLOOR.at3ee13880.classifierRev` is `'6c9a4348'`, and the docblock says: *"To
reproduce the reading: slice this module at `classifierRev` and read the tree at `rev`.
`unit-465maildurable`'s arm does exactly that (`T6`, green at 207 / `[9]`)."* Three things measured:

| leg | reading |
|---|---|
| `T8a` | module sliced at `6c9a4348` exports `unattestedRoundsAt`: **false** — the literal route cannot execute |
| `T8b` | **composed** route (classifier spliced from `6c9a4348`, reader from HEAD) over tree@`3ee13880` → **paths=207, outside=[9]**, equal to the pin |
| `T8c` | that composed module's own `selfTest()` **throws**: *"SOURCE_IDS declares S6 but classifyPath cannot return it"* |

`unattestedRoundsAt` was introduced by the **cure commit** (`a827c5cd`), one commit after the rev the
cure pins as its classifier. Verified independently of the arm: `git show
6c9a4348:docs/research/lib/attested-rounds.mjs | grep -E '^export (function|const)'` lists 13
exports and `unattestedRoundsAt` is not among them.

And the cited evidence is a different reader: `arm-maildurable.mjs` `T6` uses a **locally
re-implemented** `unattestedAt(mod, rev)` (line 256) applied to the sliced module's *own pre-cure*
`floor.unattestedRounds` field, not `unattestedRoundsAt`. The figures are right — `T8b` reproduces
207/[9] to the digit — but the route that produced them is not the route the pin documents, and the
documented one raises a `TypeError`.

**The mechanism, which is his own one step further on:** when a cure introduces both a scoping field
and the reader that field scopes **in the same commit**, the scope value necessarily points at a rev
that predates the reader. A pin whose value is a rev is only reproducible if *every* component of the
route exists at that rev — and the component that moved is the one the cure added.

## F2 — the at-risk set is classifier-scoped too, and the gap is exactly the member the change protects

`T10` is drive2's only red. His §2 publishes `T8 at-risk @6c9a4348 = [10, 270, 282, 319, 466]`,
keyed on the tree rev alone. Attributed in arm C rather than noted:

```
U1  at-risk @6c9a4348 · FIVE-source classifier (sliced at 6c9a4348) = [10,270,282,319,466]  his set
U2  at-risk @6c9a4348 · SIX-source classifier (HEAD)                = [270,282,319,466]
U3  the whole gap is [10] — the member his §2 names as the one S6 protects
U4  under HEAD's classifier 10 ∈ mailRounds and ∈ nonSubject, so S6 removes it from at-risk
    by doing exactly what it was taken to do
```

Neither side is arithmetically wrong. `at-risk` is a function of `(tree rev, classifier)` for the
same reason the floor reading is, so the 5-member table is a **pre-cure** reading carrying a
post-cure rev label, and the sentence *"protects ≥1 at-risk member"* is true only against the set
that existed before the protection landed. `T10b`: at HEAD the set is `[270,282,319,466]` — 10 absent,
size 4, which is his claim holding.

**My own `P10` is the refuted one here**, and the refutation is the finding rather than an exception
to it: I pre-registered his figure as a reproduction and then read it with HEAD's classifier over his
tree rev — reaching for a figure pinned on one axis and measuring it on the other, five hours after
writing down that this is the hazard.

## F3 — the strict mail key still reads a word tail; only the separator was excluded

His §4 rejects the loose `round[ -]?(\d+)` because it reads *"the tail of the word workaround"* plus a
year as round 2026, and says the strict key's rejection of that real path is now a test. Measured:

```
T1a  classifyPath('…ssh443-workaround-2026-04-18.md')  → null/null        the near-miss holds
T1b  the same path with the separator removed          → S6 / 2026        (P1 HELD)
T3   driven through the real attestedRounds over a scratch git repo holding exactly that one path:
     2026 ∈ mailRounds, ∈ nonSubject, ∈ filtered · removed=[] · |filtered|=1
T2   live word-tail matches under docs/mail at HEAD: 0 of 80 round-naming mail paths   (P2 HELD)
```

`/^docs\/mail\/.*round(\d+)/i` has **no left boundary**. The separator is what the strict key
excludes, not the word tail — so the stated reason for preferring strict over loose is one character
wide, and the ≥1000 round number the loose key was rejected for admitting is admissible under the
strict one, landing in `nonSubject` where no denial can reach it. **The class is empty at HEAD**, so
this is prophylactic and not a live defect — stated as both halves, because "the cure removes a live
defect" and "the cure removes a defect this key has not met yet" are different claims and only the
second is true.

## F4 — two readers of one path, with different answers, in the same module

`S6`'s `.*` is greedy and crosses `/`, so `classifyPath` credits the **last** `round\d+` in a path;
`unattestedRoundsAt`'s own key is `/round(\d+)/i.exec(p)[1]`, the **first**.

```
T6   tree@HEAD paths naming ≥2 distinct rounds: 58 · classifyPath credits other than the first: 5
T6b  of those, under docs/mail/: 2        (P6b REFUTED — I predicted 0)
T6c  rounds named by a CLAIMED multi-round path and not credited by it: 28
     [163,205,248,270,303,316,322,368, …]
```

The consequence is a blind-spot leak, not a count error: `unattestedRoundsAt` censuses only paths
**no source claims**, so a path claimed for its last round hides every other round it names from the
census that exists to find unattested rounds. 28 distinct round numbers at HEAD are in that position.
Whether any of them is *otherwise* unattested is not measured here and is not claimed.

## F5 — the near-miss case is deletable with `selfTest` green

```
T4p  S6's near-miss CASE line deleted (line 259) → selfTest() true · 12 path cases left, floor is >= 8
```

`must(pathCases.length >= 8)` against 13 cases leaves five deletions of slack, and `covered.has(null)`
is satisfied by the other `null` entries, so the one case that makes §4's *"the rejection is a test"*
true is required by nothing. Arm A's first attempt at this cripple **did not land** — it anchored on
the filename, found the docblock mention first, and deleted that; its own landing check refused to
score rather than reporting a pass (`drive1.out` line 8, `REF T4`). Arm B re-keyed it onto the array
entry form.

## F6 — the second-axis guard guards type, not value

```
T5   classifierRev = 'banana'  → selfTest() true                                   (P5 HELD)
T5b  classifierRev deleted     → THREW "…does not name the classifier rev…"        (P5b HELD)
```

The guard is live, not dead — and what it requires is that *a string is present*. Nothing checks the
rev is a rev, and nothing checks the pinned reading reproduces under it. `T8b` shows a module-level
check is available: compose the classifier at `classifierRev` with the reader and compare to the pin.

## Predictions, as pre-registered

| # | outcome |
|---|---|
| P1 strict key reads a word tail | **HELD** — S6/2026 |
| P2 class empty at HEAD (prophylactic) | **HELD** — 0 of 80 |
| P3 a word tail is denial-proof | **HELD** — driven on a scratch tree |
| P4 near-miss deletable, selfTest green | **HELD** (arm A's cripple refused; arm B's landed) |
| P5 second-axis guard is a typeof | **HELD** |
| P5b the guard is live, not dead | **HELD** |
| P6 two readers of one path disagree | **HELD** — 5 live paths |
| P6b empty under docs/mail | **REFUTED** — 2 |
| P7 `casePathsPresent` undriven in his unit | **REFUTED** — his arm calls it twice |
| P7b the S6 KP path exists | **HELD** (and `T7c`: `casePathsPresent(HEAD)` missing=`[]`) |
| P8 the literal reproduction route runs | **REFUTED** — it crashes; this is F1 |
| P9 his `T11` reproduces (127 / `[]`) | **HELD** — exact |
| P10 his `T8` at-risk set reproduces | **REFUTED** — classifier axis; this is F2 |
| P10b 10 ∉ at-risk at HEAD, size ≤ 4 | **HELD** — `[270,282,319,466]` |

10 held, 4 refuted. Two of the four refutations are the unit's two findings; one (P6b) is a census I
guessed the wrong way on; one (P7) is a claim about his arm that his arm already satisfies — it drives
`casePathsPresent` twice, and `T7c` drives it here too.

## Not claimed

- **No gate leg is owed and none is claimed.** `T12`: `git status --porcelain packages scripts` is
  empty. The new files are under `docs/research/`, which `typecheck:scripts` does not cover and
  `readdirSync('scripts')` does not see, so the probe population is unchanged — the census hook
  printed **CENSUS OK — 155 / 45 / 110** on all three pushes.
- **Nothing is applied to the module.** It is Daedalus's; F1–F6 are routed as mail.
- **No commit subject in this unit names a round number**, because `S4` reads a subject naming a
  round as an attestation of it and this unit measures attestation.
- The scratch repo for `T3` is created under `os.tmpdir()`, outside this worktree, and removed in a
  `finally`.
- Delivery is the wrapper's to log, not mine to assert.

— Theseus
