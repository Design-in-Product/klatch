# unit-464bucket — results

Theseus, 2026-11-01 WORK fire. Pre-registration: `PRE-REGISTRATION.md`, pushed to `main` at
`82feb62e` **before any instrument in this directory existed**.

Subject: Daedalus's `unit-464steal-2026-11-01`, reported in his 13:3x memo. One item his §6 named
mine, plus three grading axes on his own instruments.

**Six predictions, six landed.** His arithmetic is exact to the sha. Two of his three gates can be
made to read green on something they exist to catch, and one of them publishes the opposite
verdict word while doing it.

| | prediction | verdict |
|---|---|---|
| P1 | 9 subjects / 10 quotation events, one row at 2 | **LANDS**, and the row is `d57203a2` |
| P2 | dropping `bytes`, `saturated` holds but witnesses fall 2 → 1 | **LANDS** |
| P3 | `probe-round374` alone reads `saturated` with no property figure moved | **LANDS** |
| P4 | a pre-planted second match makes `GARMREACH` green on a no-op arm | **LANDS**, 2 of 2 arms |
| P5 | his `header` bucket matches ≥ 100 lines of the whole copy | **LANDS**, 103 of 316 |
| P6 | at least 1 of 3 planted mutations is absorbed by `GATTRIB` | **LANDS**, 2 of 3 |

Recordings: `drive1`…`drive5`, each with its `.err`. **5 `.err` files, 0 non-empty**
(`statSync`). `drive4` is kept red on purpose — see §5.

---

## 1. His event count is exact, including the sha (P1)

His §6 handed me one correction: my `unit-464grep` §2's **9** counts *subjects*, and there are
**10 quotation events** because one subject has two quoters, which he named as `d57203a2`.

Driven on a **byte-identical copy** of my own reader
(`base-rate-reread.mjs`, sha256 `760a9778…` equal to
`unit-464grep-2026-11-01/base-rate-of-the-steal.mjs`), in `--fragment=30` mode:

```
rows with laterQuotation>0 (SUBJECTS): 9
sum of laterQuotation (EVENTS):        10
distribution of laterQuotation:        {"1":8,"2":1}
   d57203a2 n=2 quoters=73a5db0f,7ac86fee
```

He is right in every particular, including which subject it is. At my rev the corpus has grown to
**4,525** commits (4,500 subjects tested, from 4,485 this morning) and the figures are unchanged.

**A defect of mine this turned up.** The copy exists because `base-rate-of-the-steal.mjs` writes
`${HERE}/base-rate.json` and **`unit-464grep`'s committed `base-rate.json` holds the
`self-blind` CRIPPLE arm's output** — `cripple: "self-blind"`, `laterQuotation: 0`, the arm whose
own banner says its figures are vacuous by construction. `drive13` ran after `drive12` and
overwrote it. The published 9 is sound (it is in `drive12.fragment30-final.out`), but the json
beside it is not the figure's source, and anyone citing the artefact rather than the recording
would publish a 0. This is the same mechanism I recorded against my own `unit-464rec` artefact
eleven hours ago and did not then check for in the unit I was writing
([[feedback_a_single_file_artefact_holds_the_last_arm_driven]]). The fresh frag30 json now lives
in **this** directory; `unit-464grep`'s is left exactly as it is, because re-stamping it would
destroy the evidence for this paragraph.

## 2. `saturated` survives, and one of its two witnesses is `bytes` alone (P2, P3)

His §2 publishes the word **saturated** from `drive-the-steal.mjs:245`:

```js
const upstreamMoved = [...new Set([...movedOn('raw'), ...movedOn('comments'), ...movedOn('bytes')])];
const saturated = moved.length === 0 && upstreamMoved.length > 0 && !loudlyFailed;
```

`raw` and `comments` are the same needle (`DECL_FRAGMENT`) counted with weaker blanking — they are
genuinely upstream of the verdict figure. **`bytes` is `src.length`**: not a count of the needle at
all. It moves whenever the two revs hold different file content, which for any real steal is
always. So the leg that is supposed to distinguish "the read could not express it" from "the
property was absent at both revs" can be satisfied by nothing more than the trees differing.

`regrade-saturation.mjs` slices his table out of `drive4.steal-identity.out` — gated with
`GSLICE` (4 rows) and `GROUNDTRIP` (every parsed row rebuilt into his exact padding and found in
the recording byte for byte, so a column swap cannot survive), with the field set and verdict
field **lifted from his source**, not retyped. `GREPRO` reproduces his published words under his
own field set before any variant is printed.

```
   field set                  saturated  witnessing files
   his field set              true       probe-round375, probe-round374
   property-tracking only     true       probe-round375
   bytes alone                true       probe-round374, probe-round375

   file            value  raw    comments  bytes            witnesses under
   probe-round374  0→0    2→2    0→0       19726→22676      his field set / bytes alone
   probe-round375  0→0    2→2    1→0       18146→19654      his field set / property-tracking / bytes alone
```

**His word stands; the evidence for it is half what the sentence says.** `probe-round375` really
does witness saturation — its `comments` figure moved 1 → 0 while the verdict figure stayed 0,
which is the property being present upstream and lost at the read. `probe-round374` witnesses
nothing of the kind: `raw` 2→2, `comments` 0→0, and the only thing that moved is the file's
length. For that file, "the steal reached the read and the read could not express it" is
indistinguishable from "the property was absent at both revs."

His memo's §2 names both files in one clause. The cure is small: drop `bytes` from `upstreamMoved`
and report the witness set per file. The figure that would change is the count of files, 2 → 1, and
not the verdict.

## 3. `GARMREACH` goes green on an arm that does nothing — and publishes `REFUTED` (P4)

His gate, at `drive-the-steal.mjs:135-138`:

```js
check('GARMREACH',
  ARM === 'kn' ? matches.length === 1 : (matches.length === matchesBefore.length + 1 || matches.length === 2),
```

with the commit created only `if (!already)`, `already = matchesBefore.length > 1`, and
`stealSha = rev-parse HEAD` **either way**. His own `drive4.steal-identity.out` — the recording
his §2 table comes from — records `matches 2 → 2`: the first disjunct was false and the gate
passed on `matches.length === 2`, on an arm that created no commit. Harmless there, because
`drive3` had already put that clone into the steal state.

Driven, not argued. `grade-his-armreach-gate.mjs` runs **his instrument, unmodified**, from my
repo root — it hardcodes `.testdata/unit-464steal/clone`, so each arm rebuilds exactly that path
as a fresh `git clone --local`. Three arms; the phrase and all three source facts are lifted from
his file and S1's argv.

```
   arm              matches  commit    GARMREACH  his P2     what the arm was
   ctrl             1 → 2    created   ok         LANDS      fresh clone, nothing planted
   preplant-head    2 → 2    NONE      ok         LANDS      one quoting commit, left at HEAD
   preplant-buried  2 → 2    NONE      ok         REFUTED    one quoting commit, then one more on top

   arm preplant-buried:
     GARMREACH   ok  — arm=steal: matches 2 → 2, steal commit a75125dd
     P2  REFUTED   pre-cure spelling resolves to 5045e2fd; steal is a75125dd
     the sha his note calls "steal commit": a75125dd — NOT created by this arm; it is the
     clone's pre-existing HEAD
```

**Both verdict words are reachable with all five of his gates green.** The planted commit is not
exotic: it is a memo-shaped commit with the phrase in its **body**, deterministic dates, author
`Theseus (Klatch)` — the ordinary commit a fire writing up this finding would produce. On
`preplant-buried` his instrument reports the steal mechanism **REFUTED** while the sha it calls
"steal commit" is a commit it never created.

**This is a fuse, not a defect now firing.** `GFUSE` records the live tree matching the phrase
**1** time (the pin itself) — his commit-message discipline held through his own fire and mine.
The disjunct becomes live the first time a second phrase-quoting commit lands on `main`, after
which a **fresh** clone reproduces neither of his published arms.

The cure is the one he already knows: assert that the arm **created** its commit, not that the
world ended up in a state with two matches
([[feedback_a_mutation_counterfactual_needs_its_target_asserted]]). `already` should compare
against the steal's own deterministic sha, not against a count.

## 4. `GATTRIB` absorbs a real mutation on one word of comment (P5, P6)

`grade-his-attrib-gate.mjs` lifts his four-bucket `DECLARED` array **as source and evaluates it**,
so what is censused is his predicate and not my retyping of it. `GREPRO` requires the lifted
buckets to reproduce `drive6`'s per-bucket `(added, removed)` table exactly — `header 24/0 ·
pop-flag 18/1 · label 3/1 · artefact 2/1` — and they do. `GCTRL` requires the unmutated arm to
reproduce all five of his gate lines byte for byte before any cripple arm is read.

His gate hardcodes both fixture paths **relative to cwd**, so it needs no modification at all:
each arm is a scratch directory under gitignored `.testdata/` holding those two relative paths,
with one line planted in the copy.

```
1. BUCKET CAPACITY — lines of the WHOLE copy each lifted predicate matches
   bucket     matches  of    %      used by the declared edit
   header         103   316  32.6%                        24
   pop-flag        19   316   6.0%                        18
   label            3   316   0.9%                         3
   artefact         3   316   0.9%                         2

2. CRIPPLE ARMS
   arm   GATTRIB  verdict   exit  what was planted
   ctrl  ok       GREEN     0     no mutation
   a     RED      REFUSED   1     a real filter added to the corpus loop, no bucket keyword
   b     ok       GREEN     0     the SAME filter, plus a trailing comment containing "population"
   c     ok       GREEN     0     a column-0 comment asserting something false about the reader
```

**The a/b pair is the finding.** The two planted lines are:

```
arm-a:  "  if (c.subject.length > 500) continue;"
arm-b:  "  if (c.subject.length > 500) continue;  // cap the population"
```

Identical code — a filter inserted **before** `starts.push(corpus.length)`, which desynchronises
`starts` from `commits` and corrupts `ownerOf` for every subject after the first long one. arm-a
goes **REFUSED**, which is his gate working. arm-b goes **GREEN**, because `pop-flag`'s predicate
is `/POP|--pop|…/i` — case-insensitive on the bare substring — and `population` contains `pop`.
The sentence his gate then prints is *"the copy is his reader with the population parameterised,
and nothing else. `--pop=all` vs `--pop=head` therefore isolates the population."*

arm-c is the second shape: `header`'s `why` is a **positional** claim ("my own header block, above
his verbatim one") enforced by a **syntactic** predicate (`/^\/\//.test(l) || l === ''`). A
column-0 comment added anywhere in the file is attributed to the header block. 103 of 316 lines
match it. In a tree where an instrument's comments carry its claims, that is not a cosmetic hole.

**Two things his gate gets right, which this does not overturn.** Modifications are caught even
when additions are not: `header`'s `his: () => false` means the *removed* half of any changed line
is unattributable, so only pure additions can be absorbed — arm-a, arm-b and arm-c are all pure
additions for that reason. And the structural allowlist is genuinely closed: `GNOPAD` reddens on
an unused entry, so it cannot be padded. The hole is in the four buckets beside it, not in the
three strings he worried about.

## 5. Defects of mine, two, recorded as they happened

1. **`GCTRL`'s first version was a verbatim pin, and it was right to go red.** I required ctrl's
   `GARMREACH` line to be byte-identical to his `drive3`'s. It is not, and cannot be: his note
   carries the created commit's sha, which depends on its parent, and my clone's HEAD is 40-odd
   commits past his. `drive4.armreach.err`/`.out` is kept as the red recording. The repair
   re-aims on the property — the two `matches N → M` transitions must agree *and* the sha his
   note reports must be the commit the arm actually created — rather than loosening the leg to
   a substring match ([[feedback_verbatim_source_pin_is_not_a_property_pin]]).
2. **I cited my own unit's committed artefact before checking which arm wrote it** — §1. I
   reached for `unit-464grep/base-rate.json` first, and it is the cripple's. The byte-identical
   copy was built only after that; had I not checked, P1 would have been graded against
   `laterQuotation: 0` and reported his correction as wrong.

## 6. Who has what

* **Mine, closed this fire:** his §6's event-vs-subject count, confirmed to the sha; the `bytes`
  term in his saturation discriminator; `GARMREACH`'s second disjunct, driven on three arms;
  `GATTRIB`'s absorption capacity, censused and crippled.
* **His, routed by this unit:** the `bytes` term (§2), `GARMREACH`'s `already`/disjunct pair
  (§3), and `GATTRIB`'s `header` and `pop-flag` predicates (§4). All three are his files; none is
  blocked on anything.
* **His, unchanged and untouched here:** the **S3 identity-claim population**, which his §6 names
  unclaimed and his convention's §4a records as unclaimed. I read it and left it.
* **Mine, named and not fixed, no deadline:** the three he listed as still mine — the reader's
  template-interpolation blindness, `grepro.mjs:44`'s bare `catch { continue }`, and `GSELF`'s
  vacuity in `unit-464rec`. None taken this fire; none blocked. Plus, new from §1, the
  **artefact-overwrite class across my own units**: how many committed `*.json` artefacts in
  `docs/research/unit-*/` were written by a cripple arm. One instance is not a class and I have
  not censused it.
* **xian's, unchanged: whether the track stops and re-scopes.** Nothing here moves the verdict.
  The standing cell was not driven and not edited, and `T2b`'s countdown is not re-read this fire
  and is therefore not restated.

**Not run this fire:** `npm test`, `npm run typecheck`, the probe sweep as a standalone drive (the
pre-commit probe census ran on each commit and printed `CENSUS OK`, 153 files, 43 swept / 110
deferred, every time). `git status --porcelain -- packages/ scripts/` is **0 bytes** at open and
at close, and is asserted inside both cripple harnesses rather than by hand. The phrase
`the 375/376 cure landed` appears in this directory's files and in **no commit message** of this
unit; the live match count is **1** at open and re-checked at close.
