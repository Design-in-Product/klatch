# Daedalus session log — 2026-08-16

Model: Opus 5 · Worktree: `/Users/xian/Development/klatch-worktrees/daedalus` · Branch: `claude/daedalus-cycle`

---

## 09:17 PT — START fire

Briefing: `git log` (worktree synced to `origin/main` at `3720bea` by the wrapper),
`docs/COORDINATION.md`, `ls docs/mail/`, `docs/briefs/cross-pollination/current.md`.

**Two inbound memos, both addressed to me, both actioned in this fire.** Not a
no-op fire.

### 1. Iris's wire fork — decided by her, landed by me (`ed4bc61`)

`iris-to-daedalus-cc-theseus-team-tool-use-wire-fork-decided-2026-08-15.md`
resolved the fork my 8/15 memo left open: the live `tool_use` card's label rides
the event rather than being derived client-side from `toolInput`.

**Her correction to me, verified rather than accepted.** I had cited
`useStream.ts:23,25` as the live consumer in both my 8/15 memo and my
COORDINATION entry. Ran `grep -rn "useStream'" packages/client/src` this fire:
two hits, both in `__tests__/useStream.test.ts`. **Only its own test imports it —
my citation was wrong.** The live consumer is `useStreams.ts` (plural). Recording
the correction here rather than editing the 8/15 entry.

**What landed:**

- `StreamEvent.inputSummary?: string` (`packages/shared/src/types.ts`), documented
  with the deciding memo and the fallback contract (absent, not `undefined`, for
  tools with no summary vocabulary).
- `toolUseInputSummary(toolName, toolInput)` exported from
  `packages/server/src/claude/client.ts`, called from **both** the emit site and
  the `createToolUseArtifact` call.

**One deliberate divergence from Iris's literal instruction, flagged to her in
the reply.** She wrote "populated at the same emit site from whatever string
`createToolUseArtifact` would compute." Taken literally that puts a second copy
of the recall vocabulary at `client.ts:870`, ~230 lines from the copy at
`client.ts:637` — the same two-places-to-reword defect we agreed to avoid, moved
from the client to the server rather than removed. The shared helper makes live
and reload agree **by construction rather than by discipline**.

**Tests: 4 added to `round52b-tool-use-stream-event.test.ts`.** The property
pinned is *the live string and the persisted string are the same string* — each
asserts the event against the `message_artifacts` row from the same turn, because
hardcoding the prose in both places would pass while the two drifted. Covered:
search, expand, a retry turn with differing args (the 2.0–2.2 cards/turn case),
and `'inputSummary' in event === false` for a non-recall tool.

**Stated plainly, not glossed: there is no live-model test of this.** All four
drive a mocked Anthropic stream. The wire shape is verified; "a human sees the
right words on the card at the right moment" is not, and can't be until Iris's
consumer lands.

### 2. Theseus's Round 56 §4 — stale probes, and the class was still live in my own instruments (`68b2005`)

He asked for my view on the cheapest standing practice for probe-wording
staleness (two independent instances in one week).

**My answer: the two instances are not the same failure, and the
cross-pollination brief's generalisation ("match structural markers, not prose")
is half-wrong.**

- **Case A** — probe reads output we generate deterministically (vitest totals).
  **Zero is never legal.** Fix is fail-closed parsing, not better patterns.
- **Case B** — probe reads model output scored against our build's prose
  (`edgeReachable`). **Zero is legal and often the finding.** Fail-closed would
  have thrown on exactly the arms where "nothing fired" was the result.

One-liner offered: *every pattern declares whether zero is a legal answer for it,
and the probe enforces the declaration.*

**Also flagged to him:** retaining both Round 54 and Round 56 patterns is the
right local move but has a half-life. The Round 54 pattern now matches zero
*forever, correctly*; a stale Round 56 pattern matches zero *wrongly*; **on the
printout those are identical.** Retention without a declared expectation raises
the noise floor that hid the original failure. Suggested `expect:
'zero-since-round-56'` vs `expect: 'nonzero-on-this-build'` — a per-pattern field
and a comparison, not a redesign. Offered, not assigned; his file.

**The Case-A half is mine, so I fixed my own instruments rather than
recommending it.** Went to read `round54-revert-probe.mjs` /
`round56-revert-probe.mjs` expecting the ANSI bug fixed and nothing else.
**Two silent-zero paths were still there, one day after both of us called the
class fixed:**

1. **A drifted revert anchor printed `!!` and continued** — file written back
   unmodified, suite green, row reads as *"not load-bearing"*, which is the one
   conclusion the probe exists to license. **My probe could have told me a
   load-bearing piece wasn't, and I'd have believed it.** Now fatal.
2. **`(clean.match(/Tests …/) || ['?'])[0]`** — the fallback that turned the ANSI
   bug into a legal-looking `Tests ?` for a whole round. The 8/15 fix removed the
   cause and left the converter. Now throws with the output tail.

Plus a green-total-with-zero-failures row now prints an explicit
`!! NOT LOAD-BEARING, or the revert did not take`. Both throws fire while the
source file is in its original state, so a failing probe can't leave the tree
dirty.

**The class survived the fix, in the same file, in two places, for a day. That is
a better argument for a standing practice than either original instance.**

**Offered to Theseus, not landed:** `edgeGapLine` is module-private
(`recall.ts:208`, checked) and his probes are standalone `.mjs` talking to SQLite
directly, so deriving Case-B patterns from the build needs either an export of
the function or of the invariant substrings. **I did not land either — an export
with no caller is speculative and he's the caller.** Also flagged:
`probe-recall-tool.mjs:721-723` recomputes the reachable/unreachable split rather
than reading what the server rendered — a second implementation of
`edgeGapLine`'s arithmetic, same drift risk, independent of the wording question.

Also answered his §2/§3/§5: accepted the F confound, agreed J′ first, accepted
his sharper reading of my §3 (*"the risk didn't materialise on an arm that cannot
express it"*), and confirmed from source that `RECALL_MAX_EXPAND_ROWS = 30`
(`recall.ts:560`) with the slice at `recall.ts:661`. Ranked a second model after
J′ but before the miss case.

---

## Verification — run this fire, not recalled

```
npm run typecheck        → clean ×3 (shared, server, client)
npm test                 → 1364 passed server (81 files) | 230 passed, 13 skipped client
                           server +4 vs Argus's 1360 this morning = my 4 new tests
node scripts/round56-revert-probe.mjs → 9 reverts, all red: 9/2/6/7/1/1/1/1/1
                           (zero drift from 8/15) — no spurious throws
node scripts/round54-revert-probe.mjs → 8 reverts, all red: 14/10/2/1/3/1/4/2
                           — no spurious throws, no NOT LOAD-BEARING rows
```

Both probes re-run **after** the fail-closed change specifically to confirm the
hardening doesn't throw on the healthy path. It doesn't.

## Mail

**Filed (2):**
- `daedalus-to-iris-cc-theseus-team-inputsummary-is-on-the-wire-2026-08-16.md`
- `daedalus-to-theseus-cc-iris-xian-team-stale-probes-zero-is-two-different-answers-2026-08-16.md`

**Closed to `read/` (4):** Theseus's Round 55, my Round 56 reply, my 8/15
tool-use-wire memo, Iris's fork-decided memo — each fully answered by a later
memo in its thread.

**Left open, correctly:** `iris-to-daedalus-import-confirm-scope-2026-08-09.md`
(waits on her review with xian) and
`iris-to-daedalus-cc-team-carried-context-visibility-decision-2026-08-13.md`
(parent thread). Confirmed handled in prior fires via `docs/logs/2026-08-13-*`
and `2026-08-14-*` rather than assumed.

## Unchanged and still with xian

**Option (2)** and **backfill** (all 72 imports on `default-entity`). No movement
this fire and I did not restate them at length to Iris, since restating reads as
progress.

## Wrap verification

Per CLAUDE.md Session Wrap Protocol.

**Step 1 — commits present locally** (`git log --oneline -4`):

```
3a26d66 mail+log+coordination: 8/16 START — wire field landed, probes made fail-closed
68b2005 probes: make the revert probes fail closed on their own anchors
ed4bc61 tool_use: carry inputSummary on the live event, from one shared helper
3720bea log+coordination: 8/16 START fire — no-op, verified not assumed   ← pre-fire HEAD
```

**Step 2 — deliverable files exist** (`ls`, all four returned):

```
docs/logs/2026-08-16-0917-daedalus-opus-log.md
docs/mail/daedalus-to-iris-cc-theseus-team-inputsummary-is-on-the-wire-2026-08-16.md
docs/mail/daedalus-to-theseus-cc-iris-xian-team-stale-probes-zero-is-two-different-answers-2026-08-16.md
docs/mail/read/iris-to-daedalus-cc-theseus-team-tool-use-wire-fork-decided-2026-08-15.md
```

`git status --short` clean — the revert probes restored every file they touched.

**Step 3 — delivery, verified rather than assumed.** Pushed to `origin/main` this
fire (the prompt grants network and instructs pushing; measured 8/10 that the
earlier no-network claim was false). Confirmed by `git fetch` + reading the
remote ref, not by the push command's own output:

```
$ git log origin/main --oneline -4
a2f6ae6 mail+log+coordination: 8/16 START — wire field landed, probes made fail-closed
68b2005 probes: make the revert probes fail closed on their own anchors
ed4bc61 tool_use: carry inputSummary on the live event, from one shared helper
3720bea log+coordination: 8/16 START fire — no-op, verified not assumed

$ git ls-tree --name-only origin/main docs/mail/ | grep 2026-08-16
docs/mail/daedalus-to-iris-cc-theseus-team-inputsummary-is-on-the-wire-2026-08-16.md
docs/mail/daedalus-to-theseus-cc-iris-xian-team-stale-probes-zero-is-two-different-answers-2026-08-16.md
```

Both memos are on `main` where Iris and Theseus will actually look — per the
worktree mail discipline, they would not have found an unblock notice sitting on
`claude/daedalus-cycle`.

*(This entry as first written said "committed locally only" and declined to claim
delivery. That was written before the push and is corrected here rather than
left to read as the final state — `a2f6ae6` is the commit that carried the
uncorrected version.)*

---

## 13:17 PT — MID fire

Theseus's J′ memo landed between fires
(`docs/mail/theseus-to-daedalus-cc-iris-xian-team-jprime-ran-depth-was-never-the-variable-and-the-false-absence-is-back-2026-08-16.md`).
It answers my §1, §2 and §4 and asks for exactly one build change. Took it.

### 1. Round 58 — the marker phrases are named, and the names are the render

**His ask (§4), in his shape:** export `edgeGapLine`'s invariant substrings as
named constants and **not** the function. His reason (b) is the one I'd have
argued: a probe that can call the renderer agrees with the build by
construction, so the pattern can never break loudly — the failure the probe
exists to catch, one level in.

`RECALL_MARKER_PHRASES` in `packages/server/src/claude/recall.ts`. 17 strings,
`Object.freeze`d including `edgeSides`.

**The property that makes it worth anything:** it is the only place those
strings are written. `scopeGapLine`, `edgeGapLine` and `gapSentences` all
assemble from the record. Exporting a *copy* alongside the literals would have
shipped a constant that goes stale exactly the way his `REACHABLE_R54` did —
worse than the status quo, because it would look solved.

**Found doing it, and it was mine, in this file, this morning.**
`gapSentences` quoted `"not of your transcript"` and `"earlier" or "later"` as
its own literals while claiming to explain the lines that render them. Reword
one and not the other and the header sentence points at a line that no longer
exists. Same defect as the stale probe, inside a single function. Both now
interpolate `P.interiorPhrase` / `P.edgeSides`, and `round58` §5 asserts every
phrase the header quotes appears in a line the body actually rendered.

I did not find that by looking for it. I found it because his §4 made me read
the file for duplicated literals, which is a better reason than having been
careful.

### 2. The thing his own argument implies, which he did not take

**A probe that imports the substrings also agrees with the build by
construction.** It will never again read a false zero; it will also never
notice that the wording moved. Had he wired the constants in without anything
else, he would have had strictly *less* drift detection than today and it would
have felt like more.

So the detection moved somewhere it belongs:
`packages/server/src/__tests__/round58-recall-marker-phrases.test.ts`, +14
tests, writing **every one of the 17 strings out longhand**, deliberately
duplicating the source. A reworded marker fails in CI in seconds rather than
being inferred hours later from a behavioural run by an instrument that has to
be re-read to be trusted.

Two jobs, two instruments. Drift detection is a test's job; behaviour under
whatever wording ships is his probe's job. His probe was doing both, badly at
the first, because a regex reports its own staleness as a legal value.

The tests also cover two things the constants alone don't:

- **Which reachable clause this build ships** — address form present, Round 54
  form absent, plus a fixture where *no* edge marker is legal. So "zero
  occurrences" now has a documented answer instead of two indistinguishable
  ones.
- **A renderer going back to a literal of its own** — each marker is compared
  both to the record's composition *and* to the longhand string, so the two
  failure directions (record reworded / render diverged from record) are
  separately detectable.

### 3. Verification — run this fire, not recalled

```
$ npm test
Test Files  82 passed (82)
     Tests  1378 passed (1378)          ← server, +14
Test Files  17 passed | 13 skipped (30)
     Tests  230 passed | 13 skipped (243)   ← client, unchanged
exit 0

$ npm run typecheck
clean (shared / server / client)
```

1364 → 1378 matches the 14 new tests exactly; Calliope independently re-verified
1364 at her 12:38 rollup, so the baseline is not my own recollection.

**Import path verified by running it**, from a `.mjs` through `npx tsx` — the
way `probe-recall-tool.mjs:153-154` imports `RECALL_NEIGHBOUR_RADIUS` — rather
than inferred from the `export` keyword:

```
exported: [ 'RECALL_MARKER_PHRASES' ]
{ "open": "[… ", "close": " …]", "interiorPhrase": "not of your transcript", … }
```

**Drop-in regexes built from the record and run**, since `{`, `}` and `"` need
escaping into a `RegExp` and I was not going to hand him code I hadn't executed:

```
EDGE_LINE      : [ '2', 'later' ]
REACHABLE_ADDR : [ '1', 'weekly-review', '7', '7' ]
REACHABLE_OLD  : absent (expected)
UNREACHABLE    : [ '1' ]
GAP_LINE       : true
```

Chain checked at both joints rather than assumed at either: `round58`'s `toBe`
assertions pin *render === composition of the constants*; the run above pins
*regexes-from-constants === that composition*. Both scratch scripts deleted;
`git status` clean of them.

### 4. What I deliberately did not do

**Did not touch `scripts/probe-recall-tool.mjs`.** He is mid-experiment with K
live and a possible paired K-vs-J arm ahead. Changing an instrument between arms
is the confound he has spent three rounds fighting, and introducing one into his
file would be a poor way to repay a memo that spent half its length correcting
itself. Constants are landed, the drop-in is in the memo, wiring is his.

**Did not restate option (2) or backfill at him.** Both still with xian, no
movement this fire, and restating them reads as progress.

**Did not act on his `probe-recall-tool.mjs:721-723` reply.** He filed it rather
than fixing it and gave the right reason — the duplicate arithmetic is currently
load-bearing *as an independent check*, and the fix is to cross-check it against
the rendered numbers rather than replace it. His file, his call, agreed.

### 5. Carried from his corrections

- **J is 4/5, not 5/5** for taking-the-address-and-withholding. Recorded. His
  mechanism — *"a summary written before the exceptions are found does not
  update itself"* — is the same shape as the stale regex and the same shape as
  `gapSentences` quoting its own copy: a description that stopped being derived
  from the thing it describes.
- **"Round 56 made an evicted marking readable. It did not make it read."**
  That replaces my "0/5 false absence" framing, which read as a property of the
  build when it is a property of the build *conditional on the address being
  taken* — and Round 56 ships nothing that makes it taken. Adopting his
  sentence.
- **Depth was never the variable.** K vs J is byte-identical in everything
  visible pre-decision; K took the address 6/10 against J's 3/5. The length
  hypothesis is *not* established either (F 5/5 vs K 6/10, p = 0.23).

### 6. Mail

Filed
`docs/mail/daedalus-to-theseus-cc-iris-xian-team-marker-phrases-exported-and-where-drift-detection-moved-2026-08-16.md`.

Closed to `read/` — the Round 56 thread, fully superseded by the J′ memo and my
reply to it:

- `theseus-to-daedalus-cc-iris-xian-team-round56-the-address-is-taken-11-of-13-and-taking-it-is-the-whole-difference-2026-08-15.md`
- `daedalus-to-theseus-cc-iris-xian-team-stale-probes-zero-is-two-different-answers-2026-08-16.md`

Left open, correctly: the J′ thread (his §5 list — second model, `expect` field,
miss case — all his and all live) and
`daedalus-to-iris-cc-theseus-team-inputsummary-is-on-the-wire-2026-08-16.md`,
awaiting Iris's ack on the one divergence I flagged.

### 7. Unchanged and still with xian

**Option (2)** and **backfill** (all 72 imports on `default-entity`). No movement
this fire.

## Wrap verification — MID fire

Per CLAUDE.md Session Wrap Protocol. Filled in below from the actual commands,
after the commit and push, not before.

**Step 1 — commits present** (`git log --oneline -3`):

```
a9b07e2 mail+log+coordination: 8/16 MID — Round 58 landed, drift detection moved to the suite
b9a9fd2 round58: name the gap markers' invariant substrings, from one source
797f06d log: 8/16 MID — wrap verification with the actual push hash   ← pre-fire HEAD (Calliope's)
```

**Step 2 — deliverable files exist** (`ls`, all three returned):

```
packages/server/src/claude/recall.ts
packages/server/src/__tests__/round58-recall-marker-phrases.test.ts
docs/mail/daedalus-to-theseus-cc-iris-xian-team-marker-phrases-exported-and-where-drift-detection-moved-2026-08-16.md
```

`git status --short` clean — both scratch verification scripts deleted.

**Step 3 — delivery, verified against the remote rather than the push output.**
`git fetch` then read the remote ref:

```
$ git log origin/main --oneline -3
a9b07e2 mail+log+coordination: 8/16 MID — Round 58 landed, drift detection moved to the suite
b9a9fd2 round58: name the gap markers' invariant substrings, from one source
797f06d log: 8/16 MID — wrap verification with the actual push hash

$ git ls-tree --name-only origin/main packages/server/src/__tests__/ | grep round58
packages/server/src/__tests__/round58-recall-marker-phrases.test.ts

$ git ls-tree --name-only origin/main docs/mail/ | grep 2026-08-16
docs/mail/daedalus-to-iris-cc-theseus-team-inputsummary-is-on-the-wire-2026-08-16.md
docs/mail/daedalus-to-theseus-cc-iris-xian-team-marker-phrases-exported-and-where-drift-detection-moved-2026-08-16.md
docs/mail/theseus-to-daedalus-cc-iris-xian-team-jprime-ran-depth-was-never-the-variable-and-the-false-absence-is-back-2026-08-16.md

$ git ls-tree --name-only origin/main docs/mail/read/ | grep -E "round56-the-address|stale-probes"
docs/mail/read/daedalus-to-theseus-cc-iris-xian-team-stale-probes-zero-is-two-different-answers-2026-08-16.md
docs/mail/read/theseus-to-daedalus-cc-iris-xian-team-round56-the-address-is-taken-11-of-13-and-taking-it-is-the-whole-difference-2026-08-15.md
```

The memo is on `main`, which is where Theseus will look — per the worktree mail
discipline he would not have found it on `claude/daedalus-cycle`. Both closes
landed in `read/` and neither is still in `docs/mail/`.

*(This log entry's wrap section was written with the verification blocks empty
and filled in after the push, so the hashes are the ones that actually landed
rather than the ones I expected to. `a9b07e2` carries the empty version; this
paragraph and the blocks above are the correction, pushed in the follow-up
commit below.)*
