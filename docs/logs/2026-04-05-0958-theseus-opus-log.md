# Theseus Session Log — 2026-04-05

**Agent:** Theseus (manual testing & exploration — CLI side)
**Model:** Opus 4.6
**Human:** Xian (product owner)
**Started:** 9:58 AM PT

---

## 09:58 — Session Start (Day 11)

Pulled from origin main — up to date. Orientation session after a 10-day pause (last session: March 26).

### Context: Agent migration underway

Xian is migrating agents to a new designinproduct.com Claude account structure. Today's goal: get Theseus fully oriented and caught up, not necessarily a heavy working session.

### Mail received

**Calliope → Theseus (April 2):** AXT agenda + MAXT Session 01 report status.
- MAXT Session 01 report item closed — session log is the report, findings absorbed.
- Overnight April 1: Daedalus shipped FDM Phases 1+2 (files/file_refs tables, channel pinning, L4 injection). Argus hit 761 tests (Round 13). Nomenclature resolved — "Channel context" (L4) and "Role prompt" (L5).
- Two MAXT Session 02 candidates: (1) file pinning L4 injection fidelity, (2) nomenclature change as AXT variable.
- Metis notes I don't have a traditions doc yet.

### What happened in the 10-day gap (March 27 – April 4)

**~35 commits** since my last session. Major developments:

1. **Nomenclature rename (April 1):** Finding 7 from MAXT Session 01 resolved. "System prompt" → "Channel context" (L4) and "Role prompt" (L5) in the UI.

2. **File Domain Model shipped (April 1–3):** Five phases completed:
   - Phase 1: `files`/`file_refs` schema + backfill
   - Phase 2: Channel file pinning with L4 context injection
   - Phase 3: Project knowledge base with L3 context injection + upload UI
   - Phase 4: Dual-write for save_file tool
   - Phase 5: Promotion endpoint + UI
   All covered by Rounds 14–16 (58 tests).

3. **Compaction threshold (April 3–4):** Deep research by Argus. 80K trigger fires at only 8% of 1M context. Raised to 160K. Per-entity effort parameter added.

4. **Test suite at 837** (698 server + 139 client), zero failures. Round 17 covers compaction + effort.

5. **Blog + release prep:** v0.9.0 CHANGELOG draft, "Paste It Again" blog draft, "Your Model or Theirs" and "What Doesn't Transfer" published.

6. **RFC-001 response filed.** Dispatch sent cross-project RFC on Five-Layer Context Model.

7. **Janus → Ted Nadeau channel opened.** HPL/Five-Layer convergence mapped with four concrete asks.

8. **Metis joined** the team (Cowork environment, April 1).

9. **AAXT scaffolded probing design** spec written by Argus.

10. **AuditBench methodology review** with 4 AXT cross-pollination recommendations.

### Cross-pollination brief (April 4)

Key headline: **Piper Morgan M1 gate UAT did not pass.** Pattern-045 ("Green Tests, Red User") confirmed at scale — 23 passing todo tests, but completion non-functional for real users. Direct validation of the AAXT/MAXT methodology split. Suggested action for MAXT Session 02: add Pattern-045 as explicit test category.

### Status assessment

I've been away 10 days. The codebase has moved significantly:
- FDM is a whole new subsystem with L3 and L4 injection
- Compaction behavior changed
- UI nomenclature changed
- Test suite grew by ~20 tests
- New agent (Metis) joined

For MAXT purposes, the L4 injection from file pinning is the most interesting new capability to test — it's exactly the kind of structural-vs-behavioral gap MAXT is designed to probe.

---

## 10:05 — Round 18: AAXT × FDM

Xian is too tired for MAXT tonight, so we're running AAXT on the Step 9 FDM work.

### Gap analysis

- **Round 11** (AAXT harness): Tests prompt assembly for imports — no FDM (predates it).
- **Round 15**: Tests FDM L3/L4 injection — only on native channels.
- **Nobody tests the intersection**: files on imported channels, cross-scope isolation across project-linked channels, full 5-layer assembly with files at both L3 and L4.

### Test design: Round 18 — AAXT: FDM × Import Interactions

Three groups, 12 tests:

**Group E — FDM × Import interactions (4 tests)**
- E1: Imported channel with pinned file — L1 + L4 both present
- E2: Imported channel + project with KB file — L1 + L2 + L3 (with files) active
- E3: Legacy fallback (claudeMd) + pinned file — both present, no interference
- E4: Imported channel with project KB + channel pin — L3 and L4 file listings, correct ordering

**Group F — Cross-scope isolation (4 tests)**
- F1: Channel-pinned file does NOT bleed to sibling channel in same project
- F2: Project KB file visible to ALL channels in project
- F3: Unlinked channel sees neither project KB nor sibling channel files
- F4: Project KB files without memory text — L3 still ACTIVE from file listing

**Group G — Lifecycle and listing format (4 tests)**
- G1: Pin/unpin lifecycle reflected in prompt-debug
- G2: Multiple files, correct listing format (name + mime type)
- G3: Channel addendum text + pinned files coexist in L4
- G4: Full 5-layer assembly with files — all layers active, correct ordering

### Results

All 12 tests pass on first run. Full suite: **849 total (710 server + 139 client), zero failures.**

File: `packages/server/src/__tests__/round18-aaxt-fdm.test.ts`

---
