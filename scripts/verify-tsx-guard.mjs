#!/usr/bin/env node
/**
 * verify-tsx-guard.mjs — the wrong-runner guard is sound, and it is wired in at every site.
 *
 * Round 121, Daedalus, 2026-08-30 (WORK fire).
 *
 * ── What this exists to stop ────────────────────────────────────────────────
 *
 * `lib/tsx-required.mjs` converts an `ERR_MODULE_NOT_FOUND` raised by running a TypeScript-importing
 * verifier under plain `node` into a message naming the runner, and exit 2. Two ways that can be
 * worthless, and prose cannot check either:
 *
 *   1. **It over-fires.** If the predicate is loose, a *genuine* missing module gets reported as
 *      "you used the wrong runner" and the real error is swallowed. That is strictly worse than
 *      the crash it replaced — a wrong diagnosis is more expensive than an unhelpful one. §(a).
 *
 *   2. **It is not called.** The helper can be perfect and imported by nobody, or imported and not
 *      wrapped around the import that actually throws. §(b) enumerates the sites from the source
 *      rather than from a hand-written list, so a *new* verifier that dynamically imports
 *      TypeScript and forgets the guard turns this red without anyone remembering to add it here.
 *
 * §(b) is the interesting one for the standing rules. Rule 8b's structural limb says the
 * copy-instead-of-share coupling "cannot be discharged by a check — nothing inside the file can
 * detect a future editor re-inlining one call site." True of the file, and this is the counterpart:
 * a check *outside* the files can enumerate them. Uncheckable from inside is not uncheckable.
 *
 *   3. **The enumeration misses the site.** §(b)'s membership test is a regex over source text, and
 *      §(b)'s own preconditions only catch it matching *nothing* or *everything* — not it missing
 *      *one*. Missing one is the whole failure mode §(b) exists to prevent, and a missed file is
 *      invisible: §(b) reports "every TypeScript-importing verifier is guarded" over a population
 *      that silently excludes the unguarded file, and §(c) never runs it because §(c) iterates the
 *      same list. Round 122 measured this rather than reasoned about it — an unguarded verifier
 *      written with a **double-quoted** specifier, and one whose **`await` is detached** from the
 *      `import()` call, both left this file at `PASS — all 20 checks passed` while crashing with
 *      exactly the raw `ERR_MODULE_NOT_FOUND` stack trace §3 of the Round 121 memo set out to kill.
 *
 *      §(b2) removes the *source-text* population question instead of widening the regex. It asserts
 *      the property directly on every verifier: run under plain `node`, none may emit an unhandled
 *      resolution stack trace. A computed specifier or a quoting style nobody has thought of yet is
 *      covered for free. Measured cost of the whole sweep: ~1.1s. §(b) is kept for its report line
 *      and for locating *which* site is unguarded.
 *
 *   4. **§(b2) inherited §(b)'s membership test.** Round 122 wrote that §(b2) has "no membership
 *      test, so nothing to escape." Round 123 measured it: §(b2) reused §(b)'s array, so it was
 *      scoped by `readdirSync(scripts/)` + `.endsWith('.mjs')` — blind to depth and to extension.
 *      An unguarded `verify-*.mts`, and an unguarded `verify-*.mjs` one directory down, each crashed
 *      raw under `node` at `PASS — all 36 checks passed`. The escape had moved from source-text
 *      shape to filename shape; it had not gone away.
 *
 *      What is available is not *no* membership test but a **bounded** one: the property is only
 *      assertable on files it is safe to run, so the population is a naming convention this repo
 *      controls, rather than the open set of ways a person may write `import()`. §(b) now walks
 *      `scripts/` recursively for `verify-*.{mjs,mts}`, and — this is the part that carries the
 *      claim — the predicate defining that population is itself asserted, on true cases and false
 *      cases, the same treatment §(a) gives `isTsResolutionFailure`. A membership test you cannot
 *      escape was not on offer. One whose rule is written down and tested was.
 *
 *   5. **Round 123 widened one limb's population and left two limbs on the old one.** §(b2)'s sweep
 *      became depth- and extension-agnostic; §(b)'s content test and §(c)'s end-to-end runs stayed
 *      gated by a regex anchored to exactly one `../`. Round 124 measured the gap that opened
 *      between them. A verifier at `scripts/checks/` that imports TypeScript, imports the guard,
 *      writes the guard call on a branch that never runs, and exits **0** from its catch — i.e.
 *      reports a pass having verified nothing under the wrong runner, the precise failure §(a)–§(c)
 *      exist to prevent — left this file at `PASS — all 45 checks passed`. The identical file at
 *      the top level died by §(c), twice. Depth was the only variable.
 *
 *      §(b2) did not save it: the swallowing catch means there is no stack trace to see. §(b2)
 *      covers the *unguarded* case at any depth (re-measured: the same file with no try/catch turns
 *      §(b2) red), and that coverage is what made the Round 123 repair look complete. The case only
 *      §(c) can see — a guard that is present in the source and inert at runtime — is the one whose
 *      population was left narrow. And the check count moved the reassuring way while this was true:
 *      44 → 45, because §(b2) swept one file more. Coverage read as growing while it shrank.
 *
 *      So the membership test below is depth-agnostic and quote-agnostic, named, and asserted on
 *      true and false cases — the treatment Round 123 gave `isVerifierPath`, applied to the other
 *      population in the same file. The residual is written down at §(b2) rather than half-closed.
 *
 *   6. **Widening is not a strategy, and agreement does not cover absence.** Round 124 closed item 5
 *      by widening `importsTsSource` and by adding a cross-limb agreement check. Round 125 pointed a
 *      mutant at both. `await import ('…')` — one space before the paren, valid JS — is a *literal*
 *      the widened predicate still does not read. Combined with a swallowing catch one directory
 *      down, it left this file at `PASS — all 63 checks passed`, count moved 62 → 63 again. Each half
 *      alone was caught (no-space ∧ swallow died at §(c) including the agreement check; space ∧ crash
 *      died at §(b2)), so the escape was the conjunction, as in Round 124.
 *
 *      The agreement check did not fire, and could not have: it is iterated inside `importsTs`, so it
 *      compares verdicts only for files §(b) already admitted. **Two limbs can only disagree about a
 *      file both of them see.** A file neither sees produces agreement vacuously — and here §(b) and
 *      §(c) *did* share their population by construction, which is what made them agree. Sharing a
 *      population makes limbs consistent; it does not make the population right.
 *
 *      So the repair is not a wider regex. `importsTsSource`'s **negative result was carrying two
 *      meanings** — "not a TypeScript importer" and "not recognised" — and only the first is a
 *      finding. The bucket is split: a second, deliberately over-broad reading runs off the same case
 *      table, containment (narrow ⊆ broad) is asserted per row, and the difference — recognised-as-
 *      mentioning-TypeScript but unparsed — is asserted **empty**. An unread shape now turns this file
 *      red asking for a classification instead of passing as a true negative.
 *
 *   7. **The bound belonged to one limb and was worn by three.** Round 126 pointed a mutant at
 *      Round 125's clause 3, as invited. Residual shape 2 reproduces — a specifier literal bound to
 *      a variable *before* the import token escapes both readings and, with a swallowing catch one
 *      directory down, left this file at `PASS — all 89`, count 88 → 89. Third time the denominator
 *      has risen while coverage fell. Controls one variable away: inline literal `FAIL 3/92` at §(c)
 *      including the agreement check, no-catch `FAIL 1/89` at §(b2).
 *
 *      But the larger finding was not in the mutants. §(b2)'s docblock bounds the population to the
 *      `verify-*` naming convention and states the reason: *"the property is only assertable on files
 *      it is safe to run."* That is a reason about **running**. §(b) reads source text and runs
 *      nothing, so it never had that constraint — it inherited the bound when Round 123 fused the two
 *      populations, and no round since has asked whether the justification transferred. It did not.
 *
 *      Measured, on the clean tree, no mutant involved: `measure-marker-floor.mjs`,
 *      `probe-recall-tool.mjs` and `serve-scratch.mjs` all dynamically import `../packages/**.ts`,
 *      none imported the guard, and all three were in **neither** population. Run under plain `node`,
 *      `measure-marker-floor.mjs` printed the raw `ERR_MODULE_NOT_FOUND` naming `queries.js` as
 *      missing — the exact stack trace §3 of the Round 121 memo set out to abolish, and the exact
 *      misattribution Round 120 §5 read as a missing build artifact. This file reported
 *      `PASS — all 88 checks passed` over it, and had done since Round 123.
 *
 *      So the two populations are separated: `readable` (every `.m[jt]s` under `scripts/`) carries
 *      §(b)'s guard assertion and the unclassified bucket; `swept` (the naming convention) still
 *      carries §(b2) and §(c), which execute their targets. Nesting is asserted, and so is the
 *      widening doing work — if `importsTsRead` ever stops admitting a file `swept` cannot reach,
 *      the read population has silently collapsed back and the three files go dark again.
 *
 *      The residual this creates, stated rather than discovered later: the unclassified bucket now
 *      over-fires across 37 files instead of 12. A **correct** verifier — no TypeScript import, no
 *      guard needed, clean exit 0 — that merely writes the word `import` within 40 characters of a
 *      quoted `.ts` specifier *in a comment* turns this file red, and the only way to clear it is to
 *      reword the comment. Measured (M14 `FAIL 1/89`, M0 control `PASS 89`). Not live today: zero of
 *      the broad reading's matches across `scripts/` currently fall inside a comment. But this file
 *      family's house style is to quote these specifiers in prose, so it is a latent over-fire whose
 *      blast radius Round 126 tripled, and item 1 of this header is the reason that matters.
 *
 *   8. **The bucket was a file-level predicate over a site-level property.** Round 127 pointed a
 *      mutant at Round 126's repair rather than at its residual. M15: two dynamic import sites in
 *      one file — site B in the space form §(b) cannot read, behind a swallowing catch; site A
 *      readable and correctly guarded. Every limb reported health. §(b2) saw no raw trace (the guard
 *      converted site A's throw), §(c) saw exit 2 with the right message, §(b) read the file as
 *      guarded, and the bucket did not contain it **because the bucket asked its question of the
 *      file**: site A made `importsTsSource` true, so the file was not a candidate, and site B was
 *      never declared. `PASS — all 110 checks passed`, count 105 → 110. Fourth consecutive round in
 *      which the denominator moved the reassuring way while coverage fell.
 *
 *      The control isolates it: M16 is M15 with site A deleted and site B untouched — same specifier,
 *      same catch, same depth — and it died in the bucket at `FAIL — 1 of 106`. The masking was the
 *      mechanism, not the shape of site B. Note what this is: Round 125 split the negative bucket
 *      precisely because *"the negative result was carrying two meanings"*, and then aggregated the
 *      split back over the file with an `||`. One readable site anywhere in a file re-fused the two
 *      meanings the split had just separated.
 *
 *      So the anchor — a quoted `packages/**.ts` specifier literal — is enumerated, each occurrence
 *      is classified narrow / broad-only / neither, and the file-level predicates are *derived* from
 *      the site-level ones instead of being computed alongside them. M15 under the repaired file:
 *      `FAIL — 1 of 114`, naming `checks/verify-r127-mask.mjs:11`, the line of site B. The bucket
 *      reports `file:line` now, because a red naming only the file leaves the reader to re-derive
 *      which specifier is the unreadable one, and item 1 is about what an expensive red costs.
 *
 *      **Containment was never a property of the predicates.** Round 125 asserted `narrow ⊆ broad`
 *      per row and Round 126 added it per live file, and it held in both places — but it is false for
 *      a constructible input: `import(` followed by more than 40 characters of whitespace and then
 *      the specifier is narrow-true and broad-false (measured directly on the Round 126 predicate
 *      pair). Eleven rows and eight live files held it; the predicates never did. Writing the narrow
 *      reading in as a disjunct of the broad one makes containment hold **by construction**, and
 *      changes what the containment rows assert: no longer drift between two independent regexes, but
 *      an edit that removes the disjunct. Under the old pair such a file would have turned the
 *      instrument red on the CONTAINMENT check — a correct, guarded verifier producing a red it
 *      cannot clear without rewriting its whitespace. Item 1 again, and it is now unreachable.
 *
 *      **Residual, stated rather than half-closed.** Theseus's Round 126 §4 named the prose over-fire
 *      as the strongest target and this round did **not** fix it. What this round adds is that it is
 *      not latent, as Round 126 recorded it — it is live, at line 113 of this file, in the sentence
 *      Round 126 wrote to describe its own repair. It reads as absent because the one file in this
 *      repo whose house style quotes these specifiers in prose is the file excluded from the
 *      population, and because the file-level bucket would have masked it even so (this file has
 *      narrow sites). "Zero broad matches fall inside a comment, measured" was true of the population
 *      and false of the repo. The over-fire's mechanism is also now demonstrated rather than
 *      asserted: the 40-character window reaches backwards *across a line break*, which is how it
 *      caught the unrelated third row of this file's own `THREE_CLASSES` fixture on the first run.
 *
 *   9. **Three limbs shared one definition, so their agreement measured the definition.** Round 128
 *      pointed a mutant at `anchorsOf`, the outermost membership test, as invited. It found
 *      something one level out from the instrument: `.ts` was hardcoded *three separate times*, in
 *      the three limbs that are supposed to be independent measurements — the anchor regex here
 *      (`\.ts['"`]`), §(b2)'s crash detector (`ERR_MODULE_NOT_FOUND` alone), and the guard's own
 *      `isTsResolutionFailure` (`.js` → `.ts` sibling). Each was written from the same single
 *      example, `packages/server/src/db/queries.ts`, and each encoded "TypeScript" as "a `.ts` file
 *      that fails to resolve". `packages/client` is **38 `.tsx` files** and was outside all three.
 *
 *      **M17** — a verifier importing `'../packages/client/src/App.tsx'`, no guard, no catch, at the
 *      top level of `scripts/` where both populations reach — is the crudest possible instance of
 *      the defect §(a)-§(c) exist to catch. It printed a raw `ERR_UNKNOWN_FILE_EXTENSION` stack
 *      trace under plain `node` at **`PASS — all 110`**, count 109 → 110. Note what is *absent*: no
 *      swallowing catch, no unreadable quoting, no depth. Rounds 124-127 each needed a conjunction
 *      to survive. **This is a single defect**, and it survived every limb.
 *
 *      Controls, one variable away. **M18a** is M17 with one character deleted — `.tsx` → `.ts`,
 *      same file, same absent guard: **`FAIL — 4 of 114`**, three limbs firing. **M18b**, an
 *      unguarded `.ts` importer against a target that exists on this seat, so the control cannot be
 *      dismissed as a missing file: **`FAIL — 3 of 114`**. The extension was the only variable.
 *
 *      **M19 is the one that matters most**, because it is not an instrument bug. The `.tsx`
 *      importer *with the guard present and wired in canonical form* — the shape §(b) reads as
 *      correct and §(c) would certify — still crashed raw, because `node` type-strips `.ts` but does
 *      not strip JSX, so the failure arrives as `ERR_UNKNOWN_FILE_EXTENSION` and
 *      `explainTsxRequirement` re-threw it. `PASS — all 110` over a verifier the guard could not
 *      guard. §(a) row 3 asserts that code is *not* claimed — correct for its own shape, and the
 *      reason the gap was invisible: the limb that would have noticed was the limb asserting it.
 *
 *      The structural finding, which is Round 125's one level further out. Round 125 established
 *      that agreement cannot see absence — two limbs agree *vacuously* about a file neither sees.
 *      Here all three limbs **saw** the file and agreed anyway, because what they shared was not a
 *      population but a **definition**. Round 124 added the cross-limb agreement check on the
 *      premise that §(b) and §(c) are two independent measurements of one property; independence is
 *      only protective if the limbs can disagree, and limbs that share a hardcoded concept cannot.
 *      **Agreement between limbs that share an assumption measures the assumption, not the file.**
 *
 *      So the repair is rule 8b route (i) applied to a *definition* rather than to a call site:
 *      `TS_EXTENSIONS` is exported from `lib/tsx-required.mjs` and the anchor, the guard's sibling
 *      test and the extension predicate all derive from it. `isTsExtensionFailure` covers the second
 *      wrong-runner shape with its own soundness conjuncts (the extension is TypeScript's *and* the
 *      file is on disk, so an unloadable `.css` is still re-thrown), and `explainTsxRequirement`
 *      gives it a *different* body — the resolution case's "its own `.js` specifiers, building will
 *      not help" is a precise diagnosis there and a false one here, and item 1 is about exactly that.
 *      §(b2)'s detector takes both codes, which is the repair that matters most: §(b2) is the limb
 *      that does not read source, so it should have caught this whatever the anchor could parse.
 *
 *      Measured after: M17 **`FAIL — 4 of 140`**, the same profile as its `.ts` control, so the two
 *      are no longer distinguishable to this file. M19 becomes a *correct* file, read by §(b), run
 *      by §(b2), certified exit-2 by §(c). M20 — the Round 125-127 conjunction rebuilt on `.tsx`,
 *      unreadable site behind a swallowing catch — lands in the bucket at `verify-r128-mask.mjs:8`;
 *      before this round it was not an anchor at all, so there was nothing to declare.
 *
 *      **The count went 109 → 135, and that is the fifth consecutive round it has risen.** It rose
 *      here while coverage rose, which is the opposite of items 5-8 — but the count did not
 *      establish that and cannot. The mutants did. The tell is worth exactly as much as before.
 *
 *      Residual, stated rather than found later: the prose over-fire of item 7 is **still
 *      unrepaired**, reason unchanged, and this round widened its surface — the anchor now matches
 *      four extensions instead of one, and this file's own anchor count went 15 → 19. Measured on
 *      the clean tree, the bucket is still empty, so it is not live outside this file. Two of the
 *      three limbs' definitions are now shared; the third, `importsGuardSource`, still spells its
 *      own path convention (`(?:\.\.?\/)+lib\/tsx-required\.mjs`) and no round has mutated it.
 *
 *  10. **For three of the seven, the source limb is not one limb of three — it is the only one.**
 *      Round 129 pointed a mutant at `importsGuardSource`, the last definition still spelling its
 *      own convention, as Round 128 invited. The predicate was two loose file-level conjuncts: a
 *      regex for the guard's *path shape* and `src.includes()` of one exact *call string*. Four
 *      measurements, and the population is what makes them matter — of the seven TypeScript
 *      importers, three (`measure-marker-floor.mjs`, `probe-recall-tool.mjs`, `serve-scratch.mjs`)
 *      are in the read population Round 126 added and outside §(b2) and §(c), which execute. For
 *      those three, this predicate is the entire claim. No other limb reaches them.
 *
 *      **M21 reads prose as code.** A module in that population that imports the guard for one of
 *      its *other* exports and mentions the call in a comment — `// callers wrap it:
 *      explainTsxRequirement(err, import.meta.url)` — was reported **`guarded`** while printing the
 *      raw `ERR_MODULE_NOT_FOUND` naming `index.js` as missing: the exact stack trace Round 121
 *      exists to abolish, on the exact misattribution Round 120 §5 read as a missing build artifact,
 *      in the population Round 126 widened *because* `measure-marker-floor.mjs` was doing this.
 *      `PASS — all 136`, count 135 → 136. **Single defect, no conjunction** — no swallowing catch, no
 *      unreadable specifier, no extension trick. The control is one variable away and it is the
 *      *filename*: the identical file renamed `verify-r129-prose.mjs` dies `FAIL — 4 of 140`, and
 *      the agreement check names the mechanism, `{source: "guarded", behaviour: "unguarded"}`. §(b)
 *      is fooled in both files; only the run limb saved the second one.
 *
 *      **M23a and M23b over-fire on a correct file, twice.** `from "…"` (double-quoted guard
 *      specifier) and `catch (e)` (any binding not spelled `err`) each read UNGUARDED on a verifier
 *      that exits 2 with the right message — `FAIL — 3 of 145`, with §(c) certifying `guarded` in
 *      the same run. Round 124 repaired this predicate's *depth* over-fire and left two more of
 *      exactly its kind inside it. Item 1, and a red a correct file cannot clear.
 *
 *      So the repair is rule 8b route (i) again, and this time against a *convention* rather than a
 *      concept: **resolve rather than spell.** The specifier is resolved against the importing
 *      file's own directory and compared with the guard's real path, so quoting, depth and any
 *      `./a/../b` spelling are right by construction instead of by alternation. And **read code
 *      rather than text**: one scanner blanks comment bodies for the import conjunct and comment
 *      *and* string bodies for the call conjunct, so neither a sentence nor a log line satisfies it.
 *      Measured: M21 `FAIL 1/149`, named; M23a and M23b both green at `PASS — all 158`.
 *
 *      **M22 is not repaired, and cannot be by this limb.** The guard imported, wrapped around the
 *      import, and called behind an `if` that never runs — Round 124's shape — escapes at
 *      `PASS — all 149`. Reachability is not a property of source text. Renamed `verify-*` it dies
 *      `FAIL — 3 of 140` at §(c); the variable is again the filename, i.e. whether any limb runs it.
 *      What Round 129 does instead is stop the instrument overclaiming: the check said the source
 *      reading established the import was **"wrapped"**, which is the one thing source text cannot
 *      establish, and the report printed the same word `guarded` for a run-certified verdict and an
 *      unverified one. The three now print **`source-only`**, the wording says "imports the guard
 *      and calls it", and a DISCLOSURE check asserts on the report line itself that nothing outside
 *      §(c)'s reach is labelled `guarded`. An unrepairable escape stated in the output is a
 *      different object from one absorbed by a word — which is this whole thread's subject.
 *
 *      **The count went 135 → 148: sixth consecutive round.** It rose while coverage rose *and*
 *      while a measured escape stayed open, which is the combination that should settle it. The
 *      denominator carries no information about coverage; the mutants do.
 *
 *      Residual, stated: item 7's prose over-fire is **still unrepaired** — but its reason has now
 *      changed, and that is a finding rather than a repetition. Three rounds declined it because
 *      the fix needed a comment-aware reader nobody had written. `stripSource` is that reader, and
 *      it was written this round for the sibling limb. See §6 of the Round 129 memo for the route
 *      and for the three of Round 125-128's fixtures whose meaning it would change.
 *      **Closed in item 11, and the route as written was not sufficient.**
 *
 *  11. **The one-line route was not the class, and the file was hiding its own over-fire.**
 *      Round 130 took item 1 — the prose over-fire, named as the strongest target in Round 126,
 *      declined in 126, 127 and 128, handed over in 129 §6 as `anchorsOf` over `stripSource(src,
 *      false)`. Two findings, neither of them the handover.
 *
 *      **First: it was live, and on correct files, in two shapes rather than one.** Measured on
 *      read-only modules that import no TypeScript whatever. A quoted specifier inside a line
 *      comment, after the word `import(`, reads **narrow** — so the file joins the read population
 *      and §(b)'s central claim names it, `FAIL 1/149`, report line `UNGUARDED`. The same specifier
 *      near but not in an import position reads **broad-only** and lands in the unclassified
 *      bucket, `FAIL 1/148`. Both are reds a correct file cannot clear by being more correct, on a
 *      population §(c) cannot reach to contradict — item 10's read-only three, in the over-fire
 *      direction. Item 1 has been the header's first named failure mode since Round 121 and this is
 *      the first round it was demonstrated rather than described.
 *
 *      **Second: comment-blanking alone does not close it.** On this file's own source the
 *      comment-only reading moves the narrow count 9 → **10** — up, not down: it correctly promotes
 *      the R125 comment-in-parens site while leaving **17 string-borne anchors** standing, because
 *      the anchor's target *is* a string and so the call conjunct's string-blanking is unavailable
 *      to it. Fixture tables and worked examples are the house style here, and they are the bulk of
 *      the class. So conjunct 2: a site is real code iff its own opening quote survives the
 *      strings-blanked reading — a nested specifier's quote is body and is blanked, a genuine one's
 *      is a delimiter and is kept. Exact, one array index. Together: **9 → 0**, which is the true
 *      answer, and the answer the header has asserted in prose since Round 121 while the predicate
 *      disagreed.
 *
 *      **Why it never showed: the file is excluded from its own population.** `SELF` is out of
 *      `readable` for an unrelated reason, and that exclusion was masking the over-fire rather than
 *      avoiding it — the one file guaranteed to exercise both prose conjuncts was the one file
 *      never asked. It is asked now, by the same predicate the population uses, and that is the
 *      round's second live control. Round 129 §3's shape, a fourth time: widening the demonstrated
 *      spelling is not closing the class, and here the sibling spelling was the larger carrier.
 *
 *      **The cost, which is real and is not a sentence.** At the call conjunct a desynchronised
 *      scan fails toward UNGUARDED — loud. **At the anchor the direction inverts**: a real site
 *      misread as string-interior leaves the population silently, which is Round 124's failure
 *      mode. Two live controls bound it — offset preservation asserted on every module read, and
 *      SELF — plus a mutant, M26: an unguarded importer preceded by a string containing `//`, a
 *      comment containing an apostrophe, and a nested-specifier fixture row, all at once.
 *      `FAIL — 4 of 170`, the nested row correctly uncounted and the real site correctly caught.
 *      M25, a plain unguarded importer, also `FAIL — 4 of 170`: the anchor was narrowed twice and
 *      still does its job.
 *
 *      **The count went 148 → 165: seventh consecutive round.** Daedalus proposed in 129 §7 that a
 *      number moving the same direction whether coverage rises, falls, or both is not measuring
 *      coverage. This round is the cleanest instance yet — it rose while a five-round-old over-fire
 *      was closed, *and* while the round discovered the instrument had been miscounting its own
 *      source the entire time. Agreed, and taken as settled: the denominator is not evidence.
 *      **The stated price was already being charged — see item 12.**
 *
 *  12. **The residual named in item 11 was not a risk, it was three files and this one.** Round 131
 *      (Daedalus) took the price paragraph above at its word and measured it: `stripSource` tracked
 *      quotes but not regex literals, so an unbalanced quote inside a regex (`/\bhere(?:'s)\b/i`,
 *      `"([^"]*)"`) desynchronised the scan for the rest of the file. Not hypothetical —
 *      `verify-recogniser-equivalence.mjs` read 221 of 322 lines as string interior, from line 80.
 *      His M27, a read-only module with a genuine unguarded import under a `p.replace(/\//g, '-')`,
 *      sat at `PASS — all 168` while doing exactly what §(b) exists to catch.
 *
 *      Round 132 repairs it: a conservative regex-literal heuristic in the scanner, prev-token test
 *      plus a scan-ahead bounded to the line, with the stepped-over span blanked in both readings.
 *      Written up in `docs/research/round132-*`. Four measurements.
 *
 *      **The three files were four, and the fourth was this one.** Measured character-exact, by
 *      running both scanners over the same text: at `818f391` this file was itself misread from
 *      line 993 — its own `SPECIFIERS` regex, `/\bfrom\s*(['"])([^'"\n]*)\1/g` — for 14 lines,
 *      including the whole body of `importsGuardSource`. Round 131 §2 stated the opposite, on a
 *      coarser tell. So the SELF control added in item 11 was reading a desynchronised scan of the
 *      region it was asserting over. The verdict it reported was right; the reason was not, and
 *      "right for the wrong reason" is the state item 11 found the header itself in.
 *
 *      **The repair moves no verdict on the live tree, and that is the point.** Anchor tallies are
 *      identical before and after on all 38 modules under `scripts/` — 0 moved — and no character
 *      anywhere in the population is *newly* read as string interior. What changed is what the
 *      scanner can see at all: 27, 47, 168 and 14 lines of real code returned to the code reading in
 *      the four files. A repair that fixes nothing visible today and everything invisible tomorrow
 *      is the honest shape of this defect, and the mutants are the only way to show it.
 *
 *      **M28** — a read-only module, unguarded import under a `/"([^"]*)"/g`: `PASS — all 168` at
 *      `818f391`, never named; `FAIL — 1 of 186` here, report line `UNGUARDED`. **M29** is pointed
 *      at the heuristic rather than at what it replaced, per Round 131 §4: an unguarded site sharing
 *      its line with `o.in / n`, so a scanner that misfires on that division steps over the
 *      specifier's opening quote and loses the site. It dies at `818f391` (`FAIL 1/169`) and here
 *      (`FAIL 1/186`) — it is not a regression mutant — and it goes **silent at §(b)** the moment
 *      the dotted-keyword guard is removed. What catches it then is the round's third control.
 *
 *      **Round 131 §4's declined signal is shippable, because the repair is what made it green.**
 *      Daedalus found that per-quote odd parity in the strings-blanked reading flags exactly the
 *      desynchronised files, and declined to ship it: it went red on three correct files, and a red
 *      a correct file cannot clear is item 1. Those are the three files repaired above. Measured: 3
 *      of 37 modules red under the old scanner, **0 of 37** under this one. It is shipped as a
 *      precondition, and on M29-with-the-guard-removed it is what turns a silent miss back into a
 *      named red. Necessary and not sufficient — an even-parity misread still escapes it.
 *
 *      **Residual, stated and now also tabled.** A regex literal that does not close on its own line
 *      is not recognised and the `/` falls through to division; valid JS cannot write one, so the
 *      row asserts the fall-through is safe rather than that the shape is absent. And the heuristic
 *      is a heuristic: its misfire direction is bounded to one line in *extent* but not in
 *      *consequence*, since stepping over an odd number of quote characters flips the scan's string
 *      state from there on. That is the case the parity precondition exists to catch, and M29 is the
 *      measurement that it does.
 *
 * §(c) is the end-to-end assertion: both directions of both runners, run rather than argued.
 *
 * ── Costs nothing ──────────────────────────────────────────────────────────
 *
 * No API calls, no model calls, no corpus. Runs on every seat. The §(c) `tsx` runs write only to
 * gitignored `.testdata/` scratch paths their own targets already manage.
 *
 * Run: `node scripts/verify-tsx-guard.mjs`   (this file imports no TypeScript, by design)
 *
 * Exit: 0 all checks pass · 1 a check failed · 2 an input file is not on this seat
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isTsResolutionFailure, isTsExtensionFailure, TS_EXTENSIONS } from './lib/tsx-required.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = path.join(REPO, 'scripts');

const checks = [];
const ok = (label, detail, cond) => {
  checks.push({ label, pass: cond });
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}${detail === undefined ? '' : `   — ${JSON.stringify(detail)}`}`);
};

// A shape the loader really produces. Built from a path that EXISTS as `.ts` on this seat, so the
// fixture cannot silently become vacuous if the tree is reorganised.
const REAL_TS = path.join(REPO, 'packages/server/src/db/queries.ts');
if (!fs.existsSync(REAL_TS)) {
  console.error(`INCOMPLETE — ${path.relative(REPO, REAL_TS)} is not on this seat; §(a) has no fixture.`);
  process.exit(2);
}
const err = (url, code = 'ERR_MODULE_NOT_FOUND') => Object.assign(new Error('x'), { code, url });
const asJs = (p) => pathToFileURL(p.replace(/\.ts$/, '.js')).href;

// Round 128. The second wrong-runner shape needs a second fixture, and the same treatment: built
// from a path that EXISTS as `.tsx` on this seat, so it cannot go vacuous if the tree is
// reorganised. `packages/client` is 38 `.tsx` files and no other instrument in this repo had ever
// pointed at one.
const REAL_TSX = path.join(REPO, 'packages/client/src/App.tsx');
if (!fs.existsSync(REAL_TSX)) {
  console.error(`INCOMPLETE — ${path.relative(REPO, REAL_TSX)} is not on this seat; §(a) has no .tsx fixture.`);
  process.exit(2);
}
// Node attaches no structured path to this one — own properties are exactly `stack`, `message`,
// `code` — so the message is the only carrier and the predicate has to parse it. §(b2) asserts
// this reconstruction against an error the *running* node actually threw.
const extErr = (file, ext = path.extname(file), code = 'ERR_UNKNOWN_FILE_EXTENSION') =>
  Object.assign(new Error(`Unknown file extension "${ext}" for ${file}`), { code });

// ---------------------------------------------------------------------------------------------
// §(a) The predicate fires on the wrong-runner shape and on nothing else
// ---------------------------------------------------------------------------------------------

console.log('\n=== (a) isTsResolutionFailure — fires on the wrong runner, not on a real absence ===\n');

ok('the real shape is recognised: a packages/ .js whose .ts sibling exists',
  path.relative(REPO, REAL_TS),
  isTsResolutionFailure(err(asJs(REAL_TS))) === true);

// The soundness conjunct. Without it, `node` on a verifier whose dependency was genuinely deleted
// would print "re-run under tsx", the user would, and tsx would fail for the real reason — one
// wasted round trip and a diagnosis pointing away from the cause.
ok('a genuine absence is NOT claimed as a runner problem (no .ts sibling)',
  undefined,
  isTsResolutionFailure(err(asJs(path.join(REPO, 'packages/server/src/db/no-such-module.ts')))) === false);

ok('a different error code is not claimed', undefined,
  isTsResolutionFailure(err(asJs(REAL_TS), 'ERR_UNKNOWN_FILE_EXTENSION')) === false);

ok('a .js outside packages/ is not claimed', undefined,
  isTsResolutionFailure(err(pathToFileURL(path.join(SCRIPTS, 'lib/recall-call-kind.js')).href)) === false);

ok('a non-file: url is not claimed', undefined,
  isTsResolutionFailure(err('node:sqlite')) === false);

ok('a null/undefined error is not claimed', undefined,
  isTsResolutionFailure(undefined) === false && isTsResolutionFailure(null) === false);

// Preconditions: a predicate that answered a constant would pass some of the above trivially.
ok('PRECONDITION — at least one case is true and at least one is false',
  undefined,
  isTsResolutionFailure(err(asJs(REAL_TS))) === true
    && isTsResolutionFailure(err(asJs(REAL_TS), 'EOTHER')) === false);

// Round 128, Theseus. The guard covered one of the two ways its own subject occurs. `node`
// type-strips `.ts`, so a `.ts` import survives to fail on the `.js` specifiers inside it —
// `ERR_MODULE_NOT_FOUND`, the shape above. It does not strip JSX, so a `.tsx` import dies earlier
// at format detection with `ERR_UNKNOWN_FILE_EXTENSION`, which the predicate above rejects (row 3,
// "a different error code is not claimed" — correctly, for its own shape). Measured: M19, a `.tsx`
// importer with the guard present and wired in canonical form, crashed with a raw stack trace,
// because `explainTsxRequirement` re-threw. The same treatment, on the second shape.

ok('the .tsx shape is recognised: a TypeScript extension node cannot load',
  path.relative(REPO, REAL_TSX),
  isTsExtensionFailure(extErr(REAL_TSX)) === true);

// The soundness conjunct, and it is the important one. An unloadable `.css`, `.vue` or `.wasm`
// import raises the identical code, and telling that author to re-run under `tsx` would be a
// confident wrong diagnosis — header item 1, in the helper written to remove one.
ok('a non-TypeScript unloadable extension is NOT claimed as a runner problem', undefined,
  isTsExtensionFailure(extErr(path.join(REPO, 'packages/client/src/index.css'))) === false);

// Distinguishes "the loader is wrong" from "the file is not there". The guard's whole message is
// that nothing is missing, so it must not say that about a path it has not confirmed exists.
ok('a TypeScript extension that is not on disk is not claimed', undefined,
  isTsExtensionFailure(extErr(path.join(REPO, 'packages/client/src/NoSuchComponent.tsx'))) === false);

ok('a different error code is not claimed (.tsx shape)', undefined,
  isTsExtensionFailure(extErr(REAL_TSX, '.tsx', 'ERR_MODULE_NOT_FOUND')) === false);

// Fails closed: the path is parsed out of prose, so a message this predicate cannot read must
// re-throw the original error rather than guess. §(b2) checks the live message still parses.
ok('an unparseable message is not claimed', undefined,
  isTsExtensionFailure(Object.assign(new Error('something else entirely'),
    { code: 'ERR_UNKNOWN_FILE_EXTENSION' })) === false);

ok('a null/undefined error is not claimed (.tsx shape)', undefined,
  isTsExtensionFailure(undefined) === false && isTsExtensionFailure(null) === false);

ok('PRECONDITION — the .tsx predicate has at least one true case and one false case', undefined,
  isTsExtensionFailure(extErr(REAL_TSX)) === true
    && isTsExtensionFailure(extErr(REAL_TSX, '.tsx', 'EOTHER')) === false);

// The two predicates partition rather than overlap: each must reject the other's shape, or
// `explainTsxRequirement` could print the resolution body for an extension failure — the wrong
// cause, stated confidently, which is the defect this file exists to prevent.
ok('PRECONDITION — the two wrong-runner predicates do not both claim either shape', undefined,
  isTsResolutionFailure(extErr(REAL_TSX)) === false
    && isTsExtensionFailure(err(asJs(REAL_TS))) === false);

// ---------------------------------------------------------------------------------------------
// §(b) Every verifier that dynamically imports TypeScript is wrapped — enumerated, not listed
// ---------------------------------------------------------------------------------------------

console.log('\n=== (b) Every scripts/verify-*.mjs importing TypeScript routes its failure here ===\n');

// Round 123, Daedalus. §(b2) was written as "population-free", but it reused the array below, so
// it inherited this membership test verbatim — one on *filenames* rather than on source text.
// Measured, not reasoned: an unguarded `scripts/verify-r123-escape.mts` and an unguarded
// `scripts/checks/verify-r123-nested.mjs` each crashed raw under `node` while this file printed
// `13 verifiers, 4 of them import TypeScript` and `PASS — all 36 checks passed`. A flat
// `readdirSync` + `.endsWith('.mjs')` is blind to depth and to extension, and neither variation is
// exotic: `scripts/lib/` already establishes subdirectories here and `probe-expand-continuation.mts`
// already establishes the extension.
//
// So the population is walked, and the predicate that defines it is itself asserted below — a
// membership test that cannot be escaped is not available here, but one whose *rule* is stated and
// tested is, and that is the difference this repair is making.
const isVerifierPath = (rel) => /(?:^|\/)verify-[^/]*\.m[jt]s$/.test(rel);

// Round 126, Theseus. The `verify-` convention bounds the population this file may *execute*.
// §(b2)'s docblock states the reason: "the property is only assertable on files it is safe to run,
// and this repo's `scripts/` also holds servers and live probes that a blind sweep must not run."
// That reason is real, and it is a reason about *running*. §(b) does not run anything — it reads
// source text — so it never had that constraint, and inherited the bound anyway when Round 123
// fused the two populations. Measured cost of the inheritance: three tracked files.
const isModuleSource = (rel) => /\.m[jt]s$/.test(rel);

const walk = (dir, base = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const rel = base ? `${base}/${e.name}` : e.name;
  return e.isDirectory() ? walk(path.join(dir, e.name), rel) : [rel];
});

const allUnderScripts = walk(SCRIPTS).sort();
const verifiers = allUnderScripts.filter(isVerifierPath);

// The predicate gets §(a)'s treatment — true cases and false cases, and a precondition that both
// kinds are present, so a predicate that has degenerated to always-true or always-false is caught
// here rather than by the silence downstream. The two Round 123 escapes are the first two trues.
for (const [rel, want] of [
  ['verify-r123-escape.mts', true],
  ['checks/verify-r123-nested.mjs', true],
  ['verify-tsx-guard.mjs', true],
  ['lib/tsx-required.mjs', false],
  ['probe-expand-continuation.mts', false],
  ['verify-notes.md', false],
  ['unverify-x.mjs', false],
]) {
  ok(`PREDICATE — ${rel} is ${want ? '' : 'not '}a verifier path`, undefined, isVerifierPath(rel) === want);
}
ok('PRECONDITION — the walk reaches below the top level and the predicate rejects some of what it finds',
  { seen: allUnderScripts.length, verifiers: verifiers.length },
  allUnderScripts.some((r) => r.includes('/')) && verifiers.length > 0 && verifiers.length < allUnderScripts.length);

// Round 124: hoisted from §(b2), because §(b) needs it too and two exclusions would be two holes.
// This file must be out of both the source scan and the run sweep, and for the same reason in each:
// §(b)'s predicate cases below quote real specifiers, so an unexcluded self-scan would classify this
// file as a TypeScript importer and §(c) would then run it under `node` expecting exit 2 — a
// verifier recursing into itself and failing on the way. One exclusion, asserted once, used twice.
//
// Round 127, Daedalus, applying Round 126's own amendment to the line directly above the code
// Round 126 wrote. That paragraph is a *run*-limb reason — the clause that carries it is "§(c) would
// then run it". §(b) reads and runs nothing, so under the amendment it is not entitled to the bound
// and must state its own. It has one, and it is a different one: this is the only module under
// `scripts/` that quotes `packages/**.ts` specifiers **as data** — as §(b)'s own predicate fixtures,
// and as prose about those fixtures. Measured on this file at the time of writing: 15 anchors, 6
// read as imports, 7 in an import position the narrow reading cannot parse, 2 in no import position
// at all — and *not one of them is an import this file performs*. Including it would put seven
// entries in the bucket, every one of them a fixture or a sentence.
//
// So the bound survives, which is worth saying plainly: re-derivation is not a synonym for widening,
// and Rounds 123-126 widened every time. What changes is what generalises. The run-side reason
// generalises by "is this safe to execute", a property of any file. The read-side reason generalises
// by "does this file carry the instrument's own fixtures" — which is a property of *this* file and
// would not transfer to a second instrument written next to it under a different name. Two reasons
// that license one exclusion today and would license different ones tomorrow.
const SELF = path.relative(SCRIPTS, fileURLToPath(import.meta.url)).split(path.sep).join('/');
const swept = verifiers.filter((f) => f !== SELF);
// Self-exclusion is a hole in both populations, so assert its size. A rename that stopped matching
// would silently re-include this file; a second exclusion creeping in would go unnoticed.
ok('PRECONDITION — exactly one verifier is excluded, and it is this file',
  { excluded: verifiers.filter((f) => f === SELF) }, verifiers.length - swept.length === 1);

// Round 126, Theseus. The READ population — every module under `scripts/`, not just the ones named
// `verify-*`. §(b)'s guard assertion and the unclassified bucket run over this; §(b2) and §(c) keep
// running over `swept`, because those limbs execute their targets and this one does not.
const readable = allUnderScripts.filter(isModuleSource).filter((f) => f !== SELF);
// The read limb's exclusion gets the same bounding assertion the run limb's has had since Round 124.
// It did not have one: `swept`'s size was asserted, `readable`'s was not, so a second exclusion
// creeping into the read population — or a rename that stopped matching — was unasserted on exactly
// the limb Round 126 widened. Same hole, other limb, which is this round's subject twice over.
ok('PRECONDITION — exactly one module is excluded from the read population, and it is this file',
  { excluded: allUnderScripts.filter(isModuleSource).filter((f) => !readable.includes(f)) },
  allUnderScripts.filter(isModuleSource).length - readable.length === 1);

for (const [rel, want] of [
  ['measure-marker-floor.mjs', true],
  ['probe-recall-tool.mjs', true],
  ['serve-scratch.mjs', true],
  ['lib/tsx-required.mjs', true],
  ['checks/verify-r123-nested.mjs', true],
  ['probe-expand-continuation.mts', true],
  ['verify-notes.md', false],
  ['lib/recall-call-kind.js', false],
]) {
  ok(`PREDICATE — ${rel} is ${want ? '' : 'not '}module source`, undefined, isModuleSource(rel) === want);
}

// The two populations are nested, not parallel. If this ever inverts, a file would be run by §(b2)
// without §(b) having read it — the Round 124 gap with the limbs swapped.
ok('PRECONDITION — the run population is a strict subset of the read population',
  { run: swept.length, read: readable.length },
  swept.every((f) => readable.includes(f)) && swept.length < readable.length);

// Round 124, Theseus. This was the *other* population in this file, and Round 123 did not widen it.
// It read `'\.\./packages/` — anchored to exactly one `../`, single quotes only, `await` required —
// so a verifier one directory down was outside it however it was written. That is invisible rather
// than merely incomplete: a file outside `importsTs` is reported as "does not import TypeScript",
// which is indistinguishable from the true negative, and §(c) never runs it. Measured, not reasoned
// — see item 5 of the header for the mutant that survived at `PASS — all 45 checks passed`.
//
// Depth- and quote-agnostic, and it does not require `await` adjacent to the call (the Round 122
// detached-await escape). It still requires a *literal* specifier: a computed one is out of reach
// here by construction, which is the residual recorded at §(b2), not a hole this predicate hides.
// Round 127, Daedalus. Every reading in this section is a question about a *site* — "is this
// specifier in an import position, and can §(b) parse it?" — and both readings were written as
// predicates over a whole file. Measured cost below at item 8: one readable site clears every
// unreadable site in the same file. So the anchor — a quoted `packages/**.ts` specifier literal —
// is enumerated, each occurrence is classified, and the file-level verdicts are *derived* from the
// site-level ones rather than computed separately. One definition, two granularities.
// Round 128, Theseus. The anchor is the outermost membership test — both readings and the bucket
// derive from it — and its extension was written `\.ts`, from the one example this thread has used
// since Round 121. `.tsx` is not an anchor at all, so a `.tsx` importer is not narrow, not broad,
// and *not in the bucket either*: Round 125's split separated two meanings inside the anchor set,
// and everything outside that set still carries the single silent meaning the split was built to
// remove. The bucket inherited the anchor's blind spot, which is item 8's finding one level out.
//
// The extension set comes from `lib/tsx-required.mjs` rather than being spelled here, because this
// is the third place the same concept was hardcoded and the drift between the three is the whole
// of item 9. Sorted longest-first there, so the alternation cannot match the `ts` of `.tsx` and
// then fail on the trailing `x` — asserted below on every member, which is what catches a re-sort.
// Comment bodies (and optionally string bodies) blanked, offsets and line breaks preserved.
//
// Round 129 wrote this for `importsGuardSource`'s two conjuncts: strings *kept* for the import
// conjunct — the specifier is one — and blanked for the call conjunct, which contains no string.
// Round 130 moves it above the anchor, because the anchor needs it too and needed it first: it is
// the outermost membership test, so every reading in this file inherits whatever it gets wrong.
// One scanner, three readings, so no two of them can disagree about where a comment ends.
//
// Round 130 stated this residual and Round 131 measured it: this tracked `'`, `"` and `` ` `` but
// not regex literals, so an unbalanced quote inside one (`/it's/`, `"([^"]*)"`) desynchronised the
// scan for the rest of the file. On the clean tree that was **three of the 37 modules in
// `readable`** — not hypothetical, and not caught by either live control, because both readings
// stay length-preserving while wrong. Item 12. Repaired below; the two failure directions it had
// are kept in the prose because they are what the repair is measured against.
//
// A `/` is regex-open or division depending on the token before it, and this file has no parser, so
// the decision is a heuristic and the honest question is what its two error directions cost.
//
//   * **Declining to fire** on a real regex leaves the scan exactly as it was before this round —
//     an unrepaired instance of the old defect, never a new one.
//   * **Misfiring** on a division steps over a span of real code. The span is bounded to one line
//     (a regex literal cannot contain a newline, so an unterminated scan-ahead returns −1 and the
//     `/` falls through to division) — but **the consequence is not bounded to that line.** If the
//     stepped-over span holds an *odd* number of quote characters, the scan's string state is
//     flipped from that point on, which is the same unbounded desync this repair exists to remove.
//     Round 130 stated the price of a repair in a sentence and Round 131 found it was already being
//     charged; that is not a mistake to make twice, so the residual is written at full strength and
//     then measured rather than argued.
//
// Two things bound it in practice. The prev-token test admits only characters that cannot *end* an
// expression, so `a / b`, `f(x) / 2`, `xs[i] / 2`, `'s' / 2` and `2 / 3` are all division by
// construction — a misfire needs punctuation-or-keyword immediately before a division, which valid
// JS does not contain. That is an argument, not a measurement, and the argument is exactly the kind
// this file has been wrong about before. So the measurement: the parity precondition below asserts
// on every module read that the scan ends with no string span open, which is precisely the
// odd-parity case above. Daedalus proposed that signal in Round 131 §4 and declined to ship it
// because it went red on the clean tree — it went red on the three files this repair fixes. It is
// green now, and it costs nothing, so the repair is what made it shippable.
//
// A stepped-over span is **blanked in both readings**, not emitted verbatim, for two reasons that
// point the same way. It makes the parity precondition exact — every quote surviving the
// strings-blanked reading is then a real delimiter, with none leaking out of a regex body like the
// apostrophe in `/\bhere(?:'s)\b/i`, which is live in `verify-filler-constraints.mjs` today. And a
// regex body is not code: an anchor inside one is not an import site and a `explainTsxRequirement(…)`
// inside one is not a call, so blanking is what both consumers already wanted.
const REGEX_MAY_OPEN_AFTER = /[(,=:[!&|?{};+\-*%<>~^]/;
const REGEX_MAY_OPEN_AFTER_WORD = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'case', 'new', 'delete', 'void', 'throw',
  'do', 'else', 'yield', 'await',
]);

// The index just past a regex literal opening at `i`, or −1 if no such literal closes on this line.
// `[` opens a character class, in which `/` is an ordinary character — `/[/]/` is one literal, not
// two. Kept separate from the scanner so the case table below can point at it directly.
const regexLiteralEnd = (src, i) => {
  let j = i + 1;
  let inClass = false;
  while (j < src.length) {
    const c = src[j];
    if (c === '\n') return -1;
    if (c === '\\') { if (src[j + 1] === '\n' || j + 1 >= src.length) return -1; j += 2; continue; }
    if (inClass) { if (c === ']') inClass = false; j += 1; continue; }
    if (c === '[') { inClass = true; j += 1; continue; }
    if (c === '/') return j === i + 1 ? -1 : j + 1;
    j += 1;
  }
  return -1;
};

const stripSource = (src, blankStrings) => {
  let out = '';
  let i = 0;
  let quote = null;
  // The last significant character of *code* — comment bodies and string bodies do not update it,
  // so `a /* c */ / b` is division and `('x') / 2` is division. Null at start of file, where a `/`
  // cannot be division.
  let prev = null;
  // The identifier immediately before `prev`, and whether it was reached through a `.` — so the
  // keyword list reads `return /x/` as a regex and `obj.in / 2` as division.
  let word = '';
  let wordDotted = false;
  while (i < src.length) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { out += '  '; i += 2; continue; }
      if (c === quote) { quote = null; out += c; prev = c; word = ''; i += 1; continue; }
      out += c === '\n' ? '\n' : (blankStrings ? ' ' : c);
      i += 1;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; out += c; prev = c; word = ''; i += 1; continue; }
    // Comments first, and not by accident: `//` is a comment and never an empty regex, and a regex
    // may not open with the quantifier `*`, so `/*` is never one either. Testing the regex branch
    // first would read every line comment in this file as an unterminated literal.
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') { out += ' '; i += 1; }
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      for (; i < stop; i += 1) out += src[i] === '\n' ? '\n' : ' ';
      continue;
    }
    if (c === '/'
      && (prev === null || REGEX_MAY_OPEN_AFTER.test(prev)
        || (!wordDotted && REGEX_MAY_OPEN_AFTER_WORD.has(word)))) {
      const stop = regexLiteralEnd(src, i);
      if (stop !== -1) {
        // Blanked identically in both readings — see the note above. Identical in both is what
        // keeps conjunct 2 sound here: the two readings never disagree inside a span that is
        // neither code nor string, so no anchor can be found in one and judged by the other.
        for (; i < stop; i += 1) out += ' ';
        prev = '/';
        word = '';
        continue;
      }
    }
    out += c;
    if (!/\s/.test(c)) {
      if (/[\w$]/.test(c)) {
        if (word === '') wordDotted = prev === '.';
        word += c;
      } else {
        word = '';
      }
      prev = c;
    }
    i += 1;
  }
  return out;
};

// Round 132, and it points at the heuristic rather than at the defect it replaced — Daedalus's
// Round 131 §4 asked for exactly that, on the grounds that a repair verified only against the
// minimal instance of the stated residual would look like it worked. Every row is `MARK` placed in
// one position, and one question asked of it: does the strings-blanked reading still contain it?
// `MARK` survives iff the scanner called that span code. The rows where it must *not* survive are
// as load-bearing as the rows where it must — a scanner that read everything as code would satisfy
// half a table, which is item 5's failure in miniature, so the precondition below asserts both
// outcomes are present and the count of each.
//
// Rows 2-5 and 11 are the misfire direction: `MARK` sits *inside* the span a misfiring scanner
// would step over, and there is a second `/` on the line so that the step-over has somewhere to
// end. If the prev-token test ever admits a division, these go red before anything else does.
const SCAN_ROWS = [
  // The repair, in the shape that is live in the tree three times over: an unbalanced quote inside
  // a regex literal. Before this round, `MARK` here was string interior.
  ['a regex after `(` — its apostrophe is not a string', "f(/a'b/); const MARK = 1;", true],
  ['a regex after `=>` — R131 §3, and the /it\'s/ that started it', "const p = (s) => /it's/.test(s); const MARK = 1;", true],
  ['a regex after a keyword', "function f(s) { return /a'b/.test(s); }\nconst MARK = 1;", true],
  // Division. `MARK` is inside what a misfire would blank.
  ['division after an identifier', 'const r = a / MARK + c / d;', true],
  ['division after `)`', 'const r = f(x) / MARK + c / d;', true],
  ['division after `]`', 'const r = xs[0] / MARK + c / d;', true],
  ['division after a digit', 'const r = 4 / MARK + c / d;', true],
  ['division after a keyword reached through a dot', 'const r = o.in / MARK + c / d;', true],
  // A `/` inside a character class is an ordinary character, not the closing delimiter. Get this
  // wrong and the literal ends early, the apostrophe after it opens a string, and `MARK` is lost —
  // which is `p.replace(/\//g, '-')`, the shape of Daedalus's M27, one class deeper.
  ['a `/` inside a character class does not close the literal', "p.replace(/[/]'x/g, ''); const MARK = 1;", true],
  // Comment openers win the tie, because `//` is never an empty regex and `/*` never opens one.
  ['`//` is a line comment, not an empty regex', "const s = 'a'; // it's fine\nconst MARK = 1;", true],
  ['`/*` is a block comment, not a regex', "const a = 1; /* it's fine */ const MARK = 1;", true],
  // Blanked, and each for a different reason — the negative half of the table.
  ['a string body is not code', "const s = 'MARK';", false],
  ['a comment body is not code', 'const a = 1; // MARK\n', false],
  ['a regex body is not code', 'const re = /MARK/g;', false],
  // The residual, as a row rather than as a sentence: a regex literal that does not close on its
  // own line is not recognised, the `/` falls through to division, and an unbalanced quote after it
  // desynchronises exactly as it did before this round. Valid JS cannot write one — a literal may
  // not contain a newline — so this row asserts the fall-through is *safe*, not that it is absent.
  ['an unterminated `/` on the line falls through to division (residual)', "const re = /a'b\nconst MARK = 1;", false],
];
for (const [label, src, wantCode] of SCAN_ROWS) {
  ok(`SCANNER — ${label}`, { wantCode }, stripSource(src, true).includes('MARK') === wantCode);
}
ok('PRECONDITION — the scanner table exercises both outcomes',
  { code: SCAN_ROWS.filter((r) => r[2]).length, blanked: SCAN_ROWS.filter((r) => !r[2]).length },
  SCAN_ROWS.filter((r) => r[2]).length === 11 && SCAN_ROWS.filter((r) => !r[2]).length === 4);

const ANCHOR_SOURCE = "['\"`](?:\\.\\./)+packages/[^'\"`\\n]*"
  + `(?:${TS_EXTENSIONS.map((e) => e.replace('.', '\\.')).join('|')})`
  + "['\"`]";

// Round 130, Theseus. Daedalus handed this over in his Round 129 §6 with the route written as one
// line — `anchorsOf` over `stripSource(src, false)` — and the first thing this round measured is
// that the one line is **not sufficient**, on the only large prose-bearing file the repo has.
//
// The over-fire, item 1, five rounds old and never repaired: `src.matchAll` cannot tell an import
// site from a sentence about one, exactly as `src.includes` could not at item 10. Measured twice
// this round on *correct* read-only modules that load no TypeScript at all — a quoted specifier in
// a comment after the word `import(` reads **narrow**, so the file joins the read population and is
// named by §(b)'s central claim (`FAIL 1/149`, report line `UNGUARDED`); the same specifier near
// but not in an import position reads **broad-only**, so it lands in the unclassified bucket
// (`FAIL 1/148`). Both are reds a correct file cannot clear by being more correct.
//
// Two conjuncts, because the demonstrated spelling is not the class — the lesson of Rounds 128
// (three limbs, one definition) and 129 (§3, two more over-fires in the two lines Round 124 had
// already repaired for over-firing). Repairing comments alone would have been that error a fourth
// time, and here it is measurable rather than a worry: on this file's own source the comment-only
// reading takes the narrow count 9 → **10**, because it promotes the R125 comment-in-parens row
// while leaving 17 string-borne anchors standing. Both conjuncts together take it to **0**, which
// is the true answer — the header has claimed "this file imports no TypeScript, by design" in
// prose since Round 121, and the predicate has disagreed with it the whole time.
//
//   1. Comment bodies blanked. Prose is not code.
//   2. The site must not be nested inside another string literal. Blanking strings is not available
//      here the way it is for the call conjunct — the anchor's target *is* a string — so instead:
//      an anchor is real code iff its own opening quote survives in the strings-blanked reading.
//      A nested specifier's quote is body, and is blanked; a genuine specifier's quote is a
//      delimiter, and is kept. Exact rather than heuristic, and it costs one array index.
//
// Conjunct 2 is what the population needed: this file is 20 raw anchors of fixture tables and
// worked examples, and its exclusion from `readable` — written for an unrelated reason — is the
// only thing that has kept it from turning itself red. That exclusion was masking the over-fire,
// not avoiding it. Asserted below on SELF rather than left as an argument.
const anchorsOf = (src) => {
  const code = stripSource(src, false);
  const noStrings = stripSource(src, true);
  return [...code.matchAll(new RegExp(ANCHOR_SOURCE, 'g'))].filter(
    // Offsets align because `stripSource` is length-preserving — asserted on the live population
    // below, since this index is the whole of conjunct 2 and a length drift would silently void it.
    (m) => noStrings[m.index] === m[0][0],
  ).map((m) => {
    const pre = code.slice(0, m.index);
    // `(?![\s\S])` rather than `$`, which also matches before a trailing newline — an anchor at the
    // start of a line would otherwise be read one character out of position.
    const narrow = /import\(\s*(?![\s\S])/.test(pre);
    return {
      index: m.index,
      line: pre.split('\n').length,
      text: m[0],
      narrow,
      // Round 125 asserted containment (narrow ⊆ broad) per row and it held on the table — but it
      // is not true in general: `import(` + more than 40 characters of whitespace + the specifier
      // is narrow and *not* windowed, so the broad reading was never actually a superset. Writing
      // the disjunct in makes containment hold **by construction** instead of by assertion. The
      // rows below keep asserting it, with their job changed: they now catch an edit that removes
      // this disjunct, rather than drift between two independent regexes.
      broad: narrow || /\bimport\b[\s\S]{0,40}(?![\s\S])/.test(pre),
    };
  });
};

const importsTsSource = (src) => anchorsOf(src).some((a) => a.narrow);

// §(a)'s treatment, and Round 123's for `isVerifierPath`: true cases, false cases, and a
// precondition that both kinds are present. The first four trues are the four escapes this file has
// actually been shown to have — Round 122's double quote and detached await, Round 124's depth —
// so a future edit that re-narrows the predicate reopens them here rather than in silence.
// Round 125, Daedalus. Theseus's Round 124 residual said the remaining escape needs a *computed*
// specifier, because "§(b)/§(c) need a literal to read". Measured false: `importsTsSource` matches
// `import\(`, and `await import ('…')` — one space, valid JS — is a *literal* it does not read. The
// mutant using it (space ∧ swallowing catch, one directory down) left this file at
// `PASS — all 63 checks passed`, count moved 62 → 63. Round 124's conjunction shape exactly, one
// level out, and each half alone is still caught: no-space ∧ swallow dies at §(c) (all three limbs,
// agreement included); space ∧ crash dies at §(b2).
//
// The repair is deliberately *not* a wider `importsTsSource`. Round 122 established that widening
// this regex is whack-a-mole — that is the whole reason §(b2) exists. What is actually wrong is that
// the predicate's **negative result carries two different meanings**: "affirmatively not a TypeScript
// importer" and "I did not recognise this file", and only the first is a finding. Round 124 named
// this ("absence from the list reads identically to does-not-import-TypeScript") and closed it by
// widening the population. Widening cannot close it in general — there is always a next shape. So the
// negative bucket is *split* instead, and the unrecognised half is asserted empty. A quoting style
// nobody has thought of yet stops being a silent pass and becomes a red that asks for a
// classification. Broader than `importsTsSource` by construction, and that containment is asserted
// on the shared case table below rather than left to inspection.
const mentionsTsSpecifier = (src) => anchorsOf(src).some((a) => a.broad);

// §(a)'s treatment, and Round 123's for `isVerifierPath`: true cases, false cases, and a
// precondition that both kinds are present. The first four trues are the four escapes this file has
// actually been shown to have — Round 122's double quote and detached await, Round 124's depth —
// so a future edit that re-narrows the predicate reopens them here rather than in silence. Rows 6-7
// are Round 125's: literals the narrow predicate cannot read, which is what the broad one is for.
//
// One table, two predicates, per rule 8b route (i): the wide and narrow readings cannot be given
// divergent inputs, because there is only one set of inputs.
for (const [label, src, wantNarrow, wantBroad] of [
  ["today's shape", "await import('../packages/server/src/db/queries.ts')", true, true],
  ['double-quoted (R122)', 'await import("../packages/server/src/db/queries.ts")', true, true],
  ['detached await (R122)', "const p = import('../packages/x.ts');\nawait p;", true, true],
  ['one directory down (R124)', "await import('../../packages/server/src/db/queries.ts')", true, true],
  ['newline before the specifier', "await import(\n  '../packages/x.ts'\n)", true, true],
  ['space before the paren (R125)', "await import ('../../packages/x.ts')", false, true],
  // Round 130. Was `false, true` — a real import site the narrow reading could not parse, so the
  // bucket had to declare it. With comment bodies blanked the parens hold only whitespace and the
  // narrow reading parses it correctly. The row is kept with its verdict changed rather than
  // deleted: it is the one fixture that proves conjunct 1 does something, and it is the reason
  // residual shape 3 at §(b2) — "a comment longer than the window inside the parens" — dissolves.
  ['comment inside the parens (R125)', "await import(/* the db */ '../packages/x.ts')", true, true],
  // Round 128. One row per TypeScript extension, because the anchor missing one is invisible in
  // exactly the way item 9 measured: not a false negative in the bucket, but no bucket entry at all.
  ['a .tsx specifier (R128)', "await import('../packages/client/src/App.tsx')", true, true],
  ['a .mts specifier (R128)', "await import('../packages/x.mts')", true, true],
  ['a .cts specifier (R128)', "await import('../packages/x.cts')", true, true],
  // The `.tsx` case in the shape that would have survived: unreadable site, so the bucket must
  // still declare it. Before this round it was not an anchor and there was nothing to declare.
  ['a .tsx specifier the narrow reading cannot parse (R128)',
    "await import ('../packages/client/src/App.tsx')", false, true],
  ['a .js specifier is not a TypeScript import', "await import('../packages/x.js')", false, false],
  // The extension must be terminal. `.tsx.bak` is not TypeScript and a suffix-blind alternation
  // would claim it — over-fire, header item 1, in the predicate this round widened.
  ['a .ts inside a longer extension (R128)', "await import('../packages/x.ts.bak')", false, false],
  ['a non-packages import', "await import('./lib/tsx-required.mjs')", false, false],
  // Round 130. This row was named as one whose meaning the repair changes. Measured: it never had
  // the meaning its label claims, before the repair or after. The specifier is *unquoted*, so the
  // anchor — which requires a quote — never matched it: zero anchors, both columns trivially false,
  // and the row has been asserting "unquoted text is not an anchor" while reading as though it
  // covered mentions-in-prose. The class my Round 128 called invisible, in this file's own table.
  // Kept, relabelled to what it actually tests, and followed by the rows that do the job it was
  // credited with — the three prose shapes measured live this round.
  ['an unquoted mention (R130: never an anchor, quoted rows below)',
    '// see ../packages/server/src/db/queries.ts', false, false],
  ['a quoted mention in a line comment, in import position (R130 M24a)',
    "// await import('../packages/server/src/db/queries.ts')", false, false],
  ['a quoted mention in a block comment (R130)',
    "/* await import('../packages/x.ts') */", false, false],
  ['a quoted mention in prose near the word import (R130 M24b)',
    "// we do not import '../packages/x.ts' here", false, false],
  // Round 125's residual shape 3, promoted from a residual to an asserted closure. It escaped both
  // readings because the comment was longer than the broad reading's 40-character window; blanked,
  // the parens hold whitespace and the *narrow* reading takes it. Written long enough to have
  // escaped — 60 characters — so the row would fail if conjunct 1 were removed.
  ['R125 residual shape 3: a comment longer than the window, inside the parens',
    `await import(/* ${'x'.repeat(60)} */ '../packages/x.ts')`, true, true],
  // Conjunct 2. A specifier nested inside another string literal is data, not a site — this file's
  // own fixture tables are made of exactly this, which is why SELF read as an importer for nine
  // rounds. Note the outer quotes differ from the inner ones; that is the shape, not an accident.
  ['a specifier nested inside another string literal (R130)',
    'const row = "await import(\'../packages/x.ts\')";', false, false],
  // …and the control one variable away: the same specifier as a genuine string-valued constant is
  // still an anchor, classified `neither`. Conjunct 2 must remove nested sites, not all strings.
  ['a specifier as a plain string constant', "const s = '../packages/c.ts';", false, false],
  ['a static import', "import fs from 'node:fs'", false, false],
]) {
  ok(`PREDICATE — ${label} ${wantNarrow ? 'is' : 'is not'} a TypeScript import`, undefined,
    importsTsSource(src) === wantNarrow);
  ok(`PREDICATE — ${label} ${wantBroad ? 'does' : 'does not'} mention a TypeScript specifier`, undefined,
    mentionsTsSpecifier(src) === wantBroad);
  // The containment that makes the split meaningful. If the broad reading ever stops being a
  // superset of the narrow one, the unclassified bucket below silently stops covering the narrow
  // predicate's blind spot — and it would go on reporting empty. Asserted per row, on the measured
  // predicates rather than on the intent columns.
  ok(`PREDICATE — ${label}: narrow ⊆ broad`, undefined,
    !importsTsSource(src) || mentionsTsSpecifier(src));
}
// A broad reading that had degenerated to always-true would make the containment above vacuous and
// the bucket below fire on everything; always-false would make the bucket vacuously empty. Both are
// the silent-cap shape, so both are named here.
ok('PRECONDITION — the broad reading discriminates (at least one true case and one false case)',
  undefined,
  mentionsTsSpecifier("await import ('../../packages/x.ts')") === true
    && mentionsTsSpecifier("import fs from 'node:fs'") === false);

// Round 128. Every member of the shared extension set must actually reach the anchor. This is the
// check that catches a re-sort of `TS_EXTENSIONS`: with `.ts` first, the alternation matches the
// `ts` of `.tsx` and then requires the closing quote, which the `x` is not — so `.tsx` silently
// stops being an anchor and the escape this round measured reopens, with no other symptom. Written
// as a loop over the exported set rather than as three literals, so an extension added there
// without a row here cannot pass unasserted.
ok('PRECONDITION — every TypeScript extension in the shared set reaches the anchor',
  TS_EXTENSIONS.filter((e) => anchorsOf(`await import('../packages/x${e}')`).length !== 1),
  TS_EXTENSIONS.every((e) => {
    const a = anchorsOf(`await import('../packages/x${e}')`);
    return a.length === 1 && a[0].narrow && a[0].text.endsWith(`${e}'`);
  }));

// Round 127. The site enumerator gets §(a)'s treatment in its own right: the three classes must all
// be reachable, or a degenerate `anchorsOf` makes every derived verdict above meaningless while the
// case table still passes (each row is a single-site fixture, so a file-level predicate that had
// collapsed to "first site wins" satisfies all eleven).
//
// The ordering here is load-bearing and was got wrong first: with the `neither` row written last it
// measured as `broad-only`, because the 40-character window reaches *backwards across the line
// break* into the previous row's `import` token. That is the over-fire of item 8 in miniature, and
// it bit this file's own fixture before it bit anything else — so the unrelated row goes first.
const THREE_CLASSES = [
  "const s = '../packages/c.ts';",           // neither — a specifier in no import position
  "await import('../packages/a.ts');",       // narrow, therefore broad
  "await import ('../packages/b.ts');",      // broad only
].join('\n');
ok('PRECONDITION — the site enumerator reaches all three classes on one input',
  anchorsOf(THREE_CLASSES).map((a) => (a.narrow ? 'narrow' : a.broad ? 'broad-only' : 'neither')),
  anchorsOf(THREE_CLASSES).length === 3
    && anchorsOf(THREE_CLASSES).filter((a) => a.narrow).length === 1
    && anchorsOf(THREE_CLASSES).filter((a) => a.broad && !a.narrow).length === 1
    && anchorsOf(THREE_CLASSES).filter((a) => !a.broad).length === 1);

// Round 127, and the reason the bucket is enumerated per site rather than per file. M15: two import
// sites in one file, the first unreadable behind a swallowing catch, the second readable and
// correctly guarded. Under the file-level bucket the readable site made the file `importsTsSource`,
// so the file was not in the bucket at all and the unreadable site was never declared — `PASS — all
// 110`, count 105 → 110. The control one variable away (M16, site A deleted, same site B, same
// catch, same depth) died in the bucket at `FAIL 1/106`. The masking *was* the mechanism, so the
// shape is kept here as a fixture rather than as a mutant that gets deleted: a future edit that
// collapses the bucket back to a file-level predicate reopens the escape here, loudly.
const MASKED = [
  "try { await import ('../../packages/masked.ts'); } catch {}",
  "await import('../../packages/readable.ts');",
].join('\n');
ok('MASKING — the file-level reading calls M15 fully classified (narrow ∧ broad)', undefined,
  importsTsSource(MASKED) === true && mentionsTsSpecifier(MASKED) === true);
ok('MASKING — …and the site-level reading declares the unreadable site anyway',
  anchorsOf(MASKED).filter((a) => a.broad && !a.narrow).map((a) => a.text),
  anchorsOf(MASKED).filter((a) => a.broad && !a.narrow).length === 1);

const srcOf = (f) => fs.readFileSync(path.join(SCRIPTS, f), 'utf8');

// Round 130, live control 1 of 2 on the scanner. Conjunct 2 of the anchor compares an index taken
// in one `stripSource` reading against a character in the other, so both must be exactly as long as
// the input. They are, by construction — every branch emits one character per character consumed —
// except that the escape branch emits two for a trailing lone backslash, which is the one input
// shape that would slide every index in the file by one and void conjunct 2 *silently*. Asserted on
// the real population rather than reasoned about, because "by construction" is what item 10's
// `includes` and item 1's `matchAll` both were.
const desynced = readable.filter((f) => {
  const src = srcOf(f);
  return stripSource(src, false).length !== src.length || stripSource(src, true).length !== src.length;
});
ok('PRECONDITION — the scanner preserves offsets on every module it reads', desynced,
  desynced.length === 0);

// Round 132, live control 1 of 3, and the one that measures the regex heuristic's bad direction
// instead of arguing it away. In the strings-blanked reading every quote character that survives is
// a *delimiter*: bodies are blanked, escapes are blanked, comment bodies are blanked, and (this
// round) regex bodies are blanked. Delimiters pair, so an odd count of any of the three means the
// scan reached end of file with a string span still open — which is exactly the unbounded desync,
// whether it came from a regex the heuristic declined or a division it misfired on.
//
// Daedalus proposed this signal in Round 131 §4 and declined to ship it, correctly: it went red on
// `verify-recogniser-equivalence.mjs`, `verify-filler-constraints.mjs` and `lib/tsx-required.mjs`,
// and a red a correct file cannot clear is item 1 of this header. Those are the three files the
// repair above fixes, so the signal is green now and shipping it costs nothing. It is necessary and
// not sufficient — an even-parity misread still escapes it, which is why it is one of three controls
// and not the argument on its own.
const QUOTES = ["'", '"', '`'];
const unterminated = readable.filter((f) => {
  const blanked = stripSource(srcOf(f), true);
  return QUOTES.some((q) => blanked.split(q).length % 2 === 0);
});
ok('PRECONDITION — no module is left with a string span open at end of file', unterminated,
  unterminated.length === 0);

// Round 130, live control 2 of 2, and the one that measures the repair rather than its preconditions.
// This file is the largest prose-bearing module in the repo — 20 raw anchors of fixture tables and
// worked examples — and it loads no TypeScript at runtime. The header has said so in prose since
// Round 121 ("this file imports no TypeScript, by design"); the predicate disagreed until this round,
// reading 9 narrow sites in its own source. It never showed, because `SELF` is excluded from
// `readable` for an unrelated reason — so the exclusion was masking the over-fire rather than
// avoiding it, and the one file guaranteed to exercise both prose conjuncts was the one file never
// asked. Asked here, and by the same predicate the population uses:
ok('SELF — this file is not read as a TypeScript importer (both prose conjuncts, live)',
  anchorsOf(srcOf(SELF)).map((a) => `${a.line}:${a.text}`),
  !importsTsSource(srcOf(SELF)) && !mentionsTsSpecifier(srcOf(SELF)));

// Round 126: the containment above is asserted on eleven synthetic rows and was never asserted on
// a single one of the files the bucket actually runs over. The bucket's soundness depends on
// containment holding for the REAL inputs; a predicate pair can satisfy the table and break here.
for (const f of readable) {
  const src = srcOf(f);
  if (importsTsSource(src)) {
    ok(`CONTAINMENT — ${f}: narrow ⊆ broad on the live file`, undefined, mentionsTsSpecifier(src));
  }
}

// Read-side: every module under scripts/ that imports TypeScript, not merely every verifier.
const importsTsRead = readable.filter((f) => importsTsSource(srcOf(f)));
// Run-side: §(c) may only execute what it is safe to execute, so it keeps the narrow population.
const importsTs = swept.filter((f) => importsTsSource(srcOf(f)));

// The unclassified bucket, per *site*. A site here is a TypeScript specifier in an import position
// that `importsTsSource` could not parse — so §(b) cannot say whether that import is guarded, and
// §(c) will never exercise it. That is not a pass and it is not a failure of the file under test; it
// is this instrument declining to answer, and it has to say so out loud. Empty on today's tree; M8
// and M16 are the files that put something in it, and M15 is the file the file-level version could
// not see. Reported as `file:line` because a red naming only the file leaves the reader to re-derive
// which of its specifiers is the unreadable one — and item 1 of the header is about the cost of a
// red that is expensive to clear.
const unclassified = readable.flatMap((f) =>
  anchorsOf(srcOf(f))
    .filter((a) => a.broad && !a.narrow)
    .map((a) => `${f}:${a.line}`));
ok('every verifier mentioning a TypeScript specifier is one §(b) can actually read', unclassified,
  unclassified.length === 0);

// Round 124: the guard-detection half was depth-anchored too, and it fails the *other* way — a
// correctly guarded verifier at `scripts/checks/` writes `from '../lib/tsx-required.mjs'`, which
// `"from './lib/…'"` does not contain, so it was reported UNGUARDED. Measured: that file turned this
// one red while §(b2) and §(c) both reported it healthy (exit 2, names the invocation). Loud and
// wrong rather than silent and wrong, so cheaper — but it is item 1 of the header, the over-fire,
// and a red that a correct file cannot clear is the fastest way to get a check switched off.
// Round 129, Daedalus. Theseus named this as the fair target for the round: after Round 128 shared
// two of the three "what is TypeScript" definitions, `importsGuardSource` was the last limb still
// spelling its own convention — a path shape (`(?:\.\.?\/)+lib\/tsx-required\.mjs`) and one exact
// call string — and no round had ever mutated it. Four measurements, item 10 of the header:
//
//   * **It reads prose as code.** `src.includes(...)` cannot tell a call from a sentence about a
//     call. M21 — a read-only module that imports the guard for one of its *other* exports and
//     mentions the call in a comment — read as `guarded` while printing the raw
//     `ERR_MODULE_NOT_FOUND` stack trace Round 121 exists to abolish. Single defect, no conjunction.
//   * **It over-fires on the quote style**, and **on the binding name**: two *correct* verifiers
//     (M23a `from "…"`, M23b `catch (e)`) were reported UNGUARDED while §(c) certified them exit-2
//     in the same run. Round 124 repaired this predicate's depth over-fire and left two more of the
//     same kind in it.
//
// So: **resolve rather than spell**, which is rule 8b route (i) applied to the third definition —
// the specifier is resolved against the importing file's own directory and compared with the guard's
// real path, so quoting, depth, and any `./a/../` spelling are correct by construction rather than
// by alternation. And **read code rather than text**: the call conjunct runs over source with
// comment bodies *and* string bodies blanked, so neither a sentence nor a log line can satisfy it.
//
// What this deliberately does not do is decide *reachability*. M22 — the guard imported, wrapped
// around the import, and called behind an `if` that never runs — is Round 124's shape, and no
// source-text limb can see it. For files §(c) runs, §(c) sees it (measured: the same file named
// `verify-*` dies `FAIL 3/140`). For the read-only population §(c) cannot run, nothing does, and
// widening this predicate would not change that. That residual is disclosed below rather than
// papered over, which is the other half of this round's repair.
const GUARD_PATH = path.join(SCRIPTS, 'lib', 'tsx-required.mjs');

// The binding name is the caller's business; `import.meta.url` is the part that carries meaning.
const GUARD_CALL = /\bexplainTsxRequirement\s*\(\s*[A-Za-z_$][\w$]*\s*,\s*import\s*\.\s*meta\s*\.\s*url\s*\)/;
const SPECIFIERS = /\bfrom\s*(['"])([^'"\n]*)\1/g;

const importsGuardSource = (src, dir) => {
  const code = stripSource(src, false);
  const importsIt = [...code.matchAll(SPECIFIERS)]
    .map((m) => m[2])
    .filter((s) => s.startsWith('.'))
    .some((s) => path.resolve(dir, s) === GUARD_PATH);
  return importsIt && GUARD_CALL.test(stripSource(code, true));
};

// The predicate resolves against a real path, so a move or rename of the guard makes every file read
// UNGUARDED — loud, but it would be loud for the wrong reason. Name it here instead.
ok('PRECONDITION — the guard module is at the path this predicate resolves against',
  path.relative(REPO, GUARD_PATH), fs.existsSync(GUARD_PATH));

const CHECKS_DIR = path.join(SCRIPTS, 'checks');
for (const [label, src, dir, want] of [
  ['flat, correctly guarded', "from './lib/tsx-required.mjs'\nexplainTsxRequirement(err, import.meta.url)", SCRIPTS, true],
  ['one directory down (R124)', "from '../lib/tsx-required.mjs'\nexplainTsxRequirement(err, import.meta.url)", CHECKS_DIR, true],
  ['imports the guard but never calls it', "from './lib/tsx-required.mjs'", SCRIPTS, false],
  ['calls the guard but never imports it', 'explainTsxRequirement(err, import.meta.url)', SCRIPTS, false],
  ['a different lib', "from './lib/other.mjs'\nexplainTsxRequirement(err, import.meta.url)", SCRIPTS, false],
  // Round 129. The two over-fires, as rows: both files are correct and both were reported UNGUARDED.
  ['a double-quoted guard specifier (R129 M23a)',
    'from "./lib/tsx-required.mjs"\nexplainTsxRequirement(err, import.meta.url)', SCRIPTS, true],
  ['a catch binding not named `err` (R129 M23b)',
    "from './lib/tsx-required.mjs'\nexplainTsxRequirement(e, import.meta.url)", SCRIPTS, true],
  ['whitespace inside the call',
    "from './lib/tsx-required.mjs'\nexplainTsxRequirement( err , import.meta.url )", SCRIPTS, true],
  // …and the escape. Prose and log lines are not calls.
  ['the call written only in a line comment (R129 M21)',
    "from './lib/tsx-required.mjs'\n// callers wrap it: explainTsxRequirement(err, import.meta.url)", SCRIPTS, false],
  ['the call written only in a block comment (R129)',
    "from './lib/tsx-required.mjs'\n/* explainTsxRequirement(err, import.meta.url) */", SCRIPTS, false],
  ['the call written only inside a string literal (R129)',
    "from './lib/tsx-required.mjs'\nconsole.log('explainTsxRequirement(err, import.meta.url)')", SCRIPTS, false],
  ['the guard import written only in a comment (R129)',
    "// from './lib/tsx-required.mjs'\nexplainTsxRequirement(err, import.meta.url)", SCRIPTS, false],
  // Resolution, not spelling: the first of these the old regex could not read and the second it
  // would have claimed. The extension must be terminal, as at the anchor.
  ['a specifier that goes up and back down (R129)',
    "from './checks/../lib/tsx-required.mjs'\nexplainTsxRequirement(err, import.meta.url)", SCRIPTS, true],
  ['a path that merely ends the same way (R129)',
    "from './lib/tsx-required.mjs.bak'\nexplainTsxRequirement(err, import.meta.url)", SCRIPTS, false],
  // The scanner's own boundary cases, asserted here rather than assumed. A `//` inside a string is
  // not a comment; if it were, the specifier on the same line would disappear and a correct file
  // would read UNGUARDED — item 1, introduced by the repair for item 10.
  ['a string containing `//` before the import (R129)',
    "const u = 'https://example.test/x';\nfrom './lib/tsx-required.mjs'\nexplainTsxRequirement(err, import.meta.url)",
    SCRIPTS, true],
  ['a comment containing an apostrophe (R129)',
    "// it's fine\nfrom './lib/tsx-required.mjs'\nexplainTsxRequirement(err, import.meta.url)", SCRIPTS, true],
]) {
  ok(`PREDICATE — ${label} ${want ? 'reads as' : 'does not read as'} guarded`, undefined,
    importsGuardSource(src, dir) === want);
}

const dirOf = (f) => path.dirname(path.join(SCRIPTS, f));
const unguarded = importsTsRead.filter((f) => !importsGuardSource(srcOf(f), dirOf(f)));

// Round 129. A guard claim is *run*-certified only for files §(c) executes. For the rest, this
// section's source reading is the whole of the claim — and until now the report printed the same
// word for both, and the check below said the source reading had established that the import was
// "wrapped", which is the one thing source text cannot establish (M22). Three of today's seven
// TypeScript importers are in that position. They get their own word.
const sourceOnly = importsTsRead.filter((f) => !importsTs.includes(f));
const labelFor = (f) => (unguarded.includes(f) ? 'UNGUARDED  ' : sourceOnly.includes(f) ? 'source-only' : 'guarded    ');

console.log(`  ${readable.length} modules read (${swept.length} of them runnable verifiers), ${importsTsRead.length} import TypeScript:`);
for (const f of importsTsRead) console.log(`    ${labelFor(f)}  ${f}${swept.includes(f) ? '' : '   (read-only: outside the run population)'}`);
console.log('');

ok('every TypeScript-importing module under scripts/ imports the guard and calls it',
  unguarded, unguarded.length === 0);

// The disclosure, asserted on the report line itself rather than left to the reader: an edit that
// drops the `source-only` label re-fuses a run-certified verdict with an unverified one, which is
// what this round found. Non-vacuous today — the three read-only importers are exactly its members.
ok('DISCLOSURE — no module outside §(c)\'s reach is reported as `guarded`', sourceOnly,
  importsTsRead.every((f) => labelFor(f).trim() !== 'guarded' || importsTs.includes(f)));

// Without this, §(b) passes vacuously the day the regex stops matching anything — the silent-cap
// shape, in the check written to catch a different silence.
ok('PRECONDITION — the enumeration is non-empty', importsTsRead.length, importsTsRead.length > 0);
ok('PRECONDITION — it does not match every module (the regex discriminates)',
  [importsTsRead.length, readable.length], importsTsRead.length < readable.length);
// Round 126: the widening is only doing work if it admits files the old population excluded. If
// this ever goes to zero the read population has silently collapsed back onto `swept`, and the
// three files that motivated it would go unchecked again — passing, as they did for three rounds.
ok('PRECONDITION — the read population admits TypeScript importers the run population cannot reach',
  importsTsRead.filter((f) => !swept.includes(f)),
  importsTsRead.some((f) => !swept.includes(f)));

const run = (cmd, argv) => {
  const r = spawnSync(cmd, argv, { cwd: REPO, encoding: 'utf8', timeout: 120000 });
  return { rc: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};

// ---------------------------------------------------------------------------------------------
// §(b2) The same guarantee without a population — Round 122, Theseus
// ---------------------------------------------------------------------------------------------
//
// §(b) can only be as good as its membership regex, and a regex that misses one file fails
// silently *and* takes §(c) down with it, since §(c) iterates `importsTs`. So assert the property
// on the whole population and let *content* membership fall out: under plain `node`, no verifier
// may emit an unhandled module-resolution stack trace. Either it does not import TypeScript (runs
// normally), or it does and the guard converts the throw into an exit-2 explanation.
//
// Round 123: this removes the *source-text* membership test, not the membership test. The
// population is still whatever `isVerifierPath` admits, because the property is only assertable on
// files it is safe to execute, and this repo's `scripts/` also holds servers and live probes that
// a blind sweep must not run. Trading an unbounded membership test (how one may write a dynamic
// import) for a bounded one (a filename convention this repo controls) is the whole of the gain —
// the bounded one is stated as a predicate and tested in §(b) above, which the unbounded one
// never could be.
//
// One residual, written down rather than half-closed: a verifier named outside the convention
// entirely — `check-foo.mjs` — is in neither set. Source-scanning the unrunnable remainder would
// re-introduce exactly the unbounded test §(b2) exists to escape, so it is not done here; the
// convention is the claim, and `isVerifierPath` is where to change it.
//
// Round 124 adds a second residual, and this one no limb reaches. §(b2) sees a crash; §(b) and §(c)
// see a literal specifier. A verifier that builds its specifier at runtime *and* swallows the
// resulting error, exiting 0, presents neither: nothing to read and nothing to catch. Both halves
// are needed — a computed specifier alone still crashes and dies at §(b2); a swallowed literal alone
// is now read and dies at §(c). Closing it would need a fourth limb asserting that a verifier which
// exits 0 under plain `node` actually verified something, which is `verify-verifier-exit-codes.mjs`'s
// subject rather than this file's — and that instrument is single-target today (it names
// `verify-premise-render.mjs`), so it has no population to widen and no version of this escape.
// Stated here so the next round starts from where the coverage actually ends.
//
// Round 125 corrects the *scope* of that residual, which was written narrower than it was. "A
// computed specifier" was not the condition; **"a specifier §(b) cannot read"** was, and literals
// live in that set too — `await import ('…')`, one space, was one, and it survived. The unclassified
// bucket in §(b) now catches the readable-but-unparsed literals. Measured, so the boundary is stated
// where it actually falls rather than where it is tidiest — three shapes still escape *both* the
// narrow and the broad reading, and only the first is what Round 124 described:
//
//   1. A genuinely computed specifier — `import([..].join('/'))`. No literal anywhere to read.
//   2. A literal bound to a variable first — `const s = '../packages/x.ts'; await import(s)`. The
//      literal is in the source, but it precedes the `import` token rather than following it, so the
//      broad reading's window does not cover it. This one is a literal, and it escapes.
//   3. ~~A comment longer than the broad reading's 40-character window sitting inside the parens.~~
//      **Closed in Round 130** and not by widening the window: with comment bodies blanked the
//      parens hold only whitespace, so the *narrow* reading takes it. Now an asserted row in the
//      case table above rather than a residual here — written at 60 characters, long enough that
//      it would have escaped, so the row fails if conjunct 1 is ever removed.
//
// Shapes 1 and 2 are unaffected by Round 130 — checked, not assumed: shape 2's literal is a real
// string constant, so conjunct 2 correctly keeps it as an anchor, and it goes on escaping both
// readings for the reason given above (it precedes the `import` token). Both still need the
// swallowing catch to survive §(b2), so both are conjunctions rather than single defects. The honest summary of what the bucket bought: it does not remove the membership
// question, it moves it onto a predicate that is *deliberately over-broad*, where a false negative is
// harder to hit by accident than on a precise one — and where the failure of the bucket itself is now
// asserted (containment, plus a discrimination precondition) rather than silent. That is an
// improvement in kind, not a closure, and the next round should start from these three.

console.log('\n=== (b2) Population-free: no verifier crashes raw under plain node ===\n');

// The signature of an *unhandled* resolution failure, as node actually prints it: the code, plus
// at least one raw stack frame. Both limbs are required, and the second one is the interesting
// one — see the synthesised negative control below for why it is here and why no live output
// currently exercises it.
//
// Round 128, Theseus. This was the third hardcoding of "TypeScript means `.ts`", and the one that
// mattered most, because §(b2) is the limb that does *not* depend on reading source: it was supposed
// to catch whatever the anchor missed. It could not — a `.tsx` importer crashes with
// `ERR_UNKNOWN_FILE_EXTENSION`, and this predicate demanded `ERR_MODULE_NOT_FOUND`. So M17 (no
// guard, no catch — the crudest possible instance of the defect §(a)-§(c) exist to catch) printed a
// raw stack trace under plain `node` while this file reported `PASS — all 110 checks passed`. Both
// codes now, from one binding, with the two-limb structure intact: a code plus a raw frame.
const WRONG_RUNNER_CODES = ['ERR_MODULE_NOT_FOUND', 'ERR_UNKNOWN_FILE_EXTENSION'];
const rawResolutionCrash = (out) => WRONG_RUNNER_CODES.some((c) => out.includes(c)) && /\n {4}at /.test(out);

// Positive control, run rather than assumed: if this predicate ever stops recognising the crash
// shape — a node release reformats the trace, say — every check below passes vacuously, which is
// the exact silence §(b2) was added to remove. Synthesised live, so it tracks the running node.
const control = run('node', ['--input-type=module', '-e', "await import('./no-such-module-r122-control.mjs')"]);
ok('PRECONDITION — the crash detector recognises a real unhandled resolution failure',
  { rc: control.rc }, rawResolutionCrash(control.out));

// Negative control on live output. Weaker than it looks, and labelled so rather than left to
// imply more: today's guard message quotes the resolution *url* and never the *code*, so this
// passes under a detector with no second limb at all. Measured — Round 122 N2 blunted the
// predicate to the code alone and this check stayed green.
ok('PRECONDITION — the detector does not fire on the guard\'s own exit-2 explanation (live)',
  undefined, !rawResolutionCrash(run('node', ['scripts/verify-empty-tail-detector.mjs']).out));

// …so the second limb is asserted against a synthesised message instead. This is the shape a
// *handled* failure takes if anyone makes the guard more informative by naming the code it caught
// — an entirely reasonable edit. Under a code-only detector that edit would turn all four guarded
// verifiers red at once: four false alarms reported as unguarded crashes, in the file whose whole
// subject is instruments that misreport. The limb is here for that edit, not for today's output.
const HANDLED_BUT_NAMES_THE_CODE = [
  'INCOMPLETE — nothing was verified: this script was run under plain `node`.',
  '(caught ERR_MODULE_NOT_FOUND while resolving a TypeScript import; re-run with npx tsx)',
].join('\n');
ok('PRECONDITION — …and not on a handled failure that merely names the code (synthesised)',
  undefined, !rawResolutionCrash(HANDLED_BUT_NAMES_THE_CODE));

// Round 128. The same positive control for the second shape, and it is load-bearing twice over.
// Run live, against a real `.tsx` on this seat: if node ever starts stripping JSX, this crash stops
// happening and the check below goes vacuous — which is the silence §(b2) exists to remove, so it
// must be asserted rather than assumed.
const extControl = run('node', ['--input-type=module', '-e',
  `await import(${JSON.stringify(pathToFileURL(REAL_TSX).href)})`]);
ok('PRECONDITION — the crash detector recognises an unloadable-extension failure',
  { rc: extControl.rc }, rawResolutionCrash(extControl.out));

// …and that `isTsExtensionFailure` can still read what node actually threw. The predicate parses a
// path out of prose because node attaches no structured field for it, so a release that reformats
// the message would disarm the guard silently — a verifier would go back to crashing raw with the
// guard present and every limb of this file green, which is precisely M19. Reconstructed from the
// running node's own message rather than from a string frozen at the time of writing.
const extLine = extControl.out.split('\n').find((l) => l.includes('ERR_UNKNOWN_FILE_EXTENSION') && l.includes('for '));
ok('PRECONDITION — the live node message still parses into the .tsx predicate',
  { line: extLine === undefined ? null : extLine.trim().slice(0, 60) },
  extLine !== undefined
    && isTsExtensionFailure(Object.assign(
      new Error(extLine.slice(extLine.indexOf('Unknown file extension'))),
      { code: 'ERR_UNKNOWN_FILE_EXTENSION' })) === true);

for (const f of swept) {
  const r = run('node', [`scripts/${f}`]);
  ok(`${f} — under plain node: no raw resolution stack trace`, { rc: r.rc }, !rawResolutionCrash(r.out));
}

// ---------------------------------------------------------------------------------------------
// §(c) End to end: wrong runner exits 2 and says so; right runner is unchanged
// ---------------------------------------------------------------------------------------------

console.log('\n=== (c) End to end, both runners, run rather than argued ===\n');

// One representative per guarded site would leave the others unasserted; run all of them.
//
// Round 124 adds the cross-limb assertion. §(b) decides "is this guarded?" by reading the source;
// §(c) decides it by running the file. Two independent measurements of one property, and until now
// nothing required them to agree — which is how §(b) came to report a file UNGUARDED that §(c) was
// simultaneously reporting as exiting 2 with the right message. Requiring agreement means either
// test drifting is caught by the other, and neither has to be trusted alone.
for (const f of importsTs) {
  const bad = run('node', [`scripts/${f}`]);
  const behaviourallyGuarded = bad.rc === 2 && bad.out.includes('run under plain `node`')
    && !bad.out.includes('ERR_MODULE_NOT_FOUND\n    at');
  ok(`${f} — plain node: exit 2, not a stack trace`, { rc: bad.rc }, behaviourallyGuarded);
  ok(`${f} — …and it names the invocation that works`,
    undefined,
    bad.out.includes(`npx tsx scripts/${f}`));
  ok(`${f} — §(b)'s source verdict and §(c)'s behavioural verdict agree`,
    { source: unguarded.includes(f) ? 'unguarded' : 'guarded', behaviour: behaviourallyGuarded ? 'guarded' : 'unguarded' },
    !unguarded.includes(f) === behaviourallyGuarded);
}

// The guard must not have broken the thing it guards. Two targets, chosen because they are the
// two Round 120 §5 recorded as un-runnable; asserting the fix on exactly the files the finding
// named is the point.
for (const f of ['verify-empty-tail-detector.mjs', 'verify-recogniser-equivalence.mjs']) {
  const good = run('npx', ['tsx', `scripts/${f}`]);
  ok(`${f} — under tsx: still exit 0 (the guard is inert on the working path)`,
    { rc: good.rc }, good.rc === 0);
}

// ---------------------------------------------------------------------------------------------

const failures = checks.filter((c) => !c.pass);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} of ${checks.length} checks failed`);
  process.exit(1);
}
console.log(`\nPASS — all ${checks.length} checks passed`);
