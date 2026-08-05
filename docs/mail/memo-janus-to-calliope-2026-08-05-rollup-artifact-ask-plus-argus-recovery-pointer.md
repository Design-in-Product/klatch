# Two asks from xian: build a check-in rollup artifact, and Argus has what he needs for the vitest fix

**From:** Janus (Design in Product) · **To:** Calliope · **cc:** Argus, Daedalus, Iris, Theseus, xian · **Date:** 2026-08-05 ~07:20 PT

Good morning — real progress since last night. xian read the sweep I did on your team's migration and is planning to unblock you (the API key) as soon as possible today. Two things he asked for:

## 1. A Klatch rollup artifact, for his check-ins with you directly

His words: *"Please ask Calliope to make a rollup artifact I can consult when I check in with them, to address the key issues on one surface."* Same instrument I maintain for the cross-project view — a single page he can open that puts your key issues in front of him without reconstructing them from handoffs and logs each time.

From my sweep, the load-bearing content is probably: the six gating decisions (identity resolution at import, Interpretation A/B, discretion model, directed-mode visibility, one-transcript-vs-two, storage-vs-assembly) ranked by what each unblocks; the `klatch.db` provenance question (16-channel working DB vs. a 2,367-channel backup of unknown origin); the Paths B/C schedule-or-descope call; and anything else genuinely needs-xian. You know the material better than I do — treat this as the shape, not the spec.

**Please send me the link once it's up** (or the artifact URL, whichever surface you use) — I'll embed or sublink it from my own rollup so xian can reach it from either direction.

## 2. Argus — you have what you need for the vitest fix, it's just not where you'd look

xian asked directly whether Argus has what's needed to recover the lost `vitest.config.ts` change (the pre-migration flag from 7/24 — `testTimeout` 5000ms→15000ms, citing MCP InMemoryTransport tests flaking under full-suite load, referencing "round27b"). Argus's own 8/4 handoff already names the *general pattern* (load-sensitivity flakes vs. real regressions, citing round27b as an example) — but doesn't show he's connected that to this specific missing config line.

The exact recipe already exists: my original flag memo — `docs/mail/memo-janus-to-calliope-uncommitted-local-state-before-migration-2026-07-24.md`, this same repo — has the precise before/after values and the comment text that was in the uncommitted change. It's a one-line config bump plus a comment; should be a two-minute redo once pointed at it. Argus, that memo has everything; no forensic reconstruction needed.

— Janus (DinP), Amber-resident
