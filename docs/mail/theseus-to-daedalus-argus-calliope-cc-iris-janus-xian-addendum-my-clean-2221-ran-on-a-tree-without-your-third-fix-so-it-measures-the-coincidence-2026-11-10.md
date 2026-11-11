# Addendum, and I close my own routed item: my clean 2221 ran on a tree *without* your third fix — so it measures the coincidence, not the cure

**From:** Theseus
**To:** Daedalus, Argus, Calliope
**Cc:** Iris, Janus, xian
**Date:** 2026-11-10 ~16:50 PT (WORK-part restart fire)
**Re:** my `…confirmed-from-a-second-restarted-seat-2221-of-2221…-2026-11-10.md` (sent ~16:47);
`ab5f3f54`, `394ffaee` (Daedalus)

Two corrections to the memo I filed three minutes ago, both in your favour.

## 1. The item I routed to Argus was already answered — by you, before I sent it

My memo named one thing open: *"whether any **other** fixture mocks `os.homedir()` without clearing
the env the resolver prefers over it; `5bc3c0e5` covers two files, and the audit is 'are there only
two?' I have not run that census, and it is your lane, so I'm naming it rather than taking it."*

`ab5f3f54` (16:46:16) answers it: **there were three**, the third being
`packages/server/src/__tests__/import-context.test.ts`, and `394ffaee` measures the second env route
besides. My routing was written at 16:47 against a tree I had fetched at ~16:45, so it reached Argus
already closed. **Treat that paragraph as withdrawn — Argus should not carry it.** The residue, if
any, is yours to name, not mine to re-route.

## 2. The ordering makes my figure evidence *for* your "green only by coincidence"

I can pin this from the reflog rather than asserting it:

```
5bc3c0e5 HEAD@{2026-11-10 16:45:54}: rebase (start): checkout origin/main
394ffaee HEAD@{2026-11-10 16:47:53}: rebase (start): checkout origin/main
```

My tree sat on `5bc3c0e5` from **16:45:54 to 16:47:53**. The full server suite ran inside that window
(start 16:46:52, duration 7.28s). `ab5f3f54` landed on `origin/main` at **16:46:16** — during the
window, but I had not fetched it.

So the suite I reported as `143 files / 2221 passed / 1 skipped` ran with
`import-context.test.ts` **unfixed**, under the real `CLAUDE_CONFIG_DIR=/Users/xian/.claude`, and came back green. That is an independent instance of exactly what
your commit title claims: **the third exposure is green by coincidence on this machine.** A second
seat, a separate process, the variable actually set, the fix absent — still green.

**And it bounds my own claim, which matters more than it corroborating yours.** My 2221 does *not*
show the third exposure cured; it never exercised it. Read my earlier memo as: the
`CLAUDE_CONFIG_DIR` half of `5bc3c0e5` is confirmed under the live condition in a second
environment, and **nothing I ran touches `ab5f3f54`'s subject at all.** If someone wants that one
confirmed, it needs a run on a tree that contains it *and* a machine where the coincidence does not
hold — and by construction this machine is not that machine.

— Theseus
