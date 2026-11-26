---
agent: Theseus Prime (manual testing & exploration — CLI side)
date: 2026-11-25
model: claude-opus-5
worktree: /Users/xian/Development/klatch-worktrees/theseus (branch `claude/theseus-cycle`, pushed `HEAD:main`)
---

# 2026-11-25 — Theseus session log

## 10:47 — START fire

Session-start protocol: fetched, read `docs/COORDINATION.md` (this seat's section), checked
`docs/mail/`. **One new memo addressed to this seat:**
`daedalus-to-theseus-argus-…-key-e-is-kpd-6-of-6-…-2026-11-25.md`, read in full. It asks nothing of
this seat and its §7 hands back by name the only two items `unit-514` §7.6 left marked
*unblocked, mine, no blocker* — `SECOND-ARG` integration, and the `FIXTURE` class / unit-level
exclusion. Both were closed by drive in this fire.

### Unit: `unit-516secondargfixture-2026-11-25`

- **Pre-registration `da9ac6b9`** pushed to `main` at **10:51:35 PST** (`TZ=America/Los_Angeles date`
  run in the same command as the push), before any arm, reader, cell, KP, scratch or capture of the
  unit existed. Addendum `PRE-REGISTRATION-ADDENDUM-GRANULARITY.md` registered after the arm's only
  drive and before the post-hoc that grades it existed.
- **17 registered predictions: 16 HIT, 1 REFUTED.**

**Captures** (all `.err` **0 B**):

| capture | bytes |
|---|---|
| `captures/ARM.out` | 70,398 |
| `captures/POSTHOC-GRANULARITY.out` | 8,264 |
| `captures/ARM-REDRIVE-AFTER-COMMIT.out` | 70,397 |

### What was measured

1. **`SECOND-ARG` integrated into the classifier** — recovers **exactly the two sites P3 named, by
   file and line** (`unit-510quotepathskip/arm-quotepathskip.mjs:160`, `…/confirm-landed.mjs:102`).
   Graded on site identity rather than count. Cannot double-count **by construction** (consulted only
   where the inherited classifier returns `UNCLEAR`); the regex's own refusals graded as a separate
   prediction. **9 of 9 KP cells, 4 of 4 gated, 6 of the 9 sliced from real lines in tracked files.**
   P6's nested-call blindness planted and asserted missed. P11 registered at 0 and held.
2. **The `FIXTURE`/unit-exclusion question** — answered, and the answer is *neither cure as §7.5
   stated it*: `22 → 15` excluding `NESTED-LITERAL` rows, `22 → 0` excluding `docs/research/unit-*/`,
   because **P8 holds at zero: no own-line consumer of this label exists outside the thread.**
3. **`18 → 20 → 22` is two `+2`s with disjoint rows (overlap 0) and opposite causes** — population
   growth (`NEW-FILE`, Daedalus's arm committed 09:24 today) and measurement improvement
   (`PRESENT-THEN`, two long-standing `unit-510` rows). Existence oracle re-KP'd 3 of 3 in-process.
4. **P9** — his §6 growth-term claim measured rather than accepted: 2 of my 22 rows are his, added
   inside 90 minutes.
5. **Against me** — my own arm graded P7 at a **wider granularity than I registered it** (22 rows
   against a claim scoped to 18), printing `REFUTED` in the same column as eleven honest verdicts.
   At the registered granularity: **5 of 5, HIT** (PH1). Both halves published. Caught only because
   the arm prints rows in full and the two intruders carried today's date in their paths.
6. **§7.5 inside one fire, measured** — re-drive after commit, compared line by line: 1676 lines
   each, **5 differ**, `read` **635 → 636 (+1, not +0)**: `posthoc-granularity.mjs`, in this same
   unit and not in the exclusion list, joined the population it was written to analyse. All 12
   verdicts identical; it moved nothing only because it contains the label 0 times.
7. **No copy of the classifier** — span sliced from yesterday's key at run time and compiled
   (5703 B, 19 markers asserted), population rule extracted with the prior key's own extractor
   sliced from its source and KP'd on 4 paths. No brace comparison anywhere in the unit.

**Gate green at every push:** `tracked files read` **1104 → 1105 → 1106**, population **65**,
**MARKED 4 / GUARDED 3 / UNGUARDED 58**, `baseline entries 58` — flat across the unit.
`git diff --stat HEAD -- packages/ scripts/` **EMPTY**, asserted inside both scripts.

### Mail handled in-fire

- **Answered:** `theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-both-your-handed-back-items-are-closed-by-drive-and-your-growth-term-has-a-figure-2-of-my-22-are-yours-from-this-morning-2026-11-25.md`.
  Thread stays in `docs/mail/` — open items both ways, `ABSENT` still ownerless (twentieth night).
- **Cross-repo, all four checked fresh:** `designinproduct/docs/mail` (newest 11-23),
  `mediajunkie/docs/mail` (11-23), `piper-morgan-product/mailboxes` (no new), `dispatch/mail`
  (11-24). Nothing addressed to this seat with an open ask.
- **Delivered outside Klatch:** ninth datapoint on the `question-theseus-2026-11-01` question-box
  thread → `dispatch/mail`, commit **`662047f`**, **verified at the remote** with
  `git -C /Users/xian/Development/dispatch ls-tree -r origin/main` (file present). Recipe from the
  memory store worked first try: `fetch` → `rebase origin/main` (was 3 behind) → commit with
  `-c user.email=xian@Amber.local`. The addendum also names a numbering drift in that thread — the
  11-24 filename says "seventh" where the bodies' running count makes it the eighth — without
  renaming anyone's file.

---

## 11:05 — Session wrap verification

**Step 1 — `git log origin/main --oneline -6`, pasted from the run:**

```
a4d415a1 coord+log(theseus): 11-25 START fire -- both handed-back items closed by drive, 16 of 17 HI
d28e8108 results+mail(theseus): unit-516 -- 16 of 17 HIT; SECOND-ARG integrated recovers exactly its
c99d1d91 posthoc(theseus): unit-516 -- P7 is HIT at its registered granularity (5 of 5) and REFUTED
af5a816b arm+addendum(theseus): unit-516 -- SECOND-ARG integrated into the classifier recovers EXACT
da9ac6b9 prereg(theseus): unit-516 -- integrate SECOND-ARG into the classifier and key a NESTED-LITE
df0430db log(daedalus): START fire wrap verification -- 6 commits confirmed on origin/main, every de
```

All five of this fire's Klatch commits are on `origin/main`. `df0430db` is Daedalus's, the checkpoint
this fire started from.

**Step 2 — every deliverable `ls`'d (all present, `.err` 0 B on all three drives):**

```
docs/research/unit-516secondargfixture-2026-11-25/:
   8434  PRE-REGISTRATION.md
   2998  PRE-REGISTRATION-ADDENDUM-GRANULARITY.md
  17975  RESULTS.md
  29534  arm-secondargfixture.mjs
  12205  posthoc-granularity.mjs
captures/:
  70398  ARM.out                        0  ARM.err
   8264  POSTHOC-GRANULARITY.out        0  POSTHOC-GRANULARITY.err
  70397  ARM-REDRIVE-AFTER-COMMIT.out   0  ARM-REDRIVE-AFTER-COMMIT.err
docs/mail/theseus-to-daedalus-argus-…-both-your-handed-back-items-are-closed-by-drive-…-2026-11-25.md
docs/logs/2026-11-25-theseus-log.md
```

Cross-repo deliverable verified **at the remote**, not locally:
`git -C /Users/xian/Development/dispatch ls-tree -r origin/main` lists
`mail/addendum-theseus-2026-11-25-the-ninth-datapoint-….md` (commit `662047f`, pushed
`a565def..662047f`).

`git status --short` — **clean** (empty output) before this log's own commit.

**Step 3 —** this log is committed last, after Steps 1 and 2.

---

## 14:47 — Session resumed (WORK fire)

Model: claude-opus-5.

Session-start protocol: `git status` clean, branch `claude/theseus-cycle` at `865949a5`; read this
seat's section of `docs/COORDINATION.md`; checked `docs/mail/` (164 live threads, 1258 in `read/`).
**One new memo since the START fire, addressed to this seat:**
`daedalus-to-theseus-argus-…-my-own-reach-parenthetical-was-false-at-6-the-hazard-is-2-and-one-of-the-two-is-yours-2026-11-25.md`,
read in full. Its §5 says *"Nothing in this memo asks either of you for anything, except that Theseus
now owns a named two-hit site he did not know about"* — so that one routed site is the whole of this
fire.

### Unit: `unit-518routedternaryreach-2026-11-25`

- **Pre-registration `768bf4a9`** pushed to `main`; `TZ=America/Los_Angeles date` read
  **14:50:18 PST** in the command immediately before the push, before any arm, reader, cell, KP,
  scratch or capture of the unit existed.
- **Addendum `7fe210a2`** pushed **before the arm's first drive** — not after it. A cripple on the
  **key** cannot simulate a ternary in the **subject**, so P6/P7 alone would have priced a different
  breakage than the one routed, and P11/P12 had to be registered before anything ran.
- **13 registered predictions: 12 HIT, 1 REFUTED.** Post-hoc: **3, 2 HIT, 1 REFUTED.** Both
  refutations are mine and both are about my own instrument, not the corpus.

**Captures** (all `.err` **0 B**):

| capture | bytes |
|---|---|
| `captures/ARM.out` | 8,135 |
| `captures/POSTHOC-SEPARATE.out` | 2,615 |

### What was measured — three levels, because grading only the first would have been a dodge

1. **The quotation.** `file:` **never appears at `recon.mjs:83`.** The only `file:` property in that
   file is at line **89**, value `String(file)`, not a ternary. The routed text occurs **0 times**
   verbatim. Reported as **his key's capture**, not as a misquote — the string is exactly what a
   position-blind key returns there, so he reported his instrument faithfully.
2. **The mechanism — HIT, and registered as a HIT *for him* before I drove anything**, precisely so
   that level 1 could not be mistaken for a defence of my file. The `file` his key matched is the
   **tail of the member expression `e.file`** (preceding char captured and asserted `.`), and the
   `:` is a **ternary's else-colon**; the span after it, `typeof e === 'string' ? e : e.file;`, is
   then genuinely a ternary, so every downstream check agrees — **the corroboration is downstream of
   the same mistake.** **P10 is the proof my own key could have had it:** drop my property-position
   constraint (`{`, `,` or line-start) and my count on the same file goes **1 → 2**, picking up line
   83 exactly as his did. I only know the constraint was load-bearing because I registered a
   prediction that it was.
3. **The reach — 0.** Both key occurrences (probe lines **97**, **106**) sit inside
   `for (const line of srcLines) {`, verified by walking back from each key to its own nearest
   enclosing `for (` and asserting the iterable **text** rather than reading the docblock. Chain
   asserted link by link at 1x each: `SWEEP = join(HERE, 'sweep-probes.mjs')` → `sweepSrc` →
   `srcLines`. `recon.mjs` / `unit-307c4` / `blast-radius` occur **0 times** in the probe. The
   probe's whole **12-site** read/write/spawn/import set printed in the capture rather than
   summarised.
4. **Hazard census on the subject it does read:** **0 unreadable of 45** property-position `file:`
   lines in `scripts/sweep-probes.mjs` — with the counter **KP'd first** on planted ternary-valued
   and double-quoted cells plus a readable negative cell, because a key returning 0 needs a known
   positive before the 0 is a finding.
5. **The two numbers, in one sentence (his PH4, adopted):** of the probe's 2 `file:` key
   occurrences, **0 are reachable** by the routed ternary and **2 are guarded** by a known positive
   that reddens when the key dies. Reach 0 means no cure has a subject here.
6. **Consequence for his published figures, and it is kinder than what he published.** Under his own
   definition my site is a **SHAPE** member, not a **HAZARD** member: his **HAZARD 2 of 6 / gap 4**
   becomes **1 of 6 / gap 5** — **exactly the 1 he registered as PH3.** So **PH3 HELD** and the
   refutation he published was an artefact of the position-blind key. Routed back to him; four of his
   six SHAPE members remain unmeasured at consumer level and I measured one cell, so I do not know
   whether `recon.mjs:83` is representative or singular and did not guess.
7. **THE KEEPER, and P12 cost me a prediction to get it.** P12 was registered **OPEN** — a
   commitment that my two cripples might turn out to be one cripple, so I could not discover it after
   the fact. It came back **REFUTED**: both cripples read `false/false`. The post-hoc then went to
   reason level instead of accepting the saturated column:

   ```
                              A1     A2      kpOwner                   r225 decls / total
   LIVE                       true   true    probe-round225-…mts             2 / 3
   KEY-CRIPPLE  (dead key)    false  false   (none)                          0 / 3
   HAZARD-SIM   (subject      false  false   probe-round224-…mts             0 / 3
                 ternary)
   ```

   A dead key reports `(none)` — a **visible refusal**. A ternary in the subject reports a **real but
   WRONG owner**, because a nearest-preceding walk keeps the last entry it could read. **The identical
   `false/false` pair is a property of the COLUMN, not of the cripples, and the column flattens the
   dangerous cause into the same cell as the harmless one.** Fourth face of the `unit-515` §4 /
   `unit-516` §3 / `unit-517` §2 family, sharpened to: *a saturated column is not evidence that two
   arms did the same thing.*
8. **Frozen instruments honoured.** `probe-round373-…mts` and `recon.mjs` never executed, edited or
   copied to disk. The A1/A2 predicates were **sliced from the probe's source at run time**
   (3,413 B, offsets 5810..9223), **9 markers asserted on the span before compiling**, **3 transforms
   declared with occurrence counts asserted** (two strip TS annotations the dynamic compile does not
   reach, one redirects `check` to a capture), and both cripples applied to the sliced text **in
   memory**. The post-hoc re-sliced and **asserted the span's byte count and offsets against the
   arm's own printed figures** before grading, so it cannot explain a different span than the one the
   arm drove. No brace comparison anywhere in the unit.

### Against me, two

- **(i) My arm's own marker set ABORTED its first drive, and the expectation was wrong, not the
  span.** I registered `owners.length ===` at **1** occurrence in the slice; it is **2** — once in
  the 2026-11-07 re-key docblock, which quotes the arm it replaced, and once in the live ORPHAN
  clause. I had read the code and not the prose. Corrected to 2 **plus** an exact code-only marker
  (the full ORPHAN clause across both lines) that no comment can satisfy. **Nothing was published on
  the aborted drive**, which is the only reason this is a correction rather than a wrong figure.
- **(ii) PH3 REFUTED — I typed `2 of 2` where the format I was slicing says `2 of 3`.** Two declarer
  *entries*, three declaration *lines* (round225 declares a `refusal:` and a `skip:`;
  `probe-backfill-sidecar-neutrality.mts` declares one). The probe has always printed `2 of 3`; I
  restated it from my own reading of the format. **Slicing the inputs and re-typing the verdict** —
  in the post-hoc whose whole purpose was to capture strings rather than restate them.

### Gate, at every push

`node scripts/verify-decl-body-slicers.mjs` rc 0 (plus the pre-commit census, `CENSUS OK`, 45 swept /
110 deferred). `tracked files read` **1108 → 1109 → 1110**, population **65**,
**MARKED 4 / GUARDED 3 / UNGUARDED 58**, `baseline entries 58` — flat across the unit.
`git diff --stat HEAD -- packages/ scripts/` **EMPTY**, rc 0, 0 bytes, asserted inside the arm
**before any measurement ran** rather than after.

### Mail handled in-fire

- **Answered:**
  `theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-your-routed-site-is-not-a-hazard-member-the-colon-your-key-matched-is-a-ternarys-else-colon-so-your-ph3-held-at-1-of-6-2026-11-25.md`.
  Thread stays in `docs/mail/` — open items both ways, `ABSENT` still ownerless (twentieth night).
- **Cross-repo, all four checked fresh:** `designinproduct/docs/mail` (newest 11-23),
  `mediajunkie/docs/mail` (11-23), `piper-morgan-product/mailboxes` (no new),
  `dispatch/mail` (newest 11-25, `signal-dispatch-dinp-to-dispatch-pm`, addressed to the PM seat).
  **Nothing addressed to this seat with an open ask**, so nothing delivered outside Klatch this fire.

### Drain

- **Drained and done:** the one routed item (closed by drive, reach 0 / detection 2, no cure has a
  subject); the reply memo; COORDINATION; this log.
- **Deferred with a named blocker:** `unit-516` §5's 15-vs-0 census-purpose choice — **blocker:
  xian's call and nobody else's**, and the measurement is done either way. The `ABSENT` hole —
  **blocker: no owner, twentieth night.**
- **Carried, unblocked, mine, no blocker:** the frozen-population-prediction pattern defect
  (`unit-516` §4); `SECOND-ARG`'s nested-call blindness; the inherited concatenated-label blindness.
  Not deferred — not reached inside a bounded fire that spent itself on the routed item.

---

## 15:0x — Session wrap verification (WORK fire)

**Step 1 — `git log origin/main --oneline -6`, pasted from the run:**

```
2a503d8e results+mail(theseus): unit-518 -- 12 of 13 HIT; the routed site is a SHAPE member not a H
cb19a46c posthoc(theseus): unit-518 -- the identical false/false pair is a property of the COLUMN, n
25a5b3ba arm(theseus): unit-518 -- 12 of 13 HIT; the routed ternary's reach over my reader is 0 and
7fe210a2 prereg-addendum(theseus): unit-518 -- HAZARD-SIM, because a cripple on the KEY cannot simul
768bf4a9 prereg(theseus): unit-518 -- grade the routed probe-round373 `file:` reader at three levels
865949a5 log(argus): 11-25 WORK fire wrap verification -- both commits confirmed on origin/main, log
```

All four of this fire's unit commits are on `origin/main`. `865949a5` is Argus's, the checkpoint this
fire started from. This log's own commit is the fifth and lands after this paste, per Step 3.

**Step 2 — every deliverable `ls`'d (all present, `.err` 0 B on both drives):**

```
docs/research/unit-518routedternaryreach-2026-11-25/:
   7465  PRE-REGISTRATION.md
   2333  PRE-REGISTRATION-ADDENDUM-HAZARD-SIM.md
  11068  RESULTS.md
  22948  arm-routedternaryreach.mjs
   8873  posthoc-separate-the-cripples.mjs
captures/:
   8135  ARM.out                   0  ARM.err
   2615  POSTHOC-SEPARATE.out      0  POSTHOC-SEPARATE.err
  11566  docs/mail/theseus-to-daedalus-argus-…-your-routed-site-is-not-a-hazard-member-…-2026-11-25.md
  16786  docs/logs/2026-11-25-theseus-log.md
```

No cross-repo deliverable this fire — nothing in the four external mailboxes was addressed to this
seat with an open ask, so there was nothing to send. Stated rather than left silent, because an
absent delivery and an unchecked mailbox look identical in a log.

**Step 3 —** this log is committed last, after Steps 1 and 2.


---

## 19:10 — Session resumed (interactive, not a fire — restart onto Claude Code 2.1.332 at xian's go)

Pard restarted this seat onto a new CLI build; model unchanged (`claude-opus-5`). This is an
interactive session with xian, **not** a day-part fire. Session-start run in full, every line below
from a tool call in this session:

- **Version.** `claude --version` → **2.1.332 (Claude Code)**. This seat's `COORDINATION.md` status
  line said **2.1.322**; corrected in the same commit as this entry. The old figure was right when
  written — it is the version string, not a typo of it.
- **Pull.** `git pull --ff-only` → *Already up to date*; worktree clean, `claude/theseus-cycle` at
  `origin/main` (`5f2b3829`).
- **Role doc.** `docs/ROSTER.md` → *Theseus Prime — Manual Testing & Exploration*, human-agent
  tandem tester; `docs/operations/duty-cycle/theseus-tasks.md` (task list of record) read.
- **Board.** `docs/COORDINATION.md` this seat's section — last entry is the 11/25 WORK fire
  (`unit-518routedternaryreach`), which routed one item to Daedalus.
- **Mail.** Newest inbound to this seat is Daedalus's **11-25 STOP** memo
  (`…your-refutation-of-my-refutation-holds-under-my-own-cured-key…`), read in full. It **closes the
  `unit-518` routing by drive** — his position-blind key cured and KP'd 5 of 5, `file`
  TERNARY-position 1 → 0, HAZARD 2 of 6 → **1 of 6**, gap 4 → **5**, so `unit-517`'s PH3 is restored
  to HELD — and it states in terms that **nothing is asked of this seat**. No reply owed; no action
  taken on it this session.
- **Cross-pollination.** `docs/briefs/cross-pollination/current.md` is a pointer (public repo); the
  private source was read at `designinproduct` → `src/internal/briefs/2026-11-25-brief.md`
  (`eb3acca`). Both of today's findings are from this project's own thread — one of them this
  seat's `unit-514` fixture-contamination result. Nothing asked of this seat.
- **Cross-repo mailboxes.** `git fetch` first in each, then read `origin/main` rather than the
  working copy, because an absence claim off a stale checkout is not an absence claim:
  `designinproduct` (newest 11-25, all to other seats), `mediajunkie` (no mail dated 11-24+),
  `dispatch` (11-25 traffic is the PM/DinP daily pair plus **this seat's own outbound addendum**),
  `piper-morgan-product` (no new). **Nothing addressed to this seat with an open ask.**
- **Fire schedule.** `com.klatch.theseus-STOP.plist` → `Hour 19 / Minute 47`, `RunAtLoad false`.
  Clock in this session is **19:10:17 PST**, so the STOP fire is due in
  minutes in a separate process on this same worktree. **No measurement unit started here on that
  account** — a unit's pre-registration and the fire's would race on the index and on this log.

Open items for this seat are unchanged by this session: the frozen-population-prediction pattern
defect (`unit-516` §4), `SECOND-ARG`'s nested-call blindness, the inherited concatenated-label
blindness (all unblocked, mine); `unit-516` §5's 15-vs-0 census-purpose choice (**blocker: xian**);
the `ABSENT` hole (**no owner, twentieth night**).

---

## 19:47 — Session resumed (STOP fire, launchd) — model `claude-opus-5`

Fire start clock **19:47:11 PST** (`TZ=America/Los_Angeles date`, first command of the session).
Session-start protocol run in full; every figure below came from a tool call in this session.

- **Pull / branch.** Worktree clean, `claude/theseus-cycle` level with `origin/main` at `b1136cac`
  (`git rev-list --left-right --count origin/main...HEAD` → `0 0`).
- **Board.** `docs/COORDINATION.md` → this seat's section; last entry was the 11/25 WORK fire.
- **Mail.** Newest inbound to this seat is Daedalus's 11-25 STOP memo
  (`…your-refutation-of-my-refutation-holds-under-my-own-cured-key…`), **already read in full in the
  19:10 interactive session** and re-read here. It closes the `unit-518` routing by drive and states
  in terms that nothing is asked of this seat. **No reply owed.** So this fire's work is a carried
  item of mine rather than routed work.
- **Cross-repo mailboxes.** `git fetch` first in each, then read `origin/main` by `ls-tree` rather
  than the working copy, at **19:58:38 PST**: `designinproduct` (11-25 traffic, all to other seats),
  `mediajunkie` (newest 11-25, to Pard), `dispatch` (11-25 is the PM/DinP daily pair, the inbox-check
  signal, and **this seat's own outbound addendum** from earlier today), `piper-morgan-product`
  (11-25, to the docs/exec seats). **Nothing addressed to this seat with an open ask; nothing to
  send.**

### The unit: `unit-520builtlabelreach-2026-11-25`

Took the third of `unit-516` §9's three unblocked-and-mine items: **`unit-514` KP11's
concatenated-label blindness, declared since 11/24 and never measured for reach.**

| | |
|---|---|
| pre-registration | `2802d979` on `main`, pushed **19:49:56 PST**, before any script existed |
| addendum | `db630b42`, pushed **19:53:06 PST**, after the arm's only drive, before the post-hoc existed |
| results | `e3b3014c`, **19:56:36 PST** |
| memo + correction | `e9859936`, **19:58:28 PST** |
| verdicts | **12 HIT · 2 REFUTED · 1 OPEN-resolved · 1 PARTIAL of 16** — both refutations mine |
| `.err` | **0 B** on both drives |

**The answer: 0 live consumers.** Over a population of **646** tracked `.mjs`/`.js` files (filter
**extracted** from published source, KP'd on four paths, not retyped), there are **3** built-label
*text* sites in **2** files and **0** of them key as a consumer of the gate label. The thread's
floors — 13 / 18 / 20 / 22 — are **counts in practice**, under the named residual of §6. **No cure
is owed**: a binding- or paren-aware key would buy 0 rows today.

**The keeper — a declared blindness becomes its own census population.** All three sites are this
thread's own: `unit-513` KP5's planted fixture, `unit-514` KP11's own plant, and a `unit-513`
docblock line *writing about* the form. The act of declaring the blindness is what put its only
witnesses into the tree. A census keyed on the text rather than the **role** of the text would have
published *"3 built-label sites exist, so the published floors understate"* — the opposite of the
finding. `CONSUMER` is the key's fall-through cell, so it was **KP'd reachable, 4 of 4**, before its
0 was allowed to mean anything.

**Against me, one — P6 refuted by my own registered sentence, not by the corpus.** I registered
"0 built-label **sites**", interval 0–2; the claim I cared about was "0 built-label **consumers**".
Those are **3** and **0**. The arm graded the text, which is correct. *A prediction is graded on its
text, not its intent* — the inverse of the four recorded cases where a foil ran wider than its
claim, arriving this time through the **registration**. Second face of the `unit-516` §5 pattern
item still on my list.

**Against me, two — the ±5 population tolerance refuted by a drift of exactly 7.** 646 against
`unit-516`'s published 635/639. PH2 named all 7 files, novelty oracle (`git cat-file -e
c99d1d91:<path>`) **KP'd in both directions first**: **7 of 7 are units 517–519's own instruments**,
committed today. Restricted to `c99d1d91` the population is **639** — the published 639 to the file
— with the **same 3 sites** (PH3). Daedalus's `unit-519` PH2 from the other direction: there the
moving denominator moved a figure, here it took out a **tolerance** priced against a corpus three
units added 7 files to in nine hours.

**Vacuity guard, registered before the drive.** The joint collapse fired in **382 of 646** files,
**7164** joints, against a registered floor of 20 (P7), and files-where-text-changed (382) is
published beside files-where-the-label-count-changed (2) (P8). **KP 5 of 5**: three planted
positives — KP11's exact form, a **mid-word** split (a different shape, not a second instance of
one), a three-part two-joint form — and one negative **sliced** from
`unit-510quotepathskip…/arm-quotepathskip.mjs:160`. The positives are planted **and declared as
planted**: whether the corpus holds a built label is the question, so a sliced positive would
presuppose the answer. **P5** asserts my own blindness missed (variable-assembled, template-
interpolated, `.concat`, `join`). **P9**, the manufactured-hit hazard, registered OPEN and resolved
at **1 of 3** by hand-reading the published line text.

### Two self-catches, both recorded rather than quietly fixed

1. **A three-reading gate sequence with one reading behind it.** The outbound memo first carried
   `tracked files read 1113 → 1114 → 1116` as captured output. **Only the 1113 came from a tool
   call.** Corrected in the memo *and* in RESULTS §7b before the memo was committed. Real readings:
   **1113** at the pre-reg push, **1115** read live at **19:57:52 PST** (`of 1116 tracked code
   file(s) in scope`); the two intermediate pre-commit runs scrolled past uncaptured and are **not
   quoted**. The middle figure was *derivable* (1113 + 1), which is what makes the class dangerous —
   an arithmetic reconstruction prints identically to a reading. **A three-element trend quoted as
   captured needs three captures, not one capture and a slope.**
2. **A `.length`-as-bytes mislabel.** The post-hoc printed the arm capture as `8497 B`; `wc -c`
   returns **8569**. `String.length` is UTF-16 code units and the capture holds `—`, `·`, `⇔`, `−`.
   The label is wrong, not the number. Recorded in §7 because the class is not small: a size
   assertion in characters wearing a `B` label agrees with a byte assertion on ASCII and diverges
   silently the moment a dash is typed. **The census of span assertions comparing `.length` to a
   `wc -c` figure is named and NOT run** — offered to Argus in the memo, mine if he declines.

### Gate, at both captured readings

`population` **65**, **MARKED 4 / GUARDED 3 / UNGUARDED 58**, `baseline entries` **58** — flat.
Gate rc 0 at every push. `git diff --stat HEAD -- packages/ scripts/` **EMPTY**, asserted and
printed inside the arm before any measurement ran.

### Drain

Closed by drive: one carried unblocked item. Memo filed and pushed to `main` in its own commit.
Two self-caught defects recorded. COORDINATION and this log written. **Deferred, each with a named
blocker:** `unit-516` §5's 15-vs-0 census-purpose choice (**blocker: xian's call, nobody else's**);
the `ABSENT` hole (**blocker: no owner, twentieth night**). **Carried unblocked and mine, no
deadline attached:** the frozen-population-prediction **pattern** defect (now with a
registration-side face from §4), `SECOND-ARG`'s nested-call blindness, and the new
`.length`-as-bytes census.

### 20:00 — Session wrap verification (STOP fire)

**Step 1 —** `git log origin/main --oneline -6`, captured at **20:00:18 PST**:

```
cb0fa322 coord+log(theseus): 11-25 STOP fire -- the blindness KP11 declared has 0 live consumers ...
e9859936 mail(theseus->daedalus,argus)+results correction: unit-520 filed, and a three-reading gate
         sequence I nearly shipped had exactly one reading behind it ...
e3b3014c results(theseus): unit-520 -- the concatenated-label blindness has 0 live CONSUMERS over 646 ...
db630b42 arm+addendum(theseus): unit-520 arm driven, 7 HIT / 2 REFUTED / 1 OPEN ...
2802d979 pre-reg(theseus): unit-520builtlabelreach -- measure the REACH of the concatenated-label ...
b1136cac log(daedalus)+correction: the section header on my own correction was an ESTIMATED time ...
```

All five of this fire's commits are on `origin/main`. `b1136cac` is Daedalus's, and is the commit
this fire started from.

**Step 2 —** every deliverable `ls`'d, sizes as returned:

```
docs/research/unit-520builtlabelreach-2026-11-25/
   7941  PRE-REGISTRATION.md
   4809  PRE-REGISTRATION-ADDENDUM-WHOSE-PLANTS.md
  16808  RESULTS.md
  15166  arm-builtlabelreach.mjs
  12577  posthoc-whose-plants.mjs
captures/:
   8569  ARM.out                 0  ARM.err
   9254  POSTHOC-PLANTS.out      0  POSTHOC-PLANTS.err
  13249  docs/mail/theseus-to-daedalus-argus-...-zero-live-consumers-...-2026-11-25.md
```

`ARM.out` at **8569** bytes is the section-7 finding standing in its own evidence: the post-hoc
printed that same file as `8497 B`, and the 72-unit difference is the multi-byte characters.

No cross-repo deliverable this fire -- nothing in the four external mailboxes was addressed to this
seat with an open ask, so there was nothing to send. Stated rather than left silent, because an
absent delivery and an unchecked mailbox look identical in a log.

**Step 3 --** this log is committed last, after Steps 1 and 2.

### 20:0x — Memory-index housekeeping, triggered by a post-write hook

Appending this fire's two lesson classes to existing topic files (no new index lines, which is the
preferred shape) tripped the index's size hook: **19,969 B against a 17.1 KB target**, 125 entries.

The index's own preamble recorded a by-hand trim on 11-17 that reached **15,981 B**. Eight days
later the **same 125 entries** measured 19,969 B. Hooks regrow, because every fire that files a
lesson wants to say what it was — so **a by-hand pass that has to be repeated is a script nobody
wrote yet**. Written: `docs/operations/memory-index-trim.mjs`, dry-run by default, `--apply` to
write, and it **aborts unless all four invariants hold** — entry count, ordered link targets,
ordered titles, smaller. Result, with the invariants asserted before the write:

```
entries before 125  after 125        links 125 → 125
bytes   before 19969  after 16645    delta -3324     hooks trimmed 31
preamble rewritten by hand afterwards → 16629 B
```

**A population trap found in my own script, and it is the reason the figure is trustworthy:** the
first dry run reported **124** entries where a `/^- \[/` count gives **125**. The title class
`[^\]]+` silently drops the one entry whose title contains brackets
(``A `[false,false]` row looks like an untouched defect``). That line is short and would have been
left alone either way — which is exactly why a population one member short goes unnoticed. Fixed to
a greedy title with the target pinned to `.md`, and the discrepancy is recorded in the script's own
docblock rather than quietly corrected.

Lessons filed as **sections, not new index lines**: the declared-blindness-becomes-its-own-census
result into the census/population-keying topic (§21), the two write-up defects into the
figure-and-count-drift topic (§17 the one-capture-and-a-slope trend, §18 `.length` wearing a `B`),
and the registration-side granularity face as a fifth instance on the foil-granularity file. Each
file's count was updated in its index hook, per the index's own standing instruction.

**Still owed and NOT done here:** the ~20-entry **merge** pass, which is the only thing that reduces
the 125 lines. Trimming buys bytes and never touches the count. Named with its blocker — it needs a
cluster list authored, and this fire spent its remaining budget on the script instead.
