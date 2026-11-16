# PRE-REGISTRATION-B — unit-467rawjson arm B: the site is the FIRST match, so "no live caller" is not yet said

**Theseus, 2026-11-16 (START fire).** Pushed to `origin/main` **before `arm-rawjson-b.mjs` exists.**
Arm A is `0eda091b`; its recording is `drive1.arma.out`, read as a frozen artefact below.

## §1 Why arm B exists, and it is a blindness in arm A, not in the instrument

Arm A named the 12 and printed each one's site. Reading those 12 sites, **not one looks like a live
model call**: 9 fire on `ANTHROPIC_API_KEY` and every one of those nine is an env *scrub* or a dummy
(`delete env.ANTHROPIC_API_KEY`, `ANTHROPIC_API_KEY: ''`, `'ANTHROPIC_API_KEY=r253-dummy-no-calls-are-made'`),
two are `check('Z4', 'CONTROL — 0 model calls: nothing here IMPORTS the Anthropic SDK', …)`, three are
minted detector **fixture strings**, and `messages.create` fires on **0 of 12**.

**That reading cannot be published as "none of the 12 makes a live call," and the reason is
mechanical.** `hazardSite` (`promote-probes.mts:277-281`) is `lines.findIndex(...)` — the **first**
matching line in the stripped source. A file whose line 301 scrubs the key and whose line 450 calls
`client.messages.create(...)` reports the scrub and says nothing about the call. Arm A's own site
column is a one-line slice of each file, and a one-line slice cannot carry a whole-file claim. This
is the same shape as the `striplift`/`reasontok` family: a reader green on its own slice.

So arm B reads **every** model-branch match in each of the 12, over the instrument's own stripped
reading (`stripSource(src, false)`, imported from `scripts/lib/strip-source.mjs` — not re-implemented),
and separately asks the question the three-way detector cannot ask: **does this file construct and
call the SDK, or does it only name it?**

## §2 Predictions (registered before the arm exists)

**Q1 — at least one of the 12 has a model-branch match on a line OTHER than its arm-A site.**
Near-certain and registered anyway, because it is the precondition for arm A's site column being a
slice rather than a census. If Q1 is refuted, every one of the 12 matches on exactly one line and
arm A's reading was a complete one after all.

**Q2 — zero of the 12 contain a `messages.create` call outside a string literal.** The strong form
of the headline. Tested by the *difference* between the two readings the instrument already
supplies: `stripSource(src, false)` (comments blanked, strings kept) vs `stripSource(src, true)`
(comments AND string bodies blanked). A `messages.create` surviving `blankStrings: true` is live
code; one that vanishes is a fixture. That is `literalOnly()`'s own logic
(`promote-probes.mts:208-209`), reused rather than retyped. **If Q2 is refuted, the live-call
population is non-empty and arm A's reading of the sites was misleading — which is the result I
would rather have than a confirmation.**

**Q3 — the six `-live` probes contain NO model-branch token in their own source at all.** Arm A
measured overlap(the 12, the six) = 0, and bucketing precedes admission (line 722), so a `-live`
probe owning a model token would have appeared in the 12. This prediction restates that as a
positive claim about their source and checks it directly, because the alternative reading of
"overlap 0" is that something about admission hid them. **Mechanism if it lands: the probes the
raw-JSON ruling is actually about reach the model through the PRODUCT'S HTTP API, not the SDK, and
`DETECTORS.model`'s three branches are blind to that route** — `probe-round213-reassign-live-http.mts`
names the route in its own filename.

**Q4 — at least one of the six `-live` probes posts to a `/api/messages`-shaped path in its own
source.** The constructive half of Q3. If both land, the seam for any raw-JSON writer is the
product's message route, not the probe, and step 1's `model`-class census measured a population that
does not contain the ruling's subject.

**Q5 — `probe-round230`, the root all six inherit `[model]` from, does not itself make a live call
either.** Its arm-A site is `env: { ...process.env, ANTHROPIC_API_KEY: '' }` — a scrub. If Q5 lands,
the inheritance chain the six are refused for bottoms out in a probe that deliberately runs with no
key, and "inherits `[model]`" names a spawn relation rather than a call.

## §3 RED conditions (arm defects, not refutations)

- **S1.** The set of 12 filenames arm B reads differs from the 12 in `drive1.arma.out`. Arm B parses
  that recording rather than re-running the instrument, so a mismatch means my parse is wrong.
- **S2.** Any of the 12 is unreadable, or `stripSource` throws on it.
- **S3.** For any of the 12, arm A's site line is absent from arm B's own match list for that file —
  the two readings must agree on the line arm A reported, or one of them is wrong.
- **S4.** `git status --porcelain packages scripts docs/research/lib` non-empty.

## §4 Declared limits

1. **`blankStrings: true` surviving is evidence of live code, not proof of an executed call.** A
   `messages.create` in a dead branch, behind a flag, or inside a function never invoked survives the
   strip and is still not a call made at runtime. Arm B is a source reading, like the instrument it
   checks; the only thing that settles execution is a live round, which this fire cannot run.
2. **Arm B says nothing about the 110 DEFERRED probes outside the `model` class.** If the live route
   is HTTP, the live-round population has to be re-keyed over the whole population, and that is arm C
   or step 2b — not claimed here.
3. Pin unchanged: `1f675ebf`. Arm A's recording is read at `0eda091b`.

— Theseus
