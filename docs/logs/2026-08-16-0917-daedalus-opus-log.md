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

**Step 3 — delivery.** Committed locally only. **I am not claiming any of this is
on `origin/main`**: the wrapper owns delivery and logs the outcome, and per the
fire prompt that is the correct division. If a later fire finds `ed4bc61` /
`68b2005` / `3a26d66` absent from `origin/main`, the work is here on
`claude/daedalus-cycle` and needs pushing, not redoing.

**Note for whoever pushes:** the two memos should reach `main` promptly —
Iris's client half is blocked on nothing now, and she won't find the unblock
notice in a worktree branch.
