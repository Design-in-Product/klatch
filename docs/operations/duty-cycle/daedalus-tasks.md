# Daedalus — Task List of Record

**Persists across days.** The drain-loop's task source. Unblocked items the cycle picks up; blocked-on-xian items surface (Calliope's verified sweep promotes them into the attention rollup — the cycle batches, doesn't act).

Created: 2026-06-21 (Phase 2 launch). Format per `duty-cycle-klatch-v0.2.md`.

## Unblocked (cycle can advance)

- [ ] **Composition gesture implementation** — the 1.0 critical-path blocker. Spec: `docs/ux/spec-composition-gesture.md`. Build on `claude/daedalus`; pushing branch work is unblocked, **merge to `main` is review-gated (blocked-on-xian)**. **Corrected scope (6/21):** substrate already mostly built — `channels` has `type`+`mode` (no migration), routes create+assign, `parseMentions`/`resolveMentions` exist, an earlier klatch form exists. Work = evolving the front-door to spec. Sub-phases:
  1. ✅ **Data model** — no migration needed (`mode` column = spec's orchestration_mode). Done: atomic roster at creation (`createChannel(...entityIds)` + route validation) — kills stray-default-entity wart.
  2. ✅ **Spine increment 1** — dual New Chat/New Klatch affordance + Purpose label. Tests green (server 1096, ChannelSidebar 18).
  3. [ ] Agent picker polish — Path A typeahead search + chips + roles-first tiering (current: flat checkbox list works).
  4. [ ] Path B (JIT import inline) + Path C (start-new agent: continue role / new agent).
  5. [ ] @mention autocomplete in klatch input (routing via existing `resolveMentions`).
  6. [ ] Clone-klatch (copy channel + channel_entities, new IDs, no history).
  7. [ ] Cross-reference surface: agent's 1-1 chat shows which klatches it's in.
  8. [ ] project-optional flip — **pending Iris** (sidebar-rendering reconciliation) + Argus test coordination.
- [ ] **Finding 1 dedup logic (UUID re-import matching)** — Iris's UX answered (`iris-to-daedalus-uuid-matching-ux-reply-2026-06-20.md`): project match → silent attach + toast; channel match (UI) → inline "View existing / Import as new copy"; channel match (MCP) → 409 with `reason` + `existing_channel_id`. Implementable now. Remaining round-trip work from 4/28.
- [ ] **Round 31b cosmetic follow-ups** (from Argus, none blocking): (1) `package-builder.ts:58` mislabels Klatch-to-Klatch hop as "Original claude.ai session"; (2) format_version on import path — gate or document permissive-by-design; (3) empty `entities: []` import — auto-attach default entity or accept un-exportable channel as valid. Small, pick up between larger work.
- [ ] **Channel-list ordering check** (Argus finding follow-up, 6/21) — `getChannelEntities` same-second-tie nondeterminism fixed (`ce.rowid` tiebreak, roster-order). Argus flagged the `SidebarRedesign` "chats before klatches" flake as possibly the same class — check `getAllChannelsEnriched` ordering for a coarse-timestamp tie; if it's a query fix, it's mine.
- [ ] **Pre-beta vocab copy sweep** (Iris flagged 6/20) — `entity`→`agent/role`, `channel settings`→`klatch/chat settings` across the rest of the UI (composition surface already uses correct vocab). Low effort; needs to land before beta invites. Coordinate with Iris so I don't collide with her in-flight copy work.
- [ ] **Mail drain + log upkeep** (continuous) — keep `docs/mail/` at inbox-zero per Mail Handling; move closed threads to `docs/mail/read/`; cycle log + session log turn-by-turn.

## Blocked-on-xian (cycle surfaces, doesn't act)

- **Merge of composition-gesture work to `main`** — review-gated per branch discipline. Surfaces when a coherent increment is built and verified on `claude/daedalus`.
- **Round-trip MAXT** (assigned to Theseus 4/28, `daedalus-to-theseus-roundtrip-maxt-2026-04-28.md`) — behavioral round-trip testing; parked, needs xian to direct Theseus.

## Watch items (cycle monitors; triggers action when condition met)

- ✅ ~~**Mode-key naming reconciliation**~~ **RESOLVED 6/21** — Iris confirmed (`iris-to-daedalus-composition-spec-ack-2026-06-21.md`): store the internal code keys `panel|roundtable|directed`; §10 vocab table is canonical (`panel`=internal, `Broadcast`=user-facing). No key rename.
- **Composition-spec → demo-able** (shared with Calliope's watch list) — when implementation produces something demo-able / client-legible (a working flow, screen recording, transporter-device artifact), note it so Calliope can trigger her Janus one-liner. Trigger lives downstream of my own implementation.

## Recurring items (START dispatcher promotes when `next_due ≤ today`)

| Item | Cadence | next_due | last_completed | Notes |
|---|---|---|---|---|
| Rebase `claude/daedalus` against `main` | daily | 2026-06-22 | 2026-06-21 | Worktree discipline (v0.2): long-lived branch rebases daily, merges to main on wrap. |

## Notes

- Tandem with Argus (`:43`; I'm at `:17`). Who-touches-what: I implement composition surface; Argus writes extended-coverage tests against my new surfaces as they land. Coordinate via COORDINATION.md + mail. Mutual-assessment "what surprised me" memo after a few days on cycle.
- Most composition work lands on `claude/daedalus` and is push-unblocked; the *merge* is the xian-gated step. Don't sit passively (5/12): when blocked on review, drop to the next unblocked item (Finding 1 dedup, round31b follow-ups, vocab sweep).
