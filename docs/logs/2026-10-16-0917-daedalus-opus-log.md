# 2026-10-16 — Daedalus (Opus 5) — START fire

Round 399. Day's first daedalus log; the three head commits at open were other seats'.

---

## 09:17 — Session start, briefing

- `git log -6 --format='%h | %an'`: three head commits — `0b159654`, `6a5ac265`, `fa64f4f7` — all
  carrying **my own** subject shape, `coord+log: 10/16 START fire — no-op on product, gate
  re-verified 43/43 green, standing blockers unmoved`. `%an` says **Argus (Klatch)**, **Calliope
  (Klatch)**, **Iris (Klatch)**. **None mine.** Round 326's lesson paid for itself immediately:
  `--oneline` hides the author, and I would have read my own fire as already done and gone no-op on
  a round that was waiting. Corroborated by `ls docs/logs/`: no daedalus log for 10/16 existed.
- `docs/COORDINATION.md` read: my last entry is 10/15 STOP = Round 397.
- `docs/mail/` read on arrival. One item new to this seat: Theseus's **Round 398**,
  `theseus-to-daedalus-…-your-397-finding-reproduces-both-cures-are-taken-and-the-shape-is-31-windows-not-one-2026-10-15.md`
  (mtime 10/16 09:17). Read in full before anything else. It routes **nothing** to me; both cures my
  397 routed are taken. His open-with-no-blocker item is the severity audit of his own 13 remaining
  FAILS OPEN sites, which he claims for his next unrouted fire — so not mine to duplicate.

## 09:2x — His round verified before building anything (328)

- His census driven unmodified in my worktree: **31 sites in code, 14 FAILS OPEN, 9 WIDE, 3 PARTIAL,
  5 UNRESOLVABLE**; 10 of 10 KPs and controls as expected; both grades true; `CENSUS OK`; exit 0.
  Reproduces with his published figures.
- Both his commits present here: `dee68c0f`, `7cf65ceb`. `git ls-tree -r --name-only dee68c0f`
  confirms his census file **does** exist at its own commit (not the Round 389 shape where fixtures
  landed two commits later).
- Tried the detached-worktree recording at `dee68c0f` (389 discipline). `git worktree add --detach`
  succeeded, but reads **outside the daedalus worktree are blocked** in this session — `ls` and a
  `cd`-prefixed git call both refused. Removed the worktree (`git worktree list` back to 7, nothing
  left behind) and substituted a **better** instrument: his denominator is "tracked JS/TS sources",
  which is a git question answerable at any rev without a checkout at all.
- Denominator verified under a key sharing neither end with his — `ls-tree` at the rev vs his
  `ls-files` on a checkout: **`dee68c0f` → 516, `7cf65ceb` → 517, `5cf014f7` → 517, HEAD → 517**,
  live index under his own selector → 517. His 516 and 517 both land. Taken to **member** level
  rather than the count (340): difference is exactly one file **added, none gone** —
  `docs/research/round398-instruments/record-drives.mjs`, his own recorder becoming tracked between
  his two drives, which is the reason his memo states.
- `scripts/lib/` checked before writing any lexer (lib-before-hand-rolling). `strip-source.mjs`
  exists, is length-preserving, and its header records that Round 257 repaired its interpolation
  model and that the regex-with-apostrophe case is why it was the extraction target. His census
  imports neither it nor anything else — `grep` for imports returns only `node:fs`,
  `node:child_process`, `node:path`. His §4 reports paying for both of those residuals this fire.

## 09:3x–09:5x — Round 399: measuring the disjunction his §3 leaves open

His §3's honest limit: absence from his census means "no longer defective **OR** invisible". Binding
an index to a name is not a cure, it is a spelling; the cure is the guard. Built
`docs/research/round399-instruments/census-the-named-binding-form.mjs` to split that into two
numbers over his selector and his corpus, importing `stripSource` rather than writing a lexer.

**First drive REFUSED at exit 1** — the collision grade was false and no figure printed (353/356).
One member of mine collided with his list at `probe-round303…:186`. Hand-read the line:

```ts
return i >= 0 ? l.slice(i + 1) : l.slice(l.indexOf('/packages/') + 1);
```

Two distinct window calls on one line — mine guarded by the `i >= 0` beside it, his adjacent.
`file:line` was the wrong granularity (345), a lesson I had taken in the matcher and not in the
comparison. Grade re-keyed per-call on byte offsets, hardcoding no count (377).

**Three corrections to my own key, each returning a SMALLER number.** All three found by
hand-reading sites the census had already flagged, none by reading my own code:

1. **Resolver took the FIRST preceding finder binding, not the NEAREST binding of that name.**
   `probe-round260:182` is a two-char window on `i` where that `i` is `let i = 0` on :176 **inside a
   different function**; it resolved to the finder binding on :137. A **FALSE site in a SWEPT
   probe** — the worst direction for a census headlined "there are more than you found". Fixed to
   collect every binding, resolve nearest-preceding by name, then ask about the finder. **62 → 51
   sites, 18 → 14 unguarded**, plus four misattributed binding lines corrected. KP-10 and KP-11
   carry both directions (341).
2. **The stratum assumed a binding refuses with -1; a compound initializer does not.**
   `m.index + m[0].indexOf(init) + at` refuses to `m.index + at - 1`, so `.slice(abs, abs + 13)`
   returns thirteen **real** characters from the wrong offset instead of collapsing — a third
   behaviour, nastier than failing open because the window reads as content. Now published
   **UNMODELLED**. **3 → 1 FAILS OPEN.** KP-12 and KP-13 carry the axis.
3. **KP-4's expected stratum was mine and wrong.** Resolved against *his* published rows
   (`.slice(0, …search(…))`, exactly 199, prints **FAILS WIDE** at `round386:79` and `round387:53`;
   196 and 198 print PARTIAL) and his source line 311, `len >= SAMPLE.length - 1`. My
   implementation already agreed with his; only my written expectation was out. Moving the number
   until my own code went green would have been the vacuous fix.

Also fixed: `init` was being displayed out of the strings-blanked reading, printing every anchor as
spaces (`src.indexOf('\n')` showing as `src.indexOf(' ')`). Now sliced from the original, which is
the documented consumer pattern for that module.

**Final figures, 17 of 17 KPs and controls green, all three grades true:** 51 named-binding window
sites in 518 tracked sources, invisible to his adjacency key by construction — **37 GUARDED**
(cured), **14 UNGUARDED** (not cured; OPEN 1 · WIDE 4 · PARTIAL 1 · UNRESOLVABLE 6 · UNMODELLED 2).
Disjoint from his 31 by construction, one file:line collision, explained. **14 is a floor** — guard
detection is file-scoped and the resolver has no block-scope model, and both drop sites rather than
inventing them.

## 09:5x — Severity, read honestly

- Swept-vs-deferred answered with the instrument, not a parse (his §4 lesson): `SWEPT` and
  `DEFERRED` are **exported** from `sweep-probes.mjs`, and line 2550 guards `main()` on
  `process.argv[1].endsWith('sweep-probes.mjs')` — so importing them does not drive it. Reads
  **43** and **110**, matching the verdict line. That guard is also the mechanism behind `--help`
  driving, which I had recorded as a hazard without ever reading why.
- The single remaining FAILS OPEN is **mine**, `round397-instruments/probe-the-anchor-that-is-not-guarded.mjs:88`
  — the file whose subject is an unguarded anchor, the fourth round running where the cure's own
  instrument carries the shape. Hand reading says **LATENT, not live**: (a) the mutator only ever
  runs on sources that still carry the marker (CF-1 is `dropMarker(reintroduce(s))`, reintroduce
  first), and (b) **`indexOf(needle, -1)` clamps its fromIndex to 0 rather than refusing**, so that
  index cannot be -1 for any multi-line source. (b) makes a whole sub-shape of this mechanism fail
  **CLOSED** — the one thing this round routes to him, since his audit list holds at least two sites
  of that shape.
- **Hand-read 3 of the 14.** The other 11 are an open item, not a claim.

## 10:0x — Gate

- `npx tsc -p scripts/tsconfig.json` → exit 0, **0 diagnostics** (output file 0 lines).
- `npm run typecheck` → exit 0, **0 diagnostics**. Both legs run, because a fire I thought could not
  reach typecheck did (396) — and this one was not docs-only anyway.
- `node scripts/sweep-probes.mjs` → **SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked
  (0 could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred**. Read out of the
  recorded file, not a pipe.
- Pre-commit `--census` on every commit: **153 probe files, 43 swept / 110 deferred**.
- **Nothing committed while the sweep drove** (358) — staged only after the verdict line.

## 10:1x — Session wrap verification

Per CLAUDE.md Session Wrap Protocol.

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -4
b7b7e96f mail: Round 399 to Theseus — his 398 reproduces, and the disjunction his §3 left unmeasured is 51 sites with 14 not cured
681c0331 round399: two modelling errors of my own, and the OPEN count falls 4 → 3 → 1
a85b4a11 round399: census the spelling his adjacency key cannot reach — 62 named-binding windows, 18 unguarded, 4 fail OPEN
0b159654 coord+log: 10/16 START fire — no-op on product, gate re-verified 43/43 green, standing blockers unmoved
```

Pushed incrementally in three commits across the fire rather than once at the end (2400s lesson),
with the mail as its own commit straight to `main` so he does not wait on the rest.

**Note on `a85b4a11`'s subject:** it states 62/18/4, which the next commit corrected to 51/14/1.
Left as written — it was true of the tree at that commit, and `681c0331` names both the old and new
figures in its body. Rewriting it would be the thing this project keeps finding: a cured figure with
a live sentence about the old one.

**Step 2 — deliverable files present** (verified with `ls`, output in the fire):
`docs/research/round399-instruments/census-the-named-binding-form.mjs`, `.out`,
`sweep.out`, `typecheck-scripts.out`, `typecheck-packages.out`,
`docs/mail/daedalus-to-theseus-…-2026-10-16.md`, `docs/COORDINATION.md`.

**Step 3 —** this log pushed last.

**Drain:** done, bounded. One item new to this seat (his Round 398), verified, answered, replied to
in the same fire. Deferrals, each with its blocker named: the 11 unread severity sites (**no
blocker** — next fire's first item, no deadline attached); my Round 389 `R1`/`R4` re-key (blocker:
the pair needs re-aiming rather than loosening, and no fire has opened with it first); his Round 394
`detachedAt` guard (his, blocked as he framed it, noted not nudged). Nothing here needs xian.
