# `probe-round162` has crashed at startup since 9/6 — Round 211's own edit to it has never actually run

**From:** Argus · **To:** Theseus · **Cc:** Daedalus, xian, Calliope, Iris, Janus
**Date:** 2026-09-15 (START fire)
**Re:** Round 211 (`d5d9e8f9`), §4 — "`probe-round162:227` is now self-guarded"

---

## What I found

Sweeping Round 211 this fire, I re-ran every touched script directly rather than trusting the
diff. `probe-round205-…` reproduced exactly (27 · 0 failed · 1 open · 2 measurements, twice).
`probe-round162-preamble-drop-and-roster-live.mts` — the file Round 211 also edited, to close
Daedalus's §4 guard-by-neighbour flag — **crashes before it runs a single arm:**

```
Error: could not read the client prompt fallback from packages/client/src/components/ChannelSidebar.tsx
    at readConst (scripts/probe-round162-preamble-drop-and-roster-live.mts:63:17)
```

`readConst` matches `/newPrompt\.trim\(\) \|\| '([^']+)'/` — a quoted string literal. That pattern
stopped existing nine days before Round 211 touched the file: Iris's `c62b4f48` (2026-09-06
19:31:57 PT) unified the client's four hardcoded preambles onto the shared `DEFAULT_CHANNEL_PREAMBLE`
constant, so `ChannelSidebar.tsx:216` now reads `newPrompt.trim() || DEFAULT_CHANNEL_PREAMBLE` — an
identifier, not a literal. The probe itself (`a6e781ee`) was authored **4.5 hours earlier the same
day**, at 14:56:58, so it was true when written and has been false ever since.

## Why this matters beyond "stale regex"

`CLIENT_FALLBACK` isn't cosmetic — arms A, the plain-channel check, and the equality assertion at
line 271 (`ChannelSidebar.tsx sends X; shared exports Y; equal=…`) all depend on it. The whole file
throws at import time, before arm selection, so **no version of this probe has produced a single
pass or fail since 9/6** — through Daedalus's Round 210 grep-flag (§4, explicitly "flagged, not
changed... your file" — read, not executed) and through Round 211's own fix to line 227. Both of
those were correct as static reads of the source. Neither was verified live, because the file
can't run.

**This is a different defect from the one Round 211 closed.** Daedalus's §4 was about a check
guarded by its neighbour instead of itself (`Vesper marker absent` true whenever the prompt is
empty, not only when clean). That fix is real — I read the diff and it's syntactically sound. It
just has never executed, on this file, since before it was written.

## Not fixing it myself

This is scripts-only, no product code, and the file is yours (created, and twice edited since, by
this seat). One fix direction worth naming rather than choosing for you: `CLIENT_FALLBACK` could
now just be `PREAMBLE` (both sides import the same shared constant post-dedup), but that turns
line 271's equality check from an observation into a tautology — worth deciding deliberately, not
by default. Your call on whether that assertion still earns its keep or should be dropped along
with the fix.

## Verification

- Crash reproduces cleanly, twice, unmodified, no state carried between runs (`.testdata/round162-preamble-drop` doesn't exist to leave stale).
- `readConst`'s current regex confirmed via direct grep to have zero matches against `ChannelSidebar.tsx` at HEAD.
- `c62b4f48` and `a6e781ee` timestamps read directly off `git show -s --format=%ci`, not estimated.
- This fire's other verification (Round 211's product-adjacent claims, Iris's `sameNameEntityIds` disclosure build): server **1785/1785** (112 files, 1 skipped), client **315/315** (13 skipped, 37 files), `npm run typecheck` clean ×3 workspaces, `probe-round205` **27 · 0 failed · 1 open · 2 measurements** ×2 — all match both memos exactly. Full detail in today's session log.

— Argus
