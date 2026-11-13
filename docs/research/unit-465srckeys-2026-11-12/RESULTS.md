# unit-465srckeys — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-12 STOP · **Model:** claude-opus-5
**Pre-registration:** `94b17b20`, pushed to `origin/main` before `arm-srckeys.mjs` existed.

```
drive0.standing-cell-precure.out   VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2]
drive1.precure.out                 VERDICT/1 RED legs=10 red=[T2,T4] refused=[T5,T6,T7,T8,T9]
                                              preds=8 refuted=[P2,P3b] prefused=[P4,P5,P6pop,P1inv]
drive2.postcure.out                VERDICT/1 RED legs=11 red=[T2,T4] refused=[]
                                              preds=8 refuted=[P2,P3b,P4,P5]
drive3.standing-cell-postcure.out  VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2]
```

```
APPARATUS: 0 unexplained refusals. drive1's five refusals are the pre-cure arm declining
           the legs that need `classifyPath`, which did not exist yet — the declared shape.
PREDICTIONS: 3 held · 1 held-with-a-named-exception · 4 refuted  (of 8)
```

**The two reds are findings, not failures, and both are left red.** `T2` and `T4` assert things the
pre-registration predicted and the measurement refuted. Re-keying either to its measured value would
turn a refutation into a tautology.

---

## 1. Theseus's §8 blindness is confirmed, and it is total — `T1`, `P1` HELD

Blinding each source pattern in a copy of the module **taken from git at `94b17b20`** (not from the
working tree — this fire cures its own subject) and running that copy's own `selfTest()`:

```
S1 (round dirs)        blinded → green
S2 (roundNNN*.test.ts) blinded → green
S3 (other docs paths)  blinded → green
S4 (commit subjects)   blinded → green
```

**0 of 4 noticed.** His *"a mis-written source regex would be green in all four of my arms"* was
equally true of mine. `T0` establishes that the as-filed `selfTest()` does return `true` on an
unmodified copy, so "green" above means the self-test ran and passed, not that it was never reached.

## 2. Two of the four sources carry no load at all — `T2` RED, `P2` REFUTED

```
S1 blinded → filtered 465 → 465   lost 0    removed=[]
S2 blinded → filtered 465 → 455   lost 10   removed=[465]
S3 blinded → filtered 465 → 465   lost 0    removed=[]
S4 blinded → filtered 465 → 369   lost 96   removed=[]
```

`S1` (round-instrument dirs) and `S3` (other `docs/research/` round paths) are **entirely subsumed
by `S2 ∪ S4`** on today's tree. Every round a round-dir attests is also attested by a test filename
or a commit subject.

**This is why the cure had to be a classifier test and not a figure test.** A mis-written `S1` or
`S3` moves no count, so no number a cell could print would catch it — the only instrument that can
is a case table over paths. That reasoning is now in the module's docblock rather than only here.

**`P2` was refuted in both halves.** I predicted blinding `S2` would cost exactly one member (465)
and the other three more than one. Measured: `S2` costs **ten** —
`[8,26,27,30,37,43,45,46,47,465]` — and `S1`/`S3` cost **zero**. Nine of those ten have no subject
attestation at all; **465 is the one that is also denied by a subject**, which is the mechanism
behind Theseus's §1. His *"one test filename away from zero"* understates the dependency: **ten
rounds rest on test filenames alone.**

## 3. The fifth source is neutral at both revs, so I took it — `T4` RED, `P3b` REFUTED

My pre-registered objection to Theseus's §6 item 1 was mechanical: `S5` moves a round into
`nonSubject`, where the denial filter cannot drop it, so it would buy no member and quietly disarm
the filter. Predicted: at `69cf9167` it takes `removed` from `[465]` to `[]`.

```
S5 @3ee13880 (HEAD):   filtered 465 → 465 · removed [] → []    · added=[] dropped=[]
S5 @69cf9167 (his rev): filtered 464 → 464 · removed [465] → [465] · added=[] dropped=[]
```

**Refuted.** `removed` is `[465]` under both keys at his rev. The reason is the error, and it is a
clean one: **I priced a change at an old rev using a count measured at HEAD.** 465's 38 `unit-*`
dirs are a HEAD figure; at `69cf9167` **no `unit-465*` dir existed yet**, so `S5` credits nothing
there and cannot disarm anything.

The pre-registration committed me in advance: *"If P3's second half is refuted … the honest ruling
becomes 'harmless, so take it', which I will then take."* **Taken.** `S5` is live in
`attestedRounds`, `unitRounds` comes back as its own named set so a cell can print what it
contributed, and `T10` measures the whole content of the change rather than asserting it:

```
T10  docs/research/unit-465attestdenial-2026-11-12/grade-the-denial-rekey.mjs
     five-source → S5/465 · four-source → null/null
```

The weakening mechanism is real even with zero measured effect, and it is declared in the docblock
rather than left for a reader to rediscover.

## 4. I reproduced Theseus's figure under the wrong key, and caught it from the gap — `P3b`, second cause

`P3b` also predicted `filtered 174 → 175`. Measured `464 → 464`. The 175 is **not a population
count**: his `drive1.clean.out:9-11` reads `above 292: 175`, i.e. members **above 292**. I read a
labelled figure out of a memo and wrote a prediction against a quantity it was not keyed on.

The `removed=[465]` half **does** reproduce exactly, at his rev, through an independent reader —
which is what makes the P3b refutation about the subject rather than about my transcription. But the
count half was never his claim, and the pre-registration should have carried `above 292` or not
carried a count at all. *A figure quoted from a memo must be re-derived under the key the memo
printed it with — the memo's own line said so, and I read the number instead of the label.*

## 5. The blind spot hides a member — `P5` REFUTED, and this is the fire's largest finding

`T7` enumerated every path in the tree at `3ee13880` that names a round and is claimed by **no**
source pattern:

```
207 invisible paths · 162 distinct round numbers (min 2, max 463) · outside the population = [9]
```

I predicted the blind spot was non-empty but hid no member. **It hides one: round 9**, attested
solely by `docs/mail/read/daedalus-to-argus-round9.md`, and credited by nothing else.

`S3`'s first-component anchoring is confirmed as the mechanism (`docs/research/round999-notes.md` →
`S3`; `docs/research/notes-2026/round999-notes.md` → **no source**), but the live member is not in
`docs/research/` at all — **it is in `docs/mail/`, which no source pattern reads.**

**Priced, routed, not taken** (now `SOURCE_RECALL_FLOOR` in the module, as a constant a cell can
assert rather than a paragraph a reader must trust):

- a sixth source keyed strictly as `round(\d+)` over `docs/mail/`: **+1 member (9)**, and 9 is far
  below the 292 floor every live consumer counts above, so **no figure anyone prints today moves**;
- keyed loosely as `round[ -]?(\d+)` to reach the hyphenated mail spellings: admits **`round-2026`**
  — a date read as a round. 93 mail paths carry a round-shaped token.

So the loose key is wrong and the strict key buys one member below every live threshold. **Not added
in the fire that found it**, and not because of a blocker: the refutation is the deliverable, and a
population change is worth its own pre-registration.

## 6. The cure is behaviour-preserving, and non-vacuous — `T8`, `T9`, `P6pop` HELD, `P1inv` HELD

```
T8   as-filed 465 vs cured 465 · lost=[] gained=[] · removed [] → []
T9   cured selfTest with S1/S2/S3/S4/S5 blinded: NOTICED, NOTICED, NOTICED, NOTICED, NOTICED
```

`T9` is the leg that makes the cure worth anything: the same five blindings that the as-filed
self-test passed now each throw, naming the failing case. Each cripple is a programmatic
substitution on the **working-tree** source whose anchor is asserted to occur exactly once — a
missed substitution refuses rather than reading as a clean arm.

**`P6`'s second half: held, with my prediction's wording wrong.** I predicted the standing consumer
`round464-instruments/grade-the-stop-condition.mjs` would print **byte-identical** output across the
edit. `diff drive0 drive3` returns **two differing lines, both of them the cell's own clock** —
`CLOCK 2026-11-13T01:23:36.431Z` vs `…01:28:09.949Z`, and the line that prints the clock beside
drive1's. The verdict line is identical (`VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10
refuted=[P7,P2]`). **A cell that prints a wall clock cannot be byte-identical across two drives**;
the prediction should have excluded the lines the cell itself labels clock-dependent. The claim it
was making — the refactor moves nothing — holds.

Its `red=[T2b] refused=[T8]` is the cell's **standing** published state (Theseus's 11/12 §3; and
`unit-464t8-2026-10-29/drive7.clean-final.out:262` for the same reds at 22 legs rather than today's
26). Nothing here causes or cures it. **Its pre-cure baseline was captured in this fire at this rev
rather than taken from the 10/29 recording** — a refactor leg must diff a pre-action baseline, and
the leg count alone (22 → 26) shows why the older recording would not have served.

## 7. `T7`'s synthetic case moved, and the move is recorded rather than silent

The pre-registration named `docs/research/unit-999x/round999-notes.md` as the nested case that
should classify as no-source. **The cure made that false**: `S5` claims every `unit-*` path, so that
spelling now returns `S5/999`. The nested case is `docs/research/notes-2026/round999-notes.md`
instead — a strictly cleaner isolation of `S3`'s anchoring, since no other source claims it. Both
spellings are declared synthetic. `P4` is left **refuted as registered** for the same reason: it
predicted the `unit-465attestdenial` path would classify as no-source, and the fifth source I took
in this same fire is exactly what changed that. *A prediction about a classifier can be refuted by
the cure the same fire applies, and re-keying it would erase the only record that the change had an
effect.*

## 8. `S5`'s live contribution is three round numbers, not two — and his figure is right under his own key

Taking `S5` makes `unitRounds` printable, so it got printed:

```
HEAD: unitRounds = {307, 464, 465}      (3 round numbers)
      92 unit-* dirs    →  307: 2 · 464: 51 · 465: 39
```

Theseus's §2 reads *"unit dirs enumerated there: 83 · round 464: 45 · round 465: 38 · distinct round
numbers attested by the unit-dir naming: 2 → [464,465]"*. **Both are correct, under different keys,
and the difference is the interval.** His 83 is the dirs added *since* `69cf9167`; both
`unit-307c4-*` dirs were added **before** it — `cc41fa53` 2026-10-27 and `6190a0dd` 2026-10-28,
against his rev's 2026-10-29 09:25 — so his enumeration excludes them by construction, not by
oversight.

It matters only for the sentence that leaves the repo: **"83 units of work sit inside 2 round
numbers" is an interval figure; the standing all-dirs-at-HEAD figure is 92 dirs inside 3.** His §7
conclusion is unaffected either way (~1 new round number per six weeks against `N_PROPOSED = 5`),
and this is the figure to quote if the stop condition's unit is actually re-keyed.

## 9. Not claimed

- **No `packages/` or `scripts/` diff.** The subject is `docs/research/lib/attested-rounds.mjs`,
  which `typecheck:scripts` does not cover and `readdirSync('scripts')` does not see, so the probe
  population and census are unchanged and **no gate leg is owed**. The real regression surface is
  the module's consumers, and the standing one is driven before and after (§6).
- **The other consumers were not re-driven**: `unit-464t2-*` and `unit-465attestdenial-*` cells are
  frozen units whose recordings are graded artefacts; re-driving them would re-stamp another seat's
  recording. `unit-464t2-rekey/insert-coord-entry.mjs` is a writer and was not run.
- **The sixth source over `docs/mail/` is not applied** (§5) — priced, declared as
  `SOURCE_RECALL_FLOOR`, needs its own pre-registration.
- **`SUBJECT_ROUND_RE`'s recall over subject prose** is still graded only by the KP/control pair
  plus the two new `SOURCE_CASES.subjects` entries. A systematic census of subject spellings is not
  in this unit, and `ALT_SPELLINGS` remains a declared floor rather than a measured one at HEAD.
- **Theseus's §4 `T3` conjunct is not taken** — he offered it to Argus first and it is a leg in his
  cell; I have not touched it.
- **His §7 (the stop condition's unit) is not ruled on.** That is xian/Janus's, and §2 here adds one
  measured input rather than an answer: the population the condition counts over is 465 members with
  **ten of them resting on test filenames alone**.

Delivery is the wrapper's to log, not mine to assert.
