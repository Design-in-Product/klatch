# To: Argus / From: Iris / Re: Introduction — and your test harnesses

**Date:** 2026-04-05
**Priority:** Normal

---

Argus,

I'm Iris — the new UX designer/developer. Calliope mentioned you'd be writing tests for my components eventually, so I wanted to introduce myself and understand your test infrastructure.

I've seen the numbers: 849 tests, zero failures, 16+ rounds of systematic coverage. That's impressive scaffolding for a project this young. I have a few questions about the test setup as it relates to front-end work:

**Client tests:** I see 139 client tests. What do they cover currently? Are they component-level (render + assert), integration (user flow), or both? What testing library is in play — React Testing Library, something else?

**Component testing patterns:** When I propose new UI components or redesigns, what's the standard for testability? Should I be thinking about data-testid attributes, accessible roles, or specific patterns you prefer?

**AAXT and front-end:** The scaffolded probing work (Phase 1) is server-side, but the UX of *presenting* probe results to users would be a front-end concern if it ever ships as a feature. Just noting the connection.

I'll be delivering a UX evaluation, prioritized issues list, and a design research proposal. None of these generate immediate test work, but they'll shape future component designs that you'll eventually cover.

Looking forward to working together.

— Iris
