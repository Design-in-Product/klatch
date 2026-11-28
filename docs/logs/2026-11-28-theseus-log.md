---
agent: Theseus (manual testing & exploration — CLI side)
date: 2026-11-28
model: claude-opus-5 (Claude Code 2.1.332)
worktree: /Users/xian/Development/klatch-worktrees/theseus
---

# 2026-11-28 — Theseus session log

## 10:47 — START fire

Session-start protocol: worktree synced to `origin/main` by the wrapper, HEAD `6a1a7d81b7cc`
(Daedalus's 11-28 START wrap). `git status` clean. Clock read from
`TZ=America/Los_Angeles date` → `Sat Nov 28 10:47:14 PST 2026`.

**Mail.** `docs/mail/` holds **169** live memos (counted this session). **ONE** had arrived since my
11-27 STOP fire, and it was read in full before any work:

- `daedalus-to-theseus-argus-cc-…-your-proof-exists-and-it-closes-nothing-…-2026-11-28.md` —
  `unit-533exhaust`, **12 HIT / 2 REFUTED of 14, both refutations his.** He **takes my 11-27 STOP §7
  invitation** and proves totality is a property of the reader: the `cls` chain terminates in a bare
  `else` and all eight bodies assign, so `cls ∈ L` with no throw and no corpus. He then argues my
  second premise **relocates** rather than vanishing — to `L ⊆ CLASSES`, a cross-reader agreement —
  and that the relocation is **cheap**, because `L ⊆ CLASSES` is *"statically decidable per cure at
  no corpus, so your 'needs the 126 to hold still' does not travel with it."* His §9 carries an
  explicit invitation to this seat: *"If you can build a cure that keeps `L ⊆ CLASSES` and still
  moves `S_l`, the relocation is wrong and I want to know inside a fire."*
  **That invitation is this fire's work unit.**

Calliope's 11-26 item-10 memo stays visible and unanswered by design: xian's call and only his.

**Product no-op.** `git diff --stat HEAD -- packages/ scripts/` **EMPTY** at 10:51:52 PST, in the
same command that read HEAD `6a1a7d81b7cc` and the population SHA `6104850593cd` over **7879**
tracked files. Re-asserted inside the arm before any measurement; `git status --porcelain` outside
the unit asserted **0 lines** inside the arm too.

### Unit: `unit-534unsound-2026-11-28`

**Pre-registration pushed before the arm existed.** `788ab4bc` on `origin/main`, clock
**10:51:52 PST**, with `fs.existsSync('…/arm-unsound.mjs')` printing **`false`** in the same command
that read the clock, the SHA and the population digest.

**§1 declared what I had read**, and it mattered twice. I **had** read his `isTotal` source (lines
1–360 of `arm-exhaust.mjs`), so no prediction could claim blindness to his instrument — `P1` is a
prediction about what that source *implies* under his own reader, not about whether I can read an
`occ()` call. I **had** read `captures/PROBE.out` from this unit's own probe, which is why cure `N`
is built on the `PROPERTY` branch rather than guessed at, and `LD1` records that the figure 3 is a
reproduction under a different reader rather than a cold hit. I had opened **no byte** of his three
capture files, which is the only reason `P9` graded at all.

**12 predictions. Graded: 9 HIT / 3 REFUTED. All three refutations mine, two of them about my own
instrument rather than his.** `ARM.err` **0 B**.

**THE ANSWER — HIS CHECK FAILS IN BOTH DIRECTIONS.**

```
  label  chain B  sha           TOTAL  |L|  orphans            extras       |M|  S    p   excl  pre-flight
  PUB    938      7afb92320891  yes    10   []                 []           128  128  0   65    GREEN
  N      979      65731818cdb8  yes    10   []                 []           128  125  3   65    GREEN
  R      945      0f37342a9b41  yes    10   [MAP-EXPR-SEEDED]  [MAP-EXPR]   128  128  0   65    RED
  W      938      7afb92320891  yes    10   []                 []            80   80  0   31    GREEN
```

- **`⟹` fails — the walker is UNSOUND (`P1`/`P2`/`P3`/`P4`/`P5`/`P12` HIT).** `isTotal` accepts a
  branch body on `occ(b.mask, 'cls =') > 0` — containment of a **token**, at any depth, under any
  condition. Cure `N` guards the `PROPERTY` body with *"exactly one dot"*, adds **no literal** so
  `L(N) = L(PUB)`, is **TOTAL by his walker**, clean under **both** his readers, **pre-flight
  GREEN** — and drives to **`|M| 128 · S 125 · p 3`**, `PROPERTY` **12 → 9** with no other class
  moving. His `LD1` calls the walker *sound, not complete*; it is **neither**.
- **His own `C2` is what hid it.** Same branch. `C2` deletes the text `cls =` and reddens; `N` keeps
  it and guards it and passes. **A cripple that removes the token a detector keys on grades the
  token, not the property.** Routed to Argus as a gate-shaped claim, same family as the
  uncrippled-baseline rule Daedalus handed him this morning.
- **`⟸` fails — the check is not necessary either (`P6` HIT).** `p = 0` does not imply
  `L ⊆ CLASSES`: `SET-EXPR`, `MAP-EXPR` and `SET-TAIL-DIRECT` are reached **0** times at every
  published label, so cure `R` renames one out of the ten at **pre-flight RED** with `p_R = 0`,
  `S_R = |M_R| = 128` and a tally **identical to `PUB` on all ten**.
- **Consequence.** The exact carrier is **`L_reached ⊆ CLASSES`**, which **needs the corpus** — so
  the cost he said does not travel, travels. And his **`P13` conclusion is false as stated**: at `N`
  statics is green and the class-sum throw is the **only** thing that catches it.
- **`P7` HIT, declared near-vacuous in advance (`LD3`).** Cure `W` narrows `SIZE_CMP`, leaves the
  chain **byte-identical** to `PUB`, and moves `S` **128 → 80** with `p = 0`. It answers his wording
  and nothing else, because `S_W = |M_W|` still holds. Reported, not banked.

**Method — his own non-retyping discipline pointed at him.** His instrument (`pair`, `shapeAsserts`,
`chainIn`, `parseChain`, `isTotal`, `chainOf`, `extractL`, `diffSets`) **sliced out of
`arm-exhaust.mjs` as source text and evaluated** — 5737 B, sha `5ad083c341b1` — with
`stripSource`/`occ`/`parenSpanEnd`/`braceSpanEnd` passed in. Not one line retyped. `CLASSES` sliced
out of `arm-defaultparam.mjs`. The arm **asserts the body-acceptance test is present verbatim and
exactly once** in the slice before measuring. No arm driven as a child process.

**AGAINST ME, THREE.**

1. **`P9` REFUTED — my absence key read the row, not the field.** I claimed 0 verdict rows in his
   captures name a conditional; measured **3**, and all three are one row in three captures:
   `RED  C3 terminal else -> else if (true)  no terminal bare else`. The `if (true)` is in **his
   cripple's name**. *An absence claim about one field of a row cannot be keyed on the row.* A
   field-level re-key parses 9 verdict rows and returns **0** — **post-hoc, grades nothing**, and
   kept apart from the registered cell rather than re-keyed into a hit.
2. **`P10` REFUTED — one dead cripple and one that read red without running.** `K3` inserts
   `void 0;` before the chain, and `chainIn` only requires the prefix to contain no **brace**, so
   the verdict never moved — **dead**. `K4` renames `cls`, which destroys the `  let cls;` slice
   anchor, so the arm throws in `sliceBetween` **upstream of `isTotal`** — **red by crash**. Two of
   four cripples informative. **And the uncrippled baseline Daedalus made me put in the table is
   what told me which two** — his rule catches a dead *cripple*, not only a dead *detector*, which
   is more than he claimed for it.
3. **`P11` REFUTED — drift at 871, not 870.** The one entrant is **my own `probe-N-choice.mjs`**,
   committed with the pre-registration; tracked **7879 → 7882**. `sites` **128** and `excl` **65**
   both flat — the probe holds no `.size` comparison, so **no graded cell moved**. Fifth unit running
   where the drift-invariant half is exact and only the denominator moves. The miss is specific: I
   read **his** 870 and predicted it forward across **my own** commit.

**Gate:** rc **0** at both pushes, no `--no-verify` anywhere. `population 65 · MARKED 4 / GUARDED 3
/ UNGUARDED 58 · baseline 58` — **flat** at both. `tracked files read` **1137 → 1138**, the growth
being this unit's arm, **not entering the brace-slicer population**.

**Deliverables:** `docs/research/unit-534unsound-2026-11-28/` (`PRE-REGISTRATION.md`, `RESULTS.md`,
`arm-unsound.mjs`, `probe-N-choice.mjs`, `captures/PROBE.out`, `captures/ARM.out`,
`captures/ARM.err`) and the reply memo
`docs/mail/theseus-to-daedalus-argus-cc-…-your-pre-flight-check-is-unsound-and-not-necessary-either-…-2026-11-28.md`.

**Drain:** the one new memo read in full before any work and answered **in-fire**; the invitation it
carried driven to a close and published; the reply pushed to `main` in its own commit so he can see
it without hunting a worktree. **Close-discipline:** his memo and my reply **both stay in
`docs/mail/`** — my §8 carries open asks back to him and to Argus (the one-line walker cure, and a
cripple-table claim with no known detector), so the thread stays visible deliberately. **Nothing
deferred, nothing with a deadline. Three items explicitly named and NOT taken, with the reason said
out loud rather than absorbed:** the one-line `isTotal` cure (his §9 already boarded that reader to
Argus's seat), `DESTRUCTURE-DECL` at an exact price of **4** (third unit named, still no named
blocker), and my boarded `p_BOTH`-only cripple for the
`Σ = (p_DEF + p_GEN) − (p_BOTH + p_PUB)` identity.

### 11:0x — wrap verification (per CLAUDE.md Session Wrap Protocol)

Recorded below, verbatim, after the deliverables were pushed.
