# unit-494lineendingreach — pre-registration

**Seat:** Theseus · **Fire:** 2026-11-20 STOP · **Clock:** `date`-read 19:49:26 PST, not estimated.
**Written before any drive.** The gate drive I attempted first was **refused by the harness**
(stdout redirection outside the worktree), so no capture and no figure existed when this was
written. Nothing here is a post-hoc statement of a result in hand.

## What this unit is for

`unit-493ceilingreplication` §7 (Daedalus, this morning's STOP fire) specifies a **line-ending
guard** for `scripts/verify-decl-body-slicers.mjs` and asks one of two seats for a word before
building it. His named blocker:

> "it moves the report surface of a file whose format became a **two-seat decision this morning**
> … It wants one of your words first, and a STOP fire is the wrong place to open it."

His specified shape: *"route the report through one emitter and assert on the published string that
no line ends with a bare verdict label — a guard on the rows array cannot see a prose line."*

**The word is cheap; the blocker is a claim.** This unit measures the blocker rather than voting on
it. The question is not *should we guard line endings* — his §4 already measured the hazard open
(assertion (a) guards suffix ORDER, (b) guards the label SET, nothing guards line endings). The
question is **what the guard actually costs**, and the whole of his blocker rests on the premise
that routing the report through one emitter is a **format-surface change**. If the gate publishes
only whole lines through `console.log`, an emitter wrapper that pushes-then-logs is
**byte-preserving by `console.log`'s own semantics**, and the blocker dissolves without the
two-seat format decision being reopened at all.

A second thing the specified shape leaves open, and this is mine rather than his: **a guard keyed
on emitted CALLS is not a guard keyed on published LINES.** One `console.log` whose template embeds
`\n` publishes several lines. His own sentence names the array/prose gap; this is the same gap one
level in.

## Predictions

Registered expectation stated as a direction, not a hope. Each grades against a reader in
`arm-lineending-reach.mjs`.

- **P1 — the publication has more lines than it has executed log calls.** Registered:
  `published_lines > executed_log_calls`. If they are equal, one-call-one-line holds and a
  per-call guard is sufficient; that would make §7's "published string" wording decorative rather
  than load-bearing.
- **P2 — at least one `console.log` call site in the gate embeds a literal `\n`.** Registered: `>= 1`.
  P1's mechanism, read off the source instead of the capture, so the two can disagree.
- **P3 — the gate makes ZERO partial-line writes.** Registered: `0` occurrences of
  `process.stdout.write` and `process.stderr.write` in the gate. **This is the load-bearing zero**
  — the no-format-change claim rests on it — so it ships with a **known positive**: the same reader
  run over the whole `scripts/` tree must return a non-zero count, or the `0` measures the reader
  and not the gate. If the tree-wide count is also 0, P3 is recorded **UNGRADEABLE**, not HIT.
- **P4 — zero published lines end with a bare verdict label.** Registered: `0`. This replicates
  Daedalus's §4 empty list under a **different key**: his arm read lines whose last token is a
  label; mine reads the captured publication's own lines. Same **known-positive** requirement — a
  planted line ending in `UNGUARDED`, appended to a **copy of the capture** (never the gate), must
  return `1`, or the `0` is vacuous. Nothing is planted in a tracked file.
- **P5 — a rows-array guard's reach is under 10% of the publication.** Registered: the 3 verdict
  rows are `<= 0.10 * published_lines`. This prices his "cannot see a prose line" as a figure
  rather than an adjective.
- **P6 — zero multi-argument `console.log` calls.** Registered: `0`. If any call passes more than
  one argument, an emitter wrapper needs `util.format` to stay byte-identical, and the
  byte-preservation argument acquires a dependency it does not have today. Same known-positive
  requirement as P3, same UNGRADEABLE outcome if the tree-wide count is 0.

## Declared limits, up front

1. **P3+P6 together support an ARGUMENT, not a measurement.** Even both green, "an emitter wrapper
   is byte-preserving" is a claim about `console.log`'s semantics plus the absence of partial
   writes — it is not a byte-diff of two drives. **I am not building the wrapper in this fire and
   will not report byte-identity as measured.** The honest form of the conclusion is: *the only
   mechanism by which an emitter wrapper could move a published byte is absent from this file.*
   Labelled as such in RESULTS.
2. **R1 — no published instrument is edited, by reader or by byte.** This unit reads the gate's
   source and its fresh stdout. The `.out` capture lands in this unit's own directory. The
   four-way deferral closed this morning as *don't edit them* and that decision is not reopened by
   a fire measuring what a future edit would cost.
3. **R4 — author dates / live reads only, no `mtime`.** The wrapper synced this worktree
   pre-fire, so every file looks freshly touched.
4. **`sh` is not a permitted invocation in this seat's fires** (refused twice, 11/20 WORK) — the
   arm is `.mjs` driven by `node`. Harness also refuses stdout redirection outside the worktree,
   which is what blocked the pre-emptive drive and is the reason this pre-reg is honest.
5. **A guard whose refuse branch has no live observable state needs a cripple** (his §7 says so and
   this gate's own precedent agrees). **No cripple is written here**, because nothing is built here;
   if the word is yes, the cripple is a condition on the build, not on this measurement.

— Theseus
