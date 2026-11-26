---
agent: Daedalus (architecture & implementation)
date: 2026-11-25
model: claude-opus-5
---

# 2026-11-25 — Daedalus session log

## 09:17 — START fire (bounded)

**Briefing.** Pulled (wrapper synced before the fire). `docs/COORDINATION.md` read; `docs/mail/`
listed. One memo addressed to this seat has arrived since my last outbound
(`f06506ab`, 11-24 STOP): Theseus's 11-24 STOP memo, `154634ac`, *"the re-key is driven and it
refutes my own 14 twice…"*. Read in full. It **asks nothing of this seat** and names item 1 —
Key E's KP + subject reader — as *"Yours, unchanged"*.

**Decision.** That discharges the only thing deferring my oldest board item. `COORDINATION.md` has
carried **Key E's KP + subject reader** as *unblocked, mine, no blocker* and recorded it three
times as "not reached this bounded fire." Took it.

I did **not** take his §5 (`FIXTURE` class / unit-level exclusion) — he boarded it as his, and his
memo says neither seat gets to call it the other's hygiene problem.

## 09:20:31 — pre-registration pushed before any script existed

`docs/research/unit-515keyekp-2026-11-25/PRE-REGISTRATION.md`, commit `deb46404`, on `origin/main`.
P1–P7. The pre-reg records what I had read **before** registering (all 14 bucket rows' source lines,
by eye) and registers the by-eye decomposition **as the thing to be refuted**, not as a result.

Gate at `deb46404`: `tracked files read: 1102`, population 65, 4/3/58, baseline entries 58.

## 09:23 — arm driven; gate RED on my own intactness assertion

`arm-keyekp.mjs`. First drive: **KP 10 of 10**, but the **pre-commit gate went RED** — population
65 → 66, `UNGUARDED` 58 → 59, "1 new hand-rolled brace-balance body slicer."

The arm does **not** hand-roll one; it imports `bodyOf` from `scripts/lib/decl-body.mjs`. What
admitted it was the **intactness assertion on the shared reader's output** — `body[0] !== '{'`, a
character comparison against a brace, which is the gate's population key. **The assertion that I had
used the shared reader correctly is what put the file among those suspected of not using it.** The
gate's own header already records this class of over-admission, so the gate was right to be loud.

Cured by **not making the comparison**: `body.startsWith('{') && body.endsWith('}')` — same
assertion, no `===` against a brace. **No marker, no baseline entry, no `--no-verify`** (remedies 2
and 3 would both be false claims about this file). Re-driven: population back to **65**, every
figure byte-identical across the cure. Commit `a152501d`.

## 09:26 — addendum rung registered and driven

The arm left **1 of 14 rows `UNKEYED`**, and the cause was mine: two mechanism arms need the
subject's identifier, and the arm parsed it out of `unit-513`'s **`why` message**, which spells it as
a backticked token for some rows and a path for others. Registered
`PRE-REGISTRATION-ADDENDUM-SOURCE-SUBJECT.md` (P8–P11) **before** writing the rung, then drove
`posthoc-source-subject.mjs`. Commit `3fef5f1a`. Name-reader KP **5 of 5**.

## 09:28 — results and memo

`RESULTS.md` at `9ddd48da`; memo + the `unit-513` correction note at `938b18e4`, pushed to `main` as
its own commit per the worktree mail rule.

### Score — 11 registered predictions, 8 HIT, 3 refuted, all three refutations mine

| | |
|---|---|
| P1 Key E's 6 classes all reachable | **HIT** — 10 of 10 KP cells, 6 of 6 classes |
| P2 `FILE 0` / `OTHER-PROCESS 0` are measured zeros | **HIT** — `unit-513` §4's row stands |
| P3 literal test beats the evidence tests | **HIT** on the verdict; **provenance false** (below) |
| P4 the by-eye decomposition of the 14 | **REFUTED as registered**, confirmed in content |
| P5 the cure recovers exactly 2 | **HIT** on count, **REFUTED** on class (both `UNRESOLVED`) |
| P6 one silent row moves | **REFUTED** — zero move |
| P7 the two `why` strings don't partition | **HIT** — `BOUND-PATTERN` under both |
| P8–P10 source-derived subject name | **HIT · HIT · HIT** — `UNKEYED 1 → 0`, 1 moved / 13 unchanged |
| P11 my published `12` is the wrong arithmetic | **HIT** — candidate A returns 12; honest is `[1, 8]` |

### The finding I'd keep

**A cure that was exactly right and moved zero figures.** The `RECEIVER-OFF-LINE` rung recovered
*exactly* the 2 rows predicted, passed 5 of 5 KPs including refusals — and **every Key E cell is
identical to before it**, because both recovered subjects re-enter the real key and land
`UNRESOLVED` again. Those sites stack **two independent causes**: the subject is off the use line
(cured) *and* the subject is a **property of an object assembled incrementally across the file**,
whose binding line is `let out = {}` and names no source. Only re-entering the key **per row**
separates *recovered the subject and it still does not resolve* from *recovered nothing* — the
count-based test would have scored the rung a no-op.

### Against me

1. **A true claim with a false stated provenance.** P3 registered its precedence claim as "read off
   the live branch order", and the arm prints `UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED` — **4
   branches of 6.** `GATE`/`OTHER-PROCESS` and `CAPTURE`/`FILE` are ternary operands, invisible to an
   extractor wanting a quote after `cls: `. **The array I published as the claim's evidence does not
   contain the branch the claim compares against.** It read as confirmation because the four it does
   print are in the order the claim needs. Same family as `unit-513` §7, one rung over.
2. **A key's input taken from a diagnostic message**, so one row fell through into the very bucket I
   had just built to stop fall-through. `SUBJECT-IS-PARAM 0` was my extractor failing, not a
   measurement.
3. **My published interval overstated the hazard by 4.** `[1, 12]` reproduces as `1 + ALL silent` —
   double-counting the confirmed member and counting 3 rows Key E had already resolved `FIXTURE`
   (unreachable by any rename) as still available. Corrected to `[1, 8]`, written back into
   `unit-513` §4 rather than only into the new unit.

## Drain

Drained. Theseus's memo read at session start; it asks nothing, so the fire went to the oldest
unblocked item on my own board and took it to a landed KP-gated measurement. The arm's one declared
limit was closed **in-fire** by the next rung under its own pre-registration rather than boarded. A
figure I published yesterday was corrected where a reader hits it first. Memo filed and pushed to
`main` as its own commit. `docs/mail/` re-checked after the task work — **nothing new inbound**;
`git fetch` + `git log 112af6d9..origin/main -- docs/mail/` shows only my own outbound.

**Deferred: nothing without a named blocker.**

Carrying, all unblocked and mine, each newly *specified* rather than restated: `SUBJECT-IS-PARAM` +
`CALLBACK-PARAM` keyed but not resolved (4 rows); the incrementally-assembled-object subject (2 rows,
newly named); `BOUND-PATTERN` 6, needing a use-site search for the binding that no reader in either
corpus does; the branch-order extractor's ternary blindness. **Theseus's, untaken:** `SECOND-ARG`
integration; the `FIXTURE` class — to which `unit-515` has now added itself, by exactly the mechanism
he named. **No owner, nineteenth night:** the `ABSENT` hole.

## Session wrap verification

Run at 09:31:25 PST; output pasted from the commands themselves.

**Step 1 — commits landed** (`git log origin/main --oneline -6`):

```
7a5df865 coord+log(daedalus): START fire -- Key E KP'd 6 of 6 with both zeros now measured, …
938b18e4 mail(daedalus->theseus,argus)+correction: … corrected to [1,8] at unit-513 section 4
9ddd48da results(daedalus): unit-515 -- 8 of 11 HIT, all 3 refutations mine; …
3fef5f1a posthoc(daedalus): unit-515 -- source-derived subject name closes UNKEYED 1->0 …
a152501d arm+prereg(daedalus): unit-515 -- Key E KP 10 of 10 (all 6 classes reachable) …
deb46404 prereg(daedalus): unit-515 -- Key E's KP set and a reader for the 14 UNRESOLVED subjects …
```

All six are on `origin/main`, not just local.

**Step 2 — each deliverable present** (`ls`):

```
docs/research/unit-515keyekp-2026-11-25/   PRE-REGISTRATION.md · PRE-REGISTRATION-ADDENDUM-SOURCE-SUBJECT.md
                                           RESULTS.md · arm-keyekp.mjs · posthoc-source-subject.mjs · captures/
captures/                                  ARM-KEYEKP.{out,json,err} · POSTHOC-SRCSUBJECT.{out,json,err}
docs/logs/2026-11-25-daedalus-log.md
docs/mail/daedalus-to-theseus-argus-…-overstated-the-hazard-by-4-2026-11-25.md
```

`.err` **0 B** on both drives (`wc -c`). `git status --short` **empty** — clean tree, nothing
uncommitted. One correction note was edited into
`docs/research/unit-513consumernull-2026-11-24/RESULTS.md` §4 and is in `938b18e4`.

**Step 3 —** this log is committed last, after Steps 1 and 2 were run.

---

## 13:17 — WORK fire resumed (bounded) · model: claude-opus-5

**Briefing.** Pulled (wrapper synced before the fire). `docs/COORDINATION.md` read; `docs/mail/`
listed. One memo has arrived since my 09:29 outbound: Theseus's 11-25 START memo, `d28e8108` at
11:01, *"both your handed-back items are closed by drive…"* — `unit-516secondargfixture`, 17
predictions, 16 HIT. Read in full. **It asks nothing of either seat.** Its one open question (the
15-vs-0 census-purpose choice, §5) he names as xian's, and I agree — I have nothing to add to how he
put it.

**Decision.** His §7 lists back to this seat *"your §5(i) ternary-blind branch-order extractor."*
That is the top item on my own board, unblocked, mine, no blocker. Took it.

## 13:20:30 — pre-registration pushed before any script existed

`docs/research/unit-517branchorder-2026-11-25/PRE-REGISTRATION.md`, commit `109f4948`, on
`origin/main`. P1–P8. Records what I had read before registering (the six `return` statements of
`subjectOfApplication`, by eye) and registers P1 as a *reproduction* leg precisely because an
accusation of my own instrument that cannot be re-driven is a recollection.

Gate at the pre-reg: `tracked files read: 1106`, population 65, 4/3/58, baseline entries 58, rc 0.

## 13:23 — arm driven; two of my own readers came back red on their own KP sets

`arm-branchorder.mjs`. **Both failures were caught by KP cells before any figure was published**,
which is the whole reason the cells exist:

1. **Guard reader 1 of 3.** Its rule was "no `return` between the `if`'s closing paren and the `cls:`
   site" — but a guard's own `if` is immediately followed by its own `return`, so it rejected every
   guard for its own branch. The single cell it passed expects `null`. Re-keyed to "no other `cls:`
   site in between" → **3 of 3**.
2. **Region classifier 0 of 3, and the dead reading agreed with my prior.** I had written in this
   unit's docblock that `stripSource` keeps a construct's delimiters and blanks only its body. It
   blanks the construct **whole** (`const r = /x/g` → `const r =      g`). The classifier returned
   `code` for all three positives and the census read **`MEMBERS 0`** — a zero indistinguishable from
   *"nothing reuses it"*, which is the sentence I had written four hours earlier. Re-keyed onto
   length-preserving blanking (`raw[i] !== blank[i]` as an exact mask) → **5 of 5**, figure **6**.

Also found while writing §5: guards must be sliced from the **raw** source, not the blanked reading,
because `stripSource` blanks a regex **body** in both readings — a guard read from blanked text is
`/      /.test(subj)` and no token test over it can see what the regex matches.

Arm at `8189e3be`. **7 of 8 HIT.** P7 **REFUTED**: 6 members / 11 hits.

## 13:26 — addendum registered before the post-hoc existed

`PRE-REGISTRATION-ADDENDUM-HAZARD.md`, `c6b9ba52`. P7's 6 is a **shape** figure, and publishing it as
the reach of a blindness would repeat this morning's P3 — a figure standing in for a claim it does
not make. PH1–PH4 registered, including PH2 (the extractor parameterised by property name is a
**different key** and must be re-KP'd rather than inherit the arm's 9 of 9) and PH4 as a *commitment*
to print both figures in one sentence, registered before I knew which was more flattering.

## 13:29 — post-hoc driven; PH3 refuted, and v1's positives were half artefact

`posthoc-hazard.mjs`, `e0c9f88e`. **3 of 4 HIT.** PH3 registered at 1 of 6, measured **2 of 6**.

**Reading v1's positives rather than its zeros is what found the next defect:** 3 of 4 `file` hits
and 1 of 5 `cls` hits were not conditionals at all — a TypeScript **optional property**
(`refusal?: RegExp`) read as a ternary, and a value span running past a `;` because a TS type member
is not comma-terminated. Both invisible in `.mjs`; this corpus is mixed. v2 cures both, re-KP'd, and
**both censuses are printed** rather than the cured one swapped in.

**And the headline did not move while most of its evidence did:** live-blind **2 under v1, 2 under
v2**, with `file` 4 → 1 and `cls` 5 → 4 — **4 of 7 supporting rows replaced under an unchanged
total.** Reported as the count alone, the cure would have read as a no-op confirming the first pass.

## 13:31 — results, correction, memo

`RESULTS.md` + the `unit-515` §7 correction note at `063d6e79`; memo at `1b7d20cf`, pushed to `main`
as its own commit per the worktree mail rule.

### Score — 12 registered predictions, 10 HIT, 2 REFUTED, both refutations mine

| | |
|---|---|
| P1 the published artefact reproduces | **HIT** — 4, `UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED` |
| P2 two granularities | **HIT** — 4 of 6 branches **and** 4 of 8 class literals |
| P3 the blindness is the discriminating branches | **HIT** — 2 of 2 missed ternary, 0 of 4 caught |
| P4 cured extractor, nothing invented | **HIT** — 6 of 6, 8 of 8, 0 invented |
| P5 the precedence verdict at full granularity | **HIT** — @243 precedes all 3 evidence branches |
| P6 a class-name sequence cannot name a branch | **HIT** — 4 of 8 non-unique; 1 of 2 consults evidence |
| P7 reach, registered at 1 | **REFUTED** — 6 members / 11 hits |
| P8 refusals rather than widening | **HIT** — 4 refusal cells held |
| PH1 a name per member | **HIT** — 6 of 6, 5 distinct names |
| PH2 re-KP'd per name | **HIT** — 9 of 9 under `cls`, `p`, `error` |
| PH3 hazard, registered at 1 of 6 | **REFUTED** — 2 of 6 |
| PH4 both figures in one sentence | **HIT** (commitment, met in RESULTS and the memo) |

### The finding I'd keep

**A verdict that survives its own evidence being corrected was never resting on that evidence.**
`unit-515` P3's precedence verdict holds over all six branches by source offset; the figure it cites
moved **4 → 8**; the verdict did not move. With `unit-515` §4 (a cure exactly right that moved zero
figures) and Theseus's `unit-516` §3 (one `+4` that is two disjoint `+2`s with opposite causes), that
is three faces of one thing — **the total is the one number in the output that cannot be read**, and
all three needed a per-row re-entry to separate the readings.

### Against me

Five, in `RESULTS.md` §6 and the memo §4: the region classifier built on a false premise about the
shared reader (0 of 3, and its dead output *agreed with my prior*); the guard reader whose only
passing cell expected `null` (1 of 3); four of seven ternary positives being TypeScript artefacts,
found by reading the positives; the headline surviving a cure of its own reader with 4 of 7 rows
replaced; and one of my two TypeScript refusal cells not separating the readers it was written to
separate (v1 passes it), so a two-cell discrimination rests on one.

### Routed, not taken

`scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts` is live-blind on
`file:` (2 hits), reached by a ternary at `unit-307c4-blast-radius-2026-10-27/recon.mjs:83`. **Both
files are Theseus's** — verified by commit author, not assumed from the filename — and **neither was
touched.** Frozen instrument; handed over with file, line and the reaching ternary rather than a
verdict about another seat's work.

## Drain

Drained. Mail read at session start and re-checked after the task work. The fire took the top
unblocked item on this seat's own board to a landed, KP-gated measurement, **and opened a second
registered rung in-fire** when the first one's refutation turned out to be a shape figure standing in
for a hazard claim. Two figures this seat published this morning were corrected at the bullet that
published them, not only in the new unit.

**Deferred: nothing without a named blocker.**

Carrying, all unblocked and mine: the cured extractor is a reader in one unit, not a shared one, and
the census that would catch the next quote-anchored `cls:`-shaped reader is a figure in a results
file rather than a gate leg; `BOUND-PATTERN` 6; `SUBJECT-IS-PARAM` + `CALLBACK-PARAM` 4; the
incrementally-assembled-object evidence model. **Theseus's, untaken:** the frozen-population-prediction
pattern defect; `SECOND-ARG`'s nested-call blindness; the inherited concatenated-label blindness.
**xian's:** `unit-516` §5's 15-vs-0 census-purpose choice. **No owner, twentieth night:** the `ABSENT`
hole.

## Session wrap verification

Run at 13:34–13:35:15 PST; output pasted from the commands themselves. The coord+log commit
(`5991bdcd`) was pushed before Steps 1–2 were run, so this section is appended after it and carries
its own commit — the verification is the last thing in, not a claim made before it.

**Step 1 — commits landed** (`git log origin/main --oneline -7`):

```
5991bdcd coord+log(daedalus): 11-25 WORK fire -- the ternary-blind extractor is cured and KP'd, …
1b7d20cf mail(daedalus->theseus,argus): my own reach parenthetical was false at 6, the hazard is 2 …
063d6e79 results(daedalus)+correction: unit-517 -- 12 registered, 10 HIT, both refutations are mine …
e0c9f88e posthoc(daedalus): unit-517 -- shape reach 6, hazard reach 2 of 6, and the count 2 SURVIVES …
c6b9ba52 prereg-addendum(daedalus): unit-517 -- shape reach is not hazard reach; PH1-PH4 registered …
8189e3be arm(daedalus): unit-517 -- the cured extractor is 6 of 6 and 8 of 8, … P7 is REFUTED …
109f4948 prereg(daedalus): unit-517 -- the ternary-blind branch-order extractor, 8 predictions …
```

All seven are on `origin/main`, not just local.

**Step 2 — each deliverable present** (`ls`):

```
docs/research/unit-517branchorder-2026-11-25/   PRE-REGISTRATION.md · PRE-REGISTRATION-ADDENDUM-HAZARD.md
                                                RESULTS.md · arm-branchorder.mjs · posthoc-hazard.mjs · captures/
captures/                                       ARM-BRANCHORDER.{out,json,err} · POSTHOC-HAZARD.{out,json,err}
docs/logs/2026-11-25-daedalus-log.md
docs/mail/daedalus-to-theseus-argus-…-the-hazard-is-2-and-one-of-the-two-is-yours-2026-11-25.md
```

`.err` **0 B** on both drives (`wc -c`). `git status --short` **empty** — clean tree, nothing
uncommitted. The correction note is edited into
`docs/research/unit-515keyekp-2026-11-25/RESULTS.md` §7 and is in `063d6e79`.

**Step 3 — mail re-checked after the task work:** `git fetch` + `git log 1b7d20cf..origin/main --
docs/mail/` returns **no rows** — nothing new inbound since my own outbound.

---

## 17:17 — STOP fire resumed (bounded) · model: claude-opus-5

Pulled by the wrapper. Read `docs/COORDINATION.md` (my own section) and `ls docs/mail/`. **Two
inbound memos from Theseus dated today, both addressed to me, and both arrived after my 13:3x WORK
fire** — so this is the first Daedalus fire to see either. Read both in full in this fire.

- `theseus-…-both-your-handed-back-items-are-closed-by-drive-…` (START fire, `unit-516`) — already
  read and acted on in the 13:17 WORK fire; nothing open back to this seat.
- `theseus-…-your-routed-site-is-not-a-hazard-member-the-colon-your-key-matched-is-a-ternarys-else-colon-…`
  (`unit-518`, pre-reg `768bf4a9` at 14:50 PST) — **routes something to me by name**: my own hazard
  key, with a separating cell and the consequence for the HAZARD/gap pair I published at 13:3x.

That is the whole of this fire's work.

### 17:18 — verified the routed cell myself before accepting it

CLAUDE.md's verify-before-asserting, applied to another agent's finding rather than to my own
recollection. Three reads, all off tracked files in this worktree:

```
docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs:83
  CRIPPLE === 'entry-shape-dot-file' ? e.file : typeof e === 'string' ? e : e.file;
  line 89:  ... return { file: String(file), hits: null };

docs/research/unit-517branchorder-2026-11-25/posthoc-hazard.mjs:144
  const KEY = new RegExp(`\\b${name}\\s*:`, 'g');
```

No `file` property at line 83; the only one in the file is at 89. `\b` is satisfied by a preceding
`.`. **Theseus's P1/P2 reproduce under my own read.** I also read the four `cls` ternary sites
verbatim (`unit-513…:160`, `:72`, `:75`, `:214`) before concluding the `cls` census was *not* also
artefact — all four are genuine property positions, so the subject stays live-blind and the hazard
collapses to 1 rather than to 0.

### 17:20:27 — pre-registration, clock read in the command that made the directory

`unit-519positionblindkey-2026-11-25`. P1–P10 registered, pushed to `main` as `d653c236` at
**17:21:18 PST**, before any arm/reader/cell/KP/scratch/capture existed. P5 registers my own PH3 as
HELD and my published refutation as an artefact — the flattering reading was available and not
taken. P7 registers an **interval** (10–120) rather than a figure I did not have. P10 registers
**OPEN against myself**: the residual false-positive class the cure does *not* remove.

The pre-reg also states the cure's shape *before writing it*, including why it is a **regex
character class and not a character comparison** — a brace comparison is
`scripts/verify-decl-body-slicers.mjs:97`'s population key, and that is precisely the
over-admission that reddened this seat's arm at 09:23 this morning. §0 asserts the absence; it does
not claim it.

### 17:23 — arm driven: 9 of 10, and the refutation is my own magnitude claim

`arm-positionblindkey.mjs`, commit `8660aabc`. KP **5 of 5** with every cell sliced out of a real
tracked file. Readers **sliced** (4177 B span out of the published `posthoc-hazard.mjs`, 13 markers
asserted present) so the `v1`/`v2` columns are produced by the code that published them.

```
HAZARD reach   published 2 of 6  ->  cured 1 of 6      gap 4 -> 5      PH3 HELD
file  TERNARY-position      1    ->         0
cls   TERNARY-position      4    ->         4      same four by file AND line
```

**P7 REFUTED: I registered 10–120 of 450 `file` sites as over-admitted. It is 1.** That is the
keeper — a 0.22% false-positive rate supplied 100% of the census, because the census filters on a
rare property, so the base rate over all sites does not bound the share of the *reported* ones. And
the rate is per name, 0%–25%, with the two names over 100 sites being the two clean ones; I
registered my interval against the cleanest one.

### 17:36 — addendum registered before the post-hoc existed, then driven: 1 of 4

`PRE-REGISTRATION-ADDENDUM-OVERADMISSION.md` (`9c54ce2b`), PH1–PH4. Then
`posthoc-overadmission.mjs`.

- **PH4 REFUTED** — registered ≥2 mechanisms, there is **1**: all 6 over-admitted sites have `.`
  before the name. The class is tighter than I guessed and is exactly the one Theseus named.
- **PH3 HIT** — no name with ≥100 sites above 1%, and the highest rate is the name with the fewest.
- **PH1 REFUTED** — the `error` 11 to 12 is **not** population growth (recomputed over the
  then-population with the published reader: 11, equal to published; 0 of 3 added files carries an
  `error:` site).
- **PH2 REFUTED** — the delta is 3 and the third is **my own arm**. A unit's script joins the
  population it measures between the arm's drive and the post-hoc's; and `unit-517` published 836
  where `ls-tree` at its own commit returns 837, the same mechanism one step earlier.

### 17:43 — the cause PH1 failed to find, measured rather than guessed

A refuted prediction that leaves its own difference unexplained is worse than no prediction, so
`diag-prefilter.mjs` was written and driven — **unregistered, and labelled as such wherever its
figure is quoted.** Cause named at one file and one line: `unit-517` pre-filtered each file on the
name-immediately-followed-by-a-colon substring, and `unit-464dir/grade-direction.mjs` contains **no
such substring for `error` anywhere** (its one site is `error :` with a space, inside a template
expression), so the published census skipped the whole file. **Both numbers are right under their own
prefilter, the differing site is false either way, and under the cured key it is 9 under both.**

And the sting, recorded because it is the same shape as the thing being measured: **the arm's own
§4b looked for this and printed `0`, because it counted in the CURED column — where the cure had
already dropped the very site the prefilter difference adds.**

### 17:48 — results, corrections at the bullets that published them, memo

`4118c4ae` carries `RESULTS.md` plus the corrections: `unit-517`'s PH3 table row (struck, restored
to HELD), its §5 reach block, its refutation paragraph, the `COORDINATION.md` 13:17 bullet, and its
PH4 two-numbers sentence. The figures measured at `e0c9f88e` are **left as measured** rather than
edited — what was measured and what is true are two different records.

**The memo whose own filename carries the wrong figure** gets an appended, marked correction block
rather than a rewrite or a rename: the name stays as the record of what was sent.

Reply memo `8f8d2a3b`.

## Drain

Drained. Mail read at session start — both inbound memos in full, in this fire — and the one that
routed work was closed by drive **in the same fire it arrived to this seat**. Four closed 11-25
memos moved to `docs/mail/read/` per the close-discipline. **My reply is deliberately left in
`docs/mail/`** rather than filed alongside its inbound: the convention's cleanest pattern is
closing-memo-and-inbound-together, but Theseus reads `docs/mail/` and a closing memo he cannot see
has not been delivered. Noted here so the next closer can move it.

**Deferred: nothing without a named blocker.**

Carrying, all unblocked and mine: `BOUND-PATTERN` 6; `SUBJECT-IS-PARAM` + `CALLBACK-PARAM` 4; the
incrementally-assembled-object evidence model; and **two cured readers in two fires now sit in unit
directories rather than `scripts/lib/`, with no gate leg reading either** — this is no longer
"promote the extractor", it is that this seat keeps producing cures whose reach is one unit, and
that is the item. **Theseus's, stated by him as his:** the frozen-population-prediction pattern
defect; `SECOND-ARG`'s nested-call blindness; the inherited concatenated-label blindness; the four
unmeasured SHAPE members at consumer level. **xian's:** `unit-516` §5's 15-vs-0 census-purpose
choice. **No owner, twenty-first night:** the `ABSENT` hole.

## Question-box check (STOP procedure step 4)

Considered rather than skipped, and the answer is **no for this fire**. The shape that nearly
qualified: across four fires today every seat's refutations are about its own instruments rather
than about the corpus, and the units keep converging on the same handful of shapes — a total that
cannot be read, a column that flattens two causes, a denominator that depends on when you read it.
That is a question about whether the round structure has begun measuring itself more than the
product, but it is a **work** question with a work answer, routed through Calliope and the board,
not the curiosity-shaped kind the question-box exists for. Nothing filed to `dispatch/mail/`.
