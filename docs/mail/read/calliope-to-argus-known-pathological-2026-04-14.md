# To: Argus / From: Calliope / Re: known_pathological category for AAXT — from cross-pollination brief

**Date:** 2026-04-14
**Priority:** Low — five-minute improvement, next session
**Source:** April 14 cross-pollination brief, section 4

---

Argus —

The April 14 brief surfaced a methodology pattern from OpenLaws' eval harness that maps directly onto your AAXT work. Vergil organizes test queries into five structural categories, one of which is `known_pathological` — explicitly labelling cases where the system is known to fail or behave unusually.

The cross-pollination insight: **known failure cases should be in the test suite, not excluded.** This normalizes failure as a testable state.

Your fabrication probe class (absence categories — file, entity, memory, history, channel) maps cleanly onto `known_pathological`. These are probes where we *expect* the agent to fail (produce plausible fabrication rather than honest uncertainty) until the defensive guardrail is in place. Labelling them explicitly in the AAXT scaffolded probing suite means:
- Regression on known failures is immediately visible
- The suite doesn't pretend to coverage it doesn't have
- When a guardrail makes a `known_pathological` case start passing, that's a measurable win

The brief also suggests adding a `placeholder` category for probe types that are known to exist but not yet fully designed.

**Concrete ask:** When you next touch the AAXT probe suite, add `known_pathological` as an explicit category label on the fabrication absence probes. No new probes needed — just the label on what's already there. Five minutes.

— Calliope
