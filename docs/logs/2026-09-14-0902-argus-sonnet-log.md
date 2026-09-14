# 2026-09-14 — Argus (Sonnet) — duty-cycle log

## 09:02 PT — START fire

Briefing: `git log` at `50f8febf` (Calliope's own 9/14 START no-op). Worktree
(`/Users/xian/Development/klatch-worktrees/argus`, branch `claude/argus-cycle`) clean, tracking
`origin/main`. `docs/COORDINATION.md` Argus section read (own last entry: 9/13 STOP fire,
checkpoint `197bd876`). `docs/mail/` listed — no new mail addressed to Argus by name; the open
thread (`theseus-to-daedalus-cc-xian-janus-argus-calliope-204-holds-and-there-are-two-resolvers-not-one-2026-09-13.md`)
is cc-only, correctly still in `docs/mail/` (Daedalus's §6 and xian's §7 both still open).
Cross-pollination brief (`docs/briefs/cross-pollination/current.md`, 2026-09-14) read — its lead
item is Klatch's own Round 205 finding, accurately summarized; no new Argus action.

**`packages/`+`scripts/` diff since my own checkpoint (`197bd876`) is not empty:** `cc10370b`
(Theseus, Round 205 — scripts/docs only, no `packages/` file touched) — a new probe
(`scripts/probe-round205-the-plan-and-the-apply-pick-opposite-ends-of-a-duplicated-name.mts`) and
writeup (`docs/research/round205-the-plan-and-the-apply-pick-opposite-ends-of-a-duplicated-name-2026-09-13.md`).
Mail: `theseus-to-daedalus-cc-xian-janus-argus-calliope-204-holds-and-there-are-two-resolvers-not-one-2026-09-13.md`
(same file, covers Round 204 confirmation + files Round 205's §2 finding) — read in full.

**Round 205, independently checked, not re-trusted:** read `entity-backfill.ts:429-432` (plan's
`new Map(SELECT id, name FROM entities)`, no `ORDER BY` — a `Map` keeps the last key written) and
`entity-resolve.ts:96-100` (`getAllEntities()` → `queries.ts:358` `ORDER BY e.created_at ASC`,
then `.find()` — first match) directly. Confirms the memo's core claim exactly: the plan and the
apply resolve a duplicated name from opposite ends of the same table, with no shared id passed
through — when two entities share a normalized name, the sheet's `MATCHED-BY-NAME → "Name"` row
gives the operator no way to see the two are different ids.

**Re-ran the probe myself, unmodified:** `probe-round205-...` → **27 · 0 failed · 1 open · 2
measurements** — matches Theseus's claimed line exactly, arm for arm (A: divergence demonstrated
end to end, `plan.rows[0].targetEntityId` newer / `channel_entities` after apply older; B: sheet
shows name only, no id, no collision block; C: undo reverts cleanly since it holds the written id,
not the plan's; D: real March corpus measured 68 entities/24 duplicate-name groups/all 24 resolve
to a different id under the two rules; E: the sheet's existing-agent note names one of four
Chief-of-Staff rows with no sign the other three exist; F3 OPEN on purpose — nothing here is a
live mis-write against *this* corpus since it has 0 projects and 0 identity-claim guesses, but the
disagreement is structural, firing on 24 of 24 duplicate groups).

**Re-ran the other probes this thread touches, unmodified, to confirm nothing regressed:**
`probe-round204-...` → **40 · 0 failed · 0 open · 3 measurements** (Theseus's own re-confirmation
number, matches); `probe-round203-...` → **15 · 0 failed · 2 open · 7 measurements** (unchanged);
`probe-round201-...` → **26 · 3 failed · 1 open** (D1/E2/E3, the known residual, unchanged).

**ROADMAP.md checked, not assumed:** the Agent-continuity bullet (line 277) was brought current
through Round 205 by Calliope's own 9/13 STOP commit (`90106934`) — states the plan/apply
divergence, the recoverable-via-undo bound, and that no data has been written outside test
fixtures. Not stale this cycle.

**Suite:** `npm run typecheck` clean across all three workspaces (shared/server/client).
`npm run test -w packages/server` → **1683/1683** (104 files, unchanged — Round 205 touched no
`packages/` file, consistent). `npm run test -w packages/client` → **311/311, 13 skipped**
(unchanged). `git status` clean throughout. No code changes needed this fire.

**Status: available.** No action required of Argus beyond this sweep — Daedalus's §6 (which
resolver rule should win) and xian's §7 (is the March corpus current) are both still open and not
this seat's to close.
