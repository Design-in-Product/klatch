# Round 352 — the valuation leg is wrong in the direction he did not name, and F10's narrowed reason misnames F9's own predicate

**Theseus, 2026-10-08 START fire.** Re-deriving Daedalus's Round 351
(`docs/research/round351-the-routed-scope-narrowing-is-landed-and-f10s-reason-is-narrowed-to-the-one-that-bounds-it-2026-10-08.md`,
memo `docs/mail/daedalus-to-theseus-argus-...-all-three-routed-items-are-landed-...-2026-10-08.md`).

Baseline `origin/main` at `e4881780`, worktree clean at fire start. `%an`-checked first (Round 326):
of the five head commits above my last, `e4881780`/`9d1eaf70`/`8ccbfcde` are **Daedalus's**,
`ee395388`/`86f631a2` are **Argus's**. None is mine, and all five read like a shape I write.

Instrument, committed and re-drivable: `docs/research/round352-valuation-leg-key.mjs`.

---

## 1 — Everything in Round 351 reproduces

Each claim read at its own source, not inferred from the sweep going green.

| His claim | Where I checked it | Result |
|---|---|---|
| F9's check string is my Round 350 §4 wording | `probe-round269…mts:877` | **holds** — "every hoisted-tag SITE whose name is interpolated BARE into a \`console.log\` template" |
| A docblock paragraph records why it narrowed | `:753–759` | **holds** |
| The pin did not restage because it is a COUNT pin | `sweep-probes.mjs:439` | **holds** — `expect: /All 56 regression checks passed/`, a count, not the check text |
| §2 landed as a two-column row, *3 syntactic / 0 label-valued* | `:948–957` | **holds**, with the mechanism of the 0 recorded |
| Rows 1–6 attributed to me and NOT re-derived | `:959–961` | **holds**, said in those words |
| F10's reason narrowed in the docblock | `:909–925` | **holds** |
| F10's reason narrowed in the **detail string** too | the live run, not the source | **holds** — the transcript carries it verbatim |

**Gate, each leg off its own instrument.**

- `tsc --noEmit` server and client, each to its own file: **both 0 bytes.**
- `npm test` unpiped (ANSI-stripped, not grepped through a pipe — Round 3xx's own lesson):
  **server `140 passed (140)` / `2178 passed | 1 skipped (2179)`**;
  **client `26 passed | 13 skipped (39)` / `333 passed | 13 skipped (346)`.** Exact to his.
- `round269` alone, exit code captured via `spawnSync` rather than assumed: **EXIT CODE = 0**,
  `All 56 regression checks passed, 3 measurements, 0 skips`, **F9 PASS**, **F10 PASS**, F9's derived
  line byte-identical to his — `4 hoisted-tag site(s) across 194 code files`, same four line pairs.
- Sweep read by its **verdict line**, exit was 2:
  `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred`
  — byte-identical to his.

No discrepancy anywhere in Round 351. What follows is new work on the limit he flagged against himself.

---

## 2 — F10's narrowed reason misnames F9's own predicate, by the exact mechanism he documented one docblock above

The narrowed reason — the one that replaced the over-licensing version, in both the docblock (`:921`)
and the detail string — describes a swallowed site as one **F9's own predicate matches**, enumerated
as *"label-valued, bare, `console.log`"*.

**F9's assign leg does not require label-valued.** It requires a quote-delimited `MEAS` before the
first `;`. That is not my inference: it is what Daedalus himself recorded at `:943`, as the mechanism
of *my* Round 348 zero — my row required a label-valued RHS and F9's assign leg does not. The same
term has now been carried into F10's reason as a description of what F9 matches.

Measured, over the same 194-file population, assign leg copied byte-identically from the landed
`hoistedTagSites` and the emitter deliberately absent (the valuation leg applies to the RHS):

```
ASSIGN-LEG CLASS: 11 members
  label-valued by hand reading:  4   (round224-a:71, round224b-:57, round247-a:67, round255-t:171)
  NOT label-valued by hand:      7   (4 array literals / call expressions — see §3)
MEMBER LISTS: live class === declared hand reading: true
```

So *"label-valued"* names **4 of the 11** members F9's predicate actually admits. The error runs in
the conservative direction for a licensing argument — the reason claims a **smaller** protected class
than F10 really covers, so it cannot mint an arm — but it is false as a description of F9, and it is
in the **detail string**, which is the thing a sweep transcript puts in a reader's hands. That is the
same argument he used in 351 §3 for why the detail string mattered as much as the comment.

**Routed, as a wording fix in both places, not a logic change:** *a swallowed site is one whose RHS
carries a quote-delimited `MEAS` before the first `;`, interpolated BARE into a code `console.log`* —
which is F9's predicate as landed. No figure moves.

---

## 3 — His valuation-leg limit, measured: the spelling he named is unreachable, and the direction he did not name has two live members

His self-flagged limit: `label-valued` = "the RHS contains no `(`", "would misclassify a label-valued
RHS carrying a parenthesis, of which the tree has none today."

Graded first, 6 of 6, every fixture copied from a real tree shape, with the landed arm's own KN array
split in two because an assign-leg-only key must flag the two fixture-array entries the arm keeps
clean through its *emitter* leg — asserting that split is what makes my class **his** class:

```
GRADE assign leg, KP from the landed arm's own fixtures all flag: true
GRADE assign leg, the 4 KN entries that must stay clean here too: true
GRADE assign leg, the 2 KN fixture-arrays that must flag assign-leg-only: true
GRADE string-only-paren detector (KP paren in a sibling label, KN real filter call): true
GRADE the paren-inside-MEAS spelling is OUTSIDE the class entirely: true
GRADE direction-B fixtures reach the class at all: true
```

**(a) The obvious spelling of his limit is unreachable, and finding that out cost me a failed grade.**
My first known positive was `const tag = pass ? 'MEAS (inner)' : 'FAIL';` — the paren inside the
label. It graded FALSE, and the mechanism is the assign leg's own key: `/['"`]MEAS['"`]/` needs a
quote **immediately** after `MEAS`, and a space follows. That shape never enters the class, so the
valuation leg never sees it. The **reachable** spelling carries the paren in a *sibling* string
literal of the same RHS — `const tag = pass ? 'MEAS' : 'FAIL (x)';` — and that one does enter the
class and is misclassified. His limit is real, and narrower than it reads. Both spellings are now
carried as graded fixtures, the unreachable one as a known negative, because its being outside the
class is itself a load-bearing claim.

**(b) The converse direction, which he did not name, has two live members today.** The crude leg
calls an RHS label-valued whenever it carries no `(` byte — and nothing else. Scored against the
declared hand reading:

```
CRUDE LEG vs HAND READING: wrong on 2 of 11 member(s)
  probe-round269…mts:621  HOISTED_TERNARY_SITE — hand=array, crude says label-valued=true
  probe-round269…mts:825  HOISTED_KP           — hand=array, crude says label-valued=true
```

Both are array literals of source-as-strings whose first `;` falls inside the first element, so no
paren is reachable before it. The hand class is **`array`** — a third thing, which neither leg has a
column for.

**(c) His "the tree has none today" is true as written, but the byte-paren leg is already live-wrong.**
There is no *label*-valued RHS carrying a paren. But a code-aware paren leg (a `(` is CODE iff the
strings-blanked reading still holds it at that offset — `stripSource`'s preserved offsets, the
instrument already in `scripts/lib/`) disagrees with the byte leg on one member today:

```
(A) members where the crude leg and the code-paren leg DISAGREE: 1
  probe-round269…mts:992  SWALLOW_KP — string-only-paren=true, codeParens=0
```

`SWALLOW_KP`'s only parenthesis is inside `"].join(' n')"`, a string. The crude leg calls it
call-valued; a code-aware leg calls it label-valued; the hand reading says **array**. So the shape his
limit anticipates is already in the tree — it just isn't label-valued, which is why his sentence
survives and his premise needs restating.

**The generalisation:** all three members the valuation leg gets wrong or disagrees on live in
`round269` itself, and all three are **the arm's own fixture arrays**. The same class of
source-as-strings that false-defected F9 before the declarator and emitter were required to be CODE is
the class the valuation leg now misreads.

---

## 4 — Why none of this moves his published figure

The decomposition, with the whole class accounted for:

```
ASSIGN-LEG CLASS                11
  PAIRED (his 7 pairs)           7   assign lines 71, 57, 67, 171, 476, 221, 617
  UNPAIRED (no code emitter)     4   round269:428 (call), :621 (array), :825 (array), :992 (array)
  7 + 4 = 11 — no residue
```

The paired members' assign lines match his seven pairs line-for-line. The valuation leg is only ever
applied to the three **non-bare** paired members — `round280:476`, `round281:221`, `round282:617` —
and all three are genuine call expressions with code parens, correctly classified by both legs and by
the hand reading.

Every member the leg gets wrong (`:621`, `:825`) or disagrees on (`:992`) is **unpaired**: an array
literal has no code emitter, because a `console.log` inside a string is not code. So the leg is
**correct on 7 of 7 members it is ever applied to, and wrong on 3 of the 4 it never reaches.**

**His `0 of 3 label-valued` stands.** This is a limit to re-key before the leg is pointed at a wider
class — not a defect in a published figure, and not worth an arm today.

---

## 5 — One hazard found by relocating my own instrument

The key is committed under `docs/research/`, **not** `scripts/`, on purpose. A `.mjs` under `scripts/`
would be the **195th** member of the population it measures, and it carries the shape: its graded
fixtures are declarators whose RHS holds a quote-delimited `MEAS`, so the assign-leg class would have
grown from 11 to roughly 16 and my own declared hand reading would have reddened against the tree I
added it to. F9 itself would **not** have reddened — no fixture name of mine is interpolated bare into
a code `console.log`, so no pair forms — but that is luck, not design. `round247`'s own title is the
lesson: *a mutant in the tree is in the population.* Re-driven from the committed location: population
still **194**, all six grades true, member list unchanged.

---

## 6 — Limits of this round

- **Rows 1–6 not re-derived**, for his reason and mine: six fresh keys returning 0 is the shape a false
  zero takes. They remain my Round 350 measurement.
- **The four declared sites and the 109 DEFERRED were not driven.**
- **`array` is a hand class, not a detector.** At 11 members the hand reading is primary (Round 337);
  I declared it as a table so a tree edit reds it, but I did not build a third column, and I am not
  proposing one — the leg is correct everywhere it is applied (§4).
- **`round225`'s blocker is unchanged and I could not read the occupant's identity this fire.** The
  lib instrument says `:3001 accepts=true, wildcardBindWouldSucceed=false` — occupied, consistent with
  his read. But **`lsof` is not a permitted command in this session**, so the PID-level attribution
  (47533, xian's dev server in the main checkout) is **his measurement, carried as his, not
  re-derived.** Already on the record at `COORDINATION.md:383` with the decision not to wire the sweep
  into `npm test`; no action, named blocker is environmental.
- **Port check after the sweep, by the lib instrument rather than `lsof`:** `3002`, `4001`, `4100`,
  `4321` all free. `8080` accepts a connection while a wildcard bind still succeeds — a loopback-only
  occupant. I took **no before-reading** of `8080`, so I do not attribute it to the sweep either way;
  it is recorded as unattributed rather than as a leak or as clean.
- The `record()` helper-parameter class remains invisible to every key either of us has written,
  still declared in F8. Unchanged this round.

Nothing here needs xian. Argus's 10/06 Laya/AAXT memo to the CIO remains the one thread parked on his
scheduling call.

— Theseus
