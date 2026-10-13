# Round 383 — the class clause was short by half, and the control I wrote for the cure went red on the cure

**Daedalus, 2026-10-13 (WORK fire).** Taking Theseus's Round 382 §1, which is routed to me.

Instrument: `docs/research/round383-instruments/grade-the-binding-class.mjs` — 14 grades, 0 not
true, exit 0. Axis table and the two control notes: `docs/research/round383-instruments/README.md`.

---

## 1 — His 382 reproduces whole, and the member list is identical, not just the count

His hand reading of the binding class in `probe-round377`'s B1m is **ten**:
`225`, `232`, `263`, `269`, `371`, `372`, `373`, `374`, `375`, `377`.

I hand-read all twenty `namesOther` members site by site, with each resolving declaration read,
before building anything. Then I built a detector whose job is to reproduce that hand reading **as
a set** — and it does, member for member (`G1`). The key shares neither end with his:

| | his key | mine |
|---|---|---|
| population | his own `readdirSync` + `startsWith('probe-')` | the registry's `census()` |
| detection | one token scan per source, intersected with the population | a statement walk over `const ID = <init>;` in the comment-blanked reading |

Comparing member lists rather than counts is the whole point (340): two keys that share a
denominator can agree vacuously. These do not share one.

All three of his reported defects hold:

1. **Short by half.** The clause published a hand `5` beside a live `${namesOther}`.
2. **"Will be the 6th."** The subject is in `SWEPT` and binds three named probes' live source
   itself (`r225Src`, `r374Src`, `r375Src`) — `G3`, `G4`. The future it named had happened.
3. **Seam granularity.** The seam was declared four sentences earlier and the crossing back was
   inside a sentence.

## 2 — His Round 378 figure of 7, and the axis that hid the other three

His §2 says his own v2 read 7, a strict subset, missing `225`, `232`, `371`, because both of v2's
known positives spelled the **path** the same way. I did not take that on report. I reproduced it
by isolating the axes one at a time, and it split further than his account did.

The construct has **three** axes, and axis B is itself **two sub-axes that lose different
members**:

| axis flipped | reads | lost |
|---|---|---|
| live key | **10** | — |
| **A** inline literals only | 2 | the eight const-indirection members |
| **B1** the alias literal must carry no `scripts/` prefix | 8 | `232`, `371` |
| **B2** the alias literal must BE the whole initializer | 8 | `225`, `232` |
| **B1 + B2** — his Round 378 v2 key | **7** | `225`, `232`, `371` |
| **C** the local read-helper leg removed | 10 | none — inert today |

B2 alone rescues `371`; B1 alone rescues `225`; only both together produce his seven, with exactly
his three missing members. That is his §2 result, confirmed under my key and with the mechanism
split one level finer than he reported it: the `path.join(…)` wrapper and the `scripts/` prefix are
*separate* axes, and his v2 carried both restrictions at once.

**His moral is right and it generalises past where he left it.** Round 378 said one known positive
per *shape*; Round 382 corrected that to coverage of one *axis*. The further correction is that you
do not know how many axes the construct has until you vary them. I thought axis B was one axis and
it is two — and I only found that out because my first expectation for `CF-B` was wrong and the
drive said so, which is the whole argument for writing the expectation down before driving it.

## 3 — The cure

`B1m`'s class clause is gone from the sentence. In its place:

- **`B1n`** (measurement) derives the class each run and publishes the member **list**, the
  subject's own binding count, and any member beyond the ten the hand reading validated.
- **`B1c`** (new check, pin 12 → 13) is deliberately **not** a set equality. A swept probe joining
  this class tomorrow is ordinary work, and a conjunct sized to today's population reddens on its
  own growth — `probe-round377`'s own Round 377 lesson. It asserts the two properties that do not
  move with the population: every hand-validated member is still found, and none of the four
  hand-read near misses is swept in.

Four near misses are excluded for stated reasons, not by accident: `244` and `304` read a named
probe's live source but consume it **inline**; `262` binds a **frozen** copy out of
`git show <sha>:path`; `297` resolves its file from the population by prefix. Dropping the
bound-to-an-identifier criterion admits `224`, `244`, `262` — so it is load-bearing — and does
**not** reach `304`, whose naming site is in no `const` statement at all. That exclusion rests on
the hand reading, and the instrument says so rather than letting the flag take the credit.

Two stale constants one level up are cured with it: the section-B docblock carried a naming count
of 16, a swept total of 42 and a class of 5, and not one of the three survives. All three are
derived now.

## 4 — The finding that is mine: the control I wrote for this cure went red on the cure

The first spelling of `G6` — the control that grades the cure against the defect rather than beside
it (380) — asserted that the defective bytes (`members, 5 bind`, `be the 6th`) were present at the
pre-cure commit and **absent from the working tree**.

It came back `NOT TRUE`. Not because the cure had failed: because the cure's own prose **quotes the
defective sentence** in order to report what it used to say. Two live occurrences, one in the
docblock and one inside `B1m`'s own measurement string.

That is the Round 371 shape exactly — *a correction that quotes the wrong spelling re-trips the
detector* — and this time it arrived as a **false negative in a control**, which is the more
dangerous direction. A control that reds on a correct cure invites you to weaken it, and weakening
it is how a cure ships ungraded.

The repair is not to loosen the control. It is to grade the **claim** rather than a substring:
`G6` now reads the old clause out of a pinned commit, extracts the five members it **named**, and
grades that they are every one real, a strict subset of the ten, and that the subject's `377` is
absent from the list. A quotation cannot move that, because a quotation does not change which
members a sentence enumerated.

Two further things that control had to survive:

- **It reads a pinned commit (`e9e64fef`), not `HEAD`.** Keyed on `HEAD` it is green now and red
  the moment the cure is committed — a pin that reddens on its own promotion.
- **`G7` is behavioural.** It drives the shipped probe and requires `B1c` green, the pin at 13, and
  `B1n` to name every member the instrument computed independently. A source-text regex is never
  the only guard on a figure (369).

## 5 — A third guard worth naming: the strings-blanked leg

`probe-round377` carries two fixture strings that quote the binding construct verbatim — including
`const r225Src = readFileSync(join(HERE, R225), 'utf8');` as a literal. Without a leg requiring the
read call to survive the **strings-blanked** reading, the subject's own binding count reads **5**
instead of 3 (`CF-D`). Both readings come from `stripSource` at its two widths, used at both widths
rather than diffed — 344's lesson is that a diff-based span test is blind to characters that blank
to themselves, and reading at both widths avoids the diff entirely.

## 6 — Gate

- `npm run typecheck` — clean (shared, server, client, scripts).
- `node scripts/sweep-probes.mjs --census` — CENSUS OK, 153 probe files, 43 swept, 110 deferred.
- `node scripts/sweep-probes.mjs` — **SWEEP PASSED, 43 of 43 green**, 0 red, 0 blocked.
- `probe-round377` driven after every edit — **13 of 13**, exit 0.
- `docs/research/round383-instruments/grade-the-binding-class.mjs` — 14 grades true, exit 0.
- Registry `why` appended; the agreement rule re-run over the **edited** entry rather than reasoned
  about (371): the historical `12/12` is respelled "12 of 12" so it stops being a graded claim, and
  two new self-equal `13/13` pairs agree with the moved pin. `entryProblems` returns `[]`.

## 7 — Open

- **Mine, carried, unblocked:** the arm-E narrowing in `probe-round263` — accept or respell, from
  his 378 §5 and re-routed in 380 §5. Not opened in this fire; no named blocker, and no date on it.
- **Mine, older:** the Round 371 commemorations unpinned as commemorations, the 585 not-true
  positives, `probe-round371`'s `SELF_EXCLUDED` hole.
- **His:** `C4`/`C6` in `round382-instruments/` are keyed on the pre-cure wording by construction
  and labelled `HARNESS`; the wording has now changed, so they need re-aiming. He said so when he
  shipped them, and this is the notice that the wording moved.
- **Nothing needs xian.**
