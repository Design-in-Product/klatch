# Daedalus session log — 2026-09-17 (WORK fire)

**Model:** Opus 5 · **Branch:** `claude/daedalus-cycle` · **Worktree:** `klatch-worktrees/daedalus`
**Round:** 224

---

## 13:18 — Briefing

Pulled state (wrapper synced pre-fire). Read `docs/COORDINATION.md` §Daedalus,
`docs/briefs/cross-pollination/current.md`, and `ls docs/mail/`. One memo addressed to me:
`theseus-to-daedalus-…-your-twenty-undriven-probes-are-driven-and-two-report-success-on-a-port-they-cannot-own-2026-09-17.md`
(Round 223). Read in full immediately per the mail discipline.

Its §3 ends *"Your sizing; say the word and I'll do it."* That's the fire's work unit: a decision
plus, since the fix is one shared primitive rather than two edits, the implementation.

## 13:20 — Verified the finding in source before accepting it

- `probe-browse-endpoint-vs-channel-count.mts:708` — `All regression checks passed; N measurements
  recorded.` guarded only by `failed.length`, reachable with 0 checks run. Confirmed.
- `probe-turncount-live-http.mts:416` — `${passed.length}/${results.length} checks passed`,
  `process.exit(0)`. Confirmed: `0/0` is reachable.
- Population: `readdirSync` over 98 scripts (not grep — Round 222's lesson), 4 pair a SKIP channel
  with a passed-summary: the two above plus `browse-latency-end-to-end`, `import-live-http`.
- Port 3001: free (`ECONNREFUSED`) at fire start.

## 13:24 — Exit-code prior art: found, not invented

Searched for a free exit code and found the semantic already had one:

- `scripts/measure-marker-floor.mjs:227` exits **3** — *"enumerated 0 files. Refusing to report —
  an all-zero table over an empty corpus is indistinguishable from a clean one."* That is this
  finding's rule, already written down, already exiting 3.
- `probe-scratch-server.mjs:233` exits 3 for an occupied port.
- `requireAnUnoccupiedPort` exits 2 for "has not run".

Adopted 0/1/2/3 = passed / broke / refused at the door / ran-but-established-less. Kept 2 and 3
distinct deliberately.

## 13:30 — `scripts/lib/probe-outcome.mts`, 4 probes migrated

One invariant: "passed" is printable only when hard-check count > 0 and nothing was skipped.
Control `probe-round224-a-skip-must-not-summarise-as-a-pass.mts`. Arms A (accepting state, per
Round 222's rule), B (staged defect), C (vacuous run), D (failure dominates), E (escape hatch),
F (old tails re-implemented as mutations), G (source-level: one summary site per probe).

First run: **39/39.**

## 13:38 — Drove it at the wire, and my own design error surfaced

`probe-round224b-the-migrated-probes-against-a-stranger.mts` — stranger on `::`, `200 []`,
staged in-process so it cannot outlive the run; Theseus's §4 zero-contact discriminator adopted.

Both §3 subjects exit **3** with `INCONCLUSIVE`. Then ran `turncount` on a **free** port:

```
5/5 verdicts PASS · SKIP [J] no session exceeds the cap
INCONCLUSIVE — established 5 of its checks and skipped 1 arm(s). This is not a pass.
```

**My error.** Arm J is an *open item*; that probe's own docblock says a red exit on a known-open
item trains everyone to ignore the exit code. I collapsed "a promised regression arm didn't run"
with "a known-open item wasn't evaluated." This is Theseus's §6.2 error ("it counted SKIP as a
conclusion") committed one layer up, inside the module written to fix what he found there.

Fix: a skip carries the kind of the arm it replaced; **bare string stays hard**, so the default is
safe. Arm H drives the discrimination both ways. Verified: `turncount` exits **0** free, **3**
occupied.

## 13:47 — Arm F of the sweep found a probe dead since 2026-09-04

`browse-latency-end-to-end`: exit 1, 360 ms, **zero contact**. Reported `OPEN — NOT ESTABLISHED`
rather than graded — the discriminator earning its keep, since a green line here would have been
skimmed past. Theseus's §4 saw the same symptom and called it "an early failure unrelated to any of
this": right about the relationship, cause unfound.

Cause: commit `18d46318` (2026-09-04) made the shipped constant `FINGERPRINT_LINE_CAP = 50_000`.
A numeric separator. Six probes scrape constants from `packages/` source with hand-rolled `(\d+)`.

**One change, two failure modes:**

| probe | regex | result |
|---|---|---|
| `browse-latency-end-to-end` | `= (\d+);` | no match → throw → dead 13 days |
| `turncount-live-http` | `= (\d+)` | matched `50` of `50_000` → ran with a cap 1000× too small |

`turncount` is the worse one: printed *"no session exceeds the **50**-line cap"* attached to a
conclusion that was correct underneath (the skip condition reads the real shipped scanner). Its
`scanUncapped` split pre/post density at line 50 — latent here, live on a corpus reaching the cap.

Second instance 170 lines below the first in `browse-latency`: the temporary patch was built by
interpolating the value back into a needle string, so it looked for `= 50000;` in a file saying
`= 50_000;`. **Its own no-op guard caught it and threw before writing** — `git status --porcelain
packages/` empty; that guard is why this was a dead probe and not a corrupted tree for 13 days.

Hoisted `scripts/lib/probe-source-constants.mts` (read + separator-tolerant rewrite, anchored on a
value terminator, throws rather than falls back). Six readers migrated. Retired a real
disagreement: `probe-accepted-multipart-allocation.mts:270` silently fell back to a hardcoded
`50` MB — the exact thing `probe-import-large-session` refuses to do in a comment.

**Scope, stated honestly:** `MAX_IMPORT_SIZE` is `50 * 1024 * 1024` today, no separator. Those
three probes were **latent, not broken**. Two live failures fixed, not five.

## 13:55 — My own scan was a false positive

The "no separator-blind regexes remain" check reported 3 files. All three were false positives:
the `// Was match(/…(\d+)…/)` comments I'd just written, plus arm I quoting both old regexes in
live code on purpose. A scan that can't tell a citation from a call would have had the next reader
"fixing" a comment. Stripped comment lines, exempted this control by name, and added a check that
the stripping didn't make the scan vacuous.

## 14:02 — `browse-latency` runs end to end, first time since 9/4

Restores `session-scanner.ts` byte-for-byte (`sha256 e2c7445e12a5`, asserted). First numbers in 13
days: browse warm median 15 ms; fingerprint sum 2725 ms capped vs 2748 ms uncapped (+23 ms); cap
fires 0/536 files; turns 1987 → 1987 (100%); dedup lookup 22 µs @ 0 channels → 436 µs @ 2000.

**One FAIL, deliberately not fixed:** arm O, `predicted 5 ms vs measured 14 ms (65.5% off);
endpoint moved ±1 ms for a fingerprint delta of ±10 ms`. My read: vacuous on this corpus — arm M
measured the cap firing on **0/536** files and 100% turn retention, so the uncapped counterfactual
is identical work, the true delta is ~0 by construction, and the check is a percentage over two
quantities separated by ±1 ms noise on a 14 ms baseline. By this round's own taxonomy it should
hard-skip when the cap doesn't fire.

Not changing it this fire: that's a judgement about an arm's semantics from one run on one corpus
— the shape of Theseus's 223b DB check ("it held for no reason it controls") — and loosening a
tolerance to green a red line is the most tempting wrong move available. Needs a corpus where the
cap fires, which is Theseus's second corpus and his call. Named, undone, routed to him.

## 14:10 — Verification

| | |
|---|---|
| `probe-round224-…` | **62/62 · 0 failed** |
| `probe-round224b-…` | **22/22 · 0 failed** (all 3 subjects established; §4's NOT ESTABLISHED closed for `browse-latency`) |
| strict typecheck, 2 modules + 9 probes | **0 errors** |
| server suite | **119 files / 1884 passed / 1 skipped** |
| client suite | **324 passed / 13 skipped** |
| `git status --porcelain packages/` | **empty** |

Suites identical to Round 222 because every edit is under `scripts/`.

## Open / carried

1. **`browse-latency` arm O** — routed to Theseus with the number and my reasoning. Undone.
2. **`reapOnExit` not retrofitted into the 21** — third round running. Said in the memo that I'll
   either take it next fire or we agree it isn't worth it; listing it is not progress.
3. **`inapplicable` hatch has zero callers** (asserted by a check). Asked Theseus whether to keep
   or delete it.
4. **Theseus's Round 219 arm C / `waitUntilPortIsQuiet` item** — untouched, still his.

## Wrap verification

Per the Session Wrap Protocol — commits and file existence verified below, appended after the
commit landed.
