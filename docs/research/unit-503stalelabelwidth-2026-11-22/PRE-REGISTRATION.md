# unit-503stalelabelwidth — PRE-REGISTRATION

**Seat:** Theseus (manual testing & exploration)
**Fire:** 2026-11-22 WORK
**Written and pushed:** 2026-11-22, `date`-read `2026-11-22T14:52:11-0800`, **before any arm,
synthetic repo, plant, cripple, capture or post-hoc existed.** The one thing that ran before this
file is `probe-baseline.mjs`, a read-only drive of the real gate recorded in §0 — so that every
figure registered below is one this seat measured, not one carried forward from a memo. That
ordering is deliberate and is itself a response to the lesson that bit both seats today.

---

## 0. Baseline, measured by this seat at pre-registration time

`node docs/research/unit-503stalelabelwidth-2026-11-22/probe-baseline.mjs`, `spawnSync`, both
streams captured separately:

```
rc 0   stdout 4230 B / 42 lines   sha e3e7252d2a37fc6c91cf4f17a18733b1feadef757e819d3c960645afd9b5e8ee
       stderr 0 B
       tracked files read: 1058   population: 65   baseline entries: 58   quoted-only: 3
```

**Daedalus's §1 figure reproduces under this seat's own fresh drive: `4230 B / 42 lines` at read
1058.** His `4160 / 41` at `1054`, published four hours earlier, is dead. One correction in passing:
his §1 says he registered `quoted-only 2` with the file already on disk — the live figure is **3**.

## 1. The subject: his §7, which is a question I can measure instead of answer

`unit-502streampin` §7 leaves exactly one thing open and hands it to this seat: *"Whether the two
new byte LAWS belong in a docblock at all. They are functions of the **defects** rather than of the
tree, and they were graded out of sample, which is the argument for keeping them… Your word, or
mine next fire."*

The clause doing the work is **"functions of the defects rather than of the tree."** That is not a
preference, it is a property, and it is separately true or false of each of the two laws. The laws
as landed:

```
  NEWONES LIMB   bytes = 658 + SUM(len(path_i) + 7)      lines = 7 + N
  STALE LIMB     bytes = 227 + SUM(len(path_i) + 25)     lines = 4 + N     (all ABSENT)
```

Read off the branch literals at `scripts/verify-decl-body-slicers.mjs` L812-813 and L824-830:

- the newOnes per-entry line is `emitErr(\`      ${f}\`)` — six spaces, the path, a newline. **No
  interpolation but the path.**
- the stale per-entry line is `emitErr(\`      ${f}  → now \\\`${verdicts.get(f) ?? 'ABSENT'}\\\`\`)`
  — six spaces, the path, two spaces, `→` (3 bytes, U+2192), ` now \``, **a label read out of the
  `verdicts` map**, a backtick, a newline.

`verdicts` is built by **reading the tree** (L365-376). `stale = baseline.filter((f) =>
verdicts.get(f) !== 'UNGUARDED')` (L385), so the reachable renderings of that label are exactly
`MARKED` (6 chars), `GUARDED` (7 chars), and `undefined → 'ABSENT'` (6 chars). **The stale law's
per-entry constant is therefore a function of a tree-derived label whose width varies, and `+25` is
a snapshot taken at the 6-character ones.**

And the rendering it is one byte wrong about is the one the gate's own comment at L826-828 names as
the real-world case: *"an entry that still exists renders `→ now \`GUARDED\``"*. His §4's own
declared limit says the same thing from the other side — the empty-population trick he used to reach
the limb makes **every** entry `ABSENT`, so `GUARDED` is the cell his derivation could not see.

**This unit measures that, in three cells, with the two controls that make the third mean anything.**

## 2. Predictions — 7, registered as 24 assertions

Each carries its own failure direction. Nothing below is re-keyed after the fact; a refutation is
recorded as a refutation.

### P1 — READER. The per-entry cost is `19 + len(path) + len(label)`, derived not fitted

A reader (`derive-stale-entry-cost.mjs`) slices the L830 statement by anchoring on its own text,
evaluates it with `f` and the label bound, and byte-lengths it. The gate never executes.

- **P1.a** the derived per-entry cost is exactly `19 + len(path) + len(label)`
- **P1.b** → `ABSENT` and `MARKED` both give `len(path) + 25`, agreeing with his published law
- **P1.c** → `GUARDED` gives `len(path) + 26`, **one byte more than his published law**
- **P1.d** the `19` decomposes as `6 + 2 + 3 + 5 + 1 + 1 + 1` (indent, gap, U+2192 at 3 bytes,
  `" now "`, backtick, backtick, newline) — stated so a miss localises

*Fails if* the derived cost is anything but `19 + len + len(label)`, or if the three labels are not
the reachable set.

### P2 — DRIVE, the GUARDED cell. Zero prior captures by anyone

A byte-identical copy of the gate (`sha256` asserted equal before every drive) in a **self-contained
git repo** under this unit's ignored `scratch/`, holding one tracked file that is a population member
and `GUARDED` (brace + paren + colon comparisons, no marker), with the copy's own baseline naming it.
`git -C <syn> ls-files` is then non-empty, the population is 1, and the entry is `stale` because
`GUARDED ≠ UNGUARDED`.

- **P2.a** rc = 1
- **P2.b** stderr bytes = `227 + L + 26`, where `L` is the asserted path length
- **P2.c** stderr lines = `4 + 1 = 5`
- **P2.d** the newOnes block is **absent** from stderr (`newOnes` is empty: the member is GUARDED)
- **P2.e** the entry renders the literal token `GUARDED`

*Fails if* the measured bytes equal `227 + L + 25` — which would refute P1.c and hand his law back
intact.

### P3 — DRIVE, the ABSENT control, same harness, same path length

Same synthetic repo, the fixture removed from **its** index only (so `ls-files` is empty, population
0, the baseline entry renders `ABSENT`), path length unchanged.

- **P3.a** rc = 1
- **P3.b** stderr bytes = `227 + L + 25` — **his law exact**
- **P3.c** stderr lines = 5
- **P3.d** cross-check against his own out-of-sample B1 (`1 entry @ 40 → 292 B / 5 L`):
  `227 + 40 + 25 = 292`, so the same formula reproduces a figure measured by the other seat in
  another harness

**P3 is why P2 means anything.** On its own, a P2 departure is indistinguishable from *this seat's
synthetic harness differs from the real gate somewhere else*. P3 pins the harness to his law in the
cell he measured, so a P2 departure can only come from the label.

### P4 — DRIVE, the MARKED control. The mechanism is label WIDTH, not label presence

Same repo, same path length, the fixture given a **declared** marker in a comment →
`declaredMarkerCount > 0` → verdict `MARKED` → still `stale`.

- **P4.a** rc = 1
- **P4.b** stderr bytes = `227 + L + 25` — his law exact, with a **present** label
- **P4.c** stderr lines = 5
- **P4.d** the entry renders the literal token `MARKED`

Without P4, P2 is consistent with *the law is right when no label is printed and wrong when one is*.
`MARKED` is a printed label the same width as `ABSENT`, so P4 forces the reading to **width**.

### P5 — DRIVE, the real gate. Is the newOnes constant tree-invariant in fact?

His argument for keeping the laws is that they are functions of the defect. The newOnes law is the
half this seat expects to survive, and it is testable across today's tree change: this morning's
`unit-501` d1 measured **722 B / 8 lines** for one plant at a path of length 57 at `read 1054`. The
tree is now at `read 1058`, four files larger, and the stdout figure has moved 4160 → 4230 in between.

One index-added plant (`git add --intent-to-add`, removed in a `finally` with the index entry reset),
at a path this unit asserts is **exactly 57** characters:

- **P5.a** rc = 1
- **P5.b** stderr bytes = **722**, byte-identical to this morning's capture at a different tree
- **P5.c** stderr lines = **8**
- **P5.d** stderr sha256 **differs** from this morning's d1 (the path spelling differs), so this is
  a count agreement, not a byte agreement — registered explicitly, because the mistake this unit
  exists to talk about is conflating those two

*Fails if* the newOnes stderr moves with the tree at all. If it does, **neither** law belongs in the
docblock and my answer to his §7 is a flat no.

### P6 — DRIVE, the real gate. The declared `N ≤ 9` limit's reach, exactly

His docblock declares both laws valid for `N ≤ 9` because the header interpolates the count. A
declared limit states a count and implies a reach; this grades the **magnitude** of the implied reach.

Ten plants, each at a path length this unit asserts is **exactly 56**:

- **P6.a** rc = 1
- **P6.b** the law predicts `658 + 10 × (56 + 7) = 1288`; measured is **1289**, exactly `+1`
- **P6.c** stderr lines = exactly `7 + 10 = 17` — the LINE law has no digit dependence and so does
  **not** break at N = 10
- **P6.d** at N = 9 (same path lengths) the law is exact: `658 + 9 × 63 = 1225`, measured 1225

*Fails if* the overflow is anything but `+1`, or if the line law breaks too — either would mean the
declared limit understates its own reach.

### P7 — THIS UNIT'S OWN LANDING. The instrument-authored class is escapable by construction

His §1 is that the standing figure moved `+70 B / +1 line` because his derivation script had to
quote the exemption token in order to slice it, so it joined the `quotedOnly` list the report prints
unconditionally — and that this will happen *"the next time either of us writes a reader that quotes
the key."* **This unit is the next one, and it is registering the opposite outcome in advance.**

Every `.mjs` file this unit lands is written so that (a) no contiguous `brace-slicer-deliberate:`
token appears in its source (the marker is assembled by split concatenation, so `MARKER` cannot
match) and (b) no quoted-character comparison appears contiguously in its source (every one is built
with `String.fromCharCode`, so `OPEN_BRACE`/`CLOSE_BRACE` cannot match). Therefore:

- **P7.a** at this unit's close the gate's green stdout is **4230 B / 42 lines**, unchanged
- **P7.b** `population` is **65**, unchanged — no file of mine is admitted
- **P7.c** `quoted-only` is **3**, unchanged — no file of mine joins the printed list
- **P7.d** `tracked files read` is the **only** figure that moves, 1058 → 1058 + K, with no change
  of digit width
- **P7.e** graded on **`sha256`** as well as on `wc -c`, and the registered expectation is that the
  two disagree: **the sha differs from §0's, the byte count does not, and exactly one line differs**
  (the `tracked files read` line). Registering sha *equality* here would be the same conflation this
  unit is about, pointing the other way — P7.d says a figure moves, so the bytes must not be
  identical even though the count is. This is the one cell where same-count/different-bytes is the
  **predicted** outcome rather than the defect.

*Fails if* any figure but `tracked files read` moves. A P7 miss is the more interesting outcome: it
would mean the class really is unavoidable for any instrument that measures this gate, which is the
strong form of his §1 and an argument for a different cure entirely.

## 3. Rules

- **R1 — no tracked published file is modified.** Not the gate, not its baseline, not any `packages/`
  or `scripts/` file. The GUARDED/MARKED/ABSENT cells are reached in a **separate git repo** inside
  this unit's ignored `scratch/`; the real-gate drives use index-only plants reset in a `finally`.
  `git status --porcelain` is asserted empty-of-plants at close.
- **R2 — the copy of the gate is `sha256`-asserted equal to the tracked file before every drive**,
  and `git check-ignore` is asserted on the scratch path rather than assumed.
- **R3 — both streams captured separately on every drive**, `spawnSync`, never `execFileSync`.
- **R4 — no prediction is re-keyed after measurement.** A refutation is recorded as a refutation and
  any post-hoc is labelled as one.
- **R5 — `npm test` is not claimed**: `packages/` is untouched, so there is nothing for it to grade.

## 4. Declared limits, stated before the measurement

- The synthetic repo gives a population of **1**. It grades the stale limb's **stderr**, which is the
  only stream the stale block writes to; it does **not** claim anything about what a one-member
  population does to stdout.
- P2/P3/P4 are driven at **N = 1**. The `SUM` form of the stale law is not re-tested here; his B2
  (`3 entries @ 40,41,42 → 425 B / 7 L`) already covers it at three ABSENT entries, and `227 + 40 +
  41 + 42 + 75 = 425` reproduces it from the formula.
- The **mixed** case — one `GUARDED` and one `ABSENT` entry in the same stale block — is **not**
  driven, so the law's behaviour under a heterogeneous label set is declared unmeasured. The derived
  general form predicts it additively; that is a derivation, not a measurement, and is labelled so.
- P5 agrees on a **count**, not on bytes (P5.d). A count agreement across two trees is weaker
  evidence than it reads as, which is this corpus's own lesson and the reason P5.d is registered.

## 5. What this unit does NOT do

It does not edit his docblock. The pin amendment is his file and his call, and his §2 is right that a
recommendation arriving from a refuted prediction arrives unvalidated by construction. This unit
answers the property question with measurement and routes the derived general form; whether the form
goes into the docblock is still his word or xian's, not something this seat lands unilaterally.
