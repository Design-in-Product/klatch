# The expand surface mis-describes its own numbering — confirmed, pinned, and deliberately not yet fixed

**Author:** Daedalus · **Date:** 2026-08-19 (WORK fire, 13:17 PT)
**Reported by:** Theseus, §5 of
`docs/mail/theseus-to-daedalus-cc-xian-team-both-arms-reproduce-the-guard-fires-and-the-header-mis-describes-its-own-numbering-2026-08-19.md`
**Cost:** zero API spend — source reads plus one new test file, 0 model calls.
**Delivered:** `packages/server/src/__tests__/recall-position-numbering-scope.test.ts` (new, 5 tests);
one comment correction in `scripts/probe-recall-tool.mjs`.

---

## 1. The claim, and it is correct

`expandConversationRange` makes two statements about what a *position* is:

- **The header**, `recall.ts:784` — *"Positions N–M of X, **your own turns** in that
  conversation, in order."*
- **The empty-range branch**, `recall.ts:738` — *"Positions count **only your own turns** in
  that conversation, so a number past its end returns nothing…"*

Neither is true. Verified from source this fire rather than taken from the memo:

`expandConversationRange` resolves rows through `getEntityTranscriptRange`
(`queries.ts:1028`), whose `scoped` CTE numbers `seq` over `entityTranscriptWhere`'s predicate
(`queries.ts:626-668`):

```sql
(m.entity_id = ?
 OR (m.role = 'user' AND m.entity_id IS NULL AND EXISTS (
       SELECT 1 FROM channel_entities ce
       WHERE ce.channel_id = m.channel_id AND ce.entity_id = ?)))
```

That is the agent's own utterances **plus every user turn addressed to it**, which the
function's own comment states outright: *"An entity's transcript is its own utterances PLUS
what was said to it."* In a 1-1 with the owner there is no third speaker, so the only thing
the word "only" can be excluding is the owner's turns — and those are counted. **The two
readings differ by 2× in the ordinary case.**

Theseus verified this against the probe corpus (`vesper-1-1-N1T1`: 60 rows, 30 `user` / 30
`assistant`, `matchCount` 60). I verified it from the SQL and then from a render — see §3.

## 2. Why the wording matters more than a wording bug usually does

An agent reading the header literally takes an offer of `1–28` to be 28 of its own ~30 turns
— substantially the whole conversation — when it is 28 of 60 rows, under half. That is the
wrong quantity to be wrong about on **the one surface whose characteristic failure is *read
part, report on all***.

**What is not being claimed.** This is a render defect with a plausible mechanism, not a
measured effect. No run has been scored for it. It is specifically **not** offered as the
cause of the M2/M5 false clears — separating "misread the numbering" from "read six rows and
stopped" needs an arm nobody has built. Theseus said this himself and it is worth restating
here, because a doc is where a hedge quietly becomes a finding.

It also **does not touch arm N1's validity**: both offers are mis-scaled by the same factor,
so the relative cost N1 manipulates is untouched — 28 vs 27 stays 28 vs 27.

## 3. New, adjacent, and mine: nothing pinned either string

`RECALL_MARKER_PHRASES` (Round 58) freezes 17 invariant substrings — but its scope is the
**scope-gap and edge markers**, deliberately. It does not reach the expand header or the
empty-range branch. And `grep "your own" packages/server/src/__tests__/` returned **zero**
before this fire.

So the one piece of prose on the recall surface that *teaches the agent how to read the
numbers* was the piece with no drift detection on it — the same shape as the stale
`REACHABLE_R54` recogniser Round 58 exists to prevent, on a surface Round 58 did not cover.

Closed with `recall-position-numbering-scope.test.ts`, in two halves:

- **§1 — the durable half.** Asserts the *scope of the numbering from the render*: twelve
  interleaved rows in a 1-1, of which the agent authored six; `matchCount` is 12, `Positions
  1–12` renders, and the body carries six `] Vesper: ` lines and six `] user: ` lines. Also
  pins the boundary that separates the two readings — position 7 resolves, position 13 does
  not; under "own turns only" the end would be at 7. This half survives the wording fix, and
  would fail if a future change to `entityTranscriptWhere` quietly narrowed positions back to
  authored rows even with every string still matching.
- **§2 — a change-detector on a known defect.** Both sentences written out longhand,
  duplicating the source, per the Round 58 mechanism. Annotated in-file as a known defect
  held rather than endorsed.

`npx vitest run …recall-position-numbering-scope.test.ts` → **5 passed**. The tests passing is
what establishes the mis-description renders verbatim in this build.

## 4. The fix is written but deliberately not landed, and this is the reasoning

**Decision: the wording does not change until arm N1 has run live.**

N1 is a single-variable arm by construction — `leadPairs: 4 → 15`, one field, everything else
byte-identical to M, proved by diff on 8/18 (171 insertions, 0 deletions, `FILLER_LEAD[0-4]`
untouched). It exists to be compared against arm M, which ran under this exact prose.
Rewording the expand header now would make N1 a **two-variable arm**: the config change *and*
a change to how an offered range is described, landed in the same run.

Stated at the right strength, because the contamination is not uniform:

- N1's **primary** dependent variable — which of two offers the agent takes — is measured at
  the *search* render, strictly **upstream** of any expand call. The header cannot reach it.
- What the header can reach is **everything after the first expand**: second and subsequent
  calls within a run, and any narrative scoring of what the agent concluded from what it
  read. That is where M's own recorded outcomes (M2, M5) live.

So the exposure is secondary rather than fatal — and that is exactly the kind of confound
that is cheap to avoid and expensive to argue about afterwards. Five live runs on
`claude-opus-5` is not a spend to make twice because a comment improved mid-flight.

**The sequence:** N1 runs → the wording lands as its own change with a round number → §2 of
the new test fails, which is the fix arriving, and its literals get updated.

**Proposed replacement**, so this does not need re-deriving later — no behaviour attached:

| Site | Current | Proposed |
|---|---|---|
| `recall.ts:784` | `your own turns in that conversation` | `your turns and the turns addressed to you` |
| `recall.ts:738` | `Positions count only your own turns in that conversation` | `Positions count your turns and the turns addressed to you` |

Theseus's ordering is right and worth keeping: **`:738` needs it more than the header**, because
that branch is teaching the numbering at the moment the agent has just got it wrong.

Open question deferred with it: in a **klatch**, a third agent's turns genuinely have no
position, and the current wording is a clumsy attempt to say so. The replacement above is
correct in a 1-1 and still correct-but-incomplete in a klatch. Whether the sentence should
vary by channel type is a design question, not a typo fix, and it should not be settled inside
this change.

## 5. Theseus's §3 correction to my guard comment — accepted and landed

He ran the positive control my guard had never had: a copy of the arm at `leadPairs: 16`,
run and deleted in-process, tracked file untouched. It threw, exit 1, arithmetic correct.
**The 8/18 defect is closed by a test rather than by an argument**, which is a better status
than the one I filed it at.

His correction to my comment is right, and I verified the ordering myself rather than accept
it: the holder entity is POSTed at `probe-recall-tool.mjs:1083` and the 1-1 channel at
`:1114-1123`, both **before** the guard at `:1170`. So the clause *"a half-seeded scratch DB is
never left behind"* over-claims — rows are exactly right, zero written, but each aborted run
leaves an **empty entity and an empty 0-message channel**.

Corrected in place with a dated note. **Comment-only**, proved rather than asserted: every
line in the diff is a `//` line (`git diff | grep -vE "^[+-]\s*//"` → empty), and
`node --check` parses. The instrument's seeding is untouched, which matters because an arm is
about to run through it.

It also confirms his 8/18 code-read: **`--dry` is genuinely not server-free.**

## 6. Where N1 stands

Nothing here moves it. Both arms are instrument-confirmed in two sandboxes independently.
xian's go-ahead is given (`janus-to-daedalus-cc-team-xian-approves-n1-live-run-plus-kudos-2026-08-19.md`).
**The live run is Theseus's to drive**, per the standing convention on this experiment —
Daedalus builds, Theseus drives — and per the plain fact that exactly one of us should spend
five opus runs. I have not run it and am not going to.
