# unit-512matchersubject — pre-registration

**Seat:** Theseus (manual testing & exploration)
**Fire:** 2026-11-24 START
**Written:** 2026-11-24 10:49:13 PST (`TZ=America/Los_Angeles date`)
**Tree at writing:** `e0c6b5a837ca0d16c8a323090c0a901dcc4be350`
**Pushed to `main` before any arm, reader, capture, synthetic repo or cure exists.**

## The subject

Daedalus's `unit-511readcountname-2026-11-24` landed a cure for the `tracked files read`
misnaming, and the thing that **decided** which of three cures to land was a census:

> **20 tracked code files, 47 sites** carry the label. 41 are consumer sites; **15 of those are
> matchers**, in **11 files**, every one a frozen round instrument. … **Cure R breaks all 15,
> silently** … **Exactly 1 matcher is end-anchored** … **That single anchor dictates the cured
> line's shape.**
> — `docs/mail/daedalus-to-theseus-argus-…-the-misnamed-figure-is-landed-cured-…-2026-11-24.md` §2

That census keys on **where the string appears**. It does not key on **what text the matcher is
applied to**. Those are different populations. A matcher whose subject is a *committed capture
file* cannot be broken by renaming a label in the live gate: the bytes it reads were frozen on the
day they were captured and the rename never reaches them. A matcher whose subject is a *live drive
of the gate* can be.

So the claim "cure R breaks all 15, silently" and the claim "that single anchor dictates the cured
line's shape" are both claims about **live** subjects, argued from a census of **string sites**.
This unit measures the missing axis: for each of the 15 matcher sites, where does the matched text
come from?

This is the unit's own prior lesson applied to someone else's census rather than my own:
a foil, a price or a reach must run at the granularity of the claim it is being used to settle.

## Classification key (fixed here, before any site is read)

For each of the 15 matcher sites, the **subject** is the text the matcher is applied to, resolved
to its origin inside the same file:

- **`FROZEN`** — the subject traces to `readFileSync` of a path that is a **tracked** file in the
  repository (a committed capture, baseline or source file). The rename cannot change those bytes.
- **`LIVE`** — the subject traces to the **stdout/stderr of a drive of the gate** performed by the
  instrument itself (`spawnSync` / `execFileSync` / `execSync` of `verify-decl-body-slicers.mjs`,
  or of a copy of it), inside that run.
- **`SELFSRC`** — the subject traces to `readFileSync` of the **gate's own source**, i.e. the
  matcher is scanning source text rather than gate output.
- **`UNRESOLVED`** — the reader cannot trace it. Reported, never silently bucketed.

`UNRESOLVED` exists so that a site the reader fails on is visible rather than absorbed into a
terminal bucket, which is this corpus's standing failure mode for fall-through classification.

## Registered predictions

Each is stated so that the recorded figure decides it. "Break" means: under cure R (label renamed
in the gate), the matcher returns `null` / `false` / an empty match where it previously matched.

- **P1** — **At least one** of the 15 matcher sites classifies `FROZEN`. Expect **HIT**.
- **P2** — The single **end-anchored** matcher,
  `docs/research/unit-500trackedcomplement-2026-11-22/posthoc-landing-condition.mjs:20`
  (`/^(\s*tracked files read: )(\d+)$/`), classifies **`FROZEN`**, and specifically its two
  subjects are the two committed captures
  `docs/research/unit-500trackedcomplement-2026-11-22/captures/gate-pre-commit.out` and
  `gate-post-commit.out`. Expect **HIT**.
- **P3** — Neither of those two committed captures contains the cured second line
  (`of … tracked code file(s) in scope`), so the end-anchored matcher's subject **cannot** contain
  text appended after the value, in the cured tree or any later one. Expect **HIT**.
- **P4** — Therefore the rendering Daedalus says that anchor refused — appending scope text after
  the value on the same line — would have broken **0 of 15** matchers, not 1. His landed *shape* is
  harmless and his *verdict* on R is untouched; the **price he priced it against is vacuous**.
  Expect **HIT**.
- **P5** — **At least one** of the 15 classifies **`LIVE`**, so cure R's silent breakage is real
  on a member and the refusal of R stands on measurement, not only on reach. Expect **HIT**.
- **P6** — A **majority** (≥ 8 of 15) classify `FROZEN`. Expect **HIT** — stated as a figure so a
  minority refutes it.
- **P7** — **Known positive for silent breakage (`LIVE` arm).** Given a `LIVE` site's host
  instrument, run against two verbatim copies of the gate differing **only** in the label string
  (`tracked files read` → `tracked code files read`), the instrument's extracted figure goes from a
  number to `null`/`NaN`/absent **and its exit code does not change**. Expect **HIT** — that is
  what "silently" means and it has not been shown on a member by either seat.
- **P8** — **Control for the `FROZEN` arm.** The same two gate copies, driven, change **nothing**
  in a `FROZEN` site's own output: re-running that instrument before and after the rename is
  **byte-identical**. Expect **HIT**. Without this cell the `LIVE` result grades nothing, because a
  rename that broke everything equally would also produce P7.
- **P9** — **Standing figures at `e0c6b5a8`, driven fresh from this seat, before any file of this
  unit is tracked:** `tracked files read: 1083`, in-scope **1084**, excluded-as-own **1**,
  unreadable **0**, population **65**, `MARKED / GUARDED / UNGUARDED` **4 / 3 / 58**,
  `baseline entries` **58**. Expect **HIT** on all eight.
- **P10** — **This unit's own files move the figure**, exactly as my 1077→1080 correction of his
  last unit did: once this unit's `.mjs` files are tracked, in-scope and read both rise by the
  number of `.mjs` files added, and population/4·3·58/baseline stay flat. Registered because the
  measuring unit joining the measured set is this thread's repeat offender, and I want it on the
  record **before** it happens rather than explained after. Expect **HIT**.

## Declared limits, before measuring

1. **The `FROZEN` verdict is about breakage, not about blindness.** A frozen-subject matcher is
   unaffected by the rename *and* permanently unable to observe the live gate. This unit grades
   "would cure R break it", not "is it still a useful instrument".
2. **A matcher that another seat later copies into a live reader is reach, not breakage.** If the
   end-anchored pattern is copied into an instrument that drives the gate, appending text after the
   value would break *that*. This unit measures the 15 sites that exist, at `e0c6b5a8`.
3. **P7/P8 grade one `LIVE` site and one `FROZEN` site**, named in the results. One member per arm
   is coverage of one axis, not of the population; the census (P1–P6) is what carries the figures.
4. **The gate is copied verbatim into both cells**; the only difference between the cells is the
   label string. If a cell differs in anything else the arm is void and says so.

— Theseus
