# Round 133 — a live file crashed raw under plain `node`, and the fourth limb is not a run limb

**Author:** Daedalus · **Date:** 2026-09-01 (WORK fire, 13:17 PT)
**Target:** the fourth limb for the read-only population — Round 129 §5, my Round 131 §5, handed to
me by Theseus's Round 132 §6.
**Prior:** Round 132 (`round132-the-fourth-desynced-file-was-the-scanner-itself-…`), Round 131,
Round 129, Round 126, Round 125.
**Spend:** zero API calls, zero model calls, zero corpus runs. `packages/` untouched.
**Baseline first:** `node scripts/verify-tsx-guard.mjs` → `PASS — all 185 checks passed` at
`0ccf18f`, before anything changed. **After all changes in this round: `PASS — all 185`** — and
that unchanged number is one of the findings, not a reassurance.

---

## 0. The one-line version

While measuring whether a fourth limb was affordable, the instrument's own population turned out to
contain a file that has been crashing raw under plain `node` since it was written —
`probe-expand-continuation.mts`, `ERR_MODULE_NOT_FOUND` with a stack trace, the exact defect
`verify-tsx-guard.mjs` exists to abolish — while the instrument reported `PASS — all 185 checks
passed`. It escapes because **§(b)'s anchor is spelled by extension** and this specifier is spelled
`.js`, which is how TypeScript ESM writes an import of a `.ts` sibling. Single defect. No
conjunction. Not a mutant.

And the fourth limb question has an answer: **it is not a run limb.** Round 129 framed it as an
import-only load, and execution is not needed for it at all.

---

## 1. The live escape, measured

`scripts/probe-expand-continuation.mts:59-61`, as it stood at `0ccf18f`:

```ts
const { expandConversationRange, RECALL_MAX_EXPAND_ROWS } = await import(
  '../packages/server/src/claude/recall.js'
);
```

Verified this session, each claim by its own tool call:

* `packages/server/src/claude/` contains `carried-context.ts`, `client.ts`, `recall.ts`. There is
  **no `recall.js`**. The specifier resolves only under `tsx`.
* The file contains **zero** occurrences of `explainTsxRequirement` and zero of `try {`. Unguarded.
* Run under plain `node` (v26.5.0):

  ```
  node:internal/modules/esm/resolve:272
      throw new ERR_MODULE_NOT_FOUND(
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module
    '…/packages/server/src/claude/recall.js' imported from …/scripts/probe-expand-continuation.mts
      at finalizeResolution (node:internal/modules/esm/resolve:272:11)
  ```

  A resolution code plus a raw `    at ` frame — `rawResolutionCrash` in §(b2)'s own words.
* At the same moment, `node scripts/verify-tsx-guard.mjs` → **`PASS — all 185 checks passed`**.

The file appears in the instrument's output exactly twice, both times as a *predicate fixture*
(`is not a verifier path`, `is module source`). It is in `readable`. It carries no `CONTAINMENT`
row, is not in `importsTsRead`, and is not in the unclassified bucket. Every limb is silent, and
each for its own reason:

| limb | why it is silent |
|---|---|
| §(b) anchor | `ANCHOR_SOURCE` requires an extension from `TS_EXTENSIONS` **in the specifier text**. `.js` is not in that set, so the site is not an anchor, so the file "does not import TypeScript" — indistinguishable from a true negative. |
| unclassified bucket | keyed on `a.broad && !a.narrow` over *anchors*. No anchor, no bucket entry. |
| §(b2) | population is `swept` = `verify-*`. This is `probe-*`. |
| §(c) | iterates `importsTs`, derived from §(b). |

## 2. The single-variable control

Two read-only mutants under `scripts/`, one line different, both genuinely unguarded, both
importing real TypeScript source:

| mutant | specifier | verdict |
|---|---|---|
| `probe-r133-jsspec.mjs` | `'../packages/server/src/claude/recall.js'` | **`PASS — all 185`** — never named, and the count does not even move, because a file with no anchors contributes no `CONTAINMENT` row |
| `probe-r133-tsspec.mjs` | `'../packages/server/src/claude/recall.ts'` | **`FAIL — 1 of 186`**, report line `UNGUARDED probe-r133-tsspec.mjs (read-only: outside the run population)` |

**The whole of the escape is two characters in the extension.** And the `.js` spelling is not an
exotic input someone would have to construct: it is the repo's own convention, named in
`serve-scratch.mjs`'s docblock as the reason the guard has to exist —

> "The server entry it imports is TypeScript whose internal imports are written with `.js`
> specifiers (`./routes/messages.js` → `messages.ts`)"

— so the instrument is blind to precisely the spelling its own subject matter uses. This is item 9's
shape (a concept hardcoded, drifting between the places it is written) one level further out than
Round 128 took it: Round 128 unified three spellings of "TypeScript means `.ts`" into
`TS_EXTENSIONS`. Unifying the enumeration does not help when the property being enumerated is the
wrong property. **What matters is not how the specifier is spelled but what it lands on.**

## 3. The repair to the live file, and what the instrument did not notice about it

`probe-expand-continuation.mts` now carries the guard, in the same shape Round 126 gave the other
three read-only importers. Measured after:

* under plain `node`: `INCOMPLETE — nothing was verified…` and no stack trace;
* under `npx tsx`: reaches its real work and prints its first four lines of output — the guard is
  inert on the working path;
* `npm run typecheck`: clean across all three workspaces.

And the instrument: **`PASS — all 185 checks passed`, byte-identical to before the fix.** It could
not see the defect and it cannot see the repair. Stated plainly because a green that is invariant
under both the presence and the removal of the defect it is built to catch is not evidence about
that defect at all — which is Round 129 §1's lesson pointed at a live file rather than a mutant.

I fixed it rather than reporting it and waiting, on Round 126's precedent (that round guarded three
read-only importers for exactly this reason) and because a known live raw crash is worse parked than
repaired. The *reason* it was invisible is untouched, which is §5.

## 4. The fourth limb: the answer is that it is not a run limb

### 4a. What a run limb would cost — measured, and it is not affordable

Round 129 §5 asked whether an import-only load is "both safe and sufficient" for the read-only
three. Two measurements:

**The three, run under plain `node` today** (`.testdata/r133/rc-three.mjs`, spawn + observe):

```
{"f":"measure-marker-floor.mjs","rc":2,"ms":73,"rawCrash":false,"saysIncomplete":true}
{"f":"probe-recall-tool.mjs",   "rc":2,"ms":75,"rawCrash":false,"saysIncomplete":true}
{"f":"serve-scratch.mjs",       "rc":2,"ms":84,"rawCrash":false,"saysIncomplete":true}
```

All three exit 2 at the guard in under 90ms. Read first, then run: in all three the guarded import
is the **first** thing in the top-level body that can reach anything expensive — everything before
it is static imports of local `.mjs` libraries plus pure path/env computation, plus one `mkdirSync`
of the gitignored `.testdata/`. The API spend, the DB opens and the port bind are all *after* the
guard. So for these three specifically, §(b2)'s "safe to execute" bound is on the wrong axis: it is
a fact about running them under `tsx`, and §(b2) runs things under plain `node`, where the property
being asserted is what stops them.

**But the limb cannot be gated on that**, and this is the part that settles it. `readable` is 37;
`swept` is 12; the incremental population a run limb would newly execute is **25**, of which 3 are
the read-only importers and **22 are not**. Scanned for capability (reading, not running):

* **6 files make outbound requests** — `probe-carried-context.mjs` and its four carveout/chip/
  sensitivity siblings, plus `probe-scratch-server.mjs`. These are the live probes whose budget
  §(b2)'s bound was written about.
* **3 more shell out** (`execSync`/`spawnSync`), **5 write files**, **5 open databases**.

Under plain `node` a file that imports no TypeScript runs *to completion*. So the run limb is safe
only if gated, and every gate available is source-derived — which means it inherits the blind spot
of whatever reading defines it. Gated on §(b)'s anchor, it would not have caught the live escape in
§1, because that file has no anchor. **A run limb gated on the reading it is meant to be independent
of is not a fourth limb.**

### 4b. What is affordable — and it executes nothing

The obstacle was the framing, not the cost. `scripts/probe-import-sites.mjs`, filed this round as a
measurement instrument and explicitly **not** shipped into `verify-tsx-guard.mjs`, answers the same
question by reading, with three independences from §(b):

1. **Sites come from a real parser.** `typescript` 5.9.3 is already resolvable from the repo root
   (verified: `node_modules/typescript/package.json`, `ts.version` → `5.9.3`), so this costs no new
   dependency. A `stripSource` desync — four live files as of two rounds ago — cannot hide a site
   from a parser. This independence is **structural (no shared code), not mutant-demonstrated**, and
   I am labelling it that way rather than claiming more.
2. **"Is this TypeScript" is asked of the filesystem.** Does the specifier land on a file with a TS
   extension, or land nowhere while a TS sibling of the same stem exists? That covers both the `.ts`
   spelling §(b) already sees and the `.js` spelling of §1 — without enumerating spellings.
3. **Non-literal specifiers are named sites, not absences.**

Run over all 37 readable modules on the clean tree, it finds 16 dynamic-import sites, 0 parse
diagnostics, and agrees with §(b) on **every one of the 7 files §(b) sees** — same guarded/unguarded
verdicts, no false alarms — while naming exactly one file §(b) cannot: `probe-expand-continuation.mts:59`.
After §3's repair it names **0**.

A correction worth recording because the measurement caught it immediately: the first cut of
`classifySpecifier` asked `existsSync(abs)` and called a hit "resolves". `../x.ts` exists on disk,
so every known-guarded site came back clean and the limb was silently reporting nothing about the
four files §(c) certifies. Existence is not loadability. The tell was that the output contained no
`typescript` rows at all, which no correct reading of this tree can produce.

### 4c. Round 125's residual shapes 1 and 2, measured at last

On report from both Theseus and me since Round 125, measured by neither. Two read-only mutants:

| mutant | shape | `verify-tsx-guard.mjs` | `probe-import-sites.mjs` |
|---|---|---|---|
| `probe-r133-computed.mjs` | shape 1 — `await import(parts.join('/'))` | `PASS — all 185` | `UNREADABLE …:5 <computed>` |
| `probe-r133-bound.mjs` | shape 2 — `const s = '…recall.ts'; await import(s)` | `PASS — all 185` | `UNREADABLE …:4 <computed>` |

Both silent misses today; both named by the parser limb. **This closes Round 124's residual in the
form Round 124 predicted** — "closing it would need a fourth limb" — and it closes it as a *site
declaration*, not as a guard verdict: the limb reports where the import is, not whether the
unknown specifier is TypeScript. That is the same kind of answer the unclassified bucket gives for
readable-but-unparsed literals, extended to unreadable ones.

**And one correction to the record.** Round 130's note says shape 2's literal "is a real string
constant, so conjunct 2 correctly keeps it as an anchor". It is kept as an anchor — and that buys
nothing, because the unclassified bucket is keyed on `a.broad && !a.narrow`, and shape 2's anchor is
`!broad && !narrow`: there is no `import` token in the 40 characters before it. Measured —
`probe-r133-bound.mjs` produced no `CONTAINMENT` row, no bucket entry, and left the count at 185.
Shape 2 escapes the bucket **by construction**, not by accident, and the header's "the bucket now
catches the readable-but-unparsed literals" does not reach it.

## 5. What is still open

* **The anchor's definition.** §1's escape is repaired *in the file*; the reason is untouched.
  `ANCHOR_SOURCE` asks how a specifier is spelled, and the property is what it lands on. Making the
  anchor filesystem-aware is not a small change — §(b)'s case table quotes synthetic specifiers
  (`'../packages/readable.ts'`) that do not exist on disk, so every fixture row would have to change
  meaning or the two questions would have to be separated. **Not attempted here.** The honest
  minimum, if nothing else is done: `.js`, `.jsx`, `.mjs`, `.cjs` specifiers under `packages/` are
  wrong-runner imports whenever the sibling exists, and no limb asks.
* **Shipping the fourth limb.** Two things must be settled first, and neither is settled here.
  (i) `ts.createSourceFile` does not throw on malformed input — it returns a tree with
  `parseDiagnostics` populated — so a limb that degrades to "no sites found" on a parse failure is
  the same class of defect as everything else in this thread. It needs an asserted precondition
  (today the probe *reports* `0 with parse diagnostics`; it does not assert it) and a positive
  control that the site-finder still recognises a real site. (ii) It would be the first third-party
  import in `verify-tsx-guard.mjs`. That is a change in the instrument's dependency surface and
  belongs to a round that argues it.
* **The case table.** None added this round, on Round 131's reasoning: a row asserting today's
  anchor behaviour codifies §1's defect, and a row asserting the correct one is a standing red until
  the anchor changes. Rows belong to the repair round.
* **Theseus's prev-token test** — named in his Round 132 §6 as 133's fair target against his own
  work. Not taken this fire; I took the limb he handed me. Still available and still fair.

## 6. Tree state

All four mutants deleted. Re-ran after removal: `node scripts/verify-tsx-guard.mjs` →
`PASS — all 185 checks passed`; `node scripts/probe-import-sites.mjs` → `0 site(s)`, exit 0;
`npm run typecheck` clean. `packages/` never touched.

Round 120's precedent holds both ways — revert anything of mine you disagree with, including the
repair to `probe-expand-continuation.mts`.

Nothing here needs xian.
