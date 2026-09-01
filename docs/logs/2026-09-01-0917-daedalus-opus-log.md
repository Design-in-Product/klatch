# Daedalus — 2026-09-01 session log

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.

---

## 09:17 PT — START fire. Round 131: conjunct 2, and the price turns out to be already charged.

**Briefing.** Worktree synced by the wrapper; `git log` at `0b9ea74`, tree clean. Read
`docs/COORDINATION.md` (Daedalus section, last fire 8/31 17:17 STOP / Round 129). Checked
`docs/mail/` — one inbound addressed to me,
`theseus-to-daedalus-cc-xian-team-the-file-was-hiding-its-own-over-fire-2026-08-31.md`, read in
full. Read `docs/briefs/cross-pollination/current.md` (9/1) in full — two items, no action for me;
its lead item is Theseus's Round 130, which is the memo I was answering.

Theseus's §8 named the fair target: conjunct 2 of `anchorsOf` in `scripts/verify-tsx-guard.mjs`.
Took it in the fire that received the memo.

**Baseline reproduced before touching anything:** `node scripts/verify-tsx-guard.mjs` →
`PASS — all 168 checks passed`. Matches the count Theseus reported for Round 130.

**Zero API calls, zero model calls, zero corpus runs. `packages/` untouched.** All probe scratch
under `.testdata/r131/` (gitignored, disposable).

### What was measured

1. **M27** — a read-only module under `scripts/` (`probe-r131-slash.mjs`, not `verify-*`, so §(b2)
   and §(c) never touch it) doing a genuine unguarded `await import('../packages/shared/src/types.ts')`,
   preceded by `p.replace(/\//g, '-') + ` a multi-line template literal.
   Result: **`PASS — all 168 checks passed`** — silent miss.
   Control, one line different (template written as a plain string): **`FAIL — 1 of 169`**,
   `["probe-r131-slash.mjs"]`, report line `UNGUARDED probe-r131-slash.mjs (read-only: outside the
   run population)`.
   Single defect, no conjunction. Mechanism: the regex's escaped slash makes the scanner read the
   following `//` as a line-comment opener, blanking the rest of the line and swallowing the
   template's opening backtick; the closing backtick then reads as an opener and the import site
   becomes string interior. This is a *second* door, not the one the header states.
   Note the direction of the count: 168 vs the control's 169 — the miss also drops the file's own
   `CONTAINMENT` row, so a silent miss lowers the denominator.

2. **The larger finding, not gone looking for.** Lifting the real text of `stripSource` out of the
   file under test (not a reimplementation) and asking per module which lines are non-blank in the
   strings-kept reading and blank in the strings-blanked one — i.e. which lines the scanner believes
   are string interior — **three of the 38 modules in `readable` are scanned wrong on the clean
   tree today**:
   - `verify-recogniser-equivalence.mjs` — **221 of 322 lines**, from line 80; opener line 79's
     regex containing `"([^"]*)"`. Its four import sites are at 61/62/64/65 — a **15-line margin**.
   - `verify-filler-constraints.mjs` — 52 of 359, from 257; opener line 255,
     `/\bhere(?:'s|’s| is| are)\b/i` — **Theseus's own `/it's/` spelling, live in the tree**.
     Import site at 107, 148 lines above.
   - `lib/tsx-required.mjs` — 36 of 153, from 113; opener line 112's `"([^"]*)"`. Prose only, no
     real site.
   `verify-tsx-guard.mjs` itself is **not** among them, so Round 130's `SELF` control is measuring
   what it claims to.
   The existing `PRECONDITION — the scanner preserves offsets` check is green and **structurally
   cannot see this**: all three are length-preserving in both readings. It bounds the offset half of
   the price; the state half is the half that is currently non-empty.

3. **Correction to the stated residual's spelling.** `/it's/` immediately before a real import site
   does **not** drop that site — 1 anchor, 1 survives conjunct 2, reads narrow. The apostrophe opens
   a string that the specifier's own opening quote closes, and `stripSource` emits a closing
   delimiter verbatim in both readings, so conjunct 2 is satisfied by accident. Conjunct 2 therefore
   has a false-*accept* path as well as the false-reject one. Not a defect standalone, but it means
   a repair verified only against the minimal instance of the stated residual would look like it
   worked.

### What was deliberately not shipped

A per-character delimiter-parity precondition (odd parity in the strings-blanked reading ⇒ the scan
ended open). Measured: flags M27 and exactly those three files, nothing else. Not shipped because
it is necessary-not-sufficient (an even-parity re-pair escapes it — finding 3 is that case), it is a
file-level answer to a site-level question (Round 127), and **it goes red on the clean tree** —
shipping it spends either a standing red or edits to three files that aren't broken. That decision
belongs to Theseus or xian, not to the round that found the reason for it.

No case-table row added, deliberately: a row asserting today's behaviour codifies the defect, a row
asserting the correct one is a standing red. Rows belong to the repair round.

### Still open

- The regex-literal recognition heuristic in `stripSource` — the actual repair, closing both doors.
  Proposed as the fair target for Round 132, with a mutant pointed at the heuristic itself.
- My own Round 129 §8 question — a fourth limb for the three read-only importers. **Neither Theseus
  nor I have measured it.** It is more pointed now: M27 is read-only, and a fourth limb would have
  caught it without touching the scanner at all.

### Tree state

Mutant removed. Re-ran the verifier after removal: **`PASS — all 168 checks passed`**, `git status`
clean of `scripts/` changes. `packages/` never touched.

### Filed this fire

- `docs/research/round131-conjunct-2s-stated-price-is-already-being-paid-on-three-live-files-2026-09-01.md`
- `docs/mail/daedalus-to-theseus-cc-xian-team-the-price-is-already-being-paid-on-three-live-files-2026-09-01.md`
- Round 130 inbound closed → `docs/mail/read/` (its ask is discharged; my reply opens the new item).
- This log; COORDINATION.md updated.
