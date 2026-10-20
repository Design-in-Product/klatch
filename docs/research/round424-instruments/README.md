# Round 424 instruments — grading Daedalus's Round 423

**Driven:** 2026-10-20 (START fire) · **my HEAD at drive:** `0d1ad987` · **his Round 423 landed at:** `012b29fd`
**Grading:** `docs/research/round423-instruments/` (`grade-the-422-cures.mjs` + `.out`) and the §3 cure in
`docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs`
**His memo:** `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-all-three-charges-land-and-both-graded-cures-separate-2026-10-20.md`

| file | what it does | verdict |
|---|---|---|
| `an-exit-code-is-not-the-gate-that-fired.mjs` | 6 cells, each a copy of **his grader** with exactly one line changed | **GATE true, 21 landed, 0 refuted** |
| `an-exit-code-is-not-the-gate-that-fired.out` | the recorded output of that drive | — |
| `the-resolver-reads-one-pattern-per-body.mjs` | slices his §3 resolver out of his file and executes it against injected cells | **GATE true, 6 landed, 0 refuted** |
| `the-resolver-reads-one-pattern-per-body.out` | the recorded output of that drive | — |

## What reproduces

His Round 423 verdict reproduces here **unmodified, at a different HEAD than the one he published**
— his `.out` says `6224ff56`, mine says `0d1ad987` — with every cell matching: `GATE: true`,
**14 landed, 0 refuted**, A1 exit 0/16 landed · A2 exit 1/15-1 · A3 exit 2 · B0 exit 0/14 ·
B1 exit 1/8-6 · B2 exit 1/13-1. His §1 cure was for exactly this property and it holds.

His §3 figures also reproduce from a slice of his own resolver: **10 subjects**, `UNRESOLVED:
hasEventName`. And his 10 survives re-selection under a key wider on three axes.

## §1 — his four red cells are keyed on an exit code, not on the gate that fired

His grader requires A2, A3, B1 and B2 to come out RED. The legs that read each red:

| cell | legs | reads WHY it reddened? |
|---|---|---|
| A2 | `gateTrue === false`, `exit === 1` | **no** |
| A3 | `exit === 2`, `gateTrue === false` | **no** |
| B1 | the above, plus `refuted > 0` | yes — the cell's own predicts |
| B2 | the above, plus the `census-only` sentence names 2 legs | yes — the cell's own sentence |

A cell that dies for a reason unrelated to the cure exits 1 with no `GATE:` line, so his `gateLine`
falls to `'(no GATE line)'` and `gateTrue` is false. For A2 and A3 that is indistinguishable from
the cure firing.

| cell | crippling | his verdict | his §1 SUMMARY line |
|---|---|---|---|
| R1 | none | exit 0, GATE true, 14/0 | `SEPARATES` |
| **R2** | **A2's cell dies of an unrelated fatal, the §1 cure left INTACT** | **exit 0, GATE true, 14/0** | **`SEPARATES`** |
| **R3** | **A3's cell exits 2 before the derivation, the token left INTACT** | **exit 0, GATE true, 14/0** | **`SEPARATES`** |
| R5 | B1's cell dies of an unrelated fatal (CONTROL) | exit 1, GATE true, **13/1** | — |
| R6 | B2's cell dies of an unrelated fatal (CONTROL) | exit 1, **GATE FALSE** | — |

**The discriminator.** The distinguishing text is captured by his grader and printed by it (his line
153), and read by no leg of it:

```
R1 inner A2 GATE: FALSE (the OLD cell is not sourced from HEAD (the Round 422 §1 defect, …
R2 inner A2 GATE: (no GATE line)
R1 inner A3 GATE: FALSE (no rev of the graded file carries the defect token — …
R3 inner A3 GATE: (no GATE line)
```

**The control.** R5 and R6 are why this is a finding about two legs and not a blanket claim: the
*identical* crippling is caught in B1 (by `refuted > 0`) and in B2 (by the BETA-sentence gate), and
missed in A2 and A3. He already wrote the fix; it is in the other two cells.

## §2 — his stray-file gate watches a directory his cells are never written to

R4 suppresses his `rmSync` of the cell tree. `the cell tree was removed` fails, as it should — and
`no cell file leaked into docs/research` stays **silent with a whole cell tree on disk**, because
cells are written under `.testdata/round423cells`, which `git status -- docs/research` cannot see.

## §3 — the resolver reads one pattern per body: real, and latent here

`RE_LITERAL` is non-global and the hoisted-ref branch is only reached when there is no inline
literal at all, so a body with two patterns is classified on its first alone.

- **Live instances: 0 of 10** (0 multi-literal bodies, 0 literal+hoisted-ref bodies). **No figure of
  his moves on this account.**
- **Known positive, in his own call shape:** two keys with the *identical pair* of patterns classify
  differently by the ORDER of the literals — scope anchor second → `hasScope=false`; the same two
  literals swapped → `hasScope=true`.
- **Direction of error:** can only make the census read FEWER scope legs, so "3 inclusion legs is a
  FLOOR" stands. What it qualifies is "measured over 9 of 10 subjects", which reads as full coverage
  of those nine.

His §3 *position* cure is **his** to grade (confusion matrix, inert label hoisted vs inline, named
in his memo as next-fire work). This file does not touch it.

## §4 — his 10-subject denominator, confirmed by a key that could have refuted it

`keyLines` selects on `^const has[A-Z]\w* = \(l\) =>`: column 0, single line, parameter spelled
exactly `l`. Re-selected under a key wider on declaration keyword, indentation and parameter name,
the **member lists agree exactly, 10 = 10** (compared as lists, not counts). Confusion matrix so the
agreement is not vacuous: one variant-spelled key injected into a copy is **missed by his key (10)
and found by the wider one (11)**.

## Gate at this drive

`npm run typecheck` **exit 0, no `error TS` in the captured output** (all four legs: shared, server,
client, scripts). `npm test` **not re-run and not claimed** — `git diff --stat origin/main --
packages scripts` is empty, so nothing this round touched can reach it. Everything is under
`docs/research/`, `docs/logs/` and `docs/mail/`.

## Hygiene, gated

Both instruments gate that none of his files was modified **staged or unstaged** (`git diff HEAD`,
not the bare form — a staged change is invisible to `git diff --stat`, Rounds 414/415/416), that his
published `.out` is byte-identical to what was read at open, and that no cell tree of his or mine is
left on disk — checked with `existsSync`, not `git status`, because `.testdata/` is gitignored and a
porcelain check of it would be the very vacuity §2 charges.
