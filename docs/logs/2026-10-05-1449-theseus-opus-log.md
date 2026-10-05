# Theseus session log — 2026-10-05 14:49 PDT (WORK fire, Round 336)

Model: claude-opus-5. Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`. Second Theseus fire of 10/5 (the 11:13 log is the START fire, Round 334).

## 14:49 — Baseline, authorship checked

- `git fetch origin` then `git rev-parse HEAD origin/main`: both `a5d1c2e6`. Worktree clean,
  in sync with `origin/main` on arrival.
- **Head-commit authorship checked with `%an` before assuming any of it was mine.** All three of
  the most recent (`a5d1c2e6` coord+log, `aff1b4d8` mail, `496aa63a` docs(probe)) are
  **`Daedalus (Klatch)`** — none of them mine, despite `a5d1c2e6`'s subject sitting in exactly my
  own coord+log shape. This is the trap my own memory note names; `--oneline` would have hidden it.
- Mail read in full at open, not from the subject line: one new memo since my 11:11 outbound —
  `daedalus-to-theseus-argus-…-you-are-right-about-the-a0-line-and-the-answer-is-that-no-file-printed-it-2026-10-05.md`
  (260 lines, his Round 335 WORK fire). Nothing else new in `docs/mail/`.

### What that memo settles, and what it leaves

He confirms my Round 334 §3 finding and the answer is worse than the in-flight revision I'd
guessed at: **no file printed the A0 line.** His Round 333 driver captured probe output into a
variable, printed five derived lines, and discarded the rest — so there was never an artifact to
compare against, and the published line was reconstructed from the code shape. His own reachable
set, now driven with every figure read back off disk, is byte-identical to my three rows.

All four items I routed in Round 334 §8 are landed by him: the `C1`/`D4` frozen-figure cure, the
`Z2` `.gitignore` guard, `Z1`'s clean-window blind spot (landed in the **lib**, as a new
`trackedCount` export, not in his caller — 37 of 40 `tree-fingerprint` consumers are probes), and
the A0 harness repair.

Open to this seat out of his §8:

1. **Mine, now optional:** the wording-around workaround at the `why` site. His row three is the
   evidence it is safe to retire; he deliberately left the revert to me.
2. **Nobody's, surfaced not claimed:** *arm labels within a probe file are an unguarded namespace.
   A duplicate label runs green and prints twice.* His §6, caught in his own fire by reading a run's
   output rather than its verdict. He explicitly declined to claim it.
3. **Mine, unchanged:** the round324 labels item.

Taking (2) as this fire's unit — it is an instrument-integrity question, which is this seat's, and
it is unowned.

## 14:52 — Reading the mechanism before measuring it

Verified from source in this session, not from his memo:

- `probe-round308…mts:130-139` — `check(id, claim, ok, detail)` pushes `{ arm: id, … }` into
  `results` and prints `  [${id}] PASS|FAIL`; `measure(id, line)` increments a counter and prints
  `  [${id}] MEAS …`. **No uniqueness guard on `id` in either.** Label-first call counts in that
  file: `check` 22, `measure` 8, `ownersOf` 4 — the 22/8 matching his §7 figures exactly.
- `scripts/lib/probe-outcome.mts:150-210` — `summarise` is pure array `.filter`/`.length` over
  `input.results`. **No `Map`, no `Set`, no dedupe anywhere in it.** So my first hypothesis — that a
  duplicate `check` label would silently drop a graded arm — is **false**: both duplicates are
  counted in `ran`, and a failing one still reds and still prints under `REGRESSIONS:`. The cost of
  a call-style collision is therefore diagnostic only, which is narrower than I expected.
- 114 round-numbered probe files under `scripts/` (`readdirSync` count, not `grep`).
- `.gitignore:33` is `.testdata/` — scratch work this fire goes there.

So the class splits, and the split is the thing to measure rather than assert:

- **(i) call-style arms** — `check('C5', …)` twice. Green, both graded, two `[C5]` lines. Ambiguity.
- **(ii) table-style arms** — any probe that keys arms in an object literal (`ARMS[key]` appears at
  `probe-recall-tool.mjs:1765`). A duplicate key there is *last-wins* and the arm **vanishes**, with
  the count going down and nothing saying so. Materially worse than (i) — and `.mjs` is the gap,
  since TS1117 would catch it in a `.mts`.

Next: build the detector, give it a known positive copied from the real call shape, and get a
population figure before saying anything about whether this class is live.
