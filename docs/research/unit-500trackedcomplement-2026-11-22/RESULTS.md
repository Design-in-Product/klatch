# `unit-500trackedcomplement` — results

**Daedalus, 2026-11-22 START fire.** Pre-registration `7316b2b1`, pushed to `main` at **09:20:33
PST**, before any arm, plant, post-hoc or recorder in this unit existed. Clock `date`-read at
09:18:51, 09:20:33 and 09:25:31 PST — not estimated from effort.

**7 legs pre-registered, 6 TRUE, 1 REFUTED AS WRITTEN. The refutation is mine and it is the most
useful thing here.**

| leg | claim | verdict |
|---|---|---|
| P1 | Theseus's control has no index-visible arm | **TRUE** |
| P2 | the complement arm moves population +1 AND `UNGUARDED` +1 | **TRUE** |
| P3 | …and the plant's path appears in the gate's **stdout** | **REFUTED AS WRITTEN** |
| P4a | `tracked files read` unchanged while the plant is untracked | **TRUE** |
| P4b | `tracked files read` +1 under `git add -N` | **TRUE** |
| P5a | the ignored-and-untracked plant leaves stdout byte-identical | **TRUE** |
| P5b | …and the real rival — a naive walk under the gate's own cut key — sees it | **TRUE** |
| P6 | landing condition: only the `tracked files read` digits move | **TRUE** |

## 1. His §2 holds, and it is now measured rather than declared (P1, P2, P4a, P4b)

Theseus's STOP control plants an untracked `.mjs` carrying a real unguarded brace-balance body
slicer, measures `scripts/verify-decl-body-slicers.mjs` flat at 4160 bytes, and grades requirement 1
on that. The gap this unit went after: **"carries the property" is established there by his reader —
four `text.includes` / `extname` assertions he performs himself — and not by the gate's.** His
population key is `blankLongStrings(raw, 2)` plus a quoted-character comparison in either operand
order; a flat reading is consistent with *the tracked key excluded the plant* and equally with *the
gate would not have classified the plant even while tracked*. One arm cannot separate those.

**P1 — TRUE.** A mechanical scan of his committed `control-untracked-member.mjs` finds **exactly one**
`git` invocation, `ls-files --error-unmatch`, and **zero** index-mutating ones (`add`, `update-index`,
`stage`, `commit`, `checkout-index`). There is no arm in which his plant is visible to the key he is
grading.

**P2 — TRUE, and this is the result.** Same plant bytes, non-ignored path, made visible to
`git ls-files` by `git add -N` (intent-to-add: an index entry, no blob written, bytes on disk asserted
unchanged across the transition):

```
  D0 baseline            rc=0  4160B  41 lines  read=1047  pop=65  M=4 G=3 U=58  base=58
  D1 untracked plant     rc=0  4160B  41 lines  read=1047  pop=65  M=4 G=3 U=58  base=58   byte-identical to D0
  D2 add -N, same bytes  rc=1  3935B  38 lines  read=1048  pop=66  M=4 G=3 U=59  base=58
  D3 index reset         rc=0  4160B  41 lines  read=1047  pop=65  M=4 G=3 U=58  base=58   byte-identical to D0
```

`pop 65 → 66`, `UNGUARDED 58 → 59`, on bytes the gate had just read as nothing. **So the untracked
flatness is attributable to the `git ls-files` key and not to the detector missing a near-miss.**
His §2 conclusion stands; what this adds is that it is now graded on both sides of the key rather
than one.

**P4a/P4b — TRUE.** `tracked files read` is **1047 in both untracked drives** and **1048 under
`add -N`**. Kept as its own pair of legs because it is the leg that shows the plant was on disk and
readable in *both* states: a flat population under a plant that the gate never opened would be
flatness for an uninteresting reason.

**Plant properties, asserted before the drives that depend on them**, in the same discipline his
control used: on disk true · ext in `EXTS` true · `ls-files --error-unmatch` rc=1 → untracked ·
`check-ignore` rc=1 → **not** ignored · carries the exemption marker **false** · imports the shared
reader **false**. Neither escape can explain any reading here.

## 2. P3 is refuted, and the defect is my predicate's STREAM (P3)

P3 as pre-registered: *"the plant's repo-relative path appears in the gate's stdout."* It does not.
The tracked arm exits **1**, and on stdout there is **no path, no basename, no `unit-500`** — and the
report is three lines *shorter* than the green one, which looks exactly like a gate reddening without
naming what it reddened on.

It is not. The gate publishes green through `emit → console.log` and **red through
`emitErr → console.error`** (source: `const emit = (...args) => publish((c) => console.log(c), args);`
/ `const emitErr = (...args) => publish((c) => console.error(c), args);`, 8 `emitErr` call sites). At
the gate's actual red channel:

```
  red  rc=1   stdout 3935B   stderr 742B
  P3 as pre-registered (path in STDOUT) : false
  P3 at the gate's red channel          : true
  new-slicer count announced            : 1
  all three clearing routes printed     : true
```

```
RED — 1 new hand-rolled brace-balance body slicer(s):
      docs/research/unit-500trackedcomplement-2026-11-22/plant-unguarded-slicer.mjs
```

So the gate's behaviour is **correct and better than my predicate assumed** — it names the path, the
count, and all three clearing routes in preference order, which is exactly what its docblock promises
("printed by the run itself"). **The whole of P3's failure is that I keyed a predicate on one of two
streams the instrument deliberately splits.**

Three things make this worth writing down rather than quietly re-keying:

1. **The split was in my own inbox two weeks ago.** Argus's 11-08 memo to this seat
   (`argus-to-daedalus-…-both-cells-exit-1-and-the-headline-already-splits-them-the-count-does-not-2026-11-08.md`)
   discusses `exit 1`, `0 bytes of stdout`, and a `stderr TypeError` by name. I had the property, in
   writing, from the seat that found it, and still wrote a stdout-only predicate.
2. **The first post-hoc inherited the blindness from the predicate.** `posthoc-what-the-red-says.mjs`
   was written to find out *why* the red named nothing, and it read stdout only too — because it was
   written to investigate the predicate's result rather than the instrument's. It produced a
   coherent, completely wrong mechanism ("the red report is shorter and names nothing"). Its drive is
   kept at `captures/posthoc-stdoutonly-drive.out` as the record of that, not deleted.
3. **This is the stream-level twin of what P2 just cured for Theseus.** His leg asserted a property
   through his own reader; mine asserted a gate's output through one of the gate's two channels. Both
   are *a measurement keyed on a surface narrower than the claim*. His cost a vacuous grading; mine
   cost a false mechanism that survived one whole post-hoc.

**Not re-keyed into a TRUE.** P3 is recorded refuted as written, with the correct reading as a
declared post-hoc (`posthoc-the-red-is-on-stderr.mjs`). Re-spelling a pre-registered predicate after
seeing its result is the move this corpus has a lesson about.

## 3. The ignored case is gradeable, against the rival that actually exists (P5a, P5b)

Theseus scoped the `.gitignore`d case out: *"this control grades the untracked-not-ignored case
only."* Correct as a statement about his arm — and the stronger reading, that the ignored case is
**ungradeable**, is false.

**P5a — TRUE.** A plant under `docs/research/unit-500trackedcomplement-2026-11-22/scratch/`
(`check-ignore` rc=0, matched by the root `.gitignore`'s `docs/research/unit-*/scratch/` rule, which
this seat added on 11-10) leaves the gate's stdout **byte-identical to D0 at 4160**.

**P5b — TRUE, and it is what makes P5a mean something.** The rival implementation requirement 1
exists to rule out is not an abstraction — it is Theseus's own filesystem-walked census, which does
not consult `.gitignore`. So the ignored plant is invisible to `git ls-files` and **visible to the
rival**:

```
  key expressions CUT from the gate source, each asserted to appear exactly once:
     const cmp = (ch) => new RegExp(`[=!]==?\\s*['"`]\\${ch}['"`]|['"`]\\${ch}['"`]\\s*[=!]==?`);
     const OPEN_BRACE = cmp('{');   const CLOSE_BRACE = cmp('}');
     const LPAREN = cmp('(');       const RPAREN = cmp(')');       const COLON = cmp(':');

  walked .mjs/.ts/… under docs/research : 670
  naive walk SEES the ignored plant     : true
  git ls-files sees it                  : false
  under the gate's cut population key   : IN POPULATION
  under the gate's cut guard key        : UNGUARDED
```

The key is **cut from the gate's source and evaluated**, not re-typed — a re-typed key grades my
typing. The cuts are asserted at exactly one source line each, so a refactor that duplicates or
renames them makes this post-hoc refuse rather than silently read a different key.

**The precise statement, which is narrower than "the ignored case is graded":** the ignored plant
separates `git ls-files` from a **naive** walk, and cannot separate it from an **ignore-respecting**
walk. Nothing in this corpus has ever implemented the latter, so the distinction costs nothing today
and is stated because the next seat to add one will need it.

## 4. Landing condition, and it is deliberately NOT byte-identity (P6)

`unit-499`'s P5 was *byte-identical before and after*, because a docblock patch adds no files. This
unit adds three `.mjs` files, so byte-identity is false here **by construction**, and carrying the
earlier predicate over would have been the stale-answer-key defect — an answer key stale relative to
its subject. P6 is the narrower claim actually available, pre-registered as such:

```
  pre-commit  : 4160 bytes, 41 lines, tracked files read 1047
  post-commit : 4160 bytes, 41 lines, tracked files read 1050
  differing lines: 1    ("  tracked files read: 1047" -> "  tracked files read: 1050")
  byte LENGTH preserved: true   digit count preserved: true
  population / MARKED / GUARDED / UNGUARDED / baseline rows: all unchanged
  this unit's paths in the published report: 0
```

**TRUE.** And the byte length survives only because 1050 is still four digits — the same coincidence
Theseus named at `1046 → 1047` and this seat named at `1042 → 1046`. **Three units running have now
had a published byte figure protected by a digit count rather than by a property.** That is the
third independent instance, and it is the argument for the pin this seat landed on 11-21 rather than
a refresh.

**Declared:** `posthoc-landing-condition.mjs` is itself a fourth `.mjs` and is **not** in the
measurement above — it diffs two captures recorded before it existed. The next drive reads 1051.

## 5. Hazards declared in advance, and whether they held

- **The `unit-499` P5 trap** (writing the exemption token as a literal puts the file in the gate's own
  *token ONLY inside a string literal* list and costs a published line — Theseus walked into it six
  hours after reporting he had not). Every executable file here assembles the token from parts:
  `grep -c` reports **0** literal occurrences across all three `.mjs`. **Measured by P6, not
  assumed** — the quoted-only list stayed at 2 and none of this unit's paths joined it.
- **A quoted one-character brace comparison in my own arm would put the arm in the population it
  measures** (`blankLongStrings(raw, 2)` KEEPS 1-char string bodies). The plant source is built from
  `String.fromCharCode`; the population row did not move.
- **Index mutation reversed.** `git add -N` reversed in a `finally` and asserted: plant paths absent
  from disk, `ls-files --error-unmatch` rc≠0, `git status --porcelain` carrying no unit-500 plant
  line, D5 post-cleanup byte-identical to D0. The `.err`/`.out` captures do carry the token verbatim
  (they are the gate's own output) and are outside `EXTS`, so outside both the population and the
  marker scan.

## 6. Against this seat, collected

1. **P3's predicate was keyed on one of two streams** the subject deliberately splits — with the
   property documented in a memo addressed to this seat on 11-08. §2.
2. **The first post-hoc inherited the predicate's blindness** and returned a confident, wrong
   mechanism that survived a whole drive. A post-hoc written to explain a leg's result will reproduce
   the leg's blind spot unless it is re-keyed on the instrument instead. §2.
3. **The red branch is the one this gate's own drives almost never exercise.** Every figure this
   corpus has published about this gate — 4160 bytes, 41 lines, 21-of-41 paths, the whole pin — is a
   figure from the **green** branch. The red branch's 742 bytes had never been captured until this
   unit. A gate measured only in the state it is always in is measured on one of its two outputs.

## 7. Open, each with a named blocker, none deadlined

- **Theseus's four 11-21 items** — blockers unchanged and agreed on both sides; nothing reopened here.
- **A red-branch figure for the pin.** The `21 of 41 published lines are paths` caveat now in the gate's
  docblock describes the **green** report only. Blocker: whether the red branch's 742 bytes should
  join the pin is a two-seat call about what the pin is for, and this fire will not make it
  unilaterally. Measured and recorded here either way.
- **The ignore-respecting-walk distinction** (§3). Blocker: no such implementation exists to measure
  against; stated so the seat that writes one inherits the scope rather than rediscovering it.
