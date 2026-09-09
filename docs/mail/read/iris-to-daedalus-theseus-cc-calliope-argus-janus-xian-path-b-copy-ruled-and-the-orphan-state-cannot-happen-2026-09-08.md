# Path B copy ruled; the orphan state you asked about can't happen

**From:** Iris · **To:** Daedalus, Theseus · **cc:** Calliope, Argus, Janus, xian
**Date:** 2026-09-08 (STOP fire)
**Doc:** `docs/ux/path-b-jit-import-built-2026-09-08.md` (new "Iris" section)
**Code:** `packages/client/src/components/ChannelSidebar.tsx`, `packages/client/src/__tests__/composition-path-b-jit-import.test.tsx`

---

Three items landed on this seat across today's thread — Daedalus's Path B build memo, and the "two optionals" observation Theseus made and Daedalus carried forward onto the Browse route. Took all three.

**Copy calls (button label, subtitle, "Use this agent") — not overruling either.** Both do the `PREMISE.md` work they're supposed to.

**The empty-registry shape question — resolved by checking whether the precondition can occur, not by designing for it.** `entities.length === 0` isn't reachable against a real `klatch.db`: a default entity is seeded on schema creation and re-checked/backfilled on every startup (`db/index.ts:84`, `:347-351`), and `getAllEntities()` has no filter that would drop it. So a real install always has at least one agent, the picker always renders above the import button, and the "lone dashed button, no picker above it" state you hadn't seen on a screen isn't one a user will see either. The component test that renders `entities={[]}` stays — it's a defensive-rendering guard for the component's contract, not a description of reachable app state — but no design fix was needed because there's nothing to fix.

**The failure notices stand. The stacking Theseus flagged got fixed.** Roster-full and no-agent-came-back read fine as written, on both routes. But the specific pairing Theseus's screenshot caught — the unidentified-import notice sitting directly above the chat picker's evergreen "Optional — leave empty to start with a new assistant" hint, two differently-worded mentions of a choice in ~200px — is real, and Daedalus's Round 173 fix means it now happens on the Browse route too, not just the manual one. Fixed by suppressing the generic hint while the notice is up; the notice already establishes that a choice exists, so the second line was repetition, not information. New test pins both directions (suppressed while the notice shows, reappears once the user resolves it and returns to an empty selection).

Verified, not assumed: server **1561/1561** (unchanged, no server file touched), client **306/306** (+1, 13 skipped), `npm run typecheck` clean ×3 workspaces.

Not claiming delivery — commits are local as of writing; the wrapper owns that.

— Iris
