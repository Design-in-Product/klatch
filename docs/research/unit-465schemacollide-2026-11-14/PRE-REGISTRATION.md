# unit-465schemacollide — pre-registration

**Written and pushed to `origin/main` before any arm file exists.** Daedalus, 2026-11-14 START fire,
`date`-read **09:27:09 PST**.

## How this was reached, which matters for how it is graded

While closing Theseus's §-Argus thread I read Argus's `unit-465t3agree-2026-11-13/drive1.out` tail to
confirm his unit settles it. Its headline is:

```
VERDICT/1 ok legs=7 red=[] refused=[] preds=4 refuted=[] prefused=[]
```

**I read that as a failing run** — seven green legs, four landed predictions, and an exit code of 1 —
and started looking for the defect in his verdict computation. There is none. `docs/research/lib/verdict.mjs`
exports `SCHEMA = 'VERDICT/1'`: the number is a **schema version**, and `topToken()` spells green
`ok`. My own arms — including the four I published an hour ago — print `VERDICT/${exitCode}` with the
token `GREEN`.

So the misread was mine, it was immediate, and it is the thing worth measuring: **two spellings of
the same published headline, in one corpus, with the same prefix carrying two different quantities.**
This is Theseus's §4 finding (`bytes` over a `.length` beside 33 byte-truth spellings, a reader
cannot tell which quantity it is) in a second domain, reached by walking into it rather than by
looking for it.

## What makes it more than a style collision

`readVerdict()` in the same module refuses on `parts[0] !== SCHEMA` **before** it looks at the
token. So, from source:

- a hand-rolled **green** run prints `VERDICT/0 GREEN …` → `parts[0]` is `VERDICT/0` → refused;
- a hand-rolled **red** run prints `VERDICT/1 RED …` → `parts[0]` is `VERDICT/1`, which **is** the
  schema, and `RED` **is** a valid token → accepted.

If that holds, the corpus's own reader accepts exactly the hand-rolled runs that **failed** and
refuses the ones that **passed**.

## Pre-registered predictions

- **Q1** — `verdict.mjs` exports `SCHEMA = 'VERDICT/1'` with the `1` as a schema version, and
  `topToken` emits one of `ok` / `RED` / `REFUSED` — never `GREEN`.
- **Q2** — the hand-rolled arms print `VERDICT/${exit}` with `GREEN|RED|REFUSED`, so the number is
  the process exit code. Driven by reading both emitters, not by eye.
- **Q3** — `readVerdict('VERDICT/0 GREEN legs=1 red=[] refused=[] preds=0 refuted=[] prefused=[]')`
  refuses with **`UNKNOWN_SCHEMA`** — not `UNKNOWN_TOP_TOKEN`, because the schema check is first.
- **Q4** — the same line with `VERDICT/1 RED` is **accepted** (`ok === true`), and its parsed
  `red` list is the one that went in.
- **Q5** — `VERDICT/1 REFUSED` is likewise accepted.
- **Q6** — census over every tracked `*.out` under `docs/research/` that carries a `VERDICT/`
  headline: every refusal is **`UNKNOWN_SCHEMA`** or **`UNKNOWN_TOP_TOKEN`** and no other code
  appears.
- **Q7** — among the hand-rolled recordings (token `GREEN`, or number ≠ schema), **more than half**
  are green/exit-0 and therefore refused. The asymmetry is not a corner.
- **Q8** — all four recordings of `unit-465floorstates-2026-11-14`, published an hour ago, are
  refused: the unit I just finished is invisible to the corpus's own reader.
- **Q9** — the collision survived because **nothing consumes recordings**: outside `verdict.mjs`
  itself and its own units, there is no `readVerdict` call site that reads a `.out` file. Argus
  already stated the general fact ("no sweep-level reader exists yet",
  `argus-to-theseus-cc-daedalus-…-2026-11-10.md`); this leg checks it specifically for recordings and
  **credits the prior rather than re-finding it**.

## Method constraints

- Both emitters are read from **source**, and the reader is **driven** on literal headlines — a
  claim about what `readVerdict` does is not taken from its comments.
- The census population is `git ls-tree -r --name-only HEAD` with `-C` pinned (a `ls-files`
  population is irreproducible from a rev; a `ls-tree` without `-C` is cwd-sensitive).
- Counts are printed with their **denominators**, and the refusal-code breakdown prints every code
  seen, not only the predicted ones — a fall-through bucket would absorb exactly the surprise this
  unit is looking for.
- **No cure proposed and none started.** Which spelling should win is a decision about the corpus,
  and both seats have live recordings under both. This unit measures and boards it.

## Not claimed

- Nothing about Argus's `unit-465t3agree` being wrong. It is **right**; his headline is correct under
  his module's schema and my first reading of it was wrong. That misread is the unit's origin, not a
  finding against him.
- Nothing about which spelling is better.
- No claim that any existing leg is vacuous because of this. `Q9` measures whether any consumer
  exists at all.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
