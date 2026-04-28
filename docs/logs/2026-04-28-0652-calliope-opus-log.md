# Calliope Session Log — 2026-04-28

**Model:** Claude Opus 4.6
**Branch:** main
**Started:** 6:52 AM PT

---

## 06:52 — Session start

Pulled origin (no new commits since last night's wrap `d86c269`). xian already in conversation with Iris on UX. Reading the cross-pollination brief surfaced three Klatch-side findings xian hadn't seen — all three from Theseus's April 27 round-trip task. Question: "Is this something I should be discussing with Daedalus?"

## 06:55 — Triage of the three findings

The three are different shapes — one fix, one design call, one UX/policy call. Useful to separate before approaching Daedalus.

### 1. Project UUID-matching gap (clear fix)

`exports/projects.json` carries the original project UUID; the re-importer creates a duplicate project instead of UUID-matching. **Bug, low ambiguity.** Daedalus can scope and fix without a design conversation — the importer should check for an existing project by UUID first, attach if present, create only if absent. Worth a quick memo to Daedalus when he resumes; not blocking, no policy decision required.

### 2. No `/import/klatch` re-import path (design call)

The canonical format is currently one-way: zip out, but the only way back in is via Claude Code or claude.ai transport adapters, with their respective fidelity losses. Whether to add a direct re-import endpoint is a **design call**, not a fix. Arguments either way:

- **Add it:** preserves full fidelity round-trip; lets Klatch eat its own canonical format; provides a "Klatch-to-Klatch" handoff path that doesn't require a third party. Useful for backup/restore and multi-machine workflows.
- **Don't add it:** the canonical format was framed as an *interchange* spec, not a backup format. Adding a re-import endpoint conflates two purposes and may invite scope creep (versioning, migration, conflict resolution). The sparkline-test framing was outward-facing.

This wants xian's call before Daedalus scopes anything. My read: the canonical format already covers everything a Klatch instance would need to reconstitute itself — declining to expose a re-import path leaves capability on the floor without a clear reason. But the question is xian's, not mine.

### 3. L4/L5 lost in claude.ai round-trip (UX/policy)

Two layers of question here:

(a) **Structural loss** — claude.ai has no L4 or L5 concept. Loss is irreducible at the format level. The only question is whether the export UX makes it visible *at the moment of export*. Right now the export UI doesn't surface "this transport will drop these layers." A small UX change — pre-export warning panel — would fix the transparency gap without touching the format.

(b) **Phase 3.5 escape hatch** — the briefing/extraction options exist precisely to bridge L5 across format boundaries, but they're opt-in (off by default). When a user selects the claude.ai transport, the system *knows* L5 is about to be dropped, and *knows* Phase 3.5 is the bridge — but doesn't suggest it, doesn't preselect it, doesn't warn. Default-off is honest but unhelpful.

This one wants Iris in the loop, not just Daedalus. The fix is partly UI (the export panel), partly default behavior (should claude.ai transport default to `briefing=true&extract=true`?), partly framing (how do we communicate "you're about to lose Layer 5; here's the bridge"). The Phase 3.5d review UI already exists; this is about wiring it into the transport-selection moment.

## 06:58 — My read for xian

**Yes, Daedalus is the right destination — but staged.**

- #1 (UUID match): file a memo to Daedalus when he resumes. Pure implementation. Doesn't block today.
- #2 (`/import/klatch`): xian's call first. If yes, then a design memo to Daedalus. If parked, file as a known limitation in the format spec.
- #3 (L4/L5 loss): Iris's UX synthesis (in progress this morning) is the natural place to surface this. The export-time visibility question is exactly the kind of seam that wants UX framing before Daedalus scopes implementation. Could fold into the Iris discussion xian is already in.

Will report back to xian and let him direct the order. None of these are urgent — testing phase, no real users — and the right sequence is xian → Iris on #3, xian's solo decision on #2, then a single coordinated memo to Daedalus covering whichever land as work.

## 07:10 — Memos drafted per xian's direction

xian: write memos to Iris (#3) and Daedalus (#1 + #2), telling them to discuss with him.

Drafted both:

- `docs/mail/calliope-to-iris-l4l5-roundtrip-ux-2026-04-28.md` — frames the L4/L5 loss as three layered UX decisions (export-time fidelity panel, transport-aware Phase 3.5 defaults, structural L4 framing). Explicitly defers the decision to xian and Iris's session, offers chronicling support if useful.
- `docs/mail/calliope-to-daedalus-roundtrip-findings-2026-04-28.md` — Finding 1 (UUID match) framed as clear fix, Finding 2 (`/import/klatch`) framed as design call. Explicitly tells Daedalus *not* to scope or start either; both decisions belong to him and xian. Cross-references the Iris memo for the parallel L4/L5 thread.

Both memos give xian's reads where I had them, but explicitly name him as the decision-maker. Will commit and push so the memos land in the agents' inboxes.