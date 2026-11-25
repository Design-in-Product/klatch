# `unit-518routedternaryreach-2026-11-25` — results

**Theseus Prime · 2026-11-25 WORK fire · claude-opus-5**
Pre-registration **`768bf4a9`** on `main`; addendum **`7fe210a2`** on `main` before the arm existed.
Arm **`25a5b3ba`**, post-hoc **`cb19a46c`**.

**13 registered predictions: 12 HIT, 1 REFUTED.** Three post-hoc predictions: **2 HIT, 1 REFUTED.**
Both refutations are mine, and both are about my own instrument rather than about the corpus.

Captures, `.err` **0 B** on both drives:

| capture | bytes |
|---|---|
| `captures/ARM.out` | 8,135 |
| `captures/POSTHOC-SEPARATE.out` | 2,615 |

Gate `node scripts/verify-decl-body-slicers.mjs` rc 0 at every push, `tracked files read`
**1108 → 1109 → 1110**, population **65**, **MARKED 4 / GUARDED 3 / UNGUARDED 58**,
`baseline entries 58` — flat across the unit. `git diff --stat HEAD -- packages/ scripts/` **EMPTY**,
asserted inside the arm before any measurement ran.

---

## 1. The routed item, and the three levels it has to be graded at

Daedalus's 11-25 WORK memo routed one item to this seat by name:

```
blind reader   scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts
               2 hits, key reads `file:`                                 (yours, last touched 11-07)
reached by     docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs:83
               file: typeof e === 'string' ? e : e.file                  (also yours)
```

**He routed it correctly and he priced it honestly** — *"I am handing over the file, the line and the
ternary rather than a verdict about your work"*, and he declined to publish `6` alone precisely
because it would overstate a blindness. Nothing below is a complaint about the routing.

## 2. Level 1 — the quotation. **`file:` never appears at `recon.mjs:83`.**

```
P1   the routed text, verbatim in recon.mjs                                      0 occurrences
P2   `file:` in PROPERTY position in recon.mjs            1, at line 89, value String(file)
P10  same file, position-blind key                                   2, at lines 83 and 89
```

Line 83 in full, from the capture:

```js
  CRIPPLE === 'entry-shape-dot-file' ? e.file : typeof e === 'string' ? e : e.file;
```

There is no property named `file` on that line. The only `file:` property in the whole file is at
**line 89**, and its value is `String(file)` — not a ternary.

**What he quoted is his key's CAPTURE, not a source line.** That is the honest reading of it, and it
is why P3 below is registered as a HIT *for* him: the capture is what a position-blind key actually
returns on that line, so quoting it was reporting his instrument's output faithfully.

## 3. Level 2 — the mechanism. **HIT, and it is a real defect in his extractor.**

```
position-blind match at col 41, preceding char "."
span after that colon:  "typeof e === 'string' ? e : e.file;"
```

The `file` his key matched is the **tail of the member expression `e.file`**, and the `:` it matched
is a **ternary's else-colon**. The span after that colon is then genuinely a ternary, so every
downstream check agrees — the shape is exactly what a ternary-valued property looks like.

> **A property-position key that is reduced to `name` + `:` will match the tail of any member
> expression that precedes a ternary's else-colon, and the value span it then captures is a real
> ternary. Every corroborating signal agrees, because the corroboration is downstream of the same
> mistake.**

This is the `reducing a predicate to operands moves an identifier to the wrong side` class, and it
belongs to his extractor, not to mine — **P10 is the proof my own key could have had it too.** My P2
key constrains `file` to be preceded by `{`, `,` or line-start; drop that constraint and my count on
the same file goes **1 → 2**, picking up line 83 exactly as his did. The constraint was load-bearing,
and I only know that because I registered a prediction that it was.

## 4. Level 3 — the reach. **Zero, and the chain is asserted link by link.**

The probe's two `file:` key occurrences are at **probe lines 97 and 106**. Both sit inside
`for (const line of srcLines) {`, verified by walking back from each key to its own nearest
enclosing `for (` and asserting the iterable text — not inferred from the docblock.

```
const SWEEP     = join(HERE, 'sweep-probes.mjs');       1x   a single fixed path
const sweepSrc  = readFileSync(SWEEP, 'utf8');          1x   that one file's text
const srcLines  = sweepSrc.split('\n');                 1x   and nothing else
```

The probe's **whole** read/write/spawn/import set is printed in the capture (12 sites). And:

```
does the probe mention the routed file at all?
  "recon.mjs":    false
  "unit-307c4":   false
  "blast-radius": false
```

**The routed ternary is not in this reader's subject, and `recon.mjs` is not in its read set at all.**

### The hazard census on the subject my reader does read — with a known positive first

My store says *a key returning 0 needs a known positive before the 0 is a finding*, so the counter
was KP'd on planted cells **before** it was pointed at the live subject:

```
P5-KP  planted:  file: cond ? 'probe-a.mts' : 'probe-b.mts',    counted unreadable
                 file: "probe-double-quoted.mts",               counted unreadable
                 file: 'probe-readable.mts',                    NOT counted      (negative cell)
P5     live:     0 unreadable of 45 property-position `file:` lines in scripts/sweep-probes.mjs
```

## 5. The two numbers, in one sentence or neither (his PH4, adopted)

> **Of this probe's two `file:` key occurrences, `0` are reachable by the routed ternary, and `2` are
> guarded by a known positive that reddens when the key dies.**

Neither number alone is the answer. `0 reachable` on its own invites the conclusion that the reader
is fine; `2 guarded` on its own hides that there was nothing to guard against here in the first
place. The pair is the finding.

## 6. The guard legs, and the post-hoc that had to follow them

The A1/A2 predicates were **sliced from the probe's source at run time** (3413 bytes, offsets
5810..9223), nine markers asserted on the span before compiling, three transforms declared with
occurrence counts asserted (two strip TypeScript annotations the dynamic compile does not reach; one
redirects `check` to a capture). The probe was never executed, edited or copied to disk.

```
                           A1     A2        kpOwner                       r225 decls / total
LIVE                       true   true      probe-round225-…mts                 2 / 3
KEY-CRIPPLE  (dead key)    false  false     (none)                              0 / 3
HAZARD-SIM   (ternary in   false  false     probe-round224-…mts                 0 / 3
              the subject)
```

**P6, P7, P11 all HIT: the blindness is not silent in either direction.** A dead key and a
ternary-valued subject line both redden A1, the probe's own known positive.

**P12 REFUTED, and it was registered OPEN for exactly this reason.** The verdict pair is
`false/false` in both cripples — the column cannot separate them. I registered a prediction I could
not win rather than discover afterwards that my two cripples were one cripple.

The post-hoc then asked the next question instead of accepting the saturated column, and the answer
is the most useful thing in this unit:

> **PH1/PH2 — the identical `false/false` pair is a property of the COLUMN, not of the cripples. A
> dead key reports `kpOwner = (none)`; a ternary in the SUBJECT reports a real but WRONG owner
> (`probe-round224-a-skip-must-not-summarise-as-a-pass.mts`), because a nearest-preceding walk keeps
> the last entry it could read. The verdict column flattens the more dangerous of the two into the
> same cell as the harmless one.**

A `(none)` is a visible refusal. A wrong-but-plausible owner is the failure that would survive a
reader's glance — and it is the one the routed mechanism produces.

## 7. Against me, two

**(i) My own arm's marker set aborted its first drive, and the expectation was wrong, not the
span.** I registered `owners.length ===` at **1** occurrence in the slice. It is **2** — once in the
2026-11-07 re-key docblock, which quotes the arm it replaced, and once in the live ORPHAN clause. I
had read the code and not the prose. Corrected to 2, *plus* an exact code-only marker (the full
ORPHAN clause across its two lines) that a comment cannot satisfy. The arm published nothing on the
aborted drive, which is the only reason this is a correction rather than a wrong figure.

**(ii) PH3 REFUTED — I typed `2 of 2` where the format says `2 of 3`.** I registered the LIVE
drive's declaration figure from my own reading of A2's description format rather than from the
format. There are **2 declarer entries** but **3 declaration lines** (round225 declares a `refusal:`
and a `skip:`; `probe-backfill-sidecar-neutrality.mts` declares one). `2 of 3` is round225's share of
the lines, and it is what the probe has always printed. *Slicing the inputs and then re-typing the
verdict* — caught only because the post-hoc captured the string instead of restating it.

## 8. What this unit does NOT measure

- **Whether a 2-hit reader of `file:` in a round-373 probe is worth curing.** The arm prices the
  breakage (`0 reachable`) and the detection (`2 guarded`) and stops. There is nothing to cure here:
  reach 0 means no cure has a subject.
- **Whether the other four SHAPE members behave like mine.** I measured *my* file because that is
  what was routed to me. Four of his six remain unmeasured at the consumer level, and that is his
  gap, not a finding of mine.
- **Whether his extractor's other hits are sound.** P3 names one false-positive mechanism in one
  key. His `cls` census, his v1→v2 TypeScript cure and his 6-member SHAPE figure are not graded
  here. If `recon.mjs:83` is representative, his HAZARD figure needs a re-key; if it is the only
  member reached that way, it needs one correction. **I do not know which, and I am not going to
  guess at it from one cell.**

## 9. Open

- **Closed by drive:** the routed `probe-round373` `file:` reader. Reach 0, detection 2, no cure has
  a subject. Nothing owed back on it.
- **Routed back to Daedalus:** the position-blind `file:`/`cls:` key (§3 above), with the cell that
  separates it. His published **HAZARD 2 of 6 / gap 4** rests on my site being a hazard member; it
  is not. **Under his own definition the hazard is 1 of 6 and the gap is 5** — which is *exactly the
  1 he registered as PH3*, so **PH3 held and its refutation was an artefact of the key**. His to
  re-key or correct; the extractor is his file and I have not touched it.
- **Mine, unblocked, carried:** the frozen-population-prediction pattern defect (`unit-516` §4);
  `SECOND-ARG`'s nested-call blindness; the inherited concatenated-label blindness.
- **xian's, and only his:** `unit-516` §5's 15-vs-0 census-purpose choice. Unchanged by this unit.
- **No owner, twentieth night:** the `ABSENT` hole.
