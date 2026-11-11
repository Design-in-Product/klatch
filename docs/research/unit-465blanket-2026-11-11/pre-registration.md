# Pre-registration — `unit-465blanket`, 2026-11-11 START fire, Theseus

> **Promotion note (added after the arms ran, nothing above or below it edited).**
> The body below was written to `.scratch/theseus-11-11-blanket/PREDICTIONS.md` at
> **10:50:48 PT**; the first recordings are stamped **10:52:41 PT** — 113 s later. Both
> times read with `stat -f %Sm`, not estimated from effort. Promoted verbatim.
>
> **Arm A3 (the L×P parity matrix) is NOT pre-registered** and is declared exploratory,
> the same way `unit-465leadbound`'s bound-50 arm was. It was built at 10:53:54, after
> A0–A2 had run, because grading Daedalus's §2 raised a question his memo does not ask:
> whether the parity argument needs the live read of `FILLER` at all.
>
> **Subject pin:** `scripts/geometry-marking-before-seed.mjs`, blob
> `19cc7c9ed56cf094e03d38ecfde9d02385853e08` (`git ls-tree HEAD`, `-C`-pinned), repo HEAD
> `9e09230b`. This is the **same blob** `unit-465leadbound` measured on 11/10 — so A0 is a
> re-measurement on an unchanged subject, not a fresh baseline.

Subject: `scripts/geometry-marking-before-seed.mjs` (Klatch, HEAD `9e09230b`)

Question: is Daedalus's 11/11 memo §4 hazard — "a blanket 15→20 puts the self-check at
leading 2·20−2 = 38, past `RECALL_MAX_EXPAND_ROWS` = 30" — **silent** or **loud**?

Written before any arm ran. Scratch lives in `.scratch/` (gitignored at `.gitignore:49`)
deliberately, so `git add -A` cannot track it.

- **A0** (unmodified copy): exit 0, `self-check: unswapped model reproduces arm N1 exactly`.
  Also predicted byte-identical to the in-repo run, which is what makes the scratch depth
  irrelevant — the file has **zero** imports (checked with `grep -n "^import\|require("`,
  no output), so there is no relative resolution to get wrong.
- **A1** (blanket: all three `15`s → `20`): **predict exit 1** with `SELF-CHECK FAILED`,
  and a mismatch list naming `leading` — and also `T`/`trailing`/`restate`, because
  `T = 2L + 2P + 6` moves with `L` as well. I.e. the hazard is **LOUD**, not silent:
  the frozen `want` fixture at `:126` is the guard.
- **A2** (`:44` only, `FILLER_LEAD: 15 → 20` — my claimed WORK-fire cure *as scoped*):
  **predict exit 0**, self-check passes unchanged, and the diff against A0 is
  **exactly two lines, both denominators** (`208 → 273`, `288 → 378`), per
  `unit-465leadbound`'s already-measured bound-20 arm.

Why it matters: if A1 is loud, his §4 warning is right in direction but wrong in kind,
and my single-site cure is not exposed to it at all.
