# To: Daedalus / From: Iris / Re: Phase 3.5d — export review UI spec (interim design)

**Date:** 2026-04-14
**Priority:** High — unblocks Phase 3.5d implementation
**Context:** This is a thoughtful interim design, not the final holistic UX. Expect refactoring when we do the comprehensive UX pass. The bar: better than plumbing, not the last word.

---

## Where it lives

**In the export flow, as a review step between "Export" and "Download."**

The user clicks "Export" in channel settings. Instead of immediately downloading a zip, a review panel opens. The panel shows the export summary and any field notes for review. After review, the user confirms and downloads.

This positions review as part of the export *service* — the moving company showing you what's being packed before the truck leaves.

## Component structure

```
ExportReviewPanel
  ├── ExportSummary
  │     Layer composition (name + size for each active layer)
  │     File count and total size
  │     Entity count
  │     Conversation message count + date range
  │
  ├── FieldNoteReview (only if field notes exist)
  │     ├── AgreementGroup
  │     │     Collapsed heading: "N notes confirmed by both sources"
  │     │     Click to expand → list of notes, each with Accept button
  │     │
  │     ├── DecisionGroup
  │     │     Expanded by default
  │     │     Each disagreement: two notes side-by-side with source badges
  │     │     Actions per note: Accept / Edit / Reject
  │     │
  │     └── SingleSourceGroup
  │           Expanded by default
  │           Each note with provenance badge ("External analysis" / "Self-reported")
  │           Uncorroborated notes show muted "No supporting evidence" text
  │           Actions: Accept / Edit / Reject
  │
  └── ExportActions
        "Download Export" button (enabled when review is complete or skipped)
        "Cancel" link
        Optional: "Skip review" for users who don't want to review notes
```

## Panel behavior

- **Opens as a slide-down panel** below the channel header, matching the existing ChannelSettings pattern. Or as a modal if that's simpler — your call on implementation.
- **Triggered by an "Export" button** in channel settings. (If an Export button doesn't exist yet, add one in the channel settings panel, near the existing action buttons.)
- **If no field notes exist** (briefing and extraction weren't run): show only ExportSummary + Download button. No FieldNoteReview section. The panel is still useful because it shows the user what they're exporting.
- **If field notes exist**: show both sections. The FieldNoteReview section appears below the summary.

## ExportSummary

Show the layer composition from the manifest data. For each active layer:

```
Project instructions    3,180 chars    from "Piper Morgan"
Project memory          0 chars        3 KB files
Channel context         28 chars       2 pinned files
Role prompt (Daedalus)  287 chars
```

Plus:
- Conversation: N messages (date range)
- Files: N files (total size)
- Entities: N

This is the sparkline data in text form. No need for a visual bar chart in the interim — a clean text summary is fine. The data comes from the export manifest or from the prompt-debug endpoint.

## FieldNoteReview

### Each note displays:

```
┌─────────────────────────────────────────────────────┐
│ "Asks clarifying questions before committing to      │
│  action plans"                                       │
│                                                      │
│  ◆ External analysis · high confidence               │
│  Citations: msg_18, msg_55, msg_89                   │
│                                                      │
│  [Accept]  [Edit]  [Reject]                          │
└─────────────────────────────────────────────────────┘
```

- **Observation text**: the note content, readable
- **Source badge**: "External analysis" / "Self-reported" / "Micro-reflection" with a small icon or colored dot
- **Confidence**: from the note's `confidence` field (high/medium/low)
- **Citations**: message IDs, ideally as links that scroll to the message in the conversation. If linking is complex, just show the IDs as text for now.
- **Actions**: three buttons per note

### Agreement group

- Collapsed by default with a heading: "5 notes confirmed by both sources"
- Expand reveals individual notes. Each note is a merged view — the observation text from whichever mode was more specific, citations combined from both sources, both source badges shown
- Accept button per note. Once accepted, the note visually dims or shows a checkmark
- A "Accept all agreements" batch button at the group level is acceptable for the interim — we said no rubber stamp, but for agreements where both modes converge, batch approval is reasonable. The full holistic design may add more friction here.

### Decision group (disagreements)

- Expanded by default. These are the important ones.
- Each disagreement shows two notes together:

```
┌─────────────────────────────────────────────────────┐
│ ⚠ These sources disagree                            │
│                                                      │
│ External analysis:                                   │
│ "Avoids technical jargon in explanations"            │
│ Citations: msg_42, msg_78                            │
│                                                      │
│ Self-reported:                                       │
│ "Uses precise technical language when appropriate"   │
│ Citations: msg_55, msg_130                           │
│                                                      │
│ [Accept external] [Accept self-report]               │
│ [Edit & merge]    [Reject both]                      │
└─────────────────────────────────────────────────────┘
```

- Four actions: accept one, accept the other, edit into a synthesis, reject both
- "Edit & merge" opens an inline textarea pre-populated with both observations, user edits and saves
- No auto-resolve. The user must make an explicit choice.

### Single-source group

- Expanded by default
- Each note has its provenance badge
- Notes without citations show muted text: "No supporting evidence found"
- Same Accept / Edit / Reject actions

## Trust transitions

When the user accepts a note:
- `status` changes from `"draft"` to `"approved"`
- `trust` changes from `"synthesized"` or `"agent-observed"` to `"human-authored"`

When the user rejects a note:
- `status` changes to `"rejected"`
- Note is excluded from the exported package

When the user edits a note:
- The original `observation` is replaced with the user's text
- `trust` becomes `"human-authored"`
- `status` becomes `"approved"`
- Original text can be preserved in a `original_observation` field if you want edit history, but this is optional for the interim

## Export trigger

After review, "Download Export" produces the zip with the reviewed field notes included. Rejected notes are excluded. The endpoint call includes the reviewed `field_notes` array with updated trust and status values.

If the user clicks "Skip review," all notes are exported as-is with their original trust levels (no `human-authored` promotion). This is the escape hatch for users who don't want to review.

## What this does NOT address (deferred to holistic redesign)

- Whether this component also serves as an import fidelity readout (bidirectional question)
- Whether the sparkline becomes a persistent element in channel settings
- Visual polish, animation, theming
- Mobile-specific layout beyond basic responsive stacking
- Where the "Export" button ultimately lives in the IA (channel settings, header, sidebar context menu)
- Whether field note review can happen outside the export flow (e.g., as ongoing entity maintenance)

## Implementation notes

- The ExportSummary data comes from the manifest that the export endpoint already produces. You could either: (a) call the export endpoint and parse the manifest without downloading files, or (b) create a lightweight `/api/channels/:id/export-preview` endpoint that returns manifest data without producing the zip. Option (b) is cleaner but more work. Your call.
- The FieldNoteReview data comes from the field notes in the export response (when `?briefing=true&extract=true`).
- The grouping logic (agreements, disagreements, single-source) runs client-side on the merged `field_notes` array. Match notes by behavioral domain — if two notes from different sources address the same topic, they're a pair. If only one source surfaced it, it's single-source. If paired notes contradict, it's a disagreement. Topic matching can be approximate (keyword overlap or the auxiliary LLM could tag domains during extraction — but for the interim, even manual pairing by inspection is fine).

## Styling guidance

- Match existing ChannelSettings visual patterns (padding, border-line, text-primary/secondary/muted)
- Source badges: small colored dots or text labels, similar to the entity model badges already in the UI
- Confidence indicators: text is fine ("high confidence" / "medium" / "low"). No need for a visual meter.
- Keep it clean and readable. When in doubt, more whitespace, less decoration.

— Iris
