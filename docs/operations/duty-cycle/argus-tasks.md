# Argus — Task List of Record

**Persists across days.** The drain-loop's task source. Unblocked items the cycle picks up; **Blocked-on-xian** items surface to the attention rollup (the cycle batches, doesn't act) via Calliope's verified sweep — keep this list true so her sweep finds real items.

Updated: 2026-06-21 (Phase 2 launch — initial v0.2 task list)

## Unblocked (cycle can advance)

- [ ] **Test rounds following Daedalus** — extended-coverage tests for the composition surface as he lands it: New Klatch button (paired with New Chat), setup panel fields, agent picker (three paths: existing / JIT-import / new session), Broadcast/Roundtable/Directed behavior, @mention composes-with-all-modes, clone-from-existing-klatch. *Status: composition spine **IN FLIGHT** (Daedalus Fire 1, 6/21) — `composition-gesture.test.ts` (route-level roster) + `createChannel(...entityIds)` atomic roster on `claude/daedalus`. I layer the behavioral/edge coverage as his surfaces land + merge. He owns the ChannelSidebar dual-affordance tests; I own round33b + the new-surface behavioral coverage.*
- [ ] **Mail drain** — keep `docs/mail/` at inbox-zero per Mail Handling; respond/act/route same turn; `git mv` closed threads to `read/`; push mail commits to `main` immediately. (Continuous.)
- [ ] **Cycle log + session log upkeep** — turn-by-turn during xian-present sessions; brief entry per substantive fire; batch no-ops. (Continuous.)
- [ ] **Flaky-test triage — SidebarRedesign DOM-order** — "chats appear before klatches in DOM order" intermittent. **Coordinating with Daedalus (6/21):** he's taking the query-side root cause (`getAllChannelsEnriched` coarse-timestamp tie); I **HOLD** the test-side harden until he reports which ordering lands, so we don't both touch it. Same nondeterminism class as round25 (fixed) + getChannelEntities (Daedalus fixed `ce.rowid`).
- [ ] **AAXT continuation candidates** (5/18 green-lit, UI-as-context line) — ProjectSettings (F5.1), EntityManager, MessageList (F1.4). Larger initiative; pick up in a quiet test-round window, not driven without one.

## Blocked-on-xian (cycle surfaces to attention rollup; doesn't act)

- *(none currently)* — vocab-fallout + round25 flake fixes **merged to `main` (`1a29830`, 6/21)** per xian's authorization; main green (1089 server / 197 client).

## Watch items (cycle monitors; one-line outbound when condition met)

- ~~**Daedalus `getChannelEntities` ordering finding**~~ **RESOLVED 6/21** — Daedalus fixed on `claude/daedalus`: `ORDER BY ce.added_at ASC, ce.rowid ASC` (rowid preserves user-picked roster order — better than my `e.created_at/e.id` suggestion; his atomic-roster create made it a live common-path bug). Lands with his composition merge. Thread closed both sides.

## Recurring items (START dispatcher promotes when `next_due ≤ today`)

| Item | Cadence | next_due | last_completed | Notes |
|---|---|---|---|---|
| Weekly intel sweep | weekly | 2026-06-21 | 2026-05-18 | AI-landscape sweep → curated review in `docs/intel/`. **Overdue** (last 5/18). Lives here, not a separate cron — the hourly cycle's START promotes it. PM CIO `valid_from`/`valid_until` proposal (6/15) is the kind of cross-project item these sweeps surface. |

## Notes

- Tandem with **Daedalus** (`:17`). Building mode = the engine (test rounds chase his commits); planning mode (current) = the cycle keeps us current. Lower-priority-unblocked beats higher-priority-blocked (don't-sit-passively, 5/12).
- Stagger: Calliope `:13`, Daedalus `:17`, Argus `:43`.
- Weekly intel sweep is a recurring row (cadence-aware via START), not a separate cron — the standard hourly cycle handles the once-a-week shape with no special-casing.
