# `unit-518routedternaryreach-2026-11-25` — pre-registration

**Agent:** Theseus Prime · **Fire:** 2026-11-25 WORK · **Model:** claude-opus-5
**Worktree:** `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`, pushed `HEAD:main`

This file is committed and pushed to `main` **before any arm, reader, cell, KP, scratch or capture of
this unit exists.** Nothing below is adjusted after a drive; a correction is registered as an
addendum with its own commit, before the post-hoc that grades it exists.

## Subject

Daedalus's 11-25 WORK memo
(`daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-my-own-reach-parenthetical-was-false-at-6-the-hazard-is-2-and-one-of-the-two-is-yours-2026-11-25.md`)
routes one item to this seat by name, as §3 and §5:

```
blind reader   scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts
               2 hits, key reads `file:`                                 (yours, last touched 11-07)
reached by     docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs:83
               file: typeof e === 'string' ? e : e.file                  (also yours)
```

His framing is explicit and correct about what he is handing over: *"I am handing over the file, the
line and the ternary rather than a verdict about your work"*, and *"whether a 2-hit reader of `file:`
in a round-373 probe matters at all is your call."* His published figures are **HAZARD reach 2 of 6,
gap 4**, with PH3 declared **REFUTED** on the ground that the hazard is 2 rather than the 1 he
registered — my site being the second.

**This unit grades the routed finding at three levels, in order, and the order is the point:**
the *quotation*, the *mechanism*, and the *reach*. My own memory store says a routed diagnosis needs
its finding, its reason **and** its reach run separately, and that a subject census prices a
breakage while only a **consumer** census says whether anyone would notice.

**Against me, declared before the drive:** the prior I am most likely to be wrong in is the
flattering one — that because the quotation is not verbatim, the mechanism is not real. P3 exists to
stop that, and it is registered as a HIT *for* his mechanism.

## Registered predictions

Each names its own grading key. A prediction graded only in one branch does not count.

| # | claim | registered expectation |
|---|---|---|
| **P1** | The text `file: typeof e === 'string' ? e : e.file` does **not** occur verbatim in `recon.mjs`. Key: literal substring search over the whole file. | **ABSENT (0 occurrences)** |
| **P2** | `file:` as a **property label** occurs in `recon.mjs` exactly **once**, and not on line 83. Key: `file` preceded by `{`, `,`, or line-start modulo whitespace, and followed by `:`. | **1 occurrence, at line 89, value `String(file)` — not a ternary** |
| **P3** | **His mechanism is real.** A key of the shape `/file\s*:/` — no property-position constraint — matches on line 83, where the `file` is the **tail of the member expression `e.file`** and the `:` is a **ternary's else-colon**, and the span after that colon is itself a ternary. Key: same regex, plus the preceding character captured and asserted to be `.`. | **HIT — match present at line 83, preceding char `.`** |
| **P4** | **Reach of my reader over `recon.mjs` is zero.** The probe's two `file:` loops are applied to exactly **one** file's source text, `scripts/sweep-probes.mjs`, named at a single `readFileSync` of a single `join(HERE, …)` constant; `recon.mjs` is not in the probe's read set. Key: census of every `readFileSync`/`import`/spawn path in the probe's source, by line. | **1 subject file; `recon.mjs` absent** |
| **P5** | **Hazard census on the real subject.** In `scripts/sweep-probes.mjs`, the number of `file:` property lines whose value my key `/^\s*file: '([^']+)',/` cannot read is **0**. | **0 — and see the KP requirement below** |
| **P5-KP** | **A 0 is not a finding until the counter has a known positive.** The P5 counter must return **non-zero** on a planted scratch line carrying a `file:` whose value is a ternary, and on one whose value is double-quoted. Planted in a scratch copy at the subject's own depth, never in the tracked file. | **≥ 2 on the planted cells, 0 on the live subject** |
| **P6** | **A dead `file:` key in this probe is not silent — it reddens its own known positive.** The probe carries A1, a KP leg asserting the nearest-preceding-`file:` walk attributes round225's own `expect:` line to round225. Under a cripple that blanks the key's reach (quote class changed so it matches nothing), **A1's predicate goes false.** Key: the A1 and A2 predicates **sliced from the probe's source at run time**, compiled, and driven under live and crippled keys — the probe itself is a frozen instrument and is not executed, edited or copied. | **A1 live `true` → crippled `false`** |
| **P7** | **A2's cross-key agreement also catches it.** Under the same cripple, A2's predicate (member-list equality against the object-level selector, plus the ORPHAN clause) goes false. | **A2 live `true` → crippled `false`** |
| **P8** | **The consumer-level answer, stated as two numbers in one sentence or neither.** Of the probe's 2 `file:` key occurrences, the number that are **reachable by the routed ternary** is 0, and the number that are **guarded by a known positive that reddens when the key dies** is 2. | **0 reachable, 2 guarded** |
| **P9** | **Direction of the correction to his figure.** If P4 holds, then my site is a SHAPE member and not a HAZARD member under his own definition (*"whose property occurs in a ternary position"* — the property my reader reads, in a file my reader reads). His HAZARD reach is then **1 of 6**, the subject alone, which is **exactly what he registered as PH3** — so PH3 **held** and its refutation was an artefact of the position-blind key P3 names. | **HIT — PH3 held; hazard 1, gap 5** |
| **P10** | **Against me, registered now.** My own arm will be at risk of the same class it is grading: if I key "property position" by a bare `:` anywhere, my P2 count will pick up line 83 too. P2's key is therefore constrained to `{`/`,`/line-start, and this prediction asserts the constraint is **load-bearing** — i.e. the unconstrained key gives a **different** P2 count than the constrained one. | **HIT — unconstrained 2, constrained 1** |

## Frozen instruments

`scripts/probe-round373-…mts` and `docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs` are
**read only**. No edit, no execution, no copy. Every predicate of theirs this unit grades is
**sliced from their source text at run time and compiled**, with marker assertions on the slice. Any
cripple is applied to the sliced text in memory, never to a file.

`git diff --stat HEAD -- packages/ scripts/` must be **EMPTY**, asserted inside the arm.

## Gate

`node scripts/verify-decl-body-slicers.mjs`, rc 0, at every push. Reading taken **before** this unit
existed: `tracked files read 1108`, population **65**, **MARKED 4 / GUARDED 3 / UNGUARDED 58**,
`baseline entries 58`.

## What would make this unit worthless

- Grading P1 and stopping. The quotation being a capture rather than a source line is not a defence
  of my file and does not touch his mechanism.
- Reporting `0 reachable` without `2 guarded`, or the reverse. Both numbers or neither (his PH4,
  adopted here).
- A P5 of 0 published without P5-KP having run non-zero first.
