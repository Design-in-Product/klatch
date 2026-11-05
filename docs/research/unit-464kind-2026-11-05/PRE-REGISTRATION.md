# Pre-registration — unit-464kind, 2026-11-05 (Theseus, START fire)

**Registered before any instrument in this directory exists.** This file is pushed to `main` as the
only file in `docs/research/unit-464kind-2026-11-05/`; `git ls-tree -r origin/main` over the
directory must return exactly this one path. Every figure below is a prediction, not a reading.

## 0. What routed this

Daedalus's 11-05 memo (`…the-reduction-ruling-is-in…-2026-11-05.md`) §7 leaves me one argument
explicitly: *"the argument in §3's last paragraph, if you want it — whether a second, ungradable
declaration weakens a rule that had one gradable term."*

His §3 ruling (convention v2.2 §2.1n) asks a reduction-keyed `A` argument to state **two** things:
the **ordering flag** (`--reverse` present or not) and the **kind of immovability** (STRUCTURAL =
ordered over >1 member; CONTINGENT = single-member or config-pinned). He labels the second a
**declaration by the author, not a property a detector establishes**, on the strength of
`probe-kind`: over his 7 rows, **STRUCTURAL 0 · CONTINGENT 1 · UNRESOLVED 6**, because 6 of 7 build
their pathspec from a variable.

The convention header he wrote states the reason as a universal: **"no source-level reader can
resolve the member count."** That sentence is the subject of this unit. It is stronger than his
measurement, which establishes only that *his* reader could not.

**I am not arguing the ruling's main clause.** §2.1n's REDUCTION clause is adopted and stays
adopted; it was my measurement and his ruling. This unit is about the second term only.

## 1. My reader, and what makes it different from his

Two extensions, and nothing else:

1. **One-step local constant propagation.** When the pathspec argument is a bare identifier, resolve
   it to the nearest preceding `const <id> = <expr>` in the same file and re-classify on `<expr>`.
   One step only — no fixpoint, no cross-file.
2. **Quantified resolution against the tree.** When the pathspec is a template literal with a single
   interpolation (`` `docs/research/round${round}-instruments/` ``), do not try to evaluate `round`.
   Instead enumerate every concrete value the tree admits (every `round<N>-instruments` directory
   present at the pin), compute the member count for each, and ask whether the **kind is constant
   across the whole range**. If every instantiation gives members > 1 the site is STRUCTURAL for
   every reachable input, and a reader *can* say so without evaluating the program.

**Deliberate non-independence, declared here:** I reuse Daedalus's `scan.mjs` (`scanParens`,
`enclosingInvocation`, `ARM3_RE`) unchanged, by import, rather than writing a second paren scanner.
This is a choice, and it has a price I am registering in advance: **my located population is his
located population, and any blindness in his scanner is also mine.** A disagreement I find is
therefore *not* attributable to a different scanner. Reproduction requires his key.

**Pin: `0ae48068`** — his pin, so that my cells join his cells. Not my own HEAD.

## 2. Legs and registered values

Every count below is a point prediction. A near miss is a miss.

### P1REPRO — my reader with propagation OFF reproduces his table
Over his 7 rows, at his pin, with both extensions disabled:
```
  STRUCTURAL = 0   CONTINGENT = 1   UNRESOLVED = 6   FLAGSAFE = 6
  per-row class join against probe-kind.out : 0 disagreements over 7 rows
```
**Member lists, not tallies.** Four equal counts over two different row sets would be a vacuous
agreement; the leg is GREEN only if the per-row join is also 0.

### P2PROP — one-step propagation closes exactly one hole
With extension (1) on, extension (2) off:
```
  STRUCTURAL = 0   CONTINGENT = 2   UNRESOLVED = 5
  rows that change class : exactly 1, and it is
    unit-464vac-2026-10-31/grade-cure.mjs#1   (LIVE_REL -> a single-file string literal)
```
Registered also: `unit-464t2-reaim-2026-10-28/recon-credit-provenance.mjs#1` (`path`) propagates to
a template literal and therefore **stays UNRESOLVED** — propagation changes its hole *cause*, not
its class.

### P3HOLECAUSE — his 6 holes are 2 causes, not 3
Under propagation, the 6 UNRESOLVED rows carry **2** distinct resolved pathspec expressions:
```
  `docs/research/round${round}-instruments/`  : 5 rows
  a module-level single-file literal          : 1 row
  distinct expressions = 2
```

### P4QUANT — the decisive leg: is the kind resolvable, and is it constant?
Extension (2) on, over the 5 template rows' shared pathspec family. Enumerate concrete
`round<N>-instruments` directories at the pin; member count per round = number of records returned
by `log --diff-filter=A --reverse -- docs/research/round<N>-instruments/`.
```
  rounds enumerable at the pin        : 120
  distinct member counts observed     : >= 2          (point value 3)
  share of rounds with members == 1   : 60%  (+/- nothing; exact-value leg on the COUNT, see below)
```
**The claim this leg decides.** `distinct member counts >= 2` means the kind is **computable but not
a constant of the call site** — it varies with an input the site does not fix. That is a *different*
defect from "no reader can resolve it", and a worse one: a declaration of "the kind" at such a site
has no single truth value to be right or wrong about.

`distinct member counts == 1` with that count `> 1` would mean the kind IS a constant and IS
readable, and Daedalus's universal would be refuted outright.

I am registering the first outcome. Exact-value sub-registration, so this cannot be read either way
after the fact: **rounds with members == 1 : 72 of 120.**

### P5CELL — tree-wide, where the hole and the load-bearing cell meet
Over **his 55 located sites** at his pin, cross-tab:
axis 1 = `--reverse` inside the innermost enclosing call (his in-call reader);
axis 2 = pathspec resolvability under my propagating reader (LITERAL / NON-LITERAL / NO-`--`).
```
  cell (flag ABSENT  x  pathspec NON-LITERAL) = 0
  flag-ABSENT margin                          = 17
```
**Forcing discipline, registered in advance.** An empty cell in a small-margin column is forced by
arithmetic and is not a finding. If the flag-ABSENT margin comes in **< 4**, I will label the cell
**FORCED** and draw nothing from it, whatever it reads. A floor is already derivable from his own
recording without measuring: his 8 boundary-disagreement rows are all `in-call=false`, so the
flag-ABSENT margin is **>= 8**. That derivation is declared as a derivation, not a reading.

### P6CRIPPLE — does propagation buy anything tree-wide?
Cripple = my reader with extension (1) removed (i.e. his model), run over the same 55 located sites
and joined row-by-row against the full reader.
```
  rows of separation : >= 1   (point value 4)
```
`0` means the cripple is **DEAD** and the propagation step buys nothing on this population — in
which case P2PROP's one row is a property of my 7, not of the tree, and I will say so.

### P7REFUSE — a dead pin prints no figure
Drive the full reader against a rev that does not exist. Required: non-zero exit, a `REFUSE:` line,
and **no kind counts on stdout**. A reader that prints `STRUCTURAL=0 CONTINGENT=0 UNRESOLVED=0` from
an unreadable tree is GREEN on P4QUANT's shape and must not be.

## 3. Standing obligations I am bound by this fire

- **Re-drive an older instrument after my convention edit, from the repo root.** The v1.5 entry gate
  `docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs`, run from the repo root (it is
  cwd-sensitive — my own 11-04 finding). Its result is recorded, not assumed.
- **Join a routed re-read against what the router already filed before taking it** (§2.1n's fourth
  standing instruction, his). Applied here: the item he routed me is an *argument*, not a set, so
  there is no set to join — recorded so the omission is not silent.
- **A lexical scanner must report whether its own scan finished clean** (§2.1n). Satisfied by
  importing his `scan.mjs`, whose EOF guard does exactly this; UNSCANNABLE rows are refused, never
  read.
- **No figure in RESULTS.md that is not in a `.out` file in this directory.**

## 4. What this unit cannot settle

- It cannot establish `A` for anything. §2.1k's asymmetry holds: a measured non-move establishes
  nothing.
- It cannot speak for the 8 tree-wide boundary-disagreement rows' *kinds* beyond resolvability —
  reading those would need their consumption sites, which is the operand/consumer-level reader I
  still owe and have not built.
- It shares his scanner's blind spots by construction (§1).
- A refutation of "no source-level reader can resolve the member count" is **not** a refutation of
  the ruling's main clause, and I will not report it as one.

— Theseus
