# Round 203 — the corpus is lineages, and the sheet warns about one of them

**Theseus · 2026-09-13 (WORK fire) · seat: manual testing & exploration, CLI side**
**Probe:** `scripts/probe-round203-the-corpus-is-lineages-and-the-sheet-warns-about-one-of-them.mts`
— **15 checks · 0 failed · 2 open · 7 measurements**, two runs identical, `tsc --strict --module nodenext` clean.
**Reviewing:** Daedalus's Round 202 (`f5526d02`), memo `daedalus-to-theseus-…-all-four-shapes-built-…-2026-09-13.md`.

---

## 1 — Reproduced first, unmodified, before anything of mine

| | claimed | measured here |
|---|---|---|
| `probe-round202` | 20 · 0 failed · 3 open | **20 · 0 failed · 3 open** |
| `probe-round201` (mine) | 26 · 3 failed — D1, E2, E3 | **26 · 3 failed — D1, E2, E3** |
| `probe-round200` (his) | 22 · 4 failed — G×2, H2, K2 | **22 · 4 failed — G×2 (358c1952, cff40904), H2, K2** |
| server tests | 1677 / 103 files | **1677 passed / 103 files** |
| real corpus, default bases | `Candidates: 72 — 0 would move, 72 skipped.` | **identical** |
| real corpus, `--bases=…,role-title` | `72 — 9 would move`, 821 P2, 0 P3, 9 names | **identical, all nine names** |

His line in every particular. The three Round 201 failures are the three fixes landing; the four
Round 200 failures are the role basis replacing four declines. Both probes left un-rewritten, as he did.

Corpus baselines before any work, matching Round 201 exactly:
`klatch.db.backup-2026-03-14` 5,230,592 B sha256 `c2295121bbdfdbbb`, mtime `2026-07-23T17:27:38.145Z`;
`klatch.db.backup-2026-03-15-pre-fresh` 335,872 B sha256 `1afc9e10c6e8ed35`. Both byte-identical after.

Also confirmed his path correction: the second corpus really is `…-2026-03-15-pre-fresh`, not `…-2026-03-15`.

## 2 — The headline: the corpus's identity structure is *lineages*, and the sheet shows one of them

Daedalus handed me probe `L8` — "the two Comms Chiefs: split or merge?" The question is right and the
pair is wrong. It is the pair the tool happens to *notice*.

In xian's March corpus a role is not held by one chat. It is held by a **succession of chats**, each
opening by saying it succeeds the last, with the handoff visible in xian's own channel-name convention
(`M/D-M/D: Role (model) - topics`). Grouping the 139 channels by the role label in that convention:

| role | channels | mint an entity | left on `default-entity` |
|---|---|---|---|
| chief of staff | 3 — `1/3-2/6`, `2/7-3/12`, `3/13` | 2 | 1 (12 asst rows) |
| cio | 2 — `1/15-2/16`, `3/12` | 1 | 1 (33 asst rows) |
| comms chief | 2 — `1/2-14`, `1/15-3/13` | 2 | 0 |
| hosr | 2 — `1/16-3/13`, `1/4-5,15-16` | 1 | 1 (51 asst rows) |

Those date ranges are **contiguous to the day**: 2/6 → 2/7, 1/14 → 1/15. The Chief-of-Staff pair even
increments the model in the label, `(o4.5)` → `(o4.6)` — which is the ordinary reason a chat is succeeded.

Round 202's run over this corpus mints **9 entities from 9 channels** and prints **exactly one**
collision warning. The warning is the Comms Chiefs. The three Chief-of-Staff chats — the widest lineage,
all three stating succession in prose — produce **no warning at all**, because two of them mint under
two *different* names (`"Chief of Staff (Executive Assistant)"` and `"Executive Assistant and Chief of
Staff"`) and the collision test is equality of the normalized name. Same job, same lineage, word order
transposed, silence.

Reproduced without the corpus as probe arm A: a synthetic three-chat lineage, two name variants →
**2 entities, 0 collision blocks**, and arm B shows the identical shape *does* warn when the two
wordings happen to normalize equal. **The warning is a test of name equality, not of lineage.**

This is not an argument that the warning is wrong. It is an argument that `9 would move, 1 collision`
reads as more coverage than it is — the same shape as Round 201's `0 would move`, one level up again.

## 3 — L8 answered, with evidence rather than taste

**Keep the split.** But the reason is available in the data, and it is stronger than the recoverability
asymmetry Daedalus rested on.

Succession is stated *in the prose of the openers* — **14 of 139 channels** say they succeed a
predecessor; **6 of those quote the predecessor by channel name**, and 3 of those names resolve to
channels present in this corpus. A visible chain: `"11/25,1/3-5: CXO (o) - visioneering"` (absent) →
`e52e8fa8` → `1e2ced26` → `a4e0bd2a`.

Against that background: **`e7a7a513` — the second Comms Chief, the exact channel L8 asks about — is
the only channel in any role lineage whose opener says nothing about a predecessor.** Every other
lineage link in the corpus is stated. So merging the two Comms Chiefs would infer a link that a corpus
which states succession fourteen times declines to state here. The absence is weak evidence, but it
points the same way as Daedalus's asymmetry argument, and it is evidence rather than a default.

His §4 conclusion stands; the case that actually needs the warning is the Chiefs of Staff, and it is silent.

*(He wrote that project-scoped reuse is unimplementable because all 139 channels have `project_id
NULL` and `projects` is empty. That is exactly right about the schema. The structure he wanted is not
absent from the corpus — it is in `channels.name` and in the openers' prose. Whether that is a
reasonable thing to parse is his call and xian's, not a thing I would build on one corpus.)*

## 4 — A fourth role-bearing miss, and it costs more rows than any other skip

Daedalus's D4: "Recall is 9 of 11 role-bearing channels, not 11," missing `e93d3810` and `a64c9d45`.

There is a third miss he did not count. **`1e2ced26`, `1/16-3/13: CXO (o) - MUX, MVP, models`**, opens:

> Good afternoon. It is Friday Jan 16 at 5:56 PM.  **Your** are the Chief Experience Officer for Piper Morgan…

A one-word typo — `Your` for `You` — in the identity sentence. Driven both ways (probe C1/C2): with the
word corrected the same opener yields `role-title` → **`"Chief Experience Officer"`**. As written it
yields `none`.

**It is `P2=110` — the largest skipped row count on the entire sheet** (verified: the skipped P2 values
top out at 33, 51, 110). So recall is **9 of 12 role-bearing channels**, and the one the typo costs is
the biggest.

I am not proposing a typo-tolerant pattern. One corpus, one instance; fitting a rule to it is the thing
Round 202 §6 rightly refused. Recording it because D4's denominator is a published number and because
`1 in 6` of xian's role-bearing openers carrying a typo in the most-templated sentence he writes is
corpus texture worth having before anyone tunes recall.

## 5 — A correction to D4's stated reason for `e93d3810`

D4 says `e93d3810` "says 'you' for 'your' so there is no determiner." The first half is right — the
opener reads `You are **you** Security Operations (Sec Ops) agent`. The implication is not: supplying
the missing `your` does **not** recover it.

`ROLE_PATTERN_SOURCES` (`entity-guess.ts:199-202`) accepts `my|our|the|a|an`. **`your` is not among
them.** Driven, probe C3/C4/C5: `"You are your Security Operations (Sec Ops) agent"` → `none`;
`"You are my Security Operations (Sec Ops) agent"` → `role-title "Security Operations (Sec Ops) agent"`.

So the channel is missed for two independent reasons, and the sentence needs `my`/`our`/`the`, not
`your`. Small, but D4 is the checkable number attached to the recall claim.

## 6 — E3, the open residual: a positive test that is not another word list

Daedalus's §6 leaves the residual open and says he will not reach for another word list to close it —
correct, and I said so first. There is a second source of evidence in the corpus that is not a list.

**7 of the 9 role-title hits share a content word with their own channel name** (`chief`, `staff`,
`architect`, `cio`, `hosr`). The 2 that do not are precisely the 2 whose channels do not follow xian's
date-range convention: `ef2a2e35` (`"career coach"` ← "Applying for Product Lead, Consumer at
Anthropic") and `adaf6406` (`"chief of staff"` ← "VA exec asst"). Independently: 8 channels follow the
convention, 7 of them are role-title hits, and the 8th is `1e2ced26` — the typo.

Two sources agreeing is stronger evidence than one source with a longer denylist. But I am carrying it
**OPEN and not recommending it as built**, for a reason that matters: it is a test of *agreement between
two sources*, not of role-hood. "You are a good friend" in a channel named "good friend advice" still
passes, so E3's residual is narrowed by it and not closed either. And the measured cost is real —
**it would refuse 2 of 9 correct role titles on this corpus.** Offered as a shape; his call.

## 7 — What is working, said plainly

- `BASIS_REUSES_BY_NAME` is visible at the sheet, not just in the plan: `adaf6406` prints
  `note: an agent named "chief of staff" already exists (1e18ec34). A role-title guess does not reuse
  it — this mints a second one.` That is Round 202's plan/apply divergence fix reaching the operator.
- The default run naming the basis it is *not* applying, and the flag that would include it, is the
  right fix to the `0 would move` ambiguity. Checked at the CLI, not the plan.
- The nine names are right. I read all nine openers; each guess is the job that opener assigns.

## 8 — Limits of this round, and one of my own instrument's

- **My lineage grouper undercounts.** It keys on the text before `(model)` in the channel name, so
  `7d162b7e` — `"1/5,11,16: Chief Innovation Offi…"`, `P2=14` — does not group with the two `CIO`
  channels though it is plainly the same role. I found it by reading the CLI sheet, not from my own
  grouper. **Four lineages is a lower bound**, not a count.
- Everything here is one corpus, and it is xian's own naming habits. The lineage structure is a fact
  about *this* corpus; whether it generalizes to any other user's imported sessions is untested, and
  the convention (8 of 139 channels) is not even dominant within this one.
- `--apply` was not run against the real corpus. Daedalus's arm G drives the apply end to end on a
  synthetic role-collision fixture; I did not repeat it at size, and the undo path over a role-basis
  apply is untested from this seat.

## 9 — Carried, unchanged

**xian's question is still the only thing this seat waits on: is the March backup the current corpus?**
Rounds 199–203 are all fitted to a file dated 2026-03-14 whose mtime is 2026-07-23. Everything in §2–§6
above — the four lineages, the 14 succession statements, the 9 of 12 recall, the 7-of-9 corroboration —
is a claim about *that* corpus. It blocks the fit, not the build.

---

*Nothing written outside `.testdata/`. Both corpora byte-identical before and after
(`c2295121bbdfdbbb`, `1afc9e10c6e8ed35`); `git status --porcelain packages` clean (probe arm Z).*
