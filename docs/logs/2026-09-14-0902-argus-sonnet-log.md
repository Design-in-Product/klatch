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

## ~13:35 PT — WORK fire

Pulled: fast-forwarded from `50f8febf` to `0e751031`. Substantial landing since my own 09:02
checkpoint: Rounds 206–208 (Daedalus) and the merge of `origin/claude/cowork-import-hardening`
(`d2233464`, the fabricated-turn fix — 12 days undelivered, flagged by me on 9/2, closed this fire
by Calliope + Daedalus). Five new mail files read in full, all cc-only (none addressed to Argus by
name, so nothing owed as a direct reply): `daedalus-to-calliope-...-you-were-right-it-never-merged-it-has-now`,
`daedalus-to-theseus-...-refuse-is-the-answer-and-the-apply-no-longer-re-resolves`,
`daedalus-to-theseus-...-your-picker-is-server-complete-and-the-tiebreak-is-worse-than-206-said`,
`janus-to-calliope-...-4c-RATIFIED-per-channel-plus-a-scaling-proposal` (governance ruling, no
testing action), `theseus-to-daedalus-...-206-holds-and-the-import-is-the-path-with-the-live-hit`.

**Independently verified at source, not re-trusted:**
- `ambiguous-name` skip reason exists exactly where claimed (`entity-backfill.ts:220,541`) — the
  plan now refuses a name carried by >1 entity rather than picking one.
- `sameNameEntityIds` field: present on `ResolvedEntity` (`entity-resolve.ts:88`), set only when
  `matches.length > 1` (line 147, `.find` → `.filter` confirmed), threaded onto the import response
  (`routes/import.ts:426-427`) and declared on the client (`api/client.ts:384`).
- `entityName`-as-stored: all three `resolveImportEntity` return paths (`bound-existing`,
  `matched-by-name`, `minted`) now return `entityName: <record>.name`, not the caller's string.
  `ImportDialog.tsx:416` — `entityName: result.data.entityName ?? confirmedName` — prefers the
  server's name, falls back to typed only when the server resolved none. Matches the memo's claim
  exactly.
- Tiebreak: `queries.ts:370`, `getAllEntities()` now `ORDER BY e.created_at ASC, e.id ASC`, with a
  comment correctly describing it as deterministic-not-correct (a same-millisecond tie falls to a
  random UUID).
- `fixture-provenance.test.ts:180` pins `turnsEmitted: 66` against the committed 1,001-event
  capture (`exports/sessions/theseus-2026-03-22.jsonl`) — matches the merge memo's headline number
  exactly (was 75, 9 fabricated).
- `grep -rn MUTATION packages/*/src` → 0 hits, confirming Daedalus's mutation-testing reverts left
  no marker behind.

**Suite, re-run myself:** `npm run typecheck` clean (shared/server/client). Server
**1776/1776 passed, 1 skipped** (111 files) — matches exactly. Client **311/311 passed, 13
skipped** (37 files) — matches exactly. `git status` clean throughout, no code changes needed.

**Probes re-run, unmodified — one environmental finding along the way:**
`probe-round205-...` first attempt hit `SqliteError: database disk image is malformed` /
`SQLITE_CORRUPT` inside `planEntityBackfill` — not the failure Daedalus described. Traced it: my
own 09:02-fire run of this same probe had left a 4.2 MB uncommitted `f-reach.db-wal` sidecar in
`.testdata/r205-probe/`, and arms D/E/F build their working copies with a bare
`fs.copyFileSync(CORPUS, X)` — unlike arm A's `buildCorpus`, which unlinks `-wal`/`-shm` first,
D/E/F never do, so a stale WAL from a prior run replays against the freshly-copied file and
corrupts it. This is a probe-script hygiene gap, not a product defect — worth Theseus knowing
before he "retires or re-aims" this probe per Daedalus's §5, since the next person to run it cold
will hit the same false corruption if a previous run left sidecars behind. **After `rm -rf
.testdata/r205-probe` and a clean re-run, it reproduces Daedalus's described outcome exactly**: A1/A2/A4/A5/B1/B3
fail as expected (Fix B skips the group, Fix A means nothing is written), then it **crashes at
line 276** on `recs[0]` being `undefined` — the apply no longer writes an undo record for a refused
group, exactly as reported. Not fixing or re-aiming this probe myself; it's Theseus's per Daedalus's
memo. `probe-round207-...` → **30 checks · 1 failed · 3 open** — D1 fails (confirm step still sends
a name not an id — item 1, unbuilt, matches "picker is server-complete, client work remains"), D5/E3/G5
open as before. No regressions from Round 208 visible in this probe (it doesn't yet exercise
`sameNameEntityIds`, since it predates that field — not a gap in Round 208, just an unmodified probe
testing what it was written to test).

**ROADMAP.md checked, found stale:** line 277 (Agent-continuity bullet) stops at Round 205
("found a live, unresolved defect, not yet answered"). No mention of Round 206 (refusal + apply
binds the plan's id), Round 207 (import-path findings), Round 208 (`sameNameEntityIds` +
entityName-as-stored), or the Cowork merge (`d2233464`) landing on `main`. **Flagged, not fixed —
not this seat's doc to own** (Calliope's, per established pattern).

**Status: available.** No product-code defects found this fire; one probe-hygiene gap flagged
above (informational, addressed to whoever next drives `probe-round205`). Nothing in the new mail
requires an Argus reply — all cc-only, no open ask directed at this seat.
