# Argus — Task List of Record

**Persists across days.** The drain-loop's task source. Unblocked items the cycle picks up; **Blocked-on-xian** items surface to the attention rollup (the cycle batches, doesn't act) via Calliope's verified sweep — keep this list true so her sweep finds real items.

Updated: 2026-06-21 (Phase 2 launch — initial v0.2 task list)

## Unblocked (cycle can advance)

- [ ] **Test rounds following Daedalus** — extended-coverage as he lands composition increments. *Increment 1 (atomic roster + dual affordance, `7d42822`) DONE 6/21 → `composition-gesture-extended.test.ts` (8 tests). My Fire-1 invariant finding drove enforcement: Daedalus shipped `chat`+multi→400 (`d4fc8a5`); I **flipped** that PIN allowed→rejected + added a 1:1 boundary test. `klatch`+empty kept permissive (his round7 catch — valid 1-agent klatch). Suite 1107 server / 198 client green. **Increment 2** (agent picker, `07bda25`) coverage written (`composition-picker-extended.test.tsx`, 5 tests: cap / chip-removal / handle-filter / partition / end-to-end roster — pass in isolation) but **PARKED as `describe.skip` 6/21** — heavy ChannelSidebar interaction tests destabilize the singleThread client suite (see client-suite-fragility finding). Un-skip when the suite can absorb heavy client interaction tests.* **Remaining as he ships them:** setup-panel fields, agent picker (existing / JIT-import / new session), Broadcast/Roundtable/Directed behavior, @mention composes-with-all-modes, clone-from-existing-klatch. He owns ChannelSidebar dual-affordance tests; I own the new-surface behavioral/edge coverage.
- [ ] **Flake-radar — ImportDialog "claude.ai import failure"** — Daedalus flagged (`spine-merged` memo, 6/21): passed 46/46 in isolation, failed once in-suite. Async-timing family (same as singleThread flakes). Triage + harden in a later fire. *Unblocked.*
- [ ] **Mail drain** — keep `docs/mail/` at inbox-zero per Mail Handling; respond/act/route same turn; `git mv` closed threads to `read/`; push mail commits to `main` immediately. (Continuous.)
- [ ] **Cycle log + session log upkeep** — turn-by-turn during xian-present sessions; brief entry per substantive fire; batch no-ops. (Continuous.)
- [ ] **Flaky-test triage — SidebarRedesign DOM-order** — root cause CONFIRMED by Daedalus 6/21 (`daedalus-to-argus-sidebar-ordering-rootcause`): `getAllChannelsEnriched` orders by `c.created_at ASC` with no secondary key → same-second tie breaks on random `uuidv4` id (same class as round25 + getChannelEntities). His two-layer fix (query `+ c.rowid` tiebreak; **client explicit type-sort** chats-before-klatches) is **queued, not landed yet** (branch-push-blocked). **HOLD test-side until his layer-2 lands**, then assert the invariant directly: *within a project group, every chat precedes every klatch in DOM order*, with a fixture that creates a klatch BEFORE a chat in the same render (the case that flakes today). Type-split is the load-bearing assertion; within-type recency is secondary.
- [ ] **AAXT continuation candidates** (5/18 green-lit, UI-as-context line) — ProjectSettings (F5.1), EntityManager, MessageList (F1.4). Larger initiative; pick up in a quiet test-round window, not driven without one.

## Blocked-on-xian (cycle surfaces to attention rollup; doesn't act)

- **`DEFAULT_MODEL` flip `claude-opus-4-7` → `claude-opus-4-8`** (low-urgency decision) — Opus 4.8 (released 5/28) is Anthropic's recommended ceiling, reinforced by the 6/12 Fable/Mythos government suspension. Adding 4.8 to `AVAILABLE_MODELS` is routed to Daedalus (code, his lane); flipping the *default* is a product decision like the 4.6→4.7 flip (which got Calliope/xian sign-off). Not urgent — 4.7 is not deprecated. Gates on Daedalus's SDK bump + 4.8 add landing first. (Sweep #13.)
- *(merged-and-clear)* — vocab-fallout + round25 flake fixes merged to `main` (`1a29830`, 6/21); composition extended coverage on `claude/argus` (`d38a89f`, ready to merge).

## Watch items (cycle monitors; one-line outbound when condition met)

- ~~**Daedalus `getChannelEntities` ordering finding**~~ **RESOLVED 6/21** — Daedalus fixed on `claude/daedalus`: `ORDER BY ce.added_at ASC, ce.rowid ASC` (rowid preserves user-picked roster order — better than my `e.created_at/e.id` suggestion; his atomic-roster create made it a live common-path bug). Lands with his composition merge. Thread closed both sides.
- **Model discovery/validation split** — xian-flagged 6/21 ("tops out at 4.7… brittle"); routed to Daedalus (`argus-to-daedalus-model-discovery-validation-split-2026-06-21.md`). `/api/models` discovers dynamically but `AVAILABLE_MODELS` is the `ModelId` type + the 400-gate (4 sites) + the capability map → picker can offer a model the server 400s (reachable today w/ Opus 4.8). Migration sketch provided. **Watch:** when Daedalus picks a shape, I write the test round (validation-accepts-discovered, offline-fallback, capability-from-metadata, picker↔validation consistency invariant). Related to the Blocked-on-xian `DEFAULT_MODEL` flip (distinct: that's the product default decision; this is the structural gate).
- **Client-suite fragility (singleThread timing)** — routed to Daedalus 6/21 (`argus-to-daedalus-client-suite-fragility-2026-06-21.md`). Heavy ChannelSidebar interaction tests (my increment-2 picker coverage) are unreliable in the singleThread client suite — they time out + cascade (latent flake 0–3/run → 11–36 with the live file). Parked my coverage as `describe.skip`. Composition is client-heavy → growing 1.0 client coverage needs a strategy (lighter design / per-test testTimeout / pool tweak). **Watch:** Daedalus's disposition; un-skip `composition-picker-extended.test.tsx` once resolved. Same family as the ImportDialog flake.

## Recurring items (START dispatcher promotes when `next_due ≤ today`)

| Item | Cadence | next_due | last_completed | Notes |
|---|---|---|---|---|
| Weekly intel sweep | weekly | 2026-06-28 | 2026-06-21 | AI-landscape sweep → curated review in `docs/intel/`. **Sweep #13 done 6/21** (`2026-06-21-sweep-curated.md` — curated 4 automated sweeps 5/25–6/15; live DB audit + NSA MCP audit both clean). Lives here, not a separate cron — the hourly cycle's START promotes it. |

## Notes

- Tandem with **Daedalus** (`:17`). Building mode = the engine (test rounds chase his commits); planning mode (current) = the cycle keeps us current. Lower-priority-unblocked beats higher-priority-blocked (don't-sit-passively, 5/12).
- Stagger: Calliope `:13`, Daedalus `:17`, Argus `:43`.
- Weekly intel sweep is a recurring row (cadence-aware via START), not a separate cron — the standard hourly cycle handles the once-a-week shape with no special-casing.
