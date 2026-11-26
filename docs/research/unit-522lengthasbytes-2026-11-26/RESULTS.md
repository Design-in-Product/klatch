# unit-522lengthasbytes — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-26 START · **Model:** claude-opus-5

| step | commit | clock (read in the same command as the push) |
|---|---|---|
| pre-registration, before any script existed | `f7296f964384` | **10:49:30 PST** |
| arm **drive 1 — ABORTED at its own KP gate**, capture committed unedited | `9f55cf1c8ffe` | 10:52:31 PST |
| arm, repaired and driven (the measurement) | `98d750306418` | 10:54:08 PST |
| addendum, **after** the arm's measuring drive and **before** the post-hoc existed | `3478cc2e1c10` | 10:54:46 PST |
| post-hoc, one drive | `93d94ab1c631` | 10:56:31 PST |

`ARM.err`, `ARM-DRIVE1-ABORTED.err`, `POSTHOC.err` — **0 B** each. Gate rc 0 at every push.
`verify-decl-body-slicers` read `tracked files read` **1118 → 1119 → 1119 → 1119 → 1120**, population
**65**, `MARKED/GUARDED/UNGUARDED` **4/3/58**, baseline **58** — flat at every reading; the growth is
this unit's own files. `git diff --stat HEAD -- packages/ scripts/` asserted **EMPTY inside the arm**
before any measurement ran.

**16 predictions graded: 12 HIT, 4 REFUTED, all four refutations mine. 1 residual (PH8), 2 declared
limits unmeasured (L2, L3).**

---

## 1. The item, and who it belonged to

`unit-520` §6/§7 (11-25 STOP) found a `.length`-as-bytes mislabel in its own post-hoc — `8497 B`
printed where `wc -c` reads `8569` — named the class, said in terms that the census was **NOT run**,
and offered it to Argus. Argus declined on 11-26 START (`grep -rl "wc -c\|byteLength\|Buffer.byteLength"
scripts/lib/ scripts/*.mts scripts/*.mjs` → product-probe callers only; "it closes back onto you").
Daedalus's 11-26 START §7 lists it as Theseus's and untouched. So it was mine, unblocked, and this
unit ran it.

## 2. THE KEEPER — the census had already been run, by this seat, thirteen days earlier

The post-hoc's **L1 prose** cell — declared in the pre-registration as a nuisance class to be
hand-read away — holds **2** sites, and one of them is:

```
docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-c.mjs:8   token "bytes"
   *   - genuine mislabels — `${str.length} bytes` where `str` is a utf8 STRING;
```

`unit-465byteslabel-2026-11-13` is **my own unit**, and its RESULTS §4 publishes the census:

> **45 distinct files** carry a `bytes` label over a `.length`, across `round*-instruments` (14),
> `unit-*` dirs (30) and `scripts/` (1) … A `bytes` label over a `String.length` of anything in this
> corpus is wrong **95–99%** of the time — tracked `.mjs` 452/464 (97.4%), `.md` 3256/3268 (99.6%),
> `.out` recordings 1124/1183 (95.0%).

So **`unit-520` §6's "I have not run that census" was false when I wrote it**, and I wrote it about
work this seat had published and graded. It was not a lie and it was not carelessness: it is the
documented failure mode — *recalled context feels identical to verified fact* — arriving in the
**absence** direction, which CLAUDE.md names as the highest-risk statement class on this project.

> **The rule this adds, because the existing one did not catch it:** "I have not run that census" is
> an **absence claim about my own prior work**, and it needs the same search as an absence claim
> about anyone's. I searched my memory, not `docs/research/`. Argus then searched `scripts/lib/` and
> `scripts/*.m{ts,js}` — faithfully answering the question I asked, which never mentioned
> `docs/research/`, the one directory where every instrument in this corpus lives. **A wrongly
> scoped question gets a correct answer and the correct answer confirms the error.** Two seats and
> a round-trip memo exchange reproduced the mistake rather than catching it.

And what found it was not diligence. It was a **false-positive class in my own detector** that I had
declared as a limit to be discarded. The L1 prose cell existed only because comments mentioning the
form had to be separated from the form; the prior art was sitting in one.

## 3. What this unit adds that `unit-465byteslabel` could not see — and it is half the class

`unit-465`'s key was lexical and **`/bytes/i`** throughout; its own §6 declares *"a figure labelled
`size`, `len` or `length` … is outside every key here."* The **`B`** spelling is outside it too.

```
UNIT-LABEL sites (arm)                                                  133
  LABEL-IN-STRING   real unit labels                                    127   across 78 files
  IDENT-IN-CODE     a VARIABLE named B reached across a comma             4   false positives
  IN-COMMENT        L1 prose                                             2   (one is unit-465 itself)
  LENGTH-NOT-PRESERVED                                                    0

token split among the 127 real labels:     bytes 58  ·  byte 3  ·  B 66     (B share 51.97%)
```

**66 of 127 — 52% — wear the `B` spelling, which `unit-465`'s declared lexical limit made
unreachable.** That is the part of the class the earlier census could not count, and it is the
spelling the `unit-520` defect was actually written in (`8497 B`). So the right description is not
"the census was already run": it is **the census was run against one of the two spellings the corpus
uses, and the half it missed is the half that bit me.**

**The `bytes`-token figure is 58, and `unit-465` arm C published `STRING=58`.** I am **not** claiming
these are the same measurement. They are two different keys — mine is "token `bytes` inside the
string run following a `.length`", `unit-465`'s was "a STRING-classified line matching `/bytes/i`
with a `.length`" — and `unit-465` §5 itself says `STRING=58` *"is not a count of defects … it
under-counts by the both-patterns lines and over-counts"*. **The overlap is not measured.** See §7.

## 4. Against me first — the fall-through KP caught the key before any census ran

**Drive 1 aborted. `KP4` — the planted fall-through reachability control,
`const n = rows.filter((r) => r).length;` — keyed `OTHER-CMP` instead of `NO-COMPARISON`, because
the `>` of the arrow `=>` matched as a comparison operator.** Capture committed unedited at
`9f55cf1c8ffe`, exit 1, no census published off it.

In a corpus written in arrow-function style the fall-through cell would have been close to
unreachable and `OTHER-CMP` would have absorbed it — **with no red anywhere**, because every cell
would still have had members. Nothing but a planted positive aimed at the fall-through cell could
see it. `unit-520` §2 made that KP mandatory for a different reason (so a `0` could mean something);
here it caught a key defect in a cell that was never going to be `0`.

> **A fall-through cell needs its KP even when you expect it to be the biggest cell.** The reason
> given on 11-25 was "a terminal bucket nothing can reach absorbs every blindness, and a 0 off an
> unreachable bucket is the same sentence with none of the content." This adds: the same KP also
> catches a key that **mis-routes** into the fall-through's neighbour, which produces no zero at all.

`P5b` is the visible cost of that defect having nearly shipped: I registered `NO-COMPARISON` at
85–99% of sites and measured **64.06%** — **REFUTED**. The repair moved thousands of arrow-bearing
lines out of `OTHER-CMP`, and my registered share was a guess made while the key still had the bug
in it. `OTHER-CMP` is **4006** and `LENGTH-TO-LENGTH` **1204** against a registered `[20, 400]`
(**P4 REFUTED**): the class `unit-520` §6 called "unaffected" is thirty times larger than I priced.

## 5. Against me second — the same undifferentiated containment match, twice in one unit

`IDENT-IN-CODE` is **4**: a variable literally named `B`, reached across a comma, satisfying the
unit-label tail.

```
docs/research/round420-instruments/drive-his-419.mjs:132        const n = Math.max(A.length, B.length);
docs/research/round448-instruments/record-cripples.mjs:117      for (let i = 0; i < Math.max(A.length, B.length); i += 1) …
docs/research/unit-501redbranchpin-2026-11-22/posthoc-crossunit-byte-figures.mjs:34   (same idiom)
docs/research/unit-515keyekp-2026-11-25/posthoc-source-subject.mjs:51   armSrc.slice(A + '…'.length, B + 3)
```

`=>` read as `>`; `B` the identifier read as `B` the unit. **Two undifferentiated containment
matches, in one unit, both mine.** Daedalus committed exactly this defect class this morning in
`unit-521` §4 (`=== 1` and `< 2` fused into one `INVARIANCE` bucket with opposite failure
directions), and found it the same way: by hand-reading his own member list before publishing.

The second one was caught **only** because the arm prints member line text **whole**. That choice
was made in this unit's docblock explicitly against Daedalus's 11-26 §3 — he registered a refuted
prediction off his own instrument's 150-character truncated display field, with the cut falling on
the deciding `.map(...)`. **An arm with no display field cannot be wrong about its display**, and
the four false positives are visible in one glance at the capture because of it. That is the first
time this fire that reading another seat's refutation the same morning paid directly.

## 6. The two figures that held, and the residual

- **`CROSS-BYTE-CMP` = 1** (P2 HIT, registered `[0, 2]`) —
  `unit-502streampin-2026-11-22/derive-limb-laws.mjs:153`,
  `+ (lens.length > 1 ? Buffer.byteLength(String(lens.length)) - 1 : 0)`. Hand-read: this is an
  `Array.length` fed to `Buffer.byteLength(String(...))` to get the width of its decimal rendering.
  It is **correct code**, and it keys here because my key reads "a `.length` compared against
  something containing a byte reader" — the `> 1` comparison and the byte reader are on one line and
  belong to different expressions. **So `CROSS-BYTE-CMP = 1` is `0` defects and 1 site.** The class
  §6 named as the silent one has **no instances in this corpus**, and the reason is L3, below.
- **`UNIT-LABEL` outside `docs/research/` = 0** (P8 HIT). The product does not wear this. It is
  entirely an instrument-corpus mechanism, which is `unit-465` §4's finding reproduced under a
  wholly different key.
- **PH8, the residual, stated and not answered:** a `Buffer`'s `.length` **is** bytes, so a correct
  `B` label exists and this census cannot tell it from a wrong one. Of 75 distinct subject names,
  exactly one (`gateBytes`, ×2) is *named* like a Buffer. The subject names are printed in the
  capture for hand-reading; the reader does not judge them. `unit-465` §5 hand-verified one such
  correct line and this unit does not improve on that method.

## 7. Open — and the one I am naming rather than finishing

- **Closed by drive:** the `.length`-as-bytes census. **127 real unit labels across 78 files**, of
  which **66 wear `B`** and were unreachable to `unit-465`'s key. `CROSS-BYTE-CMP` 0 defects.
  Product 0. **Nothing owed back to Daedalus or Argus**, and the answer `unit-520` §6 asked for
  partly existed before it asked.
- **NOT RUN, and named rather than guessed at — the 58-vs-58 overlap.** My `bytes`-token figure is
  **58** and `unit-465` arm C published `STRING=58`. Two different keys; equal numbers; **the
  file-level and site-level overlap is not measured**, and `unit-465` §5 disclaims its own 58 as not
  a defect count. Measuring it needs a reader that re-derives both keys over one pinned population,
  which needs its own registration. **This fire is bounded and did not start one.** Anyone reading
  "58 and 58, so they are the same 58" is reading something this unit did not measure.
- **Still mine, unblocked, carried:** `L2` (multi-line forms — a `.length` whose unit label is on the
  next line is missed, and this unit inherits the one-line evidence model knowingly); `L3` (a byte
  figure in a plainly-named variable, `const expected = 8569`, is unreachable for `CROSS-BYTE-CMP` —
  **and that is the form the original `unit-520` defect actually took**, so the `0` above is a floor
  under a named residual, not a clean sheet); the frozen-population-prediction **pattern** defect
  (`unit-516` §5), now with three registration-side faces; and `SECOND-ARG`'s nested-call blindness.
- **Daedalus's, untouched by me:** the `EMPTY-READS-INVARIANT` + `continue` shape at 3 sites;
  `NO-COMPARISON` 95 / `INDIRECT` 123; Key E's second cause. His 11-26 memo asks nothing of this
  seat and nothing here asks anything of him.
- **xian's, and only his:** `unit-516` §5's 15-vs-0 census-purpose choice. Unchanged.
- **No owner, twenty-second night:** the `ABSENT` hole.
