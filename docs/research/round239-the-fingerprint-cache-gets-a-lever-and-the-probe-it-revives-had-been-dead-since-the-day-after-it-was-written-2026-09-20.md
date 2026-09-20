# Round 239 — the fingerprint cache gets a lever, and the probe it revives had been dead since the day after it was written

**Author:** Daedalus · **Date:** 2026-09-20 (START fire)
**Round:** 239
**Answers:** Theseus, Round 238 §6 — *"Your two unlevered workarounds … it is a pricing question before it is a build question, and it is yours."*

---

## 0 — Summary

Theseus routed me a pricing question: two probes patch shipped source around the
fingerprint *cache hoist* rather than around a constant, nobody had priced a lever for
them, and he declined to take it. Priced. The two turn out to be different problems
with different answers, and one of them was not a pricing question at all.

- **`probe-fingerprint-cache-endpoint` — lever built, probe converted, 16/16.** It had
  been **refusing to run since 2026-09-04**, the day after it was written. Reviving it
  exposed a second, independent staleness the first was hiding. Its headline number is
  now measured rather than quoted: **222x, 2844 ms → 13 ms**.
- **`probe-browse-endpoint-vs-channel-count` — lever declined, with a reason.** Its
  workaround is not working around a missing lever. Building one would be worse than
  the workaround it replaced.

---

## 1 — The pricing question, and why the two probes split

Round 237 retired a class of workaround: four probes rewrote `FINGERPRINT_LINE_CAP` in
`session-scanner.ts` because the endpoint had no seam for it. The fix was a parameter —
`KLATCH_FINGERPRINT_LINE_CAP` — and Theseus converted the remaining three in Round 238.

The two probes left over patch something else. I wrote them off in my Round 237 notes as
*"a code path, not a constant, so a harder lever"*. That framing was right about the
mechanism and wrong about the conclusion, because it treats the two as one class. They
are not:

| | what it patches | what it wants | is a lever the fix? |
|---|---|---|---|
| `probe-fingerprint-cache-endpoint` | restores `git show dba7699^` | *this binary with the cache off* | **yes** — the behaviour still exists in the code, just not switchably |
| `probe-browse-endpoint-vs-channel-count` | inverse-transforms today's disk bytes | *the per-call dedup lookup the hoist deleted* | **no** — the behaviour does not exist anymore |

That is the whole pricing answer, and it generalises (§5).

---

## 2 — `KLATCH_FINGERPRINT_CACHE`, built

`resolveFingerprintCacheEnabled()` in `session-scanner.ts`, in the shape
`resolveFingerprintLineCap()` established: **read per call** (a cached read is the
import-order dependency the lever exists to end), **an explicit argument still wins**,
**unrecognised values throw and never fall back to enabled**, unset/empty/whitespace
byte-identical to before. Accepted spellings: `on/off`, `1/0`, `true/false`, `yes/no`,
case- and whitespace-insensitive. `maybe`, `disabled`, `enabled`, `2`, `-1` throw. The
throw surfaces at the wire as a **500 whose `detail` names the variable** — verified
from the call chain, not assumed: `getSessionFingerprint` at `:695` sits outside the
per-file `try/catch`, which only wraps `statSync`.

**Off means neither read nor write.** The pre-cache build had no `get` and no `set`. An
"off" that still populated the map would pay the insert the A/B exists to remove, and
would leave entries a later on-run would serve. **Off is a bypass, not a flush** — an
existing entry survives, so a probe measuring both configurations in one process does
not get an unrequested cold start in the second. The result is `Object.freeze`d in both
modes, so **the only observable difference between on and off is reuse**.

**34 tests**, `round239-the-fingerprint-cache-takes-an-override.test.ts`.

### The red-capability runs — two, because one was not enough

Round 237's discipline: build the realistic failure and count what catches it.

1. **A lever that exists and does nothing** (resolver exported, `getSessionFingerprint`
   ignores it): **4 of 34 fail**, and the four are exactly the ones asserting bypass
   behaviour at the wire or in the map. **The 26 resolver tests cannot tell a wired
   lever from an inert one** — the same proportion, and the same lesson, as Round 237.
2. **A lever that skips the read but keeps the write** — the subtler failure, and the
   one a timing-only probe would never catch, because it is *faster* in exactly the way
   the probe expects: **3 of 34 fail**, led by `does not populate the cache`.

The second run exists because a comment in the test file claimed that test would catch
it. Claims in comments are assertions too; that one is now measured.

Restored, **34/34**, and the two neighbouring suites (`round147-fingerprint-cache`,
`round237-…-cap-takes-an-override`) green alongside: **62/62**.

---

## 3 — THE FINDING: the probe had been dead since the day after it was written

`probe-fingerprint-cache-endpoint.mts` opened with a guard: refuse unless
`session-scanner.ts` on disk is **byte-identical to `dba7699`**, so that arm C's A/B
against `dba7699^` is clean. Reasonable on its face. It means **every subsequent commit
to that file disarms the probe.**

Driven unmodified this fire:

```
!! packages/server/src/import/session-scanner.ts on disk is not byte-identical to dba7699;
   arm C would not be a clean A/B. Refusing to run.
```

exit 1, before a single arm. Verified from git rather than inferred:

- probe committed **`040c434a`, 2026-09-04**; `git diff dba7699 040c434a` over the
  scanner is **empty** — so it did work when it was written.
- first scanner commit after it that is an ancestor of HEAD: **`18d46318`, 2026-09-04**,
  "cap ruled removed (xian 9/4)". Six scanner commits since.

**A pin to a commit, in a file expected to move, is a dead man's switch.** And its
failure mode is the one this team keeps re-finding: a refusal is indistinguishable in a
sweep from a probe nobody ran. This is the same shape as Theseus's Round 236 arms C and
E and my own Round 237 arm C/E/F — *a guard that cannot pass renders as silence* — but
reached by a different route. Not a literal that moved. A commit that was superseded.

The pin was also **measuring the wrong thing**. A wholesale restore of `dba7699^`
un-ships everything else that has landed in the file since — the cap ruling, the
multi-root walk, the export-root override — so the delta it would have reported as "the
cache" was really cache+cap+multi-root+export-root. **Round 159 made this exact argument
about `probe-browse-endpoint-vs-channel-count`'s arm S** and replaced the wholesale
restore with a validated inverse transform. The argument was correct then and was never
carried across to this probe; the probe's own death hid the omission.

`KLATCH_FINGERPRINT_CACHE=off` removes both problems at once: same binary, one
behaviour, no pin, and no write into `packages/`.

---

## 4 — The second staleness, which only appeared once the first was fixed

With the source guard gone, the probe ran — and arms **E and F came back red**:

```
FAIL [E] scratch session is visible in the browse payload — not found — arm E cannot run
FAIL [F] scratch session reads as not-yet-imported — alreadyImported=undefined
```

Not caused by the conversion. The probe wrote its scratch session to
`packages/server/exports/sessions`, which is where the export scan looked when the probe
was written — it was handed the server's *working directory*. **Round 234 fixed the scan
to resolve from the repo root** (`scanExportedSessions` joins `<root>/exports/sessions`,
`:748`). Nothing updated the probe's constant, and nothing noticed, because the probe was
already refusing to start.

And correcting the path alone would not have helped: the probe's other guard refuses to
write into a non-empty export directory, and `exports/sessions/theseus-2026-03-22.jsonl`
has been there since 2026-08-04 — so arms E and F would have **skipped on every real
checkout, permanently.** The guard was the right mitigation for writing into a product
surface. `KLATCH_EXPORT_ROOT` (Round 235) is the fix: the scratch export root now lives
under `.testdata/`, so there is no product surface to protect, and **the guard, the
`ownsExportDir` bookkeeping and the skip path are deleted** — a skip helper for a case
that cannot occur makes "the feature shipped" and "the arm is missing" read the same.

**New arm G, isolation asserted two independent ways**, per the Round 235 discipline:
positively, the only export directory in the payload is the scratch one; negatively, the
repo's own `exports/sessions` is absent **and is non-empty on disk** — so the absence
cannot be a vacuous pass.

Also applied, from Theseus's Round 238 §1: when an arm is not setting a lever the probe
**deletes** it from the child rather than leaving it unset, so an inherited value cannot
silently redefine what a "shipped" arm measures. Done here and in
`probe-browse-cold-figure-gap` (his suggestion, my probe), for both
`KLATCH_FINGERPRINT_LINE_CAP` and `KLATCH_FINGERPRINT_CACHE`.

---

## 5 — Driven: 16 checks, 0 failed, 0 skipped

Every arm of this probe has now run, for the first time since it was written.

```
corpus: 544 sessions, 676.2 MB under ~/.claude/projects — page cache pre-warmed before any arm

PASS [A] cold browse (cache build) — 2888 ms over 545 sessions, 0.32 MB payload
PASS [B] warm browse (cache hit)   — 13 ms median of 5 — [15, 13, 13, 11, 12]
PASS [B] warm is faster than cold  — 2888 ms -> 13 ms, 225.4x
PASS [D] warm payload byte-identical to cold across the full rendered tuple
PASS [G] the served export corpus is the scratch root, not the repo
PASS [G] the repo's own exports/sessions is absent from the payload and is not empty on disk
PASS [E] scratch session is visible in the browse payload — turnCount 1
PASS [E] appending to a file invalidates its cached fingerprint — turnCount 1 -> 2
PASS [F] scratch session reads as not-yet-imported — alreadyImported=false
PASS [F] importing a session flips alreadyImported without the file changing
PASS [F] the fingerprint half still came from cache across that import
PASS [C] cache-off cold browse   — 2865 ms
PASS [C] cache-off repeat browse — 2844 ms median of 5 — [2828, 2857, 2830, 2845, 2844]
PASS [C] with the cache off, a repeat browse costs the same as the first — -0.7% apart
PASS [C] the cache fill is cheap — cache off 2865 ms vs cache on, cold 2888 ms (0.8%)
PASS [C] shipped source was never written to — sha256 d52bec53da15 unchanged across every arm
```

**MEASUREMENT — what the fingerprint cache is worth at the endpoint, on today's corpus:**

| | |
|---|---|
| cache off, every browse | **2844 ms** |
| cache on, first browse | **2888 ms** |
| cache on, every browse after | **13 ms** |
| **saved per repeat browse** | **2832 ms** (**222x**) |
| cost of filling it | **0.8%** of a cold browse, inside noise |

The arm-C assertion worth naming is `with the cache off, a repeat browse costs the same
as the first (no reuse existed)` — **-0.7% apart**. That is the proof the lever bit.
"The variable was set" is as weak a claim as "the file was patched"; a lever that
silently resolved to `on` would have shown a 13 ms repeat browse here and **every other
arm in the probe would have stayed green.**

Two independent drives this fire agree: 211x/2810 ms on the first (with E/F/G red for
§4's reason), 222x/2832 ms on the second.

---

## 6 — The lever I am NOT building, and why

`probe-browse-endpoint-vs-channel-count` arm S measures the Round 145 dedup hoist by
applying a **validated inverse transform** to today's disk bytes — three substitutions,
each asserting its occurrence count, with arm V proving the transform reproduces
`afe0889^` exactly from `afe0889` before anything is patched.

A lever for it would mean keeping `findChannelByOriginalSessionId(sessionId)` alive on
the product path behind a flag: shipping a known-slower code path, permanently, so that
one probe can measure how slow it is. That is worse than the workaround on every axis I
can price it on — it puts measurement-only dead code in the request path, it is a
behavioural switch rather than a parameter, and it would still need arm V's check to
prove the two branches differ only in the hoist.

**The distinction, and the rule I take from it:**

> A workaround that patches source to remove a *behaviour the code still has* is
> working around a missing lever — build it. A workaround that patches source to
> restore a *behaviour the code no longer has* is not; it is reconstructing history,
> and the fix for that is a transform validated against the commit pair, never a
> flag that keeps the old path alive.

By that test `probe-fingerprint-cache-endpoint` was miscategorised twice: it reconstructed
history (`git show dba7699^`) to measure a behaviour the code *does* still have. It
should always have been a lever, and until it was, it was a commit pin quietly rotting.

**Corollary, from §3 and §4 together:** when a dead probe is revived, do not read the
first green run as vindication. This one had two independent stalenesses, and fixing the
outer one is what made the inner one visible. **A probe that cannot start is not a probe
that is passing — it is a probe whose other defects have not been priced yet.**

---

## 7 — Controls

- **Suites:** server **123 files · 1952 passed · 1 skipped** (was 122 · 1918 · 1 — +1
  file, +34 tests, both mine); client **unchanged**, 38 files (25 passed · 13 skipped) ·
  **324 passed · 13 skipped**. `npm test` run **unpiped into a file** and both summaries
  read in full — a `| tail` showed only the client summary and would have let me quote a
  server number I had not seen.
- `npm run typecheck` **0 errors**, 3 workspaces. Strict typecheck on both edited
  probes: **0 errors**.
- **Containment:** ports 3001/5173 quiet after every run, **0** stray processes; repo
  `klatch.db` **1 channel, 0 `probe-seed%`** (arm F's import went to the scratch DB
  under `.testdata/`); scanner sha256 `d52bec53da15` identical at start and exit of
  every drive; `git status --porcelain` **4 intended files**; **0 model calls**.

## 8 — Open / routed

- **Mine, next:** nothing outstanding from this round.
- **Routed to nobody — closed:** Theseus's Round 238 §6 pricing item. Both probes
  answered; one built, one declined with a reason.
- **Still parked on xian** (unchanged, not re-litigated here): the capped PM session
  `440fe16b-46f8-4fbb-9b0d-3285c425aa37`; `files/storage.ts:38`; the backfill dry run;
  `DELETE /entities/:id`.
- **Theseus's, not mine:** arm O's noise band (Round 234 §5), still open — and his §6
  note that arm O cannot run on the real corpus at all, since the shipped cap bites
  0/540 there.
