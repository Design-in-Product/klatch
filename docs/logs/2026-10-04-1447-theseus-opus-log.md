# 2026-10-04 — Theseus (Opus 5) — WORK fire

## 14:47 — session start, briefing

Verified by tool call, not recalled:

- Branch `claude/theseus-cycle`, worktree clean, `git status --short` empty on arrival.
- `git log origin/main --format='%h %an'` on the five head commits: **none are this seat's** — three
  Daedalus (Round 329), one Argus (WORK fire), one Calliope (MID no-op). Checked `%an` rather than
  the subject line, because Daedalus's Round 329 subjects are in this seat's own subject shape.
  This seat's own last commit is `4d5e7934`, the 11:05 START-fire log.
- `docs/logs/` for 2026-10-04 held six logs on arrival: iris, calliope, argus, daedalus 0917,
  theseus 1047 (this seat's START fire), daedalus 1317. This is **this seat's second fire today**.
- Mail: one new memo addressed to this seat since the START fire —
  `daedalus-to-theseus-argus-…-your-re-key-is-landed-and-the-anchor-cure-reds-six-of-your-own-arms-including-the-two-that-price-it-2026-10-04.md`
  (Round 329). Read in full at the top of the fire.

### What Round 329 routed here

Three things, two of them actionable in this seat's own file:

1. **§5/§9 — C4 and C5 are self-invalidating**, priced at one line each, deliberately not started
   from his seat. *"An arm that recommends an action and reds when the action is taken is a one-shot
   arm."*
2. **§6 — A4's headline is now stale** after his re-key.
3. **§9 — the round324 label offer is live again** now that the key is right.

## 14:48 — baseline

`npm test` unpiped, redirected to gitignored `.testdata/r330/npmtest.txt`, each figure `grep`ped out
of the file separately rather than read off a pipe:

```
grep -c "error TS"   → 0
server               → 140 files passed
client               → 25 passed | 13 skipped
CENSUS OK · swept 36 · deferred 108
```

`probe-round328` driven unmodified against his re-keyed tree: **All 14 regression checks passed.**
His §6 confirmed by driving, not by reading his memo — the re-key cost this file nothing.

## 14:5x — his §4/§5 figures, driven on disk rather than reimplemented

Deliberate choice: his own §7 warns that the risk here is "a reimplementation that agrees for the
wrong reason". So the variants were applied to the real files and the real probe driven, in one
process (`.testdata/r330/variant.mjs`) with the restore in a `finally`. Pin bodies copied out of the
live source, not hand-typed. Known positive on the edit itself — the body must occur **exactly
once** per file, asserted before any write (it did: 1 and 1).

```
variant 0 — unmodified          All 14 regression checks passed.   FAIL: (none)
variant A — his half only       2 of 14 FAILED.                    FAIL: B1 C1
variant C — both halves         6 of 14 FAILED.                    FAIL: A2 B3 C1 C3 C4 C5
```

**Both counts and both arm sets are byte-for-byte what he published**, including the detail most
likely to be lost in a reimplementation: B1 *recovers* in variant C, so the variants are not ordered
by severity.

Restore verified, not assumed: `git status --short` empty, and each file compared byte-for-byte
against the string read before the edit — `true` for both.

## 15:0x — THE FINDING: his count is right and his mechanism is not

His §5 has C4/C5 computing `^\s*^\s*…` off an already-anchored live pin. Recomputed on the post-cure
tree:

```
probe-round324 anchored=true  hits=[148]
probe-round325 anchored=true  hits=[148]
edges with >1 hit (what C4/C5 call `collision`): 0
=> collision is UNDEFINED post-cure
C4/C5 reach the `^\s*` + live-pin construction at all? false
```

`collision` is `underCounted[0]` and `underCounted` is `edges.filter(e => e.hits.length > 1)`. **The
cure deletes the very edge the arms index into**, so `collision` is `undefined`, `anchoredBody` is
`undefined`, and both arms fall to their `=== undefined` fallbacks — which assert false.

**The evidence was already inside his memo and neither of us read it.** He pasted
`true (must be false) · false (must be true)`, which is exactly the `? true :` / `? false :`
fallback pair. A real `^\s*^\s*` body would give `false` then `false`, since a pattern matching
nothing matches nothing with or without `m`.

Why it matters, and the reason this was worth the fire's clock: **his routed cure would not have
cured it.** "Detect the already-anchored case" has nothing to detect, because detecting it requires
holding a collision edge whose existence the cure ends. An arm written to that prescription is still
`undefined` post-cure and still red.

Third occurrence in this thread of *sound figure, unsound mechanism* — mine in Round 328, his here.
Same cause both times: the count was driven and the cause was inferred.

## 15:1x — the repair

Define the subject by the property the cure does not change:

```ts
const bare = (s: string): string => s.replace(/^\^\\s\*/, '');
const subject = edges.find((e) => e.target === 322 && hitsOfBody(bare(e.re)).length > 1);
```

That edge resolves identically before and after the cure. `anchoredBody` is built from
`bare(subject.re)`, so it is idempotent and his predicted `^\s*^\s*` cannot arise either.

C5 also gained the control it lacked: its "does not match without `m`" assertion is indistinguishable
from "the pin resolved to nothing", which is precisely how it failed under variant C. It now also
requires the **bare** body to match the whole file.

**New arm C7** pins the idempotence his §5 named and no arm held — both predicates re-run against
both spellings of the pin, in memory, nothing on disk edited, verdicts must agree.

Disagreed with half his framing, stated in the memo: he wrote that a cure-pricing arm's green
"expires on application". The first half (it is evidence about a counterfactual) is right; expiry is
a choice. Idempotence is checkable **without applying anything**.

Also repaired in the same file:

- **A4** carried a *frozen* hand reading of round327's key expression under the words "Read off that
  file this fire" — false on every run since his re-key, with its own alibi built into the sentence.
  Now a live read. Zero edges still; Z1 unmoved at 0.
- **C6** published the coordinated repair at **zero reds to this file**. Not stale — *false when
  written*. Re-priced at the driven 2 and 6, with the rule named: "did I edit a pinned line?" is
  right for a verbatim-borrow pin and blind to an arm that takes the pin ARRAYS as its input.

## 15:2x — the repair driven, 6 → 4

Same driver, same variants, against the repaired file:

```
variant 0 — unmodified          All 15 regression checks passed.   FAIL: (none)
variant A — his half only       2 of 15 FAILED.                    FAIL: B1 C1
variant C — both halves         4 of 15 FAILED.                    FAIL: A2 B3 C1 C3
```

C4 and C5 out; C7 green in all three states; variant A unchanged at 2, as it must be.

### The four left red, and why they were deliberately not touched

A2, B3, C1, C3 could have been re-based the same way. They were not, because they are a different
thing and collapsing them would hide it. **C4/C5 were wrong post-cure** — C5 asserted the trap
backwards, so its failure under the applied cure looks exactly like the trap it warns about.
**A2/B3/C1/C3 are correct post-cure** — they red to report that the finding no longer holds, which
is a retirement notice, not breakage. Converting them would buy a green and spend the signal.

So the honest price of the cure is **4 arms, all retirement notices** — not 6, and not the 0 this
seat published.

## 15:2x — verification

- `npm test` after the repair, unpiped to `.testdata/r330/npmtest-after.txt`: **0 `error TS`**,
  server **140 files passed**, client **25 passed / 13 skipped**, `CENSUS OK`, swept **36**.
- `npx tsc -p scripts/tsconfig.json` **clean** — output file **0 bytes** by `wc -c`, not inferred
  from a silent exit.
- **The sweep DRIVEN, not censused.** The census drives zero probes and says so in its own output;
  `npm test` is not the sweep gate. `node scripts/sweep-probes.mjs`, full verdict line captured:
  **`SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census
  problem(s), 108 deferred`**. The one blocked is `probe-round225`'s pre-existing port-3001 block,
  tracked as not-mine in his §9. **0 red.**
- `probe-round328` from the sweep's own output: `PASS exit 0 · All 15 regression checks passed`.
- `expect:` restaged **14 → 15**, with the reason written into the `why:` string, not just the number.
- `git diff --stat -- packages/` **empty** — no product code touched this fire.

## Session wrap — Steps 1–3

### Step 1 — commits on origin/main

`git fetch` first, then `--format='%h %an'` so authorship is checked and not assumed:

```
$ git log origin/main --format='%h %an | %s' -3
f5dc11aa Theseus (Klatch) | mail: Round 330 reply to Daedalus — your six reproduces exactly, the mechanism you named is not the one that fires
1d2c111a Theseus (Klatch) | repair: Round 330 — C4/C5 were one-shot arms, and the routed cure would not have cured them
ec3b4c77 Argus (Klatch)   | coord+log: 10/4 WORK fire — Round 327-329 verified, no discrepancy, no-op
```

Both of this fire's work commits are on `origin/main` and both are **this seat's by author**, not
just by subject. The third is Argus's, correctly attributed.

### Step 2 — deliverable files exist on origin/main

Checked against the pushed tree with `git ls-tree -r --name-only origin/main`, not against the local
working directory — a file in the worktree is not a delivery:

```
docs/mail/theseus-to-daedalus-argus-…-the-mechanism-you-named-is-not-the-one-that-fires-2026-10-04.md
docs/mail/read/daedalus-to-theseus-argus-…-purpose-is-per-edge-2026-10-04.md
docs/mail/read/theseus-to-daedalus-argus-…-linekey-is-the-pin-text-2026-10-04.md
scripts/probe-round328-…-reads-as-two.mts
scripts/sweep-probes.mjs
```

All five present, including both halves of the closed Round 327/328 pair in `read/`.

### Step 3 — session log pushed last

This log is committed and pushed after Steps 1 and 2 were run.

### Nothing left unfinished

Two items are deliberately not-done and both are named with reasons: the round324 labels (his offer,
now unblocked, not started — the fire's clock, and it lands in this seat's file so he should not
start it either), and the four retirement-notice arms (left red-under-cure on purpose). Neither is a
stranded half-operation. One item is routed to him: his §5 prose, which `probe-round329` is about to
mechanise — if it pins the stated mechanism it will pin a thing that does not happen, and it will
pass, because the arms really do fail.

**Nothing in this fire needs a decision from xian.**
