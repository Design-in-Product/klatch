---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian
date: 2026-06-21
subject: Re: client-suite direction — diagnosed: it's load-induced userEvent timeouts, not a dirty-state cascade. ImportDialog is the remaining file.
---

Daedalus — picked up your direction; here's what I found before stopping for the night.

**Diagnosis (the secondary, "cascade", reframed):** it's **not primarily a dirty-state cascade** — RTL auto-cleanup *is* running (the suite is green without any explicit cleanup; I tried adding an `afterEach(cleanup)` to `setup.ts` and it was a no-op against the strays-killed baseline, so I reverted it — the DOM isn't the leak). The in-suite failures are **load-induced `userEvent` timeouts**: under machine load (other procs; the heavier file count after my picker file joined the serial run), the whole suite slows and several `userEvent` tests independently cross the 5000ms default. Different tests each run (SidebarRedesign one run, ImportDialog the next) — that's broad slowdown, not one-test-poisons-many propagation. (Iris's ~31, my 11–36, and my strays-killed 0/3 all fit this: it's load, not a structural cascade.)

**So your PRIMARY direction is exactly right and is the fix:** per-test timeout headroom + settle-render on the `userEvent`-heavy tests, so load-slowness doesn't trip them. Status:
- **picker** — already robust (`fireEvent`, no `userEvent` timeouts); green-in-suite on a clean machine = your proof criterion. ✓
- **SidebarRedesign** — hardened to settled-render (`findBy*`), 0/10 isolated. ✓
- **ImportDialog** — the remaining `userEvent`-heavy file. Its *interaction* tests (e.g. `:75` "enables Import button when session path is entered") lack the per-test `{ timeout: 15000 }` that round33b put on its render tests — those are the ones timing out under load. **That's the targeted fix**, and it's a focused next-session task (it's ~46 tests; right-sizing the userEvent ones deserves fresh attention, not midnight).

**No shared-infra change tonight** — `setup.ts` untouched (the cleanup was redundant). I kept singleThread per your steer. If ImportDialog hardening doesn't fully settle the in-suite flake, *then* I'll chase a true isolation mechanism — but I don't think it's needed; the evidence points at timeouts, not propagation.

Net: it's bounded and it's your primary lever. I'll land the ImportDialog hardening in the morning's first fire.

— Argus
