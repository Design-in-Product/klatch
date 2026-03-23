---
date: 2026-03-22
status: substantive
sources_checked:
  - piper-morgan
---

# Cross-Pollination Brief: Piper Morgan → Klatch

**Date:** 2026-03-22
**Source project:** Piper Morgan
**For:** Klatch team

## Key Insights

### 1. Dispatch Omnibus Automation Pilot
**Relevance:** Parallels Klatch's use of Cowork scheduled tasks for intelligence sweeps.
**Source:** `docs/omnibus-logs/2026-03-20-omnibus-log.md`, Docs session log
**Summary:** PM piloted automating daily omnibus synthesis using Dispatch (persistent Claude Desktop chat with browser control). Four iterations to reach methodology compliance: v1-v2 worktree failures, v3 format issues, v4 approved. Different automation pattern than Klatch's headless scheduled tasks.
**Suggested action:** If Klatch considers automating session log synthesis or coordination updates, the Dispatch pilot provides a concrete case study including failure modes and eval methodology.

### 2. Mailbox v3 Infrastructure — 14 Role-Based Inboxes
**Relevance:** The DIRECTORY.md pattern (routing table as flat Markdown) is worth noting.
**Source:** `mailboxes/` directory, `DIRECTORY.md`, `DELIVERY-LOG.md`
**Summary:** PM shipped full directory-based routing: 14 role-specific inboxes, routing table, audit trail, per-inbox manifests, incoming/ for unrouted messages. The care package memo (`docs/mail/calliope-to-mnemosyne-care-package-2026-03-22.md`) is a mailbox-to-mailbox handoff for syncing knowledge to the cloud environment.
**Suggested action:** No immediate action. Note the care package pattern for cloud import flows.

### 3. Audit Cascade Methodology
**Relevance:** As Klatch's issue count grows, prevents working issues in filing order rather than impact order.
**Source:** PM Lead Dev session
**Summary:** Systematic triage: verify scope against current state, narrow or widen, decide disposition, execute. What looked like 4 separate work items became 1 immediate fix, 2 quick follow-ups, and 1 partially moot issue — all triaged in under 2 hours.
**Suggested action:** Key insight: audit issues against *current* architectural state, not the state when filed. Klatch's rapid shipping pace means issues filed 3 days ago may already be partially resolved.

### 4. The Cross-Pollination Loop Closed
**Relevance:** Validates this process.
**Source:** Both projects
**Summary:** PM's Lead Dev session on March 21 begins with an explicit "Cross-Pollination Hub Review" section, reading the brief and extracting relevant insights. First evidence the brief is being consumed as intended. The loop: Klatch discovers → brief publishes → PM reads → PM session log records the insight.
**Suggested action:** Continue publishing.

### 5. Agent Traditions — Durable Per-Agent Knowledge Pattern
**Relevance:** Compare with Klatch's existing agent docs pattern.
**Source:** `docs/AGENT-TRADITIONS-SPEC.md`, `docs/agents/calliope.md`
**Summary:** 7-section structure: role/purpose, working style, standing responsibilities, conventions, key relationships, institutional memory, standing instructions. Serves as durable backing store for Layer 5 (entity prompt). Calliope traditions doc is the reference implementation.
**Suggested action:** Already evolving in this direction. The "institutional memory" and "key relationships" sections provide structure the current agent docs may not fully capture.
