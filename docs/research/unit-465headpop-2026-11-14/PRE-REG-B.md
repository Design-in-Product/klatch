# unit-465headpop — pre-registration, arm B (the census)

**Filed:** 2026-11-14 ~13:3x PT, **after** arm A landed and **before** arm B exists or any count has
been taken. Pushed to `origin/main` before the arm.

## Subject

Arm A showed the defect is not `ls-files` vs `ls-tree` — it is **an unpinned ref of any kind**, and
the standing cure in my own store ("select with `git ls-tree -r --name-only <rev>`") is satisfiable
by `ls-tree HEAD`, which has the same defect. Arm B censuses the corpus for it.

**Population:** every `.mjs` under `docs/research/` and `scripts/` at a **named rev** (`de144502`),
**excluding this unit's own directory** — an instrument does not census its own source, and arm B
necessarily contains every pattern it looks for.

**Site = one `ls-tree` or `ls-files` call.** Only these two: they are the population-selecting
commands, which is what the claim is about. `log`/`rev-list`/`show` are a different question and are
counted but **not** classified, declared rather than silently folded in.

**Classification is positively keyed with an explicit refusal bucket** — no fall-through. Each site's
ref argument resolves to exactly one of: `PINNED` (a sha-like literal, or an identifier whose nearest
binding is one), `UNPINNED_HEAD` (`HEAD`, or `HEAD` with a `^`/`~` suffix), `UNPINNED_NAMED` (a
branch/ref name), `NO_REF` (`ls-files`, which takes none), or `UNCLASSIFIED` (anything the resolver
cannot decide — reported, never absorbed).

## Predictions

- **B1** — At least **20 distinct files** carry at least one `UNPINNED_HEAD` or `NO_REF` population
  site.
- **B2** — The Round 416 census recorded **30 `ls-files` population sites across 24 files**. Nobody
  re-keyed them since, so I predict `NO_REF` sites are **≥ 30** across **≥ 24** files.
- **B3** — Among sites with a ref argument at all, **`UNPINNED_HEAD` outnumbers `PINNED`.** This is
  the prediction I most expect to be wrong, because the research instruments that publish figures
  have been pinning deliberately for weeks.
- **B4** — At least **1** `UNPINNED_HEAD` or `NO_REF` site lives under **`scripts/`** rather than
  `docs/research/` — i.e. the defect is not confined to round instruments.
- **B5** — `UNCLASSIFIED` is **≤ 10%** of all sites. If the resolver refuses more than that, the
  census is not a measurement and I will say so rather than publish the other four figures.

**Known by construction, not predicted:** my own `arm-schemacollide-b.mjs` and `-c.mjs` are
`UNPINNED_HEAD`. Arm A already measured them; they are not evidence for `B1`.

## Declared limits

- A source-text census is an **upper bound** on sites (it can match a pattern inside a comment or a
  string) and a **floor** on nothing — I label the direction rather than calling it "the count".
- The resolver reads the **nearest preceding binding** for an identifier ref. A ref built by string
  concatenation or passed down two call frames will land in `UNCLASSIFIED`, by design.
- This counts **sites**, not published figures. A site whose number is never published is still a
  site; arm A's finding was about a *published* figure, and the two populations are not the same.
  Stated here so the headline cannot drift into "N published figures are wrong".
