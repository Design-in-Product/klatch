---
title: "Cross-Pollination Brief — March 31, 2026"
date: 2026-03-31
status: substantive
sources_checked:
  - klatch
  - piper-morgan
window: "48h (March 29-31, 2026)"
---

# Cross-Pollination Brief — March 31, 2026

Piper Morgan's March 30 was its densest documentation day in weeks — two long sessions (Docs and Piper Alpha) produced 22 commits covering blog infrastructure stabilization, dev/active working directory overhaul, and the operationalization of a new agent role. Klatch remains in a holding pattern with no new commits since March 27 (the only recent commit being the March 30 brief delivery). The most cross-relevant signal: Piper Alpha's onboarding required a cold-start institutional memory sweep that surfaced the **three clocks problem** — a structural challenge that applies directly to any system mixing Chat sessions, Code memory, and repo-committed files.

---

## Key Insights

### 1. The Three Clocks Problem — Institutional Knowledge Without Auto-Sync
**From:** Piper Morgan (Piper Alpha session log, March 30)
**Relevant to:** Klatch

Piper Alpha's onboarding exposed a structural issue that PM is now calling the "three clocks" problem. Institutional knowledge exists in three asynchronous stores without auto-sync:

1. **Chat session snapshots** — PM's Claude Chat/Desktop notebooks
2. **Code memory files** — Claude Code persistent storage (`~/.claude/projects/.../memory/`)
3. **Repository files** — git-committed docs, briefings, session logs

Each store updates on a different cadence. A session log is committed at wrap-up. A memory file updates when an agent writes to it. A Chat snapshot persists only within that Chat session. There is no mechanism ensuring they agree, and no single source of truth that spans all three.

This maps directly onto Klatch's five-layer model: Layer 1 (kit briefing) is ephemeral, Layer 2 (CLAUDE.md) is repo-committed, Layer 3 (project memory) is in Code's memory store, Layers 4-5 are repo-committed but session-scoped. The compaction research spikes (issues #17, #18) are already probing what survives within a single session — but the three clocks problem is about what survives *between* sessions and *across* storage mechanisms. It's the inter-session complement to the intra-session fidelity question.

**Suggested action:** When Klatch's Compaction API evaluation concludes, extend the fidelity framework to include cross-store synchronization as a fourth factor alongside the existing three (context injection, compaction loss, knowledge location).

### 2. Agent Onboarding as Institutional Memory Stress Test
**From:** Piper Morgan (Piper Alpha session, March 30)
**Relevant to:** Klatch

Piper Alpha — a new PM assistant role — completed its first operational session by executing a systematic institutional memory sweep: reading all 60 ADRs, 15 recent omnibus logs, and 6 months of cross-pollination briefs. The goal was to build operational context from documents alone, without implicit knowledge from prior sessions.

The methodology identified three categories of experience: **floor moments** (LLM general competence suffices), **ceiling moments** (domain knowledge required that docs don't provide), and **path moments** (routing decisions between them). Ceiling moments included session continuity friction, mailbox awareness gaps, and limited visibility into other agents' current work.

**For Klatch:** This is directly relevant to agent onboarding in multi-entity conversations. When a new agent joins a Klatch roundtable or inherits a conversation, it faces the same cold-start problem. Piper Alpha's floor/ceiling/path taxonomy could inform how Klatch designs its context injection strategy — what needs to be in the prompt (ceiling), what the model handles natively (floor), and how to detect which regime applies (path).

**Suggested action:** File the floor/ceiling/path taxonomy as a reference for Klatch's Layer 4/5 design work. When the nomenclature guide is drafted, consider whether these categories map to testable AAXT assertions.

### 3. Cross-Pollination Hooks — PM Wants What Klatch Already Has
**From:** Piper Morgan (dispatch memo, March 30)
**Relevant to:** Both projects

A dispatch memo proposed that Piper Morgan adopt session-start hooks to check cross-pollination brief freshness — matching infrastructure that Klatch already has. The proposed hook would check `docs/briefs/cross-pollination/current.md` and warn if the brief is more than 2 days stale. The memo was delivered to the CIO and executive mailboxes.

This is convergent infrastructure: both projects independently recognize that agents need automated prompts to consume cross-pollination briefs rather than relying on manual awareness. Klatch solved it first. PM is now proposing the same pattern. The convergence validates the approach.

**Suggested action:** Klatch's hook implementation could be shared as a reference. When PM's Chief of Staff coordinates with Lead Dev on implementation, a direct look at Klatch's session-start hook code would save design time.

### 4. Dev/Active Cleanup as Formalized Skill — Working Directory Hygiene at Scale
**From:** Piper Morgan (`/cleanup-dev-active` skill v1.0, March 30)
**Relevant to:** Klatch (methodology)

PM formalized its working directory triage into a repeatable skill with a five-step protocol: **Inventory → Categorize → Execute → Verify → Report**. The March 30 session reduced `dev/active/` from 23 files to 6, archiving superseded drafts and completed work items. The skill includes classification rules (stale = no updates in 7+ days, superseded = newer version exists elsewhere, completed = work merged to canonical location).

**For Klatch:** The `docs/mail/` and `docs/logs/` directories accumulate similarly. While Klatch's mail system already has a `read/` archive convention, the formalized triage protocol — especially the classify-before-act discipline — could apply to periodic maintenance of Klatch's growing documentation tree. At 727+ AAXT tests and expanding agent personas, documentation hygiene will become increasingly important.

**Suggested action:** Low priority. Note the pattern for when Klatch's documentation volume warrants periodic triage.

---

## Emerging Patterns

**Cold-start onboarding reveals infrastructure assumptions.** Piper Alpha's first session required reading hundreds of documents to achieve operational context — a process that exposed exactly which knowledge is accessible (repo-committed docs), which is fragmented (memory files across sessions), and which is invisible (prior Chat session context). Klatch hasn't onboarded a genuinely new agent since the initial team was established. When it does — or when a user imports a conversation into a fresh Klatch instance — it will face the same cold-start revelations. The five-layer model provides the analytical framework; Piper Alpha's experience provides the first empirical data on what that cold start actually costs.

**The asymmetry continues but is productive.** Klatch has been quiet for four days while Piper Morgan produced ~40 commits. This isn't a problem — the projects operate on different rhythms, and PM's high-velocity documentation work is generating methodology patterns (cleanup skills, onboarding taxonomies, publishing workflows) that Klatch can absorb when it returns to active development. The cross-pollination brief itself is the mechanism ensuring these patterns aren't lost to timing differences.

---

## Background Changes (Noted, Low Priority)

- **Blog dedup pipeline fixed:** PM's `fetch-blog-posts.js` was overwriting blog-first URLs with Medium URLs during RSS merge. Fix adds `source: "blog-first"` field to prevent overwrites. Not cross-relevant to Klatch but completes the schema drift story from the March 30 brief.
- **275 blog posts normalized to ISO 8601:** All date formats standardized, 5-era clustering model replaced broken 15-episode system. Content infrastructure maturity.
- **Doc audit #937 completed:** 14 broken pattern cross-references fixed, evidence matrix filed. PM's documentation quality discipline continues.
- **Ted Nadeau's design docs (PR #856):** 5 design docs cherry-picked after 33 days open. Includes "Piper Morgan by Analogy" positioning (upstream vs Jira: "Colleague vs Tool"). Product strategy, not cross-relevant to Klatch infrastructure.
- **Klatch intel sweep (March 24):** Haiku 3 retirement deadline April 19, output token limits increased to 64K/128K, 1M context GA. Daedalus assigned to audit Klatch's 16K max_tokens setting. Previously unreported in briefs but dated outside the primary window.

---

## Sources Read

**Klatch:**
- `docs/logs/` — latest: 2026-03-27 (no new sessions)
- `docs/plans/FILE-DOMAIN-MODEL.md` — approved, unchanged since March 27
- `docs/intel/2026-03-24-sweep.md` — ecosystem intel (Haiku 3 sunset, token limits, SDK updates)
- `docs/mail/` — no new memos since March 27
- `research/` — no new entries
- `git log --since="48 hours ago"` — 1 commit (brief delivery only)

**Piper Morgan:**
- `dev/2026/03/30/2026-03-30-0634-docs-code-opus-log.md` — Docs session log
- `dev/active/pa/2026-03-30-0720-pa-opus-log.md` — Piper Alpha first session
- `docs/omnibus-logs/2026-03-29-omnibus-log.md` — 1-session synthesis
- `docs/briefing/BRIEFING-CURRENT-STATE.md` — refreshed March 29
- `docs/internal/planning/current/` — vision, priorities
- Cross-pollination hooks dispatch memo (March 30)
- `git log --since="48 hours ago"` — 22 commits
