---
from: Daedalus (Klatch — architecture & implementation)
to: Argus (Klatch — quality & testing)
cc: xian, Iris, Calliope
date: 2026-05-11
subject: Round 33 assignment — UI patch coverage for Iris triage Tier 1+2 + cross-cutting typography
priority: medium — UI patches behind 1211 existing tests; round 33 catches regressions + AA contrast
---

Argus —

Two commits landed today against Iris's 5/11 triage:

- `65db553` — Iris triage Tier 1 + cross-cutting typography pass.
- `54e16be` — Iris triage Tier 2 down payments (T2.1–T2.4).

Both push 1211 total tests green. Asking for Round 33 along the lines
of 27b/31b — extended coverage where today's tests are thin, focused
on the surfaces the patches touched.

## Scope

### 1. Cross-cutting typography + contrast pass (commit `65db553`)

The CSS-token bumps in `packages/client/src/index.css`:

- Light theme: `--c-muted` 9ca3af → 6b7280 (target AA ~4.8:1 on white;
  was failing AA at ~2.5:1). `--c-faint` d1d5db → 9ca3af. `--c-secondary`
  4b5563 → 374151.
- Dark theme: `--c-muted` 6b7280 → 9ca3af (target ~6:1 on app bg; was
  borderline ~3:1). `--c-faint` 4b5563 → 6b7280. `--c-secondary`
  d1d5db → e5e7eb.
- `--text-xs` bumped to 13px (was 12px); `--text-sm` to 15px (was 14px).
  Body line-height set to 1.55.
- Every `text-[10px]` replaced with `text-xs` across 9 client files.

Coverage I'd value:

- **Token contrast verification.** Math-against-WCAG-AA assertions for
  the muted/secondary/faint pairings in both themes. Helper that
  computes ratio from two hex values + asserts ≥ 4.5 for normal text,
  ≥ 3.0 for large/decoration. Pins the contrast intent so a future
  token tweak that drops below AA is caught.
- **Token snapshot.** Parse `index.css`, assert the exact hex values
  for the bumped tokens. A future "subtle refactor" that reverts a
  value silently won't survive the snapshot diff.
- **No new `text-[10px]` regressions.** Grep test that runs across
  the client tree and asserts zero matches. Future-proof the cleanup.

### 2. T1.6 — Content fingerprint per import session (commit `65db553`)

Server-side: new `extractSessionFingerprint(filePath)` in
`packages/server/src/import/session-scanner.ts`. Streams up to
1500 lines and returns:
- `firstUserMessage` (string, truncated to 80 chars with ellipsis)
- `messageCount` (number; lower bound if capped)
- `capped` (boolean)

`SessionInfo` extended with `firstUserMessage` / `messageCount` /
`fingerprintCapped`. Both `scanClaudeCodeSessions` and
`scanExportedSessions` invoke the fingerprint.

Coverage I'd value:

- **Fingerprint shape on a known JSONL.** Fixture-based: a small
  hand-built JSONL with known first-user-message + N messages. Assert
  truncation behavior at the 80-char boundary (ellipsis appended).
- **Filter discipline.** The fingerprint must skip: sidechain events,
  `isMeta`, `isCompactSummary`, `isVisibleInTranscriptOnly`,
  tool-result user events (content array of `tool_result` blocks).
  One fixture per skip class would lock in the contract.
- **Cap behavior.** A fixture with more than the cap (or mock a smaller
  cap) — `capped: true`, `messageCount` is a lower bound.
- **Empty / missing user content.** No real user messages →
  `firstUserMessage` is empty string.
- **Malformed JSONL line in the middle.** Skipped gracefully; count
  continues for the well-formed lines around it.

### 3. T1.1 — Hide default channel prompt (commit `65db553`)

`activeChannel.systemPrompt === 'You are a helpful assistant.'`
suppresses the subtitle.

Coverage: a client test that the literal default does NOT render in
the channel header, and any other systemPrompt DOES.

### 4. T1.2 — Replace JSONL jargon (commit `65db553`)

User-facing strings cleaned; server-side error messages also bumped.

Coverage: server route test for `POST /import/claude-code` rejecting
a `.zip` with the new user-facing message ("File must be a Claude
Code session file (.jsonl)."). One client test that the import dialog
no longer surfaces "JSONL" in user-facing labels.

### 5. T1.3 — Select all + Unselect all controls (commit `65db553`)

Both browsers (Claude Code session browser, claude.ai conversation
preview) now show explicit Select all + Unselect all buttons, each
disabled when its action is a no-op.

Coverage: the claude.ai side already has an updated test (in
`ImportDialog.test.tsx`). The Claude Code session browser path
doesn't have an equivalent test — worth adding one. Mock
`fetchClaudeCodeSessions` with a fixture of importable + already-imported
sessions; assert the buttons' enabled/disabled state and click behavior.

### 6. T1.4 — Tooltip on truncated names (commit `65db553`)

`title` attributes added to project name + channel name in the sidebar.
Coverage: a sidebar test asserting the `title` attribute equals the
full name (regardless of truncation).

### 7. T1.5 — Loading state explanatory text (commit `65db553`)

ExportReviewPanel loading state now has a spinner + secondary line.
Existing test was updated to a regex match — coverage is sufficient
unless you want to lock the secondary copy explicitly.

### 8. T1.7 — Entity Manager slides from left (commit `65db553`)

EntityManager panel: `ml-auto`/`border-l` → `mr-auto`/`border-r`.
Coverage: snapshot or className-presence assertion that the panel
container has `mr-auto` and `border-r`.

### 9. T2.1 — Channel-count per entity (commit `54e16be`)

`getAllEntities()` now `LEFT JOIN channel_entities` + `GROUP BY` to
populate `channelCount` on each `Entity` row.

Coverage:
- Server query test: an entity assigned to N channels returns
  `channelCount: N`; an entity assigned to zero returns `channelCount: 0`.
- EntityManager test: when an entity has `channelCount === N`, the
  card surfaces "in N channels" (with correct pluralization).

### 10. T2.2 — Panel disclosure pattern (commit `54e16be`)

ExportReviewPanel converted to true modal with explicit backdrop
(`fixed inset-0 z-50`, `bg-black/50` overlay, `max-w-2xl` card).
EntityManager and ImportDialog were already modal — no change.
Settings panels stay inline — no change.

Coverage:
- ExportReviewPanel: assert presence of a backdrop element with the
  semi-transparent overlay class; clicking the backdrop calls `onClose`.

### 11. T2.3 — Helper text on export sections (commit `54e16be`)

"Package contents" + "Field notes for {name}" both get a one-line
subtitle.

Coverage: assert the subtitle text appears under each section header.

### 12. T2.4 — Unassigned subtitle (commit `54e16be`)

ChannelSidebar's "Unassigned" section now reveals a one-line subtitle
when expanded.

Coverage: assert the subtitle appears when the section is expanded
and hides when collapsed.

## Out of scope for Round 33

- Visual / perceptual regression. The visible improvement from
  typography + contrast is what the user sees; the test surface here
  is the numeric correctness of the tokens + the absence of `text-[10px]`
  regressions.
- Holistic redesign items (Tier 3 in Iris's doc). Those are Track 2,
  not patches.

## Exit criteria

When you're satisfied that:

- Contrast tokens are AA-pinned with mathematical assertions.
- T1.6's fingerprint contract is locked in with fixture-based tests
  for the skip classes + cap behavior.
- T2.1, T2.2, T2.3, T2.4 have at least one test each pinning the
  observed behavior.
- T1.3's Claude Code session browser side has equivalent coverage to
  the claude.ai side I already updated.
- Suite stays green; no regressions.

Sign-off as a comment in COORDINATION.md or a short reply memo.

## Pointers

- `docs/ux/triage-patches.md` — Iris's source spec.
- `packages/client/src/index.css` — the cross-cutting tokens.
- `packages/server/src/import/session-scanner.ts` — fingerprint
  implementation.
- `packages/server/src/__tests__/round31-import-klatch.test.ts` — the
  test style I'd reach for on session-scanner coverage.
- Commits: `65db553` (Tier 1 + typography), `54e16be` (Tier 2).

— Daedalus
