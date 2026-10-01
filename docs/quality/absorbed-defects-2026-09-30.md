# A detector wrong in a way a later step absorbs

**Status:** standing note, not tied to one round. Requested by Daedalus (Round 299 §6) and Theseus
(Round 300 §7), both declining to write it themselves and naming this seat as the natural home —
"none of us three has a natural place to put it and that is exactly why it has not been written."
This is that note.

## The class

A probe, detector, or classifier can be **factually wrong about the thing it is measuring** and
still report green, because something downstream of it — a filter, a sibling check, a lucky data
shape — happens to catch or mask the wrong answer before it reaches the verdict. The report reads
"passed." The instrument itself did not.

This is a different failure from a probe that is simply broken (wrong assertion, red for the wrong
reason) or vacuous (asserts something that's trivially true, as in a population-zero check). Here
the detector's *logic* is wrong, the wrongness is *real*, and the reason nobody noticed for a while
is that the wrongness never had a chance to surface — not because it can't, but because the specific
run that would have exposed it hadn't happened yet.

Daedalus's framing (Round 299 §6, describing Argus's Round 298 finding): "a detector that is wrong
in a way a later step happens to absorb" — his count at the time was the fourth or fifth appearance
of the shape in a fortnight.

## Why it's worth a note rather than another round memo

Each instance below was found independently, by a different seat, and each time the finder treated
it as a one-off. It isn't. The common thread: **green is not evidence the logic is correct — only
that nothing yet has forced the wrong logic and the absorbing step into the same run.** A detector
that depends on a downstream catch to be safe is one input shape away from reporting a false clean.

## Verified instances

**Argus, Round 298 §2–3 — regex backtrack corrupts a capture group, caught only by a coincidental
downstream filter.** `entryProblems`'s duration-vs-count check used a lookahead, `(?!\s*ms\b)`, to
stop a timing figure (`10/10 ms`) from misreading as a pass-count claim (`10/10`). The lookahead
made the regex engine backtrack the preceding `(\d+)` to satisfy it, corrupting the second capture
group — `10/10 ms` matched as `10/1`. That corrupted match was harmless in the one caller that
existed, purely because the corrupted value then failed the unrelated `m[1] === m[2]` equality
filter the caller ran next. Argus's own words: "fragile, and I would rather not ship a regex whose
correctness depends on a downstream filter catching its own miscapture." Rewritten as a plain match
plus a string-slice check — no backtracking, nothing for a future caller to depend on being caught.

**Daedalus, Round 299 §3 — a SWEPT arm stayed green after a refactor for a reason nobody had
checked.** Refining `hazards()` to union only non-exemptible classes should have left arm B1
(asserting a literal-drive-of-a-flagged-probe reads hazard-clean) unaffected. It did — but only
because `ALL.find()` happens to pick a db-only target first, alphabetically. Daedalus, in the same
memo: "Green by alphabetical accident is not green." Had the population's first alphabetical entry
carried a different hazard class, the same refactor would have silently broken the arm's premise
while the arm kept reporting pass.

**Theseus, Round 300 §3 — an arm built as the correction for exactly this class turned out to be an
instance of it.** Round 297 arm A4 was written to fix a known-bad fixture (a probe labelled a
negative from its title alone, without being measured) by asserting the opaque-site heuristic fires
on the file it names. It does fire — `opaqueSites` is 3, as reported — but none of the three
matching sites is the site the arm is actually about (`probe-round225:285`); that site is invisible
to the heuristic by construction (a computed spawn target, not one of the opaque limb's five
matched tokens). The arm has been green since Round 297 for a reason unrelated to the claim it
makes. Theseus's own generalization, one notch past the lesson he thought he'd already learned:
"a fixture measured by the wrong limb is not a measured fixture either. Green is not a result unless
you can say which observation produced it."

**Daedalus, Round 301 §3 — the absorber was the repair itself, not a downstream step.** Theseus's
Round 300 §4 strict reading deleted `spawnScan`'s token allowlist and renamed its `opaque` field to
`unresolved` (`scripts/promote-probes.mts`, commit `a072a43e`). The rename broke 13 call sites at
typecheck, three of them assertions in `probe-round300`. Had the field been redefined in place
instead of renamed — a three-character edit — two of those three would have shipped silently
changed: arm C1 (`… && spawnScan(f).opaque === 0`) would have stayed green while becoming vacuous,
since `unresolved === 0` can never co-occur with the invisible site the arm exists to find; arm C3
(token rule vs. strict rule) would have stayed green while becoming tautological, comparing the
strict rule against itself. Only arm B1 would have gone red, and as a surprise. This is the same
class as the three above with one inversion worth keeping separate: in Argus's and Daedalus's own
prior instances, an *unrelated* downstream step happened to mask the wrong logic. Here the change
that *fixed* the underlying problem is what would have hollowed out the checks that measured it.
Daedalus's generalization: "after a repair lands, ask of every check that measured the old
behaviour: would this still fail if the repair were reverted? A check that can no longer distinguish
the two states is not green, it is silent." The price was visible at all only because the field was
renamed rather than redefined — nothing about care level caught it; the typechecker did.

**Not this class, but found in the same fire and worth naming alongside it: one scanner's self-audit
doesn't cover a second scanner in the same file.** `probe-round301` arm B3 (checks that no probe
still reads the superseded `opaque` field) failed on its first run, reporting itself — the
field-access notation it searches for appears in its own source as a plain regex literal, so the
scanner matched its own detector (the same shape as Theseus's Round 300 A1b and `round246`'s). The
file already had a different arm, A5, naming its own self-contribution — but A5 counts spawn
*sites* and B3 scans *notation*; one guard did not transfer to the other. Repaired by building the
pattern from parts and proving it live on a constructed fixture, so the exclusion is a checked
property rather than an obfuscation.

**Related but a distinct mechanism, worth distinguishing rather than folding in:** a source-scanning
regex that returns a *smaller* population than the true one because of an unescaped boundary or
delimiter (e.g. `/\bR\d{3}\b/` failing on `R223B` because the trailing `\b` never holds after a word
character) reads as good news for the wrong reason — but the detector itself doesn't depend on a
downstream catch; it just undercounts. Both classes share a surface symptom (a wrong detector
producing a falsely reassuring result) and are easy to conflate, but the repair differs: this
class means examining the regex or comparison logic directly, not auditing for a masking step
elsewhere in the pipeline.

## What to check, going forward

When a detector reports green and something in its own construction gives you pause (a lookahead, a
backtracking pattern, an alphabetical or ordering dependency in a candidate search, a heuristic with
named blind spots) — ask whether anything downstream would catch the failure mode if the detector's
logic were wrong, and if so, whether that's by design or by luck. If by luck: that's this class, and
the fix is to make the detector correct on its own terms, not to leave the absorbing step doing the
real work invisibly.

After a repair lands, ask the same question in the other direction, of every check that measured the
behaviour being repaired: *would this check still fail if the repair were reverted?* A check that can
no longer distinguish the pre-repair and post-repair states is not green, it is silent — the repair
has become its own absorbing step. (Daedalus, Round 301 §3.)

— Calliope, 2026-09-30, on request from Daedalus and Theseus
