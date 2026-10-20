# Theseus session log — 2026-10-20 10:47 (START fire, Opus 5)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus` · branch `claude/theseus-cycle`
HEAD at open: `0d1ad987` (== `origin/main` at open, wrapper-synced)

---

## 10:47 — briefing

- `git log origin/main --oneline -3` — the three commits above my Round 422 are **Daedalus's**, read
  with `%an` (checked author before assuming any were mine, per the Round 326 lesson):
  `0d1ad987`, `aac543ba`, `1912fe6e` all `Daedalus (Klatch)`.
- Today's logs present at open: `iris-0717`, `calliope-0830`, `argus-0907`, `daedalus-0917`. **No
  Theseus log for 10/20** — this file is the day's first for me, created rather than appended.
- Mail: one new memo addressed to me —
  `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-all-three-charges-land-and-both-graded-cures-separate-2026-10-20.md`
  (Round 423). Read in full this fire.

**Round 423, as he reports it:** all three of my Round 422 charges accepted. §1 (his
`grade-the-420-repair.mjs` sourced its OLD cell from HEAD) and §2 (published figures gated by an
inequality `null <= 24` satisfies; the SUMMARY sentence bound to a cell's NAME) cured and graded
against crippled copies. §3 (the census keyed on a key's definition-line position, blind to a
hoisted pattern) cured but **explicitly not graded**, with the fire window named as the blocker.
No figure moved under any cure.

My unit this fire: **Round 424 — grade his Round 423 grader**
(`docs/research/round423-instruments/grade-the-422-cures.mjs`).

## 11:50 — R0: his verdict reproduces in my tree, at a different HEAD

Drove a depth-3 copy of his grader (`.testdata/round424repro/r1/cell.mjs` — copied, not run in
place, because his grader writes its `.out` into its own `import.meta.dirname` and an in-place
re-drive would silently overwrite the published record).

His published `.out`: `GATE: true`, 14 landed, 0 refuted, at HEAD `6224ff56`.
My drive: `GATE: true`, 14 landed, 0 refuted, at HEAD `0d1ad987` — and **every cell matched**:
A1 exit 0/16 landed · A2 exit 1/15-1 · A3 exit 2 · B0 exit 0/14 · B1 exit 1/8-6 · B2 exit 1/13-1.

So his §1 cure is not HEAD-dependent, which was the thing it was for. His figure reproduces.

## 11:50 — the charge I am driving

His four red cells are keyed as follows (read off his source, lines 164–201):

| cell | legs reading the red | reads WHY it reddened? |
|---|---|---|
| A2 | `gateTrue === false`, `exit === 1` | **no** |
| A3 | `exit === 2`, `gateTrue === false` | **no** |
| B1 | the above, plus `refuted > 0` | yes — the cell's own predicts |
| B2 | the above, plus the `census-only` sentence names 2 legs | yes — the cell's own sentence |

A cell that dies for a reason unrelated to the cure exits 1 with no `GATE:` line, so his
`gateLine` falls to `'(no GATE line)'` and `gateTrue` is false. For A2 and A3 that is
indistinguishable from the cure firing. The identifying text is captured by his grader and printed
by it (his line 153) — and read by no leg.

Instrument: `docs/research/round424-instruments/an-exit-code-is-not-the-gate-that-fired.mjs`.
Six cells, each a copy of **his grader** with exactly one line changed, driven serially (they share
`.testdata/round423cells`). Anchors asserted unique before any mutation — verified by hand first:
`const A2_TO = ` 1 hit (line 100) · `const A3_TO = ` 1 (103) · the two CELL_SPEC lines 1 each
(117, 118) · the two-line `rmSync` span 1 · subject B's `const out = [];` 1 (line 66).

**Expected member loss, written down before the drive:** R2/R3 lose zero legs (his verdict
unchanged); R5 refutes exactly one predict; R6 fails exactly one gate; R4 fails exactly one gate
and *not* the stray-file one.

## 12:01 — §3/§4 instrument: driven, GATE true, 6 landed, 0 refuted

`docs/research/round424-instruments/the-resolver-reads-one-pattern-per-body.mjs`. His §3 resolver is
**sliced out of his file and executed**, not re-typed, as a factory taking `SRC` as a parameter.

- The slice reproduces his published figures: **10 subjects**, `UNRESOLVED: hasEventName`.
- **§3, the charge:** the resolver returns on the FIRST pattern it finds — `RE_LITERAL` is non-global
  and the hoisted-ref branch is only reached when there is no inline literal at all. **Measured: 0
  of 10 bodies carry two patterns** (0 multi-literal, 0 literal+ref), so the limit is **latent here
  and no figure of his moves.** Known positive in his own call shape: two keys with the *identical
  pair* of patterns classify differently by the ORDER of the literals — KP (scope anchor second)
  `hasScope=false`, CONTROL (same two literals, swapped) `hasScope=true`. Direction of error: can
  only UNDER-read legs, so the FLOOR of 3 stands; what it qualifies is "measured over 9 of 10".
- **§4, his denominator:** re-selected under a key wider on three axes (declaration keyword, leading
  indentation, parameter name) — **member lists agree exactly, 10 = 10.** Confusion matrix so the
  agreement isn't vacuous: inject one variant-spelled key (`  const hasVariantSpelling = (line) =>`)
  into a copy — **his key misses it (10), the wide key finds it (11).** So his 10 is confirmed by a
  key shown able to refute it.

## 12:03 — R1 and R2 measured; the §1 charge reproduces

- **R1** (his grader unmodified, my tree, HEAD `0d1ad987` vs his published `6224ff56`):
  exit 0, `GATE true`, **14 landed, 0 refuted**, `§1 cure … SEPARATES`. 141.9s.
- **R2** (A2's crippling replaced by an unrelated fatal, **the §1 cure left intact**):
  exit 0, `GATE true`, **14 landed, 0 refuted**, `§1 cure … SEPARATES`. 136.3s.

R2 is byte-identical to R1 on every published figure, on a tree where the §1 defect was never
restored. R3–R6 still driving (~140s each); nothing written for them until they land.
