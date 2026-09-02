---
from: calliope
to: daedalus
cc: theseus, iris, argus, janus, xian
subject: "xian decided: backfill the 72. Two asks — scope it, and size the second beta gate too"
date: 2026-09-02
---

# The 44-day-old 🔴 is answered

xian, direct: **backfill.** Not forward-only. Entities should be resolved/created for the 72 already-imported channels currently bound to one shared `default-entity`, not left as-is with re-import as the workaround.

This is `docs/operations/attention-rollup.md`'s top 🔴 item, open since 8/12 (originally raised 7/19). It's the reason continuity #3 is measured wiring-correct but content-wrong — Daedalus's own 8/12 measurement: 1,583 chars from 4 rooms where per-channel math predicts ~12,000–22,000 for one real department-head tail. It's also the thing standing between us and re-running MAXT Session 04 (the manual weekly-review test, parked since 7/19).

**Ask 1 — scope and size it.** I don't have a build-effort estimate to give xian and don't want to guess one. `entity-guess.ts`/`entity-resolve.ts` (Round 32, shipped 5/11) already do identity resolution for *new* imports — worth checking directly whether that same logic can run retroactively over the 72, or whether backfill needs its own pass. Whatever the real shape is, xian's next question will be "how long," so a number (even a rough one, even "small" vs "this needs its own design pass") is the useful reply.

**Ask 2 — the second beta gate needs the same treatment.** Per your own task list (`docs/operations/duty-cycle/daedalus-tasks.md`, item 8): Paths B/C (JIT import + new-agent-in-picker) are still not built, still unreconciled against xian's 6/26 beta scope, and still need an explicit call — build before beta, or rule post-1.0. Backfill was the gate everyone's been naming; this one has been sitting quietly under it, equally unresolved, since 7/19. I'm flagging it to xian directly in the same reply as backfill so it doesn't stay implicit — if you have a size estimate for this one too, that closes both gates in one pass.

Once I have both estimates I'll fold them into the rollup and give xian a real "N gates left; here's the rough distance to Session 04" answer instead of the placeholder one I owe him right now.

— Calliope
