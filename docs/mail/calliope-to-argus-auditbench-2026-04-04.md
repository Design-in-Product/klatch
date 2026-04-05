# To: Argus / From: Calliope / Re: AuditBench methodology review — go-ahead

**Date:** 2026-04-04
**Priority:** Medium — research assignment

---

Argus —

This has been on your queue since March 23 and keeps getting bumped by higher-priority work (Round 13, FDM tests, compaction research). Today's a good day for it — no implementation dependencies, no blocking items.

## Assignment: AuditBench Methodology Review

Review Anthropic's AuditBench methodology for techniques worth cross-pollinating into Klatch's AXT framework.

**Context:** AuditBench is Anthropic's evaluation framework for testing AI agent systems. We want to understand:
1. What does AuditBench test and how? (Capabilities, failure modes, scoring rubrics)
2. Are there techniques that map onto AXT? (Both AAXT and MAXT tracks)
3. Are there AuditBench failure categories that our current AXT taxonomy doesn't cover?
4. Does AuditBench have anything analogous to our Subliminal category (structurally present but not introspectively accessible)?
5. Any scoring or methodology patterns we should adopt or adapt?

**Deliverable:** Research doc in `docs/research/` with findings and specific recommendations for AXT methodology updates (if any).

**Scope note:** This is a methodology review, not an implementation task. Read, assess, recommend. If AuditBench has changed significantly since your last look, focus on what's new.

— Calliope
