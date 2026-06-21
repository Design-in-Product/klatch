# Argus — Task List of Record

**Persists across days.** The drain-loop's task source. Unblocked items the cycle picks up; **Blocked-on-xian** items surface to the attention rollup (the cycle batches, doesn't act) via Calliope's verified sweep — keep this list true so her sweep finds real items.

Updated: 2026-06-21 (Phase 2 launch — initial v0.2 task list)

## Unblocked (cycle can advance)

- [ ] **Test rounds following Daedalus** — extended-coverage as he lands composition increments. *Increment 1 (atomic roster + dual affordance, `7d42822`) DONE 6/21 → `composition-gesture-extended.test.ts` (7 tests: multi-unknown join, partial-valid atomicity, route-level roster order, dedupe, 2 invariant pins) on `claude/argus`.* **Remaining as he ships them:** setup-panel fields, agent picker (existing / JIT-import / new session), Broadcast/Roundtable/Directed behavior, @mention composes-with-all-modes, clone-from-existing-klatch. He owns ChannelSidebar dual-affordance tests; I own the new-surface behavioral/edge coverage.
- [ ] **Flake-radar — ImportDialog "claude.ai import failure"** — Daedalus flagged (`spine-merged` memo, 6/21): passed 46/46 in isolation, failed once in-suite. Async-timing family (same as singleThread flakes). Triage + harden in a later fire. *Unblocked.*
- [ ] **Mail drain** — keep `docs/mail/` at inbox-zero per Mail Handling; respond/act/route same turn; `git mv` closed threads to `read/`; push mail commits to `main` immediately. (Continuous.)
- [ ] **Cycle log + session log upkeep** — turn-by-turn during xian-present sessions; brief entry per substantive fire; batch no-ops. (Continuous.)
- [ ] **Flaky-test triage — SidebarRedesign DOM-order** — "chats appear before klatches in DOM order" intermittent. **Coordinating with Daedalus (6/21):** he's taking the query-side root cause (`getAllChannelsEnriched` coarse-timestamp tie); I **HOLD** the test-side harden until he reports which ordering lands, so we don't both touch it. Same nondeterminism class as round25 (fixed) + getChannelEntities (Daedalus fixed `ce.rowid`).
- [ ] **AAXT continuation candidates** (5/18 green-lit, UI-as-context line) — ProjectSettings (F5.1), EntityManager, MessageList (F1.4). Larger initiative; pick up in a quiet test-round window, not driven without one.

## Blocked-on-xian (cycle surfaces to attention rollup; doesn't act)

- **`DEFAULT_MODEL` flip `claude-opus-4-7` → `claude-opus-4-8`** (low-urgency decision) — Opus 4.8 (released 5/28) is Anthropic's recommended ceiling, reinforced by the 6/12 Fable/Mythos government suspension. Adding 4.8 to `AVAILABLE_MODELS` is routed to Daedalus (code, his lane); flipping the *default* is a product decision like the 4.6→4.7 flip (which got Calliope/xian sign-off). Not urgent — 4.7 is not deprecated. Gates on Daedalus's SDK bump + 4.8 add landing first. (Sweep #13.)
- *(merged-and-clear)* — vocab-fallout + round25 flake fixes merged to `main` (`1a29830`, 6/21); composition extended coverage on `claude/argus` (`d38a89f`, ready to merge).

## Watch items (cycle monitors; one-line outbound when condition met)

- ~~**Daedalus `getChannelEntities` ordering finding**~~ **RESOLVED 6/21** — Daedalus fixed on `claude/daedalus`: `ORDER BY ce.added_at ASC, ce.rowid ASC` (rowid preserves user-picked roster order — better than my `e.created_at/e.id` suggestion; his atomic-roster create made it a live common-path bug). Lands with his composition merge. Thread closed both sides.

## Recurring items (START dispatcher promotes when `next_due ≤ today`)

| Item | Cadence | next_due | last_completed | Notes |
|---|---|---|---|---|
| Weekly intel sweep | weekly | 2026-06-28 | 2026-06-21 | AI-landscape sweep → curated review in `docs/intel/`. **Sweep #13 done 6/21** (`2026-06-21-sweep-curated.md` — curated 4 automated sweeps 5/25–6/15; live DB audit + NSA MCP audit both clean). Lives here, not a separate cron — the hourly cycle's START promotes it. |

## Notes

- Tandem with **Daedalus** (`:17`). Building mode = the engine (test rounds chase his commits); planning mode (current) = the cycle keeps us current. Lower-priority-unblocked beats higher-priority-blocked (don't-sit-passively, 5/12).
- Stagger: Calliope `:13`, Daedalus `:17`, Argus `:43`.
- Weekly intel sweep is a recurring row (cadence-aware via START), not a separate cron — the standard hourly cycle handles the once-a-week shape with no special-casing.
