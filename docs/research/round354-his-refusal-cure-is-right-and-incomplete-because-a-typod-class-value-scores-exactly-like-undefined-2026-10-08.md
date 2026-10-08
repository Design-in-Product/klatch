# Round 354 — his refusal cure is right, is kept, and is incomplete in its own mechanism: a typo'd class value scores exactly like `undefined`

**Theseus, 2026-10-08 WORK fire.** Verifying Daedalus's Round 353
(`docs/research/round353-the-routed-wording-fix-is-landed-as-a-fixture-and-his-own-key-scores-undefined-against-a-stale-table-2026-10-08.md`),
routed to me as a design change for my call.

Baseline `origin/main` at `0156511a` at fire start; worktree clean.

**`%an`-checked first (Round 326), and it earned itself for the fourth time in nine days.** The three
head commits above my last were subjected *"Round 353 …"* and one of them was
*"log: session-wrap verification for the 10-08 WORK fire"* — my own wrap shape, in my own fire's
shape, on today's date. All three are **Daedalus's** (`431b4c20`, `927f5e67`, `d50f6c51`), with
`15f93abd` **Argus's**. Had I read `--oneline` I would have opened this fire believing my own WORK
fire was already filed and done nothing.

---

## 1 — Round 353 reproduces whole. No discrepancy anywhere.

Every figure below was re-driven this fire at its own source, not read off his writeup.

| Claim (his) | Mine | Source |
|---|---|---|
| 6 grades true | **6 of 6 true** | `node docs/research/round352-valuation-leg-key.mjs` |
| population 194 | **194** | same, `readdirSync` walk |
| offsets preserved | **true** | same |
| assign-leg class 11 members | **11** | same |
| member lists live === hand | **true** | same |
| crude leg wrong on 2 of 11 | **2 of 11** (`:621` `HOISTED_TERNARY_SITE`, `:834` `HOISTED_KP`) | same |
| (A) disagreement on 1 | **1** (`:1017` `SWALLOW_KP`) | same |
| (B) 6 called label-valued | **6** | same |
| `'MEAS (inner)'` outside the class | **true** (grade 5) | same |
| `:780` is one line, no valuation test | **confirmed at the line** | `probe-round269…mts:780` |
| 3 known positives, all flag=true | **confirmed verbatim in F9's live detail string** | driven, read out of the run |
| class still 11 after his fixture, no 12th member | **11** | the key's own member table |
| `:825 → :834`, `:992 → :1017` | **both re-read at source** | the key's live member list |

The assign leg at `:780`, read at the line:

```ts
if (!/['"`]MEAS['"`]/.test(rhs)) continue;       // quote-delimited: MEASURED cannot match
```

One line, and it is the whole RHS requirement. My routed §2 reading is right at the source, and it
has landed in **both** places — the docblock (`:939`, `:968`) and the detail string (`:1064`), the
latter read out of a live run, because the file cannot tell you what a reader sees.

**His load-bearing claim, driven rather than accepted.** *"A predicate narrowed back to label-valued
now reds F9."* That is the whole value of converting my inert wording fix into a graded fixture, so
accepting it on his word would reproduce the exact failure my own Round 345 note names — a routed
finding does not validate its routed cure. Driven in a `git init`'d scratch repo holding a copy of
`scripts/` (Round 332), mutation anchor asserted to occur **exactly once** before mutating (Round
347), and graded by **red SET rather than red count** (Round 340):

```
KN  unmutated scratch copy       exit=1  F9=PASS   RED SET (4): J1, J2, J5, J6
KP  narrowed to label-valued     exit=1  F9=FAIL   RED SET (5): F9, J1, J2, J5, J6
reds the mutation ADDED: F9          reds the mutation REMOVED: (none)
```

**CONFIRMED.** The mutation adds exactly `F9` and removes nothing.

Two honesty notes on that harness. First, the KN is **not green** — four J-arm checks red in the
scratch copy because they read the real repo's git history, which a fresh `git init` does not have.
A red KN cannot grade a count, which is why the discrimination is scoped to the F9 member and the
four J reds are shown present on **both** sides. Second, the first KN attempt exited 1 with **no
summary line and no F9 line at all** (`fatal: bad revision 'HEAD'` — `tree-fingerprint` shells
`git diff HEAD`, and `git init` alone has no HEAD). Had I run the KP first and read its red as the
discrimination, I would have published a confirmation produced by a broken harness. The rule that
caught it is the cheap one: grade the known negative before you believe the known positive.

## 2 — His cure is right, and it is KEPT

The design change he routed back for my call — the score **refuses** (`exit 2`, no figure printed)
when the hand reading does not cover the live class. Graded, in a gitignored scratch copy at the
same depth so `../../` still resolves to the real repo:

```
KP2 stale hand KEY       exit=2   MEMBER LISTS: false   CRUDE LEG vs HAND READING: REFUSED, no figure
KN  clean copy           exit=0   MEMBER LISTS: true    wrong on 2 of 11 · (A) 1 · (B) 6 · 194 · 11
```

**My call: keep it.** It is the correct reading of my own Round 352 lesson — the figure is what a
reader sees, not the guard line above it — applied to the instrument that carried that lesson. The
line-number reconciliation in the HAND table is likewise correct and re-read at source.

## 3 — THE FINDING: the cure guards the key side of his mechanism and leaves the value side open

His mechanism, in his words: `handOf.get()` returns `undefined` for a moved member, and
`(undefined === 'label')` is `false`, so an unscored member is counted wrong-or-right by whatever the
crude leg happened to say.

**That mechanism is not about `undefined`. It is about equality against a single value.** The score is

```js
return m.crude !== (h === 'label');
```

and `(h === 'label')` is `false` for **every** value outside the declared domain — not only for a
missing one. The guard he added keys on `liveKeys !== handKeys`, i.e. on member **identity**. A
corrupted class **value** leaves the key set byte-identical, so the guard says `true`, the refusal
does not fire, and the exit code is 0.

Driven, not argued. One byte changed in one hand class value (`'label'` → `'labell'` on
`probe-round224-a-skip-must-not-summarise-as-a-pass.mts:71`), anchor asserted unique first:

```
KN  clean copy                        exit=0  MEMBER LISTS: true  →  wrong on 2 of 11
KP1 typo in a hand CLASS VALUE        exit=0  MEMBER LISTS: true  →  wrong on 3 of 11
```

**Same guard, same `true`, same exit 0, and the headline figure moved.** This is his finding with the
value side substituted for the key side, and it is reachable today by a single keystroke — which is
not hypothetical, because the reconciliation that a moved member *demands* is exactly the operation
that retypes both the key and its value. The docblock had declared three legal values
(`label` / `call` / `array`) and nothing enforced them, which is what made the declaration decorative.

**Cured the same way he cured his**, in my own file: the value domain refuses too, names the
offending entries, and prints no score.

```
KP1 typo       exit=2   HAND values inside the declared {label, call, array} domain: 10 of 11
                        CRUDE LEG vs HAND READING: REFUSED — 1 hand value(s) are outside the declared domain
                              probe-round224-a-skip-must-not-summarise-as-a-pass.mts:71 — class="labell"
KP2 stale key  exit=2   REFUSED on the member list (his cure, preserved)
KN  clean      exit=0   every figure restored: 194 · 11 · 2 of 11 · (A) 1 · (B) 6 · 6 grades true
```

## 4 — A second defect, mine, from Round 352: the guard's diagnostic matched substrings

The member-list guard's two explanatory lines tested membership with `includes()` against the
`|`-**joined** key string:

```js
.filter((k) => !handKeys.includes(k))     // handKeys is a joined string, not a set
```

A key that is a proper prefix of another therefore tests **present when it is absent**: with a live
key `x.mts:1017` in the joined string, `.includes('x.mts:101')` returns `true` — driven, not
reasoned. The consequence is in the same family as everything above: the guard still says `false`
correctly, while the list a reconciler actually works from **silently omits** the stale entry, i.e.
tells them that member is fine.

**Reachability, stated rather than implied: NOT reachable in today's table.** Checked mechanically —
of the 11 declared keys, **0** are a proper substring of another. So this moved no figure in any run
this fire or last. It is a latent defect in a line that only executes once something is already
wrong, which is precisely when it is relied on. Now set membership, which has no prefix semantics.

## 5 — His `:8080` item, re-measured independently in a second fire

He settled it with a before-reading: before and after his sweep identical, so the occupant predates
the sweep. Re-measured here with the **lib** instrument
(`scripts/lib/probe-server-ownership.mts` — a bind test has a miss in every column, so the question
asked is "does a connection succeed?"), before and after my own sweep:

```
BEFORE: 3001 accepts=true/bind=false | 3002 f | 4001 f | 4100 f | 4321 f | 8080 accepts=true/bind=true
AFTER : 3001 accepts=true/bind=false | 3002 f | 4001 f | 4100 f | 4321 f | 8080 accepts=true/bind=true
```

Identical on all six, and identical to his readings. **Not a leak**, now confirmed across two
independent fires. Owner still unattributed: `lsof` is not permitted here either.

## 6 — Gate, exact to his

- `tsc` server and client, each to its own file: **both 0 bytes**, exit 0.
- `npm test` unpiped and ANSI-stripped: **server 140 files / 2178 passed / 1 skipped (2179)**;
  **client 26 passed | 13 skipped (39) / 333 passed | 13 skipped (346)**; `CENSUS OK`. Exit 0.
  The census prints its own `NOT CHECKED: none of the 36 swept probes was driven` — it is not the
  sweep gate and says so.
- `round269` alone with the exit code via `spawnSync`: **EXIT 0**,
  `All 56 regression checks passed, 3 measurements, 0 skips`, **F9 PASS**, **F10 PASS**, derived line
  byte-identical (`4 hoisted-tag site(s) across 194 code files`, same four pairs
  `round224-a:71→72, round224b-:57→58, round247-a:67→68, round255-t:171→172`).
- Sweep by **verdict line**, exit code taken from `spawnSync` and not from a pipe:
  **exit 2**, `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred`;
  the one blocked is `probe-round225-a-citation-is-not-a-call.mts` (`BLOCKED exit 3`).

## 7 — Limits

- **Rows 1–6 of the dimension table** remain my Round 350 measurement, attributed, and are **not**
  re-derived here — six fresh keys returning 0 is the shape a false zero takes.
- **The four declared sites and the 109 DEFERRED probes** were not driven this fire; unchanged scope.
- **`array` stays a hand class.** I am not proposing a third column either.
- **My §3 limit from Round 352 is still recorded and still not cured** — re-key before the leg is
  pointed wider. No arm, because the leg is never applied to a member it gets wrong.
- **The scratch-repo J-arm reds (J1/J2/J5/J6)** were not diagnosed. They are artifacts of a fresh
  `git init` lacking the real history, they are present on both sides of the discrimination, and no
  figure here rests on them. Blocker: none — deliberately out of scope, not deferred work.
- **`:3001`'s and `:8080`'s owning PIDs** stay unattributed; `lsof` is not permitted.
- **The value-domain cure is graded on a one-byte typo.** It enforces the declared domain; it cannot
  catch a class value that is *in* the domain and simply *wrong* at source. That needs the member
  re-read by hand, which is what the table is for, and is why 11 members is the size at which the
  hand reading stays primary (Round 337).

Nothing here needs xian. Argus's 10/06 Laya/AAXT memo to the CIO is still the one thread parked on
his scheduling call.
