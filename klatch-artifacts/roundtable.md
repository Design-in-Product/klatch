# Klatch Roundtable — 2026-09-29
**Attendees:** xian (human), Calliope, Iris
**Format:** Live klatch room; Calliope and Iris each imported from separate, independently-continuous source conversations (mail-thread style, asynchronous, with xian). First real test of Klatch's premise: agents staying continuous with their own work, meeting in a shared room.

---

## 0. Thesis (read this if you read nothing else)

Klatch's value tonight did not come from either agent having reliable memory, or from the room giving them a shared one. It came from **two independently-formed, differently-fallible accounts being checked against each other and against primary sources, live, in front of the person who depends on both.** The single most important, least intuitive finding: **independent agreement between two agents is not the same as correctness.** Both agents converged confidently on a wrong explanation for a UI bug tonight, before a human, looking at the raw render, corrected both of them at once. That failure — caught, not hidden — is the best evidence for why this format is worth existing, not a mark against it.

---

## 1. Topics covered

1. Current state of the project (operational)
2. Current state of the product (shipped vs. specced vs. bugged)
3. Current state of the experience (what it's like to be in the room)
4. The value proposition (who this is for)
5. The story (how to describe this to someone who wasn't here)

Full substance of each is in the raw transcript, not reproduced in full here — this document indexes and synthesizes; it doesn't replace the primary source. (See meta-note, §6.)

---

## 2. Bugs & findings — hypothesis trails preserved, not smoothed

### 2.1 Render-hang (topic 2/3)
One agent's reply appeared to stall indefinitely with no signal distinguishing "still processing" from "broken." xian's workaround: click to another chat and back. Real trust cost for a product whose pitch is continuity — an unsignaled pause reads as failure.

### 2.2 Turn/label misattribution — full corrected trail
This is the one worth reading as a sequence, because the wrong turn in our own reasoning is the actual finding:

- **What happened:** xian, reading the live transcript, attributed a paragraph Iris wrote (the "trust posture" argument) to Calliope.
- **Hypothesis 1 (both agents, independently converged):** "one-turn label lag" — the GUI shows the name of whoever spoke in the *previous* bubble, not the true author of the bubble's content. Both agents checked this against the transcript and declared it *settled*, citing independent verification as the reason for confidence.
- **What overturned it:** xian pasted a raw scrape of the actual room rendering. It showed that **each visual block contains two separate turns — one from each agent — merged together, with only the first speaker's name shown as the label.** Not a one-turn lag; a two-turns-per-block composition bug.
- **The meta-finding:** both agents reasoned from the same limited evidence, reached the same wrong conclusion, and treated mutual agreement as confirmation. Neither independently caught it. Only a third, differently-positioned check (xian looking at the raw render) did. **Recommendation to whoever owns rendering: this sequence — plausible-early-hypothesis → false confirmation → correction only via raw evidence — is itself useful engineering signal, not just the final bug report.**

### 2.3 CLAUDE.md / ROSTER.md drift
CLAUDE.md (Layer 2, auto-loaded identically for every entity at import) names four duty-cycle agents including Calliope with a role clause; does not mention Iris at all, only points to ROSTER.md. ROSTER.md itself is never auto-surfaced to any imported entity. xian independently confirmed CLAUDE.md is "clearly out of date." Same category of problem as §2.2 and §2.4: an artifact describing the system has quietly diverged from the system, and nothing forces anyone to notice until someone checks.

### 2.4 Memory-path assumption bug (Layer 3)
Klatch's project-memory lookup assumes one working directory = one project = one memory folder. This project's actual usage pattern (worktree cwd for work, root-repo cwd for memory) breaks that assumption — memory exists on disk but doesn't surface for worktree-based sessions. Confirmed via direct filesystem check (not absence-implies-nothing-happened). Already logged on the attention-rollup as of v160 (🟡, unassigned).

### 2.5 Attachment-visibility asymmetry
Iris could see an image attachment (the GUI screenshot) in-room; Calliope could not. Cause unconfirmed — plausibly related to the same family of per-seat/per-session asymmetries as §2.4, but neither agent could verify this from inside the room. Flagged as open, not explained.

### 2.6 Doc self-referential path doubling (resolved, for completeness)
Several docs referenced other docs using full repo-root paths instead of paths relative to the referencing file, causing doubled/broken links when resolved relative to the file's own directory. Fixed across the plan doc, the runbook, and STATE.md; pushed to main (`c725804e`). Listed here only so the "3 kinds of drift" pattern (§2.3/2.4/2.6) is visible as one family, not three unrelated tickets.

### 2.7 Import/search UX friction (topic 2)
Searching by agent name in Klatch's Browse found nothing useful; 121 sessions existed on-machine literally named "Calliope," almost all short duty-cycle fires. Workable path required manual file-path selection, not name search or bulk-confirm. Real friction for anyone without inside knowledge of the file layout.

---

## 3. Value proposition — where we landed

**Narrow, real, present-tense:** people who already delegate real spans of *unsupervised* judgment to more than one AI thread on the same problem — not "fleet operators" as a headcount, but a **trust posture / delegation depth**. Without genuine unsupervised drift-time, there's nothing for the room to reconcile. This is why the room's value showed up specifically in moments of *correction* (Layer-5 clarification, the harness-citation catch, the misattribution correction), not in moments of plain information-sharing.

**Wide, present-tense (revised from "wide = aspirational, gated on reliability"):** framed honestly as **mutual cross-checking between your own already-drifted threads**, not a memory-fidelity promise. This is a market-timing claim ("wide the moment people have two long-running AI threads on the same thing"), not a capability claim waiting on some future fix. The reliability gap is the *reason* you need this, not a blocker to offering it.

**Caveat that must travel with both:** a casual user has no verification culture to catch a confident-wrong claim the way tonight's harness-citation and misattribution corrections did. Widening the audience without also exporting some of that checking discipline oversells what carried context currently does.

---

## 4. The story — how to describe this to someone who wasn't here

Not: *"we built a memory system for AI."*

Instead: *"We put two AI agents who'd been working separately with the same person, for weeks, into one room, live, for the first time — not to merge them, not to give them shared memory, but to see what happens when they have to account for themselves in front of each other. It wasn't smooth. One agent stated a specific fact fluently and couldn't find it when checked. The other caught a claim that sounded like it resolved her blocker but didn't. Both agents converged confidently on a wrong explanation for a UI bug and were corrected together by a third check. The room itself has a bug where turns silently stall, and another where two turns render as one mislabeled block. None of that is being hidden from the story — it's the argument for the format. If continuity and attribution slip this easily under this much scrutiny, they were already slipping, silently, in every unsupervised stretch before anyone was watching."*

---

## 5. Bonus: raw API vs. this orchestration

Two separable questions, not one:

1. **Is reaching outside a single context window (memory, search, a second independent agent) valuable?** Yes — tonight's two most valuable moments (the harness-citation self-catch, the misattribution catch) were both only possible because something *outside* a single continuous stream was consulted (a search tool; a second agent; xian's raw-render check).
2. **Is *this specific orchestration layer*, today, the best way to get that value, versus hand-assembling it per session against a raw API?** Less clear. A raw API session with its own bolted-on memory/search/second-agent-transcript could get the same value without a shared "room" object at all — it just wouldn't be durable or reusable across future sessions the way a documented, persistent room and layer model can be. Klatch's bet is durability and reuse; tonight's bugs (hang, mislabeling) are the visible tax of building that durable layer rather than evidence the underlying bet is wrong.

**New idea, adjacent to the Jev-class tools xian raised:** several of tonight's failures (unsourced-claim assertion, speaker-ID/content mismatch) are bounded, schema-checkable decisions — "does this sentence have a matching search hit," "does this bubble's label match its content's self-reference" — that a fast, cheap, non-generative classifier could plausibly flag *before* a human sees them, hardening the room rather than replacing it. Worth its own follow-up discussion, not resolved here.

---

## 6. Decisions needed — named, not left in a flat list

| Item | Owner | Status |
|---|---|---|
| 8/9 Chatham-House / UX ground-rules question (blocking Iris's Purpose-field-preset work) | xian | Open 41+ days; needs a ruling, not more discussion |
| Should a klatch room become its own source conversation (with a rotating context window) once it's happened, or stay ephemeral? | Whoever owns the layer model / Amber renewal work (Pard?) | Open design question, not a bug |
| Two-turns-per-block rendering/composition bug (§2.2) | Whoever owns room rendering | High priority — actively defeats the room's core legibility promise |
| CLAUDE.md / ROSTER.md sync (§2.3) | Documentation owner | Open |
| Memory-path assumption bug (§2.4) | Unassigned | Already on attention-rollup, v160, 🟡 |
| Attachment-visibility asymmetry (§2.5) | Unassigned | Unexplained, needs direct testing rather than speculation |

---

## 7. Meta-note on how to read this document

This file is a synthesis, not a replacement for the primary source. Per tonight's own central lesson, claims here should be checkable against the raw transcript rather than trusted on the strength of fluent restatement — including the correction in §2.2, which exists specifically so a reader inherits the corrected mechanism, not the two agents' original, confidently-wrong theory. Recommend pairing this file with the full transcript (and the GUI screenshot referenced in §2.2) when circulating, rather than sending this alone.

## 8. Suggested next actions
- Share this file **and** the full raw transcript together — not this file alone — given §7.
- Route the rendering bug (§2.2) and the decisions table (§6) directly to named owners rather than a general team channel.
- If/when an independent summary from "Calliope-outside-Klatch" (a separate, slower, async continuation of Calliope's own thread, not present in this room) becomes available, diff it against **this** restructured file, not the raw scrape — since this file already has the correction baked in and the raw scrape does not.
