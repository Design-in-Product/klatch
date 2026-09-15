# Theseus session log — 2026-09-15 START fire (Opus)

**Seat:** Theseus (manual testing & exploration) · **Branch:** `claude/theseus-cycle` · worktree `/Users/xian/Development/klatch-worktrees/theseus`
**Round:** 213

---

## 10:47 — Briefing

Pulled state read: `git log` HEAD at `29923682` (Daedalus's Round 212 fire). Mail swept.
Two items addressed to this seat, both from today's earlier fires:

1. `argus-to-theseus-…-round162-probe-has-crashed-at-startup-since-96` — **action required**,
   my file, and it asks me a design question.
2. `daedalus-to-iris-cc-theseus-…-the-reassign-endpoint-is-built` — cc, but §6 explicitly
   lists "not driven through a live HTTP server," which is this seat's work.

Both actionable in this fire. Taking them in that order.

## 10:51 — Argus's finding reproduced before acting on it

Did not take the crash off the memo. Ran it:

```
Error: could not read the client prompt fallback from packages/client/src/components/ChannelSidebar.tsx
    at readConst (scripts/probe-round162-preamble-drop-and-roster-live.mts:63:17)
```

Verified the cause directly rather than from Argus's description:
- `ChannelSidebar.tsx:216` = `newPrompt.trim() || DEFAULT_CHANNEL_PREAMBLE` (identifier)
- probe regex wants `newPrompt\.trim\(\) \|\| '([^']+)'` (quoted literal) → zero matches
- `ChannelSidebar.tsx:3` imports `DEFAULT_CHANNEL_PREAMBLE` from `@klatch/shared`

Argus is correct in every particular. Confirmed.

## 10:58 — The CLIENT_FALLBACK question, and what looking for a third option found

Argus framed a two-way tradeoff (collapse to `PREAMBLE` → tautology; or drop the assertion).
Went looking for a third and grepped for literal copies of the preamble across `packages/*/src`.

**Finding: the client dedup was complete; the server was never deduped.** Four live literals:

| site | what it seeds |
|---|---|
| `packages/server/src/db/index.ts:81` | the `general` channel's stored purpose |
| `packages/server/src/db/index.ts:84` | the default entity's prompt |
| `packages/server/src/db/index.ts:351` | re-seeded default entity (repair path) |
| `packages/server/src/routes/export.ts:249` | carried-context `system` fallback |

`db/index.ts:81` is load-bearing: layer 4 drops that purpose only when
`isDefaultChannelPreamble` (an `=== DEFAULT_CHANNEL_PREAMBLE`) matches. Edit the shared
constant without editing the seed → the seeded default channel silently resumes carrying its
boilerplate at char 0. **That is the Round 161 defect, re-creatable by a one-line edit, with
the whole suite green.** Read `isDefaultChannelPreamble` at `packages/shared/src/types.ts:124`
this session to confirm the comparison is `===` against the constant.

Also verified this session: `routes/entities.ts` does **not** appear in the literal grep, so
it is already on the constant.

## 11:10 — Fix committed (`68bb8c96`), then mutated

New **arm M** locates each literal by *surrounding syntax* and compares to the shared constant
— non-circular, since changing the constant alone still finds the old string and fails.
`CLIENT_FALLBACK` now derives from `PREAMBLE`. Client half kept as a source-property check.

Structural change that generalises: source reads feeding checks go through `locateLiteral`,
which returns `null` → one red check with a re-aim message, instead of throwing → every arm
dead. **A probe whose source reads are load-bearing should degrade to a failure, never a crash.**

Committed **before** mutating (Daedalus's Round 212 §4 rule). Mutations:

| # | Mutation | Result |
|---|---|---|
| 1 | seed literal drifts from constant | 1 fail — the load-bearing one |
| 2 | surrounding syntax moves, pattern misses | 1 fail w/ re-aim message, **34 other checks still ran** |
| 3 | client re-introduces a literal | 1 fail |

Mutation 2 is the one that matters — it *is* the defect class that killed this file.

Mutation 3 exposed a flaw in my own check: the FAIL detail restated the assertion instead of
reporting what was found. Fixed in `417c39ff` (now prints the offending expression), verified
by re-running **while still mutated**, then reverted.

**Clean run: 35/35 regression, 1 open (F, continuity asymmetry — still xian's call), 12
measurements.** Round 211's §4 guard on arm A passes, **executed for the first time.**

## 11:40 — Daedalus's §6: the reassign endpoint over a real socket

Read the implementation before probing it (`routes/entities.ts:254-288`, `queries.ts:583-653`)
and verified the mount: `app.route('/api', entityRoutes)` at `index.ts:37`, so the documented
path `PATCH /api/channels/:channelId/entities/:entityId` is accurate.

Wrote `scripts/probe-round213-reassign-live-http.mts`. Real server process, real port, real
bytes. ZERO MODEL CALLS — arms B/C/E write conversation state straight into the scratch DB.

**First run: 32/34 — and both failures were mine, not the endpoint's.**

- Arm B filtered on `m.role === undefined` against a projection that never selected `role`,
  so the filter matched every row including correctly-moved assistant stamps.
- Arm E reused `ORBIT`, which arm C had already seated in its klatch.
  `fromEntityOrphaned: false` was **the correct answer to a question I didn't mean to ask.**

Recording this because the failure mode is the dangerous one: a fixture-reuse bug produces a
*plausible* red that reads as a finding. Writing the memo off that first run would have
reported a defect in Daedalus's orphan logic that does not exist. Both fixed; arm E now mints
its own single-seat entity.

## 12:05 — Arm F found 500s; arm G kept the finding honest

Malformed bodies a hand-built `Request` never produces:

| body | status |
|---|---|
| no body / empty string / invalid JSON / form-encoded | **500** Internal Server Error |
| valid JSON wrong shape (`[]`, `{toEntityId:42}`) | 400 `toEntityId is required` |

`await c.req.json()` is unguarded. **Before attributing this to a two-hour-old endpoint, ran
the control** (arm G): same invalid JSON at `POST /channels` and `POST /entities`, both months
older → both **500**. `grep -c 'await c.req.json' packages/server/src/routes/` = **15**, none
in a try/catch.

**Conclusion: pre-existing and systemic, NOT a Round 212 regression.** Flagged, not fixed —
15 sites of product code across routes that aren't mine, and per-route guard vs. `app.onError`
is an architecture call for Daedalus.

Asserted rather than assumed: **no malformed body moved a seat**, and the server was still
serving after all six.

## 12:20 — Mutations against the live endpoint

Committed the probe first (`e4f07e54`), then:

| Mutation | Result |
|---|---|
| join-row-only move (the impl Iris declined) | **3 fails in arm B**, over the wire |
| fresh `added_at` instead of preserved | **2 fails in arm C** |

The second exposed another message flaw of my own — arm C printed two uuid arrays that came
out character-identical under the mutation. Fixed to name the seats (`c22f62fa`), verified
while still mutated, then reverted.

**Clean run: 34/34 regression, 9 measurements.**

## 12:35 — Verification

```
git diff --stat -- packages/          → (empty)
grep -rn MUTATION packages/*/src      → (no matches)
git status --porcelain                → clean
```

Note to self: my first revert-check grepped bare `packages/` and drowned in `node_modules`.
`git diff -- packages/` is the authoritative check; scope the grep to `src`.

Suites, full:
- server **113 files · 1798 passed · 1 skipped**
- client **37 files · 315 passed · 13 skipped**

Both match Daedalus's Round 212 figures exactly — my round is scripts-only, and the numbers
confirm it.

`npm run typecheck` clean ×3 workspaces.

## 12:45 — Session wrap

**Step 1 — commits on origin/main:**

```
7b0b7eba mail: Theseus Round 213 replies -- probe162 repaired, reassign driven on the wire
c22f62fa probe(round213): arm C names the seats instead of printing two uuid arrays
e4f07e54 probe(round213): drive Daedalus's reassign endpoint over a real socket
417c39ff fix(probe-round162): arm M failure detail reports what was found, not the expectation
68bb8c96 fix(probe-round162): repair the import-time crash that silenced every arm since 9/6
```

Pushed: `29923682..7b0b7eba  HEAD -> main`.

**Step 2 — deliverables verified present** (`ls`, run after the push):

```
docs/logs/2026-09-15-1047-theseus-opus-log.md                                    9652
docs/mail/read/argus-to-theseus-…-round162-probe-has-crashed-at-startup-since-96-2026-09-15.md   3777
docs/mail/theseus-to-argus-daedalus-…-probe162-fixed-and-the-dedup-stopped-at-the-client-2026-09-15.md   5179
docs/mail/theseus-to-daedalus-…-reassign-holds-on-the-wire-and-the-500-is-older-than-your-route-2026-09-15.md   5854
scripts/probe-round162-preamble-drop-and-roster-live.mts                        35270
scripts/probe-round213-reassign-live-http.mts                                   27449
```

All six present. `git status --porcelain` clean. Final commit `cc3afde5` on `origin/main`.

**Open items carried out of this fire (not finished here, written down rather than guessed):**

1. **The four server-side preamble literals are watched, not fixed.** Arm M goes red if they
   drift, but `db/index.ts:81` arguably should import the constant. Daedalus's call.
2. **15 unguarded `c.req.json()` sites → 500 on malformed bodies.** Systemic, pre-existing,
   flagged to Daedalus. Not urgent (nothing mutates), but it defeats the client wrapper's
   error-sentence surfacing.
3. **Arm M reads source, it does not execute the seed path.** The chain from a literal
   mismatch to a broken layer-4 drop is reasoned from `isDefaultChannelPreamble`, read this
   session — not measured end to end.
4. **Reassign not driven on the March corpus**, same caveat as Daedalus's §6.
5. **Round 163 arm F (continuity asymmetry) still open**, unchanged, still xian's call.
6. **Nothing in the UI calls the reassign endpoint.** Iris's picker is the open piece; the
   contract is confirmed safe to build against, including the 409 that refuses a seat merge.

**Standing rule adopted this fire:** a probe edit not followed by a probe run isn't verified,
it's proofread. Round 210 and Round 211 both edited `probe-round162` correctly as static reads
while the file could not start. Argus found it by running things.
