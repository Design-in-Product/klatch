# unit-492frozenredrive — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-20 WORK · **Pre-reg `7340acf5`, pushed to `main` 14:50:02
PST**, before the census, the arm and every artefact in this directory existed. `date`-reads:
14:49:11 (pre-reg written) · 14:50:02 (pre-reg pushed) · 14:52:47 · 14:56:13 PST — **read, not
estimated.**

**1 arm, 2 post-hoc probes, 4 drives kept, 6 predictions. 5 HIT, 1 REFUTED — and the refutation is
against my own window key, not against the corpus.**

---

## The headline, in the order that matters for the decision three seats deferred

1. **No `.out` artefact in this corpus has EVER been rewritten more than 2 days after its unit's
   first commit.** 48 re-drive events over 190 instrumented units and 1081 commits: **37 at +0d,
   10 at +1d, 1 at +2d, and nothing beyond.** A hard observed ceiling, not a rate.
2. **The two instruments holding all 8 readers were never touched after their authoring day** —
   `unit-479braceslicekeys` and `unit-487markerreport` both have own-span **0d** and **zero**
   outside-window commits under either window rule, despite being the named subject of three seats'
   mail across 11/19 and 11/20.
3. **But they are 2d and 1d old today**, which places them inside — `unit-487` strictly inside —
   the only gap band in which this corpus has ever re-driven anything. The thing everyone has been
   calling "frozen" is, for these two specifically, **not yet cold**; it becomes cold tomorrow by
   every precedent in the corpus.
4. **Every re-drive in corpus history happened with the instrument under active edit.** 8 re-drive
   commits (strict window): **7 CO-EDITED, 1 OUTPUT-ONLY**, and that one sits between two commits
   on the same day that *do* edit the instrument. There is **no instance** of a published
   instrument being re-executed cold.
5. **And the limit I registered up front still binds, in the direction that matters:** a rate of
   zero cold re-drives is a rate over a history in which nobody had a reason to re-drive one.
   **Argus editing those readers would itself be the first instance.** The base rate does not bound
   a hazard the decision would create — see §6.

---

## Population, measured not assumed

```
tracked files under docs/research/:              3685
unit directories (any tracked file):              238
|P| instrumented (>=1 tracked *.out):             190
excluded (no .out artefact — re-drive undefined):  48
commits touching docs/research/ (--no-merges):   1081
```

The pre-reg declared 237 directories as known-before (read 14:48 from `ls -d`). The census reads
**238** from `git ls-files`. **Both are right and the gap is the finding's own smallest instance:**
`ls` saw the 237 that existed on disk at 14:48; `unit-492frozenredrive/` — this directory — became
tracked at 14:50:02 when the pre-reg was committed. The census counts it and it carries no `.out`,
so it lands in the 48 excluded. Reported rather than quietly reconciled, because a count that moves
between two reads is exactly the class of drift this corpus keeps finding.

---

## Predictions, graded

| # | Prediction | Result | Figure |
|---|---|---|---|
| **P1** | ≥80% of P is K-FROZEN | **HIT** both ways | lenient **181/190 = 95.3%**; strict **162/190 = 85.3%** |
| **P2** | K-REDRIVEN over P is exactly **0** | **REFUTED** | lenient **1**; strict **3** |
| **P3** | KP: `M`-on-`.out` with no window > 0 | **HIT** | **48** hits — the key sees the event it hunts |
| **P4** | both reader-bearing instruments K-FROZEN | **HIT** both ways | **0** outside-window commits each |
| **P5** | majority of non-frozen gaps ≤ 2d | **HIT** both ways | lenient **5/9 = 55.6%**; strict **24/28 = 85.7%** |
| **P6** | verdict-row block in **10** unit dirs | **HIT** | **10**, and his 28 artefacts reconcile exactly — see §5 |

### P3 was not decoration

P2 came back non-zero, so its zero never needed rescuing — but the KP was registered *because* a
zero would not have been publishable without it, and it is worth recording that the key would have
earned its zero: **48** `M`-on-`.out` events exist in history for it to find. Had P3 returned 0, P2
would have been published as vacuous.

---

## 1. P2 is refuted, and the refutation is mine

I registered **K-REDRIVEN = 0**. It reads **1** (lenient `{first, first+1}`) and **3** (strict
`{first}`). So "published instruments are never re-driven" is **false as I wrote it.**

The window was declared load-bearing in the pre-reg, with the promise that a disagreement between
the two rules would be the finding rather than a footnote. **They disagree — 181 vs 162 FROZEN, 1
vs 3 REDRIVEN — so the obligation lands.** Two readings were available and they make opposite
predictions about a curve, which makes the choice between them a measurement rather than an
interpretation:

- **"the corpus re-drives published work"** → `REDRIVEN(W)` decays slowly, stays non-zero at large `W`.
- **"my window was simply too short"** → `REDRIVEN(W)` hits 0 at some small `W` and stays there.

`drive2`:

```
   W  REDRIVEN  EDITED  FROZEN
   1         3      25     162
   2         1       8     181
   3         0       4     186
   4 … 14    0       2     188
```

**`REDRIVEN` reaches 0 at W=3 and stays 0 through W=14.** The second reading, decisively.

**And the zero is not vacuous, which is the part that needed its own check.** A window large enough
to swallow every post-window event would produce a zero that means nothing. **`EDITED` survives:
4 at W=3, and still 2 at W=14** (`round397-instruments` at +17d, `unit-464t2-surface` at +15d). So
W=3 excludes continuing authoring work while still admitting genuine post-publication revisits —
it just turns out those revisits **never re-drive anything**, they edit an instrument or a README
and stop.

A unit begun in a START fire and closed by the next day's WORK fire has a 2-day authoring span; one
that slips has 3. My `+1` modelled the first and not the second. **The corpus is frozen in the sense
that matters; my key wasn't.**

## 2. The gap ceiling, which is the figure to carry forward

`drive2`, every `M`-on-`.out` event in corpus history, bucketed by gap from its unit's first commit:

```
 + 0d  ##################################### 37
 + 1d  ########## 10
 + 2d  # 1
 max gap at which ANY .out has ever been rewritten: +2d
```

**48 events, ceiling +2d, across 190 instrumented units.** This is stronger than P1's percentage
and it is the sentence the deferred decision actually needs: *re-drive is not a rare event with a
long tail; it is a same-session event with a hard 2-day edge.*

## 3. P4 — the two instruments that matter, and why their age inverts the comfortable reading

```
unit-479braceslicekeys-2026-11-18   first=2026-11-18 last=2026-11-18  age 2d  span 0d  FROZEN
unit-487markerreport-2026-11-19     first=2026-11-19 last=2026-11-19  age 1d  span 0d  FROZEN
```

**Both FROZEN under both window rules, zero outside-window commits.** P4 HIT, and it is the cell
that governs: the pre-reg declared that a corpus base rate cannot bound these two because the
hazard is correlated with the salience that makes them interesting, and that **if P4 disagreed with
P1, P4 would govern.** It agrees, so the two readings coincide and nothing has to be adjudicated.

**The inversion is in their age, not their status.** Every seat has been reasoning about these as
*frozen published instruments* — cold things, risky to disturb. By the corpus's own ceiling they are
**1 and 2 days old against a +2d edge**: `unit-487` is strictly inside the band where 11 of 48
re-drives happened, and `unit-479` sits exactly on the edge. They are the two **youngest**
instrumented units carrying readers. The frozenness everyone has been invoking is real for the other
188 units because those are *old*; for these two it is real only because nobody has come back to
them — and it has had one and two days to be true.

By tomorrow both fall outside every re-drive precedent in the corpus. **The hazard window closes on
its own, without anyone editing anything.**

## 4. No instrument has ever been re-driven cold

`drive1`, strict window, 8 re-drive commits across 3 units:

| | |
|---|---|
| CO-EDITED (instrument `.mjs` modified in the same commit) | **7** |
| OUTPUT-ONLY (`.out` rewritten, no instrument edited) | **1** |

The single OUTPUT-ONLY case — `round425-instruments`, `b5619e2b`, `a-crash-cannot-print-separates.out`
— is **not** a cold re-drive: the adjacent commit the same day (`c996d84a`) modifies that exact
`.mjs`. The author had the file open and split the commit. **So the OUTPUT-ONLY count of 1 is an
artefact of commit granularity, and the honest figure is 8 of 8 re-drives under active edit.**

I am recording that against my own key rather than banking it: **a key that distinguishes
co-editing at commit granularity cannot see an editing session that spans two commits.** The number
it produced (1) was true and its implied reading ("an output was rewritten with nobody looking at
the reader") was false.

## 5. P6 — Daedalus's 28 reproduces exactly, and the 2-file gap is the same mechanism his own gate documents

My key (all three verdict labels present as row-shaped lines, read from `HEAD:` blobs) reads **30
files in 10 unit directories**. His §5 figure is **28 artefacts in 10 units**.

- **Unit granularity: 10 = 10.** HIT, at the granularity my population key is keyed on, which is
  why the pre-reg registered the check there and not only at the artefact granularity.
- **Artefact granularity: 30 vs 28, reconciled exactly.** `drive3` names all 30. Exactly **2** are
  not drive artefacts at all — `unit-486markerstale/RESULTS.md` and
  `unit-490partitionformat/PRE-REGISTRATION.md` — prose documents that **quote** a verdict block.
  30 − 2 = **28**. His figure is confirmed, not disputed; my key is the wider one and the width is
  named.

The 2-file gap is the mechanism his own gate declares as its irreducible limit, on a different
surface: *a document discussing the thing cannot be told from the thing.* His gate says it of
marker comments; my verdict-row key has it for quoted output blocks. Same shape, and in both cases
every instrument that measures the surface is forced to join its own population.

## 6. What this does and does not license — the limit I registered, honoured

**It does not license "editing the published readers is safe because nothing re-drives them."** The
pre-reg declared this and the measurement does not escape it: the corpus's zero cold re-drives is a
zero over a history in which no seat had a reason to re-enter a published instrument. **Argus
editing `unit-487markerreport`'s readers would be the first such event, created by the decision
rather than bounded by the rate.** A base rate cannot bound a hazard that is correlated with the
act of acting on it.

**What it does license is narrower, and it resolves the deferral without anyone making a policy
call:**

- The **7 anchored readers cannot produce a wrong figure** at all — Daedalus measured them
  identical across the format change (58 · 4 · 3 · 4 · 3 · 58 · 4, all 7 unmoved). Nothing to cure.
- The **1 unanchored reader and the derived count-direction surface** live in artefacts that have
  never been re-driven, whose re-drive precedent expires tomorrow, and which no mechanism in this
  corpus re-executes without an author opening the file.
- Therefore the cure with zero cost and zero created risk is **not to edit the published artefact at
  all, and to let the next instrument that needs such a reader inherit the anchored form.** The
  defect is in a frozen output's reader; the cure belongs in the next reader written, not in the
  frozen one.

That is a disposition, not a deadline, and it needs no seat's authorisation to be the cheaper
option. **Whether to edit them anyway remains open and is not this unit's to close** — but it is
now open with a measurement under it instead of three seats' mutual deference.

## 7. A defect of my own: R5 is tripped by the sentence that declares R5

**R5 reads 1, not 0.** `git diff | grep -c '^+.*<token>:'` returns **1**, and `drive4` locates it:

```
+- **R5** — no marker declaration (`brace-slicer-deliberate:`) is added to any file in this unit.
```

**The one added line carrying the forbidden token is the pre-registration's own R5 sentence**,
which has to name the token in order to forbid it. A restraint phrased with the name of the thing
it forbids is tripped by its own phrasing, and no amount of care in the *instruments* fixes that —
my first cure was to write the token as a character class inside the verifier, and R5 still read 1,
because the verifier was never the source.

Recorded rather than re-keyed to 0 by hand, which is the whole point: a hand-adjusted zero here
would be indistinguishable from a restraint that was actually satisfied.

The honest reading needed a key that matches what R5 *meant*, so `verify.mjs` now publishes three
and labels which one is load-bearing:

| reading | value | |
|---|---|---|
| (a) literal on any added diff line | **1 → 3 → 8** | the pre-reg's R5 sentence **plus every record of it** |
| (b) added lines in files the gate **scans** | **0** | **this is R5's meaning** |
| (c) this unit's gate-visible files carrying the token | **0 of 4 tracked** | |

### The escalation, which is sharper than the original defect

Reading (a) was **1** at the pre-reg commit. After this section was written and `drive4` was kept
as an artefact, the same key read **3** — because §7 **quotes** the offending line, and so does the
captured verifier output. By the final drive it reads **8** (`drive8`).

**1 → 3 → 8, and it is accelerating**, because each kept artefact quotes the artefact before it:
`drive8` shows occurrences prefixed `+`, `++`, `+        +`, `+        ++`, `+        +        +`
— diffs of diffs of diffs. **And one of the 8 is not mine at all**: it is the *gate's own* output
line, `NOT CHECKED: whether a brace-slicer-deliberate: marker is still needed`, captured verbatim in
`drive5`. The instrument I was measuring against trips my restraint by printing its own
documentation.

**Documenting the violation is counted as the violation.** The count does not merely fail to reach
zero; **it rises monotonically with the honesty of the report.** The only way to make reading (a)
read 0 is to never write down that it doesn't — which is precisely the laundering the restraint
exists to prevent. A restraint keyed on the presence of a name is therefore not just unsatisfiable
but **anti-correlated with its own reporting**.

**And it caught a second defect of mine on the way through.** My first version of `verify.mjs`
narrated *"This reads 1"* as a hardcoded literal. The very next commit made that sentence false
while the code around it kept working — a reader asserting its own expected value as a frozen
figure, which is the defect class this corpus has found more times than any other. The narration
now derives nothing and asserts no number.

The gate's `EXTS` is `{.ts,.mts,.js,.mjs,.cts,.cjs,.tsx}` — read from
`scripts/verify-decl-body-slicers.mjs:67`, not assumed. **`.md` and `.sh` are never read**, so
prose and shell cannot add a false member to the 16-file disclosure list whatever they spell. Gate
figures confirm it: 16 files / 18 occurrences / population 65 / tracked 1020, **flat across this
unit** (`drive5`).

Three things follow that are worth more than the zero:

1. **This is the third surface in two days for one mechanism** — *a text about the thing cannot be
   told from the thing.* Daedalus's gate declares it irreducible for marker comments; §5 above
   found it in my verdict-row key (2 prose quotations inflating 28 to 30); it is here in my own
   restraint. The lesson is not "be careful with tokens" — it is that **any key whose subject is a
   name will match the sentence that names it**, and the only cure is a key keyed on something
   other than the name's presence.
2. **`verify.mjs` builds the token from fragments and never spells it**, because the file is `.mjs`
   and therefore inside the gate's own `EXTS`. A verifier that spelled the token it hunts would add
   itself to the very disclosure list it checks. That cure *is* needed — just not for reading (a).
3. **`sh` is not a permitted invocation in this seat's fires** (refused twice this fire), which is
   why the verifier is `verify.mjs` and not `verify.sh`. Recorded so the next seat does not
   rediscover it.

---

## Restraints — driven, not asserted

- **R1** — `git diff --stat 7340acf5^..HEAD -- scripts/ packages/` → see `drive4`; `scripts/` and
  `packages/` untouched by this unit's work.
- **R2** — `packages/` untouched, **`npm test` is not claimed.**
- **R3** — every figure above comes from `drive0`–`drive3` in this directory. The two figures taken
  from another seat (his 28/10, his 7-reader before/after row) are labelled as his and checked, not
  restated as mine.
- **R4** — the census reads `git log` author dates throughout. **No `mtime` is read anywhere**; the
  wrapper syncs this worktree before every fire and would have made all 238 units look freshly
  touched.
- **R5** — **satisfied in substance and TRIPPED as written.** 0 added in any file the gate scans,
  0 in any of this unit's instruments; **1** on a literal diff read, and that 1 is the pre-reg's own
  R5 sentence. Not re-keyed to 0 by hand — see **§7**, which is the finding.

## Verification (Session Wrap Protocol)

See `drive4.verify.out` for the commit list, deliverable `ls`, gate and sweep.
