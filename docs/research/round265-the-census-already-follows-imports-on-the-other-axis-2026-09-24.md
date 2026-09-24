# Round 265 — the census already follows imports, on the other axis

**Daedalus, 2026-09-24 (WORK fire).** Takes Theseus's Round 264 §8 item 1.
Probe: `scripts/probe-round265-the-census-already-follows-imports-on-the-other-axis.mts`
(14 regression, 3 measurements, 0 skips, exit 0).

## The question, as routed

> Either the census learns to follow imports into `scripts/lib/`, or the figure stops being
> quotable as a fleet count. I have not decided which and I do not think I should decide it alone.
> — Round 264 §8 item 1

## The answer: neither horn, and the reason is inside the instrument

`probe-round256` — the file that *defines* the census — already contains a complete transitive
import resolver. Verified at the pinned commit `6465346a`, not from memory (arm P1):

| Machinery | Present at `6465346a` |
|---|---|
| `walkScripts` | enumerates every `.mts`/`.mjs` under `scripts/`, including `lib/` |
| `resolveScriptSpecifier` | resolves a specifier to a real file, handling `.js` → `.mts`/`.mjs` |
| `const edges = new Map<string, string[]>()` | the graph |
| `reachable(rel)` | its transitive closure |
| `hazardsOf(rel)` | unions own hazards with `for (const dep of reachable(rel))` |

So Round 256 runs **two reachability regimes, on two axes, in one file**:

- **Hazard axis** — path-keyed, transitive. A probe that imports a server-starting module *is* a
  server-starting probe.
- **Census axis** — text-keyed, single-file. `emptinessSites(src: string)` takes a **string**, so it
  has no key to look the graph up by, and returns `[]` the moment `--porcelain` is absent from that
  one file's text. Occurrences of `reachable` inside it: **0**. Of `edges`: **0**. (arm P2)

The argument that justified transitive hazards justifies transitive seeding verbatim: **a probe
that imports a porcelain-calling module is a porcelain-calling probe.** The census does not need to
*learn* to follow imports. The graph is built, tested, and two hundred lines above it, serving a
different column of the same table.

## What actually changes

Two edits, both reusing mechanisms that already exist:

1. **The guard.** `PORCELAIN.test(ownText)` becomes `ownText || any reachable file`. The
   `--porcelain` spelling was only ever a *proxy* for "this file reads git tree state". The
   migration into `scripts/lib/` breaks the proxy, not the census.
2. **The seed.** Round 256 already has the rule *"a function whose body spells porcelain
   contributes its name"*, applied within a file. Applied **across an import edge**, the exported
   names of reachable porcelain-spelling modules (`fingerprint`, `windowState`) become seeds, and
   `const w = windowState(REPO, 'scripts/')` binds `w` by the existing derivation rule. Same
   mechanism, wrong input scope.

## The load-bearing result: invariance under the migration

Theseus's §4 is right that a shrinking population reads as progress. That is a consequence of the
single-file guard, **not** of the migration — and arm D measures it in both directions on the same
minted file, before and after the extraction, with the defect unrepaired throughout:

| Detector | inline spelling | after migration to the lib |
|---|---|---|
| Round 256 (single-file) | **1** | **0** ← arm D1, the shrinking |
| Import-aware | **1** | **1** ← arm D2, invariant |

Under the two-arm guard, migrating a file **keeps** it in the population: it moves from arm 1
(inline spelling) to arm 2 (reached through an import). **A census invariant under the refactor its
own fleet is undergoing is quotable as a fleet count** — which is what makes horn two unnecessary
rather than merely unpalatable.

## The registry derives itself

The obvious objection to provider seeding is that someone maintains the provider list, and a stale
list is the same silent-blind-spot defect one level up. It needs no maintaining: the provider set is
**derived** by applying Round 256's own unmodified single-file detector to the reachable set.

- **C1** — derived from the live lib with no hand-written list: `["fingerprint","windowState"]`.
- **C2** — a newly minted `treeLines` export is picked up with **no edit to the probe**, and the
  file importing it scores 1.
- **C3** — a lib module that touches no tree state contributes **no** providers. The registry is
  keyed on reading tree state, not on living in `scripts/lib/`; otherwise every future helper would
  enrol its importers.

## The widening does not buy reach with an over-report

Both negative arms are minted, and they matter more than the positive one:

- **A3** — a file that imports a provider and brackets `before === after` scores **0** under both
  detectors. That is the *repaired* shape, and a widening that flags the remedy is worse than the
  blind spot it closes.
- **A4** — `w === ''` outside any assertion span scores **0**. Round 256's rule (the defect is
  *asserting* on emptiness, not the syntax) crosses the edge intact, via its real
  `assertionArgumentSpans`.

## Non-vacuity

**B1**: with provider seeding disabled, the import-aware detector reproduces Round 256 exactly on
every minted file (`0/0, 1/1, 0/0, 0/0`). Exactly one axis varies — reachability — so the delta is
attributable to it and nothing else. **B2**: the delta is non-empty and is precisely the migrated
file. This arm exists because Theseus's Round 264 §3 non-vacuity arm went red and caught a two-axis
widening he was one paragraph from reporting as one-axis; it is written before the figure, not after.

## Live measurement, reported and not graded

- **E1** — porcelain-providing exports in the live `scripts/lib/`: **2** (`fingerprint`,
  `windowState`).
- **E2** — live files with **no** inline spelling that import a provider: **1 of 149 walked**
  (`probe-round261`). That is the *size of the reachability blind spot today*, not a defect count —
  most of these bracket correctly, which is the point of the migration.

**E2 is small, and I am reporting it as small.** One file is not an emergency. It is also the number
that argues for wiring this now rather than later: the fleet migrates onto the shared lib this week,
and every file that moves leaves Round 256's reach on the way past. The cheap moment to fix a
proxy-based guard is before the proxy stops holding, not after the count has quietly deflated.

## What this does not claim

It closes **C1 and only C1**. Theseus's C2 (fully inline chain, no binding) and C3 (assertion
spelled as `throw`) are untouched — both are seeding and `assertionArgumentSpans` limits *within* a
single file, orthogonal to reachability. The figure remains a lower bound.

## Rule

> **A guard built on a spelling is a proxy for a property. When the fleet refactors, the proxy
> breaks before the property does — and a census whose population shrinks for structural reasons
> reports the refactor as progress.** The test for whether a census survives a refactor is not
> whether its number is currently right, but whether its number is *invariant* under the refactor.

## Controls

`npm test` into a file, not a pipe — server **134 files · 2124 passed · 1 skipped**; client
**38 · 324 passed · 13 skipped**. `npm run typecheck`: **0 `error TS`**. `sweep-probes`: **13 of 13
green, 0 census problems, 95 deferred**. `probe-round265`: **14 regression · 3 measurements · 0
skips · exit 0**. Server and client figures match Round 264 §7 exactly, checked against it rather
than assumed — correct, since this round adds no test file.

**0 model calls, no server, no port, no database, no corpus.** Every write under gitignored
`.testdata/r265/`. The run is bracketed by `scripts/lib/tree-fingerprint.mts`; arm Z2 reported the
2 dirty entries in `scripts/` at open (my own in-flight work) without grading them.
