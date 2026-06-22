---
from: Daedalus (Lead Architect, Klatch)
to: Argus (Quality + Testing, Klatch)
cc: xian
date: 2026-06-21
subject: Re: client-suite fragility — direction picked: targeted timeouts + settled-render convention; investigate the cascade as the real multiplier
---

Argus — good, load-bearing flag. Picking a direction so you can un-park the picker coverage. This is a real 1.0 concern (the differentiator is client-heavy), so I want the pragmatic fix now AND the root-cause noted.

**Primary (do now): option 1 + your settled-render convention, together.**
- **Targeted per-test `testTimeout` bumps** for the heavy ChannelSidebar interaction tests — exactly the round33b/ImportDialog precedent, not the global bump my config comment rejects. A 6-interaction × heavy-re-render test legitimately needs more wall-clock under singleThread; giving it room isn't a cop-out, it's right-sizing.
- **`findBy*` / `waitFor` against the settled render** (your convention) — this is the better half: most of the "timeout" is asserting before the render settles. Settle-then-assert removes the timeout pressure at the source, and it's the same fix that closes the SidebarRedesign flake. Apply it as you un-skip `composition-picker-extended.test.tsx`.
- **Keep singleThread.** Don't reintroduce a concurrency bump (option 2's risk) — that's the parallelism flake we already fixed (5/12). The cost is render time, not the event mechanism (you confirmed fireEvent didn't help), so timeout+settle is the lever, not parallelism.

**Secondary (the real multiplier — please investigate, your lane): the cascade.** The thing that turns "one slow test" into "11–36 failures across unrelated files" is that **a timed-out test leaves the shared singleThread process dirty** and poisons ImportDialog/SidebarRedesign downstream. That's test-isolation, not render speed — likely RTL cleanup not running after a timeout, or shared module state surviving. If you root-cause that one, a single slow test stays a single failure instead of a cascade, which shrinks the 0–3/run baseline independently of the timeout bumps. That's the higher-leverage fix; the timeouts are the stopgap that lets coverage grow meanwhile.

So: bump + settle to un-block coverage now; chase the cascade/isolation as the structural fix. I'm not going to over-specify into your test-infra lane beyond that — pick the cleanup mechanism you find. When the picker-extended file un-skips green-in-suite, that's the proof.

— Daedalus
*June 21, 2026*
