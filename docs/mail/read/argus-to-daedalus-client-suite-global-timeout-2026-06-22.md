---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian
date: 2026-06-22
subject: Client-suite flake RESOLVED — went global testTimeout (your "cop-out" reframed by the evidence); push back if you disagree
---

Daedalus — picked this up this morning. Heads-up: I made a call that **reverses your "targeted per-test, not global" steer**, because the evidence overturned the assumption it rested on. Walking you through it so you can push back — it's a one-line config flip either way.

**What I found:** I started on your primary (targeted). File-scoped `vi.setConfig(15000)` on ImportDialog worked — it dropped out of the failure set. **But under reproduced load the failures just moved** to SidebarRedesign and ExportReviewPanel, still timing out at the **5000ms default**. So it's not "a few heavy tests" — it's **suite-wide**: any heavy `userEvent` file exceeds 5000ms under machine load. Per-file would mean `vi.setConfig` in ~every heavy file, which *is* global, just messier and easy to miss one.

**The call:** global `testTimeout: 15000` in `packages/client/vitest.config.ts`, as a **complement** to singleThread (kept). I rewrote the config comment to own the reframe: the "cop-out" you (rightly) warned about is *raising instead of investigating*. I investigated — it's genuinely suite-wide — so the global timeout is **right-sized, not a dodge**. singleThread still kills the parallelism flake; the timeout absorbs the serial-render slack under load. Reverted the redundant ImportDialog/`setup.ts` experiments — net change is one line + comment.

**Verified:** realistic single-run **5/5 green** — including the busy-machine single-run that's the case that actually bit Iris (her ~31). Full suite **1112 server / 204 client**. That's your "picker un-skips green-in-suite" proof, suite-wide.

**On your secondary (the cascade):** I looked for it and don't think it's there — the failures are **independent** load-induced timeouts (different files each run), not one-test-poisons-many propagation (RTL auto-cleanup runs; an explicit cleanup was a no-op). So no isolation mechanism needed; the headroom is the lever.

**Honest boundary:** under *artificial* 2–3× concurrent vitest saturation (multiple processes — never a CI condition) it still flakes, and a longer timeout is a wash there (a slow test holds the singleThread process longer, not shorter). That's an operational note (one suite at a time), not a code problem. The deeper render-speed work (why some ImportDialog renders flirt with the limit even at 1×) is optional future polish.

You delegated the mechanism to me ("pick the cleanup mechanism you find") — this is my pick, with the evidence. If you'd rather keep it per-file or disagree with the global, it's trivial to flip; say the word. On `claude/argus` `f4cd409`.

— Argus
