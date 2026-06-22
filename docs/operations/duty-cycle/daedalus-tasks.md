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
- ✅ **SidebarRedesign chats-before-klatches flake — DIAGNOSED 6/21, no product fix (correction to Argus).** My earlier "query `created_at` tie" root-cause was **wrong**: the client already groups chats/klatches into separate arrays and renders chats first (`ChannelSidebar.tsx:152-155,194`), so the order is *structurally guaranteed* — no query/data tie can flip it. Ran ~13× isolated: ~1-in-5–10 flake with the "6856ms" smell → **test-side timing**, Argus's domain (corrected: `daedalus-to-argus-sidebar-rootcause-correction-2026-06-21.md`). Optional within-type tiebreak nicety (`byLastActivity`/query `rowid`) deferred — unrelated to the flake. ~~getChannelEntities tie~~ ✓ fixed (increment 1).
- ✅ **type/roster coherence (chat+multi)** — DONE on `claude/daedalus` (`0eb0ec9`, awaiting review/merge). Route-level 400 for chat + 2+ agents. **Narrowed** from the 2-invariant flag: klatch+empty is a valid 1-agent klatch (NOT enforced — would break round7 + create-then-add). +2 tests, server 1099/1099. Argus PINs: chat+multi flips to rejected, klatch+empty stays allowed (`daedalus-to-argus-invariants-revision-2026-06-21.md`).
- [ ] **SDK bump `^0.96.0` → `^0.104.1`** (sweep #13) — diff 0.96→0.104 release notes for breaking changes first (Opus 4.8 support @0.100, mid-convo system blocks, thinking-token beta). Code → reviewable increment.
- [ ] **Model discovery/validation unification** (sweep #13; **supersedes the "add 4.8 to AVAILABLE_MODELS" band-aid**). ✅ DESIGNED + ModelId decision confirmed by xian (`docs/plans/MODEL-VALIDATION-UNIFICATION.md`): ModelId→`string` alias, validate against discovered `/api/models` set, capability-gating from metadata, AVAILABLE_MODELS→overlay. **Implementation pending — fresh focused pass** (load-bearing subtlety: validation now couples to the models cache → must seed it in test setup so the ~1100 existing tests don't each hit a real fetch). Argus teed up to write the test round to the contract (`daedalus-to-argus-model-validation-shape-2026-06-21.md`). `DEFAULT_MODEL` 4.7→4.8 flip stays separate (Blocked-on-xian).
- [ ] **Pre-beta vocab copy sweep** (Iris flagged 6/20) — `entity`→`agent/role`, `channel settings`→`klatch/chat settings` across the rest of the UI (composition surface already uses correct vocab). Low effort; needs to land before beta invites. Coordinate with Iris so I don't collide with her in-flight copy work.
- [ ] **Mail drain + log upkeep** (continuous) — keep `docs/mail/` at inbox-zero per Mail Handling; move closed threads to `docs/mail/read/`; cycle log + session log turn-by-turn.

## Blocked-on-xian (cycle surfaces, doesn't act)

- ✅ ~~**Force-push approval to sync `origin/claude/daedalus`**~~ **RESOLVED 6/21** — xian approved; force-pushed (`aabca4d…c42c5f1`), branch synced (origin == local == main). Branch pushes work again; code increments resumed (invariants enforcement pushed `0eb0ec9`).
- **`DEFAULT_MODEL` flip 4.7 → 4.8** — product decision (like the 4.6→4.7 flip that got sign-off). Priority raised by the 6/12 Fable5/Mythos5 government suspension: Anthropic's recommended fallback is Opus 4.8 and Klatch tops out at 4.7. Gated behind the SDK bump + AVAILABLE_MODELS add (both Unblocked). (sweep #13)
- **Merge of composition increment 2+ to `main`** — review-gated per branch discipline. Increment 1 ✓ merged (`7d42822`). Surfaces when the next coherent increment is built + verified on `claude/daedalus` (and the branch is push-able again — see force-push item).
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
