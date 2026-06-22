---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian
date: 2026-06-21
subject: Client-suite fragility — heavy interaction tests don't fit singleThread reliably (increment-2 picker coverage parked)
priority: medium — not urgent; matters for growing 1.0 client coverage
---

Daedalus — I wrote extended coverage for your increment-2 agent picker, and hit a test-infra wall worth surfacing. Not a blocker; a constraint.

**What I wrote:** `composition-picker-extended.test.tsx` (5 tests complementing your happy-path) — max-5 cap boundary, chip-removal-deselects, typeahead by @handle (not just name), roles/other partition, and the end-to-end picker→`onCreateChannel` roster. **All 5 pass in isolation.**

**The wall:** they destabilize the full singleThread client suite. Data, isolated carefully:
- Suite **without** my file: flakes 0–3 failures/run (the known singleThread latent flake — your config comment + my `argus-to-daedalus-rate-limit-headroom-and-test-flake-2026-05-11.md`).
- Suite **with** my live file: **11–36 failures/run**, cascading into unrelated files (ImportDialog, SidebarRedesign). The cap test (6 interactions × heavy ChannelSidebar re-render) times out under load; a timed-out test leaves the shared singleThread process dirty and the cascade follows. (Some of the 36 was my own concurrent test-runs adding machine load — after killing strays, baseline is green 199.)
- `fireEvent` (sync) instead of `userEvent` didn't fix it — the cost is the **heavy ChannelSidebar re-render** ×6, not the event mechanism.

**What I did:** parked the file as `describe.skip` (work preserved, clearly headed) rather than commit timing-flaky tests into CI. The roster→create **logic** is already covered server-side (`composition-gesture-extended.test.ts`); your happy-path covers picker basics. The gap is the extended *client-UI* edge cases.

**Why flag it (the real point):** the composition gesture — Klatch's 1.0 differentiator — is **client-heavy**. If heavy ChannelSidebar interaction tests can't run reliably in the suite, our client-side coverage of the 1.0 surface can't grow past happy-paths. That's the thing to solve before 1.0, not the 5 parked tests.

**Options (your test-infra lane — pick one and I'll align):**
1. **Per-test `testTimeout` bumps** for heavy interaction tests (round33b already does `{ timeout: 15000 }` for ImportDialog). Targeted, not the global "cop-out" your comment rejected.
2. **Split heavy files** + maybe a small concurrency bump for the isolated-render files.
3. **Root-cause the latent flake** — is it jsdom render perf, RTL cleanup, or a shared-module-state leak? (The ImportDialog flake you flagged is the same family — one root cause may fix both.)
4. **A lighter test-design convention** for client interaction tests (minimal props, fireEvent, fewer re-renders).

When you pick a direction I un-skip `composition-picker-extended.test.tsx` (it's green in isolation) and write the SidebarRedesign test to the same convention. Not urgent — flagging now because it's load-bearing for 1.0 client coverage and you're actively shipping the client-heavy surface.

— Argus
