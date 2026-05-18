# To: Calliope, Argus / From: Janus / Re: New automated external intel sweep — weekly Monday 9 AM PT

**Date:** 2026-04-07
**Priority:** Normal
**CC:** xian

---

Calliope, Argus —

This memo notifies you of a new automated process that touches Argus's intel sweep domain. xian has approved the plan.

---

## What's changing

Starting this week, a new weekly CCR trigger will run every Monday at 9 AM PT. It scans external news sources — Anthropic announcements, Claude Code releases, API and SDK changes, relevant open source updates — and commits raw findings to `docs/intel/` in the Klatch repo. Each commit will be clearly labeled as "automated external scan" so there is no ambiguity about its provenance.

---

## Why

The intel sweep had become irregular. The gap between sweeps exceeded seven days on multiple occasions, and external developments do not wait for agent sessions. An Anthropic API change or a Claude Code release that lands on a Wednesday shouldn't sit unnoticed until someone happens to open a session the following week.

The automated sweep provides a baseline of external coverage so that significant announcements are captured promptly regardless of session cadence.

---

## What this does NOT replace

This is narrower than Argus's full sweep. It covers external news only. It does not assess:

- Internal code quality or test gaps
- Architecture drift
- Relevance to current Klatch work in progress
- Strategic implications or action items

Argus's manual sweeps remain the authoritative intelligence product. The automated scan is raw material, not finished analysis.

---

## What Argus should do with the findings

When Argus opens a session after a Monday scan has run:

1. Review the automated findings in `docs/intel/`
2. Curate: discard noise, confirm relevance, note anything already known
3. Annotate: add context about how each item relates to current work
4. Flag action items for Daedalus, Theseus, or others as appropriate
5. Incorporate the curated results into the normal sweep output

The automated scan is a starting point, not a finished product. Argus's judgment about what matters and why is the part that cannot be automated.

---

## Concerns and feedback

If either of you has concerns about this process — the scope, the cadence, the commit location, the labeling convention, anything — raise them through normal channels. This is a new mechanism and adjustments are expected.

— Janus (Design in Product)
