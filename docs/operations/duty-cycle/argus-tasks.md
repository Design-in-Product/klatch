# Argus — Task List of Record

**Persists across days.** The drain-loop's task source. Unblocked items the cycle picks up; **Blocked-on-xian** items surface to the attention rollup (the cycle batches, doesn't act) via Calliope's verified sweep — keep this list true so her sweep finds real items.

Updated: 2026-06-21 (Phase 2 launch — initial v0.2 task list)

## Unblocked (cycle can advance)

- [ ] **Test rounds following Daedalus** — when Daedalus lands composition-gesture implementation (`docs/ux/spec-composition-gesture.md`) on `claude/daedalus`, write extended-coverage tests for the new surface: New Klatch button (paired with New Chat), setup panel fields, agent picker (three paths: existing / JIT-import / new session), Broadcast/Roundtable/Directed behavior, @mention composes-with-all-modes, clone-from-existing-klatch. Watch his commits. *Status: he launched 6/21 + replied PM #972; composition impl not started yet — this waits on his first impl commit.*
- [ ] **Mail drain** — keep `docs/mail/` at inbox-zero per Mail Handling; respond/act/route same turn; `git mv` closed threads to `read/`; push mail commits to `main` immediately. (Continuous.)
- [ ] **Cycle log + session log upkeep** — turn-by-turn during xian-present sessions; brief entry per substantive fire; batch no-ops. (Continuous.)
- [ ] **Flaky-test triage — SidebarRedesign DOM-order** — Daedalus flagged `SidebarRedesign.test.tsx` "chats appear before klatches in DOM order" as intermittently failing (COORDINATION note). Same order-nondeterminism class as the round25 flake fixed 6/21. Investigate + harden. *Unblocked.*
- [ ] **AAXT continuation candidates** (5/18 green-lit, UI-as-context line) — ProjectSettings (F5.1), EntityManager, MessageList (F1.4). Larger initiative; pick up in a quiet test-round window, not driven without one.

## Blocked-on-xian (cycle surfaces to attention rollup; doesn't act)

- *(none currently)* — the vocab-fallout fix + round25 flake fix are done and on `claude/argus`, ready for Calliope/xian to merge to `main` (a merge action, not a blocked-on-xian decision).

## Watch items (cycle monitors; one-line outbound when condition met)

- **Daedalus `getChannelEntities` ordering finding** — routed 6/21 (`argus-to-daedalus-getchannelentities-ordering-2026-06-21.md`): `getChannelEntities` orders by `ce.added_at ASC` with no secondary key → nondeterministic same-second order; suggested `, e.created_at ASC, e.id ASC`. Non-blocking, his lane. Watch for disposition.

## Recurring items (START dispatcher promotes when `next_due ≤ today`)

| Item | Cadence | next_due | last_completed | Notes |
|---|---|---|---|---|
| Weekly intel sweep | weekly | 2026-06-21 | 2026-05-18 | AI-landscape sweep → curated review in `docs/intel/`. **Overdue** (last 5/18). Lives here, not a separate cron — the hourly cycle's START promotes it. PM CIO `valid_from`/`valid_until` proposal (6/15) is the kind of cross-project item these sweeps surface. |

## Notes

- Tandem with **Daedalus** (`:17`). Building mode = the engine (test rounds chase his commits); planning mode (current) = the cycle keeps us current. Lower-priority-unblocked beats higher-priority-blocked (don't-sit-passively, 5/12).
- Stagger: Calliope `:13`, Daedalus `:17`, Argus `:43`.
- Weekly intel sweep is a recurring row (cadence-aware via START), not a separate cron — the standard hourly cycle handles the once-a-week shape with no special-casing.
