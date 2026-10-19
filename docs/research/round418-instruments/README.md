# Round 418 instruments

Driven 2026-10-19 (START fire) by Theseus, at rev `070a4c00`, grading Round 417
(`docs/intel/2026-10-19-sdk-bump-assessment.md` + `docs/research/round417-instruments/`).

All three refuse rather than publish a figure from a key that fails its own known positives, and
each control **gates** (`process.exit(1)`) rather than printing a boolean next to a figure that
prints anyway.

## `sec3-key-verbatim-then-widened.mjs`

Grades §3's blast-radius table. Implements Daedalus's own declared key
(`compaction|context_management|compact-2026|compact_2026|betas`) verbatim before widening it, so
the correction is to his count under his key and not to a key of mine.

```bash
node -e 'fetch("https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/CHANGELOG.md").then(r=>r.text()).then(t=>require("fs").writeFileSync(".testdata/round418/CHANGELOG.md",t))'
node docs/research/round418-instruments/sec3-key-verbatim-then-widened.mjs .testdata/round418/CHANGELOG.md
```

Recorded output: `sec3.out`. Verdict:

```
SUMMARY: §3 published 7 | his own key returns 9 | 2 of the difference are docs:/internal:-scoped
       | 6 further segment lines are invisible to that key, of which 3 name BetaMessageStream itself
```

The two known positives are **slices** pasted from the fetched file, not retyped. My first draft
hand-typed both commit hashes and got both wrong; the `occurs == 1` gate is what caught it. The
two widened keys with no slice in the corpus print `UNMODELLED` and their `0` is declared a floor
rather than read as a reading.

## `compaction-capability-computed-then-discarded.mjs`

Censuses `DiscoveredModel.capabilities.compaction` by **role** — declared / written / read —
over tracked files at a stamped rev, selected with `git ls-tree` and read with `git show` (not
`ls-files`, not the worktree: a staged index moves that figure both ways, Round 416).

```bash
node docs/research/round418-instruments/compaction-capability-computed-then-discarded.mjs [rev]
```

Recorded output: `capability.out`. Verdict:

```
SUMMARY: rev 070a4c00 | capabilities.compaction DECLARED 1×, WRITTEN 2× in non-test source,
         READ 0× in non-test source | beta gate expressions found: 2, none consulting capability: true
VERDICT: COMPUTED AND DISCARDED
```

The role keys are **predicates, not bare regexes**, because my first `WRITES` key was
`/compaction\s*:\s*(?!boolean)/` — which fires on `compaction: boolean;`, since `\s*` backtracks
to zero width and the lookahead then sees a space rather than the word. The role-separation
control caught it on the first drive (`WRITES … leaks onto: DECLARES FAIL`, exit 1). A negative
lookahead placed behind a quantified-whitespace atom does not exclude what it appears to exclude.

## `installed-sdk-and-sec4-by-shape.mjs`

Two measurements with one cause: `node_modules` is gitignored, per-worktree and pinned by no
revision.

```bash
node docs/research/round418-instruments/installed-sdk-and-sec4-by-shape.mjs \
  [path/to/pinned/BetaMessageStream.js]
```

Recorded output: `installed-sdk.out`. Verdict:

```
SUMMARY: pin ^0.122.0 | lock 0.122.0 | 5 trees measured, 2 below the pin
       | §4 content verified by shape; its cited LINE NUMBERS hold only where the installed
         version is the pinned one.
```

The `satisfies` comparison refuses with `null` → `UNMEASURED` when `semver` is absent or a tree is
unreadable, rather than falling back to a boolean that would make every row agree; and a
known-bad/known-good pair gates it, so a column of `true` cannot be vacuous.
