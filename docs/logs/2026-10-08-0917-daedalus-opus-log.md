# 2026-10-08 — Daedalus (Opus 5) — START fire

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Baseline: `origin/main` at `ee395388`, clean at fire start.

---

## 09:17 — Briefing

Pulled by the wrapper; worktree clean. `COORDINATION.md` is 1.8MB / 3588 lines, so read by section
(`grep -n '^### '` for the map, then the Daedalus section head at :196) rather than whole.

`%an`-checked the two head commits above my last (Round 326's lesson — `--oneline` hides the author):
`ee395388` and `86f631a2` are both **Argus's**, not mine, and both read like a shape I write.

Mail: newest inbound to this seat is Theseus's **Round 350**,
`docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-your-dimension-7-correction-is-right-…-2026-10-07.md`.
Read in full on arrival. It routes **three** items to this seat and lands nothing itself, by design:

1. **§4** — F9's check string overclaims its scope; narrow it, his wording, my file.
2. **§2** — the corrected dimension-7 row is two-column (3 syntactic / 0 label-valued), and the
   licensing defect is isolated to that one row.
3. **§3** — a correction **to this seat**: F10's stated motive licenses six more arms.

No other open item addressed to me. Argus's 10/06 Laya/AAXT memo to the CIO stays parked on xian's
scheduling call — not mine.

## 09:19 — §2 driven before anything was landed

Did not copy his figures. Wrote `.testdata/r351/span-key.mjs` (gitignored) with the **assign leg
copied byte-identically** from the landed `hoistedTagSites` (`probe-round269:765-772` — same `/g`
declarator regex, same `isCode` keyword guard, same quote-delimited `MEAS` test) and **only the
emitter's span varied**, because the span *is* the dimension (Round 339: vary what SELECTS).

Graded before any figure was read, BARE carried as the positive control:

```
GRADE positive control (BARE === F9's published four, as a member list): true
GRADE valuation leg (known positive label-valued, known negative call-valued): true
offsets preserved on every file: bare=true any=true
population: 194 code files under scripts/ (readdirSync walk)

ALL PAIRS  7: round224-a:71→72, round224b-:57→58, round247-a:67→68, round255-t:171→172,
              round280-t:476→478, round281-a:221→222, round282-w:617→618
BARE       4: round224-a:71→72, round224b-:57→58, round247-a:67→68, round255-t:171→172
NONBARE    3: round280-t:476→478, round281-a:221→222, round282-w:617→618
NONBARE label-valued: 0 of 3
DECOMPOSITION: 4 + 3 = 7, all pairs 7 — accounts for the whole population: true
```

Member lists are his to the line pair. **Hand reading is primary at that size** (Round 341), so all
three were read at source: `probe-round280:476-478`, `probe-round281:220-222`,
`probe-round282:617-618` — in each, `meas` holds a `rows.filter((r) => r.outcome === 'MEAS')` result
and the interpolation is `${meas.length}`. Syntactic members, false as sites.

## 09:21 — Three edits landed

All in `scripts/probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts`:

- F9's **check string** narrowed to *every hoisted-tag SITE whose name is interpolated BARE into a
  `console.log` template*, plus a docblock paragraph recording why.
- F10's **docblock**: the dimension-7 row corrected to its two-column form, with the mechanism of his
  0 and my Round 351 re-derivation; rows 1–6 recorded as **his** measurement, attributed and not
  re-derived, with the reason (six fresh keys all returning 0 is my own false-zero shape).
- F10's **reason**, in the docblock *and* in its own detail string: the swallow hides a site **F9's own
  predicate matches**, so *"the detector loses members of its own declared class without saying so"*,
  not *"a blind spot exists"*.

**Pin check before trusting the sweep:** `sweep-probes.mjs:439` pins
`/All 56 regression checks passed/` — a **count** pin, not a check-text pin — so the wording change
cannot stale it. Read at the source rather than inferred from round269 going green.

## 09:23–09:27 — Gate, each leg off its own instrument

- `npx tsc --noEmit` server and client, **each redirected to its own file** in `.testdata/r351/`:
  `ls -l` shows **both 0 bytes**. (Not a `grep -c` of zero, which also prints 0 if the compiler died.)
- `npm test` **unpiped** to a file, figures read out of the file: **server 140 files / 2178 passed /
  1 skipped**, **client 26 files / 333 passed / 13 skipped (346)** — exact to Theseus's Round 350.
  `CENSUS OK`, and the census prints of itself *"NOT CHECKED: none of the 36 swept probes was
  driven"* — **`npm test` is not the sweep gate and was not treated as one.**
- `probe-round269` driven alone with the exit code **captured via `spawnSync` rather than assumed**:
  `EXIT CODE = 0`, verdict `All 56 regression checks passed, 3 measurements, 0 skips`. **F9 PASS**
  with the new text, **F10 PASS**, F9's derived line byte-identical to his (4 sites / 194 files /
  same four line pairs).
- Full sweep driven separately, read by its **verdict line, not its exit code** (which was 2):
  `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred`.
- `lsof` after the sweep via `execFileSync`: only **:5173 and :3001**, both xian's dev server. No
  leaked probe server to reap.
- `git diff --stat -- packages/` empty — scripts-only fire.

## 09:28 — The sweep's one non-green item, chased and then NOT filed as a finding

Chain driven end to end rather than recalled:

- `probe-round225` exit **3** → `SKIP [B] the drive of probe-round223b — COULD NOT RUN — exit 2`
- `probe-round223b` exit **2**, stderr `probe-round223b: something already holds 3001.`
- occupant by PID, not inferred: **47533**, `node … tsx/dist/loader.mjs src/index.ts`, cwd
  `/Users/xian/Development/klatch` — the dev server in the main checkout.

**Then checked the record before writing it up, and it is already there** —
`COORDINATION.md:383` states exactly this chain plus the deliberate decision not to wire the sweep
into `npm test` for that reason. So: a re-confirmation, not news. This is the project's highest-risk
statement shape ("X was never measured") and the check cost one `grep`.

## 09:30 — Mail close-discipline, with an instrument

`docs/mail/` holds **184** active files against **821** in `read/`; ~115 are the daedalus↔theseus
round chain going back to 09-03, and earlier fires flagged the backlog twice without sweeping it.

Scanned the 16 recent chain memos (10-04 → 10-07) for open-item language rather than trusting the
subject lines. **First pass read 14 of 16 as FLAG** — then I printed the matched lines in context and
16 of the 17 hits were the standing *"Parked on xian, not mine, unchanged: the entity-delete thread;
the CIO Laya/AAXT memo"* status line, which is a **closure** statement about other threads. My
detector was reading a closure as an opening — the false-defect direction, and it would have stopped
the sweep entirely if I had believed the count.

**Exactly one genuinely dormant open item survived: CURE B.** State read from the source memos:

- the 36-output denominator I was asked for is **closed** (36 of 36 driven, 2254 lines, live 202 MEAS
  lines, CURE B 202, 0 probes disagree)
- Theseus **declined to land it**: it reds F7's d2, whose only instrument is the exact line CURE B
  makes countable, and a replacement d2 fixture has no reachability figure at all
- the one remaining question, **routed to Argus on 10-06** and not taken in Argus's 10-08 no-op fire,
  is a **measurement and not a ruling**: *does any probe in the fleet write a MEAS label the widened
  counter still cannot read?* I checked the 99 renderings in label position; the fleet was never
  checked for colon-form or abutted-bracket spellings **as a population**.

Taking it this fire under the project's "first one there" convention. Moved Theseus's Round 350
inbound to `docs/mail/read/` (all three items closed by this fire); my Round 351 reply stays active.

**Deferred with named blockers** (drain rule, 2026-10-08): the pre-10-04 chain backlog (~99 memos) is
**proposed, not swept** — a bulk archive of 100+ memos changes every seat's view of the active mailbox
and each needs its open-item state actually read, so it wants a one-line OK rather than one seat
doing it unilaterally.

## 09:32 — Committing before the next drain item

Pushing the landed work now rather than at fire end: fires die at 2400s and nobody reconciles a
stranded worktree. CURE B's census goes in a second commit.

Commit `8ccbfcde`, pushed to `origin/main` (verified: `git log --oneline origin/main -1` returned
`8ccbfcde` after the push, `ee395388` before it). Pre-commit census hook passed — and it printed the
fleet size, **145 probe files**, which is the figure CURE B's question is posed in.

## 09:35 — Drain item: CURE B's remaining measurement

The question, from my own 10-06 memo, routed to Argus and not taken in Argus's 10-08 no-op fire:
*does any probe in the fleet write a MEAS label the widened counter still cannot read?*

**Checked `scripts/lib` and the probe before hand-rolling anything** — the instruments already
existed, so all three are copied **byte-identically** rather than paraphrased: `MEAS_LINE`
(`sweep-probes.mjs:1738`), `renderMeasMentions` (`probe-round269:323-335`),
`MEAS_IN_LABEL_POSITION` (`probe-round269:407`). CURE B is the one documented widening of alternative
2, `\s*MEAS\s+\[` → `\s*MEAS\s+\S`.

Graded **9 of 9** before reading a figure, with both named shapes (`'MEAS: 7ms'`, `'[A1]MEAS 7ms'`)
as known positives that must be **admitted and uncountable**, `'MEAS\t7ms'` as the one the widening
rescues, and `round240:474`'s summary as a known negative that must not be admitted. The script exits
1 without printing a figure if the grade is short.

**Population reconciled in the project's unit before use.** My recursive walk said 149; `census`
(`sweep-probes.mjs:1508`) says 145 and is **non-recursive with no extension filter**. Diffed as
**member lists**, not arithmetic: the difference is exactly `lib/probe-corpus-sessions.mts`,
`lib/probe-outcome.mts`, `lib/probe-server-ownership.mts`, `lib/probe-source-constants.mts` — shared
modules, not probes — with nothing in the census missing from my walk. Re-driven on the census's own
145 by importing `census` live.

```
label-position renderings: 97
uncountable under the LANDED counter: 2
    DEFERRED probe-round196-…                           "  MEAS X"
    DEFERRED probe-round221-probe-ownership-control.mts  "MEAS X — X"
uncountable under CURE B's WIDENED counter: 0
named shape COLON-FORM (MEAS:) members: 0
named shape ABUTTED-BRACKET ([tag]MEAS) members: 0
```

**Answer: NO** — and it **confirms the 10-06 decline rather than unblocking the landing**. d2's only
instrument *is* the 221 spelling CURE B makes countable, so after the widening there is no real
uncountable spelling left to re-fixture d2 from; CURE B could land only with an invented fixture
asserting a property nothing in the tree exhibits (the Round 339 failure F6 exists to escape). Both
rescued spellings are DEFERRED, so the benefit is at promotion time. **The open item is now a
decision, not a measurement.**

## 09:38 — A figure that moved against the record, chased rather than published past

My census printed **101** MEAS-mentioning renderings; the probe's own comment — **which I wrote** —
records **99**. Docs go stale, including mine, so I listed all four non-label-position mentions
instead of explaining the delta away:

- `geometry-distance-arm.mjs` — recorded at Round 341
- `probe-round240` — recorded at Round 341
- `probe-round269` ×2 — **new**, and both are the arm's **own known-negative fixture strings**

That is F9's recorded Round 347 lesson again: a known positive for this shape can only be written as a
string, so the arm's own fixture lands in the population it measures. Both are correctly **rejected**
by the selector, which is why **label-position stayed at 97 while mentions went 99 → 101**, and why
the answer above is untouched. Had I not reconciled it, I would have published a figure contradicting
my own comment with no account of which was right.

## 09:40 — Session wrap

Deliverables filed: §7/§8 appended to the Round 351 research doc, memo to Argus + Theseus, Drain line
in `COORDINATION.md` updated with the result. Second commit below.

**Drain status:** two consecutive checks of `docs/mail/` found nothing new beyond what is handled
above. Deferrals, each with a named blocker, are in the `Drain:` line — the pre-10-04 mail backlog
(proposed, needs a one-line OK, not deferred to a date), the 109 DEFERRED probes (promotion is a
deliberate per-probe path), `probe-round225`'s BLOCKED (xian's dev server holds :3001), and rows 1–6
of the dimension table (attributed to Theseus rather than re-keyed, on my own false-zero record).

## 09:43 — Session wrap verification (required before any "done" claim)

**Step 1 — commits landed.** `git log --oneline origin/main -3`:

```
9d1eaf70 docs: Round 351 drain — CURE B's routed measurement is answered NO, which confirms the decline
8ccbfcde probes+docs: Round 351 — the routed scope narrowing lands, F10's reason narrows to the one that bounds it
ee395388 log+coord: flag abandoned claude/argus-cycle remote ref, 1394 commits stale
```

Both of this fire's commits are on `origin/main`. `git status --short` empty.

**Step 2 — each deliverable `ls`'d, all five present:**

```
docs/research/round351-…-2026-10-08.md                                      18612 bytes
docs/logs/2026-10-08-0917-daedalus-opus-log.md                              13024 bytes
docs/mail/daedalus-to-theseus-argus-…-licensed-six-arms-…-2026-10-08.md      9785 bytes
docs/mail/daedalus-to-argus-theseus-…-cure-b-measurement-…-2026-10-08.md     9627 bytes
docs/mail/read/theseus-to-daedalus-argus-…-2026-10-07.md  (archived)        10849 bytes
```

**Second mail check, after a fresh `git fetch`:** `HEAD..origin/main` is **empty** — no other agent
pushed during the fire — and the only file added to `docs/mail/` since `8ccbfcde` is my own CURE B
memo. Two consecutive checks found nothing new, so the drain closes here.

**Step 3 —** this log is pushed last, in its own commit, after Steps 1 and 2.

**Nothing in this fire needs xian except one optional call:** a one-line OK (or refusal) on bulk-
archiving the ~99 pre-10-04 chain memos to `docs/mail/read/`. Argus's 10/06 Laya/AAXT memo to the CIO
remains the one thread parked on his scheduling call.

---

# WORK fire — 2026-10-08 13:2x–13:4x PT (Round 353)

Same day, second fire. Appended rather than a new file, per the day's-log convention.

## 13:2x — Briefing

`git fetch`: worktree at `0156511a`, clean, nothing ahead of `origin/main`. `docs/mail/` read.
One memo addressed to this seat: Theseus's Round 352 (`to: daedalus, argus`). Calliope's convention
ruling to Theseus on the 68 un-numbered threads is cc-only and informational — no action here.

Round 352 routes **one** item to this seat (§2): F10's narrowed reason misnames F9's own predicate.
§3 and §4 are a measured limit he explicitly does not want an arm for.

## 13:2x — Baseline, before touching anything

Drove his committed key (`docs/research/round352-valuation-leg-key.mjs`) from its committed path.
**Every figure reproduces:** 6 grades true, population 194, offsets preserved, class 11, member
lists equal, crude leg wrong on 2 of 11 (`:621`, `:825`), (A) 1 (`:992`), (B) 6, `'MEAS (inner)'`
outside the class. Also drove `probe-round269` alone: **EXIT 0**, `All 56 regression checks passed,
3 measurements, 0 skips`, F9/F10 PASS. No discrepancy.

## 13:3x — §2 landed, then made unable to un-land

Read the assign leg at source (`:780` post-edit): `if (!/['"`]MEAS['"`]/.test(rhs)) continue;` — the
whole RHS requirement, with no valuation test anywhere. So his reading is right at the line and the
old phrase named 4 of the 11 members F9 admits.

Corrected both sites (docblock `:921`, detail string `:1039`, pre-edit numbers). **But a wording fix
cannot fail**, so `HOISTED_KP` gained a CALL-valued known positive — `round280:476`'s neighbourhood
with only the span varied to bare — driven through the **landed** detector, not a copy of its leg.
F9 now reports `3 known positives … all flag=true`. A predicate narrowed back to label-valued reds F9.

No 12th member minted; class still 11 after the edit, as predicted from where the RHS is cut.

## 13:3x — The thing I did not expect to find: his key scores `undefined`

The fixture moved two members. His member-list guard **fired correctly** — and the score below it
**still printed `wrong on 2 of 11`, the same figure as the clean run.** `handOf.get()` returns
`undefined` for a moved member; `(undefined === 'label')` is `false`; so an unscored member is
counted as wrong-or-right by whatever the crude leg happened to say. It read 2 by coincidence — one
true miss plus one `undefined` mismatch. Had `:621` moved too, it would have read 2 with both
entries unscored.

That is my own Round 352 §2 argument turned on the instrument that carried it. Reconciled the two
line numbers (re-read at source) and made the score **refuse** on a mismatch, graded with a
stale-table KP (exit 2, REFUSED, no score) and a clean same-depth KN (exit 0, every figure restored)
in a gitignored scratch copy, anchor asserted unique before mutating. **Routed back** — the refusal
is a design change to his file.

## 13:3x — Gate

`tsc` server/client each to its own file, **both 0 bytes**. `npm test` unpiped to a file,
ANSI-stripped, rc 0 — server **140 files / 2178 passed / 1 skipped (2179)**, client **26 passed |
13 skipped (39) / 333 passed | 13 skipped (346)**, `CENSUS OK`. `probe-round269` alone via
`spawnSync` — **EXIT 0**, 56 checks, F9/F10 PASS, derived line byte-identical. Sweep by **verdict
line** — **exit 2**, `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not
conclude), 0 census problem(s), 109 deferred`.

Ports read **before and after** the sweep with the `probe-server-ownership` lib (`lsof` not
permitted here): identical on all six. Nothing leaked, and Theseus's unattributed `:8080` occupant
**predates** the sweep — his open item, settled in the direction his own fire could not reach.

## 13:4x — A claim I got wrong in my own first draft, caught by the rule that exists for it

My first draft of the research doc's §1 attributed `6fdbe294` and two others to the wrong seats from
memory. `git log --format='%h %an'` says `0156511a` **Calliope**, `6fdbe294` **Pard (Mediajunkie)**,
`41a37f79`/`b536fd03`/`f35e80e8` **Theseus** — **none of the five are mine**, and three are in a
shape I write. Corrected in the doc with the slip recorded rather than quietly fixed; this is
Round 326's lesson firing on its author.

## 13:4x — Push contention, handled without force

`git push origin HEAD:main` rejected non-fast-forward: Argus had pushed `15f93abd` (his own 13:3x
WORK fire) between my fetch and my push. Inspected it first (`docs/COORDINATION.md` + his log, no
overlap with my four files), rebased the single commit, verified the log and a clean tree, pushed.
No force push. Round 353 is `431b4c20` on `origin/main`.

**A side benefit from reading his commit:** Argus re-derived `lsof -i :3001` in his own fire today
and got the same `xian`-owned PID 47533. The `:3001` occupancy no longer rests on my Round 351 PID
reading alone — it is independently confirmed the same day by a seat where `lsof` is permitted.

## 13:4x — Drain

Mail: one routed item, landed in-fire. Two consecutive checks of `docs/mail/` and `HEAD..origin/main`
found nothing new unblocked (the second found Argus's commit, read, no action). Deferrals each carry
a named blocker, in the `Drain:` line in `COORDINATION.md`: rows 1–6 (my own false-zero record), the
109 DEFERRED probes (per-probe promotion path), `probe-round225` (xian's dev server on `:3001`), and
the pre-10-04 mail backlog (a one-line OK from xian).

**Nothing in this fire needs xian.** Argus's 10/06 Laya/AAXT memo to the CIO remains the one thread
parked on his scheduling call.

## 13:4x — Session wrap verification (required before any "done" claim)

**Step 1 — commits landed.** `git log origin/main --oneline -5`:

```
927f5e67 coord+log: 10/8 WORK fire — Round 353 drain, the routed wording fix is a fixture and his key's score now refuses
431b4c20 probes+docs: Round 353 — the routed wording fix lands as a FIXTURE, and his key scores undefined against a stale table
15f93abd coord+log: 10/8 WORK fire — Rounds 351-352 verified, no discrepancy, no-op; CLAUDE.md drain contradiction confirmed resolved
0156511a mail+docs: convention ruling to Theseus on un-numbered mail, two threads closed on independent evidence, drain-rule/exception contradiction corrected
6fdbe294 mail(janus): new baseline mail field reply-to (xian)
```

Both of this fire's commits are on `origin/main`. `git status --short` empty.

**Step 2 — each deliverable `ls`'d, all six present:**

```
scripts/probe-round269-…-dies-one-level-down.mts                            85532 bytes  (modified)
docs/research/round352-valuation-leg-key.mjs                                14229 bytes  (modified — his file)
docs/research/round353-…-scores-undefined-against-a-stale-table-…md         10218 bytes  (new)
docs/mail/daedalus-to-theseus-argus-…-scored-against-undefined-…md           8780 bytes  (new)
docs/COORDINATION.md                                                      1872925 bytes  (modified)
docs/logs/2026-10-08-0917-daedalus-opus-log.md                              20338 bytes  (this file)
```

**Step 3 —** this verification block is pushed last, after Steps 1 and 2.

**Second drain check, after a fresh `git fetch`:** `HEAD..origin/main` empty, and
`git diff --name-only 927f5e67 origin/main -- docs/mail/` empty — no new mail, no other agent push
since mine. Two consecutive clean checks, so the drain closes here, bounded.

**Mail left open deliberately:** Theseus's Round 352 inbound and my Round 353 reply both stay in
`docs/mail/` rather than moving to `read/` — the thread has an open item, since the refusal I landed
in his key is routed back for his call. Scratch `.testdata/r353/` removed before commit.

**Nothing in this fire needs xian.** Argus's 10/06 Laya/AAXT memo to the CIO remains the one thread
parked on his scheduling call.

---

## 17:2x — Briefing (STOP fire)

Wrapper synced the worktree to `origin/main` at `caaa099e`; worktree clean. Read
`docs/COORDINATION.md` (my section) and `ls docs/mail/`. One memo addressed to me, arriving with
this fire's sync: Theseus's Round 354,
`theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-your-cure-is-kept-and-your-own-mechanism-reaches-the-value-side-it-does-not-guard-2026-10-08.md`.
Read immediately, acted on in this fire.

`%an` checked before anything else (Round 326). Head commits: `caaa099e` and `02470726` **Janus**,
`609a6f33` **Calliope**, then Theseus's three. None mine, none in my subject shape. Fifth time in
ten days the check has earned its one command, though it did not catch a misattribution this fire.

## 17:2x — Round 354 reproduced before any edit of mine

`node docs/research/round352-valuation-leg-key.mjs` driven with the exit code from `spawnSync`, not
from a pipe. 6 grades true; population 194; offsets preserved true; assign-leg class 11 members;
MEMBER LISTS live === hand **true**; HAND values in the declared domain **11 of 11** (his new line);
crude leg **wrong on 2 of 11** (`:621`, `:834`); (A) **1** (`:1017`); (B) **6**; **exit 0**.

Every figure in his Round 354 §1 table reproduces. **No discrepancy anywhere.**

## 17:3x — Both his cures graded as discriminations, KN first

Scratch harness at `.testdata/r355/` (gitignored): a copy of his key at the **same directory depth**
with `.testdata/r355/scripts` symlinked to the real tree, so `../..` resolves and the population
stays the real 194 without editing his committed file (Round 332). Known negative graded **first**
— his own Round 354 §1 lesson, which exists because his first harness exited 1 with no summary line
at all. Anchor asserted to occur **exactly once** before each mutation (Round 347).

```
KN   clean committed key      exit 0   MEMBER LISTS true   11 of 11   wrong on 2 of 11
KP1  'label' -> 'labell'      exit 2   MEMBER LISTS true   10 of 11   REFUSED   (his cure)
KP2  hand key :71 -> :72      exit 2   MEMBER LISTS false  (no line)  REFUSED   (mine, 353)
```

Both hold. Nothing of his needed correcting.

## 17:3x — My own substring detector published a false zero, and its known positive caught it

Verifying his §4. The mechanism first, driven rather than reasoned (Round 331):
`'x.mts:1017|y.mts:7'.includes('x.mts:101')` returns **true** against a key that is absent; set
membership on the same pair returns **false**. His diagnosis is exact.

His reachability claim — 0 of the 11 keys is a proper substring of another — then came back **0 live
pairs and 0 on my detector's own known positive**. The detector was not blind; my fixture was. I had
built the KP by replacing a key's line number (`:71` -> `:10`), which is a prefix of nothing. Dropping
the last digit instead (`:71` -> `:7`) is a real prefix: **1 KP pair, 0 live**. Same reading, but it
was not evidence until the second attempt. Fourth time a known positive has caught a false zero of
mine.

## 17:3x — His §7 limit, driven, and it is three edits wide

He declared the residual limit precisely and I drove it rather than reading it. Three separate
one-token IN-domain edits, each `exit 0` with **both** guards reporting clean:

```
KP3  :1017  array -> label    exit 0   wrong on 3 of 11
KP4  :171   label -> array    exit 0   wrong on 3 of 11
KP5  :428   call  -> label    exit 0   wrong on 3 of 11
```

Each moves the headline by **+1 in the same direction**, so the corrupted figure stays plausible.

## 17:3x — The array witness: half the limit closes without contaminating his headline

`array` is the only one of the three classes with a witness independent of **both** valuation legs:
an array literal is the only one whose RHS *begins* with a code `[`, and neither the crude leg (any
byte `(`) nor the refined leg (any code `(`) reads the first code character. Read on the
strings-**blanked** RHS so a `[` that opens a string literal cannot be the witness.

Graded through `assignLegSites` so every fixture is a site the class actually admits (Round 341):
KP a fixture array of source-as-strings, KN1 a ternary over string literals, KN2 an index expression
whose `[` is present but **not leading**. `GRADE array witness: true`.

KP3 and KP4 now `exit 2, REFUSED` with the member named. KN exits 0, witness **11 of 11**, every
figure restored. KP5 still `exit 0 / 3 of 11` — **left open deliberately**: the only witness for
`call` is `codeParens >= 1`, which **is** the refined leg, and using it would quietly turn
`wrong on N of 11` from crude-vs-hand into crude-vs-refined. Landed in his file and routed back for
his call, revert invited, exactly as he treated mine. Commit `0dbcee3a`, pushed.

## 17:4x — THE FINDING: his mechanism is in my shared lib, and there it inverts an exit code

Censused the general shape rather than stopping at his file. First pass (2-tuple hand tables with a
bare quoted class value, >= 3 entries) found exactly **one** instance tree-wide — his key, already
cured — with the detector's own known positive confirming it can see the shape. Widened to
object-literal class fields plus an equality test: **8 files**, which pointed at `kind`.

`scripts/lib/probe-outcome.mts`. `ProbeVerdict.kind` is a free-form `string`; its legal values are
declared in that module's prose and enforced nowhere; every count in `summarise()` is an equality
against `regressionKind`. Driven **directly against the function** — which its own docblock invites
— with the KN first:

```
a FAILING hard check, kind: 'regression'   ->  code 1   ran 3   1 of 3 regression check(s) FAILED.
the same row,         kind: 'regresion'    ->  code 0   ran 2   All 2 regression checks passed.
the same row,         kind omitted          ->  code 1   ran 3   (unchanged — the safe default)
a HARD skip,          kind: 'regression'   ->  code 3   INCONCLUSIVE — ... This is not a pass.
a HARD skip,          kind: 'regresion'    ->  code 0   All 1 regression checks passed.
```

One byte, **two exit-code inversions**. A real regression leaves the population that decides the
exit code and the probe prints "passed"; a hard skip stops forcing code 3 — the **Round 223 defect
this module was written to fix**, reachable again through the field it added to classify.

The asymmetry is visible in prose I wrote: the `ProbeVerdict` docblock reasons about the MISSING
case and defaults it **in**, in two paragraphs; nothing reasons about the WRONG case, and the wrong
case defaults **out**.

## 17:4x — Why the cure is a near-miss test and not a domain list

Censused every literal `kind:` under `scripts/` (194 files, `readdirSync` walk, detector carrying a
known positive): `regression` 72 sites / 46 files, `measurement` 62 / 54, `open` 6 / 4, `check` 9 / 4,
`hard` 3 / 2, `open-item` 2 / 1, plus `search`/`expand`/`unknown`/`Chat`/`zip`/`gzip`/`literal`/`plain`
which are unrelated `kind` fields on other objects entirely.

So a fixed `{regression, measurement, open}` list would be **wrong**: `regressionKind` is
caller-configurable by design (round222, 223, 223b use `check`) and soft kinds are open-ended. An
**optional** opt-in list would be worse — decorative for every probe that never opts in, which is my
own Round 352 lesson.

The invariant that does hold: only a *misspelling of `regressionKind`* can change the exit code. So
a kind within **edit distance 1** — substitution, insertion, deletion, or **transposition** (Damerau;
plain Levenshtein scores transposition as 2) — and not equal to it now refuses: code 3, row named,
no "passed".

Graded with the live tree's own kind values as the known negatives:

```
KN  measurement / open / open-item / hard            refusal not tripped
KN  kind='regression'                                code 1, unchanged
KN  kind omitted                                     code 1, unchanged
KN  regressionKind='check', kind='measurement'       refusal not tripped
KN VERDICT: clean — nothing legitimate is reddened

KP  'regresion' 'regresssion' 'regressiom' 'rgeression' 'Regression'   all code 3, refused
KP  SKIP kind='regresion'                                              code 3, refused

LIMIT, driven: 'rgerssion' (two edits) -> code 0, All 2 regression checks passed.  NOT caught.
```

## 17:4x — Gate, each leg off its own instrument

- `tsc` server and client, each to its own file: **both 0 bytes**, exit 0.
- `npm test` **unpiped** and ANSI-stripped, exit 0 from `spawnSync`: server **140 files / 2178
  passed / 1 skipped (2179)**; client **26 passed | 13 skipped (39) / 333 passed | 13 skipped
  (346)**; `CENSUS OK` with its own `NOT CHECKED` line.
- `round269` alone via `spawnSync`: **EXIT 0**, `All 56 regression checks passed, 3 measurements,
  0 skips`, **F9 PASS**, **F10 PASS**, derived line byte-identical (4 sites / 194 files, same four
  pairs `round224-a:71->72, round224b-:57->58, round247-a:67->68, round255-t:171->172`).
- Sweep by **verdict line**, exit code from `spawnSync`: **exit 2**, `SWEEP BLOCKED — 35 of 36 swept
  probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred`; the one
  blocked is `probe-round225-a-citation-is-not-a-call.mts` (`BLOCKED exit 3`, established 32 of its
  checks and skipped 1 arm).

**Every line byte-identical to Theseus's Round 354 gate.** For a change to the function 46 files
summarise through, the **0 red across 36 swept probes** is the load-bearing reading, not the suite
counts.

## 17:4x — Drain

- Inbound mail: Theseus's Round 354 was the only memo addressed to me. Read at briefing, verified,
  answered, and the reply filed in the same fire.
- Done this fire, nothing deferred: 354 verification, both cure gradings, the §4 check (twice, once
  because my fixture was wrong), the §7 limit driven, the array witness built and graded and landed,
  the two-variant census of the general shape, the lib defect driven, the lib cure built and graded,
  the full four-leg gate, the research writeup, the reply memo, this log.
- Theseus's 354 thread stays **open** in `docs/mail/` — my reply routes the array witness back for
  his call, so it carries an open action item and must stay visible. Not moved to `read/`.
- **Deferred with a named blocker: none.**
- Still parked on xian: Argus's 10/06 Laya/AAXT memo to the CIO, on his scheduling call. Not mine.

## 17:4x — Session wrap verification (required before any "done" claim)

**Step 1 — commits on `origin/main`,** after `git fetch -q origin`:

```
b477ffea mail(daedalus->theseus,argus): Round 355 — 354 reproduces whole, both cures hold, his declared limit is three edits wide and half cured, and his mechanism inverts an exit code in probe-outcome.mts
77fe69cb lib+docs: Round 355 — his Round 354 mechanism is in probe-outcome.mts, where one byte turns a failing check into exit 0
0dbcee3a probes: Round 355 — his two cures confirmed, and the in-domain limit he declared is cured for the one class with an independent witness
caaa099e mail(janus->calliope): public brief copies replaced
02470726 briefs: replace confidential April brief copies with pointers (xian approved 2026-10-08; public repo)
```

All three of this fire's commits are on `origin/main`, and `caaa099e` below them is the baseline the
wrapper synced to at fire start.

**Step 2 — each deliverable, `ls`'d:**

```
docs/research/round355-his-mechanism-is-in-my-shared-lib-and-there-a-one-byte-typo-turns-a-red-into-exit-0-2026-10-08.md   13659 bytes
docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-your-mechanism-is-in-my-shared-lib-and-there-one-byte-turns-a-red-into-exit-0-2026-10-08.md   11239 bytes
scripts/lib/probe-outcome.mts                                      15286 bytes  (the cure)
docs/research/round352-valuation-leg-key.mjs                       21172 bytes  (the array witness, routed to Theseus)
docs/logs/2026-10-08-0917-daedalus-opus-log.md                     32999 bytes  (this log)
```

**Step 3 — `docs/COORDINATION.md` and this log are committed and pushed last,** after Steps 1 and 2.

Nothing claimed done in this entry is unverified. The one thing this fire opened and did not finish
is stated as such in both the writeup and the memo: the `label` <-> `call` half of Theseus's §7 limit
is **open**, driven open (KP5, `exit 0`, `3 of 11`), and deliberately not cured, because the only
witness available for `call` is the refined leg and using it would change what his headline figure
measures. That is a declared limit of the instrument, not deferred work, and it carries no blocker.
