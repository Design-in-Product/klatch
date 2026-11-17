# unit-470bodyslice — PRE-REGISTRATION

**Seat:** Daedalus (Klatch) · **Fire:** 2026-11-17 WORK (`date` 13:17:07 PST at open) ·
**Written and pushed before any instrument or helper file existed.**

## The routed item

Theseus's 11/17 START memo
(`docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-the-brace-slicer-is-52-of-62-and-45-are-live-and-we-both-already-had-the-cure-in-our-own-prior-work-2026-11-17.md`)
§2 routes this to me and Argus with an explicit shape:

> We had both already written the cure, in those words, and regressed anyway … **That is an
> argument for a shared helper or a detector, not for a lesson.**

My own 11/17 START §5 had routed the general form as a *sentence* ("a brace-balance slicer is wrong
on every options-bag and every object default in this codebase"). His census refutes the premise of
that routing: `|GUARDED| = 6`, four of the six written *before* the two incidents, two of those four
**mine**, one of them in the same directory and the same day as an unguarded sibling. A sentence
addressed to the next author cannot work on a defect whose carrier is the author's default reach for
`indexOf('{')`.

So this unit builds the **shared helper** (my lane: `scripts/lib/`, the imported surface), and
measures whether the **detector** is worth its price — which depends on P2 below.

## Predictions

Registered before any measurement. Each states the predicate AND the direction I expect, so a
landed predicate cannot be read as the opposite of what I meant.

**P1 — reproduction, under his key, not mine.** Driving `arm-braceslice-a.mjs` fresh from my
worktree reproduces his drive-3 headline *exactly*: `62` slicers, `52` unguarded, `45` live,
`legs=0 red=[]`. **I expect it to reproduce.** If any figure differs, his number is not wrong until
I have checked my own invocation (his drive 1 died of a cwd-rooted `ROOT`; mine is a different
worktree, which is the same hazard class).

**P2 — where the 52 live, and this is the decision.** I expect the unguarded set to be concentrated
in **frozen one-off research arms** under `docs/research/`, not in the imported surface:
**≤ 4 under `scripts/` and ≥ 44 under `docs/research/`.** Decision-relevance, stated now so it
cannot be retrofitted: if the exposure is overwhelmingly in frozen artefacts, then *migrating* them
is worth nothing (nobody re-runs them; their figures are already published) and the entire value of
this unit is (a) the helper, for the next instrument, and (b) a detector that reddens on a **new**
unguarded slicer. If instead the imported surface carries a real share, migration is the first call
on the next fire and the detector is secondary.

**P3 — the differential, on real sites, not fixtures.** A naive first-`{` slicer and the helper, run
on the three *real* corpus declarations carrying each of the three known mechanisms:

| mechanism | site |
|---|---|
| JSDoc `@type` braces | `scripts/lib/strip-source.mjs` → `stripSource` |
| object default / inline options type | `packages/server/src/db/queries.ts` → `createGroundRulesPreset` |
| TS type literal in the parameter list | a site named at drive time from `packages/*/src` |

**I expect the naive slicer to be wrong on 3 of 3** (a body span that stops on the signature's own
line, so the body text does not contain the construct the consumer is looking for) **and the helper
to be right on 3 of 3.** A fixture I type myself is not evidence here: it would carry the property
by construction. These are read out of the live tree.

**P4 — the cripple's reach is partial, and I name which legs.** Deleting the parameter-list
paren-match from the helper (the only cure line) must redden the **three** differential legs above
and must **not** redden a fourth leg driven on a declaration whose parameter list carries no brace
(`stripSource`'s sibling `regexLiteralEnd`, or equivalent named at drive time). **Expected:
3 red, 1 green.** A cripple that reddens everything has not shown that the guard is what moved.

**P5 — the helper does not enter the population it drains.** My new `scripts/lib/` file contains a
brace-depth walk by construction, so it is a population member of Theseus's key. I expect it to
classify **GUARDED** — not `ambiguous`/withdrawn — under his unmodified arm. (This seat has shipped
a hygiene gate that reddened on its own directory; the general form is in my memory store and this
is its first live test.)

**P6 — I expect to find a form the helper is wrong on.** Not a hedge: a prediction with a direction.
Enumerated now as the forms I am building for — `function` declarations, `const`/`let` arrow
declarations with a parenthesised parameter list, `async`, generics. **I expect at least one real
consumer in the corpus to need a form outside that set** — a single-identifier arrow (`x => …`), a
concise arrow body with no braces at all, or a class/object-literal method. If I find one, the
helper declares the limit in its `.d.mts` rather than claiming coverage it lacks.

## What this unit does NOT claim

- It does not migrate any existing consumer. Zero of the 52 are rewritten in this fire; the helper
  is additive. Whether migration happens at all is P2's call, not this fire's.
- The detector is **specified and priced here, built only if P2 says it is the cure and the fire has
  budget left**. If it is not built, it is named with its price and its blocker, not with a date.

## Gate

Typecheck ×4 workspaces (the new module lands under `scripts/tsconfig.lib-mjs.json`'s `include`, so
`typecheck:scripts` grades it as an implementation), server suite, client suite, census — driven
fresh in this fire, not carried. Any cripple restored by `git checkout HEAD -- <path>` with
`git status --short` verified clean before the gate run, and the helper committed **before** the
first cripple so no restore can discard it.
